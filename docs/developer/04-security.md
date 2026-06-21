# 04 — Безопасность

Контекст: внутренний инструмент, dev/staging, ~15–20 пользователей. Базовый posture — LOW. При выходе в прод severity пересматривается вверх.

Owner: CISO. Полный реестр: `docs/security/RISK_REGISTER.md`.

---

## Реестр CISO-находок

| ID | Severity | Статус | Суть | Что делать разработчику |
|----|----------|--------|------|------------------------|
| CISO-001 | P1 | MITIGATING | Реальные ПДн сотрудников (ФИО, email) попали в git через seed-скрипты и дампы | Dev2: заменить `seed-real.mjs` на синтетику; реальные данные только из gitignored-источника |
| CISO-002 | P2 | OPEN | `approval.logic.ts` не проверяет роль actor, separation of duties (actor ≠ автор записи), scope отдела | Dev2: добавить guard actor-role + `actor !== entry.employee.workspaceMemberRef` |
| CISO-003 | P3 | OPEN | `manager.role.ts` — нет field-level ограничений; роль видит все поля (PII всё-или-ничего) | Оценить при появлении HR-роли; пока ACCEPTED-кандидат |
| CISO-004 | P2 | OPEN | Общий мастер-объект Employee (PII) будет виден между time/catalog/CRM без явного RBAC | Определить владельца PII Employee до старта catalog-app |
| CISO-005 | P1 | OPEN | IDOR: личность сотрудника берётся из client-supplied `workspaceMemberRef`, не из `event.userWorkspaceId`; delete без ownership-guard | Dev2: server-side резолв `userWorkspaceId` → employeeId; ownership-guard на delete/patch |
| CISO-006 | P2 | MITIGATING | Filter injection: client params интерполируются в filter-строки Twenty REST без валидации | Dev2: `isUuid()` и `isIsoDate()` на всех params ПЕРЕД интерполяцией (детали ниже) |
| CISO-007 | P1 | **CLOSED** (0446388) | `byEmployee` + detail-режим в `/s/reports` раскрывали ФИО без role-guard | **Закрыт:** `revealNames=false` по умолчанию во всех срезах (detail/byEmployee/OLAP/CSV). TODO: раскрыть ФИО менеджеру после CISO-005 (server-identity). |
| CISO-008 | P3 | OPEN | `credosTimeAbsence.note` провоцирует ввод медицинских ПДн (тип SICK) | Dev2: help-текст в UI «не указывайте диагнозы»; внести в PII_INVENTORY |
| CISO-009 | P3 | OPEN | `seed-real.mjs` содержит реальные наименования клиентов/заказчиков | Dev2: синтетические названия клиентов в сиде |
| CISO-010 | P2 | OPEN (pre-impl) | Будущий CSV-экспорт: медПДн (код «Б») в файле; нет role-guard; интеграция 1С = новый канал ПДн | Dev2: role-guard экспорта; SICK→«Н» для не-HR; аудит-лог |
| CISO-011 | P2 | MITIGATING | APPROVED-записи не блокируются: delete/upsert в `time-entry-api.logic.ts` не проверял `status !== APPROVED` | Уже закрыт на уровне L1 в logic function; прямой REST PATCH — закроется RBAC-волной |

---

## Паттерн CISO-006: UUID / Date валидация

**Правило:** все client-supplied параметры, которые попадут в filter-строку Twenty REST API, должны быть провалидированы до интерполяции.

**SSOT функций валидации:** `src/logic-functions/params-validate.ts`

```typescript
// src/logic-functions/params-validate.ts

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;

/** Проверяет что строка — валидный UUID v4. Возвращает строку или undefined. */
export const isUuid = (v: string | undefined): v is string =>
  !!v && UUID_RE.test(v);

/** Проверяет что строка — валидная ISO-дата (YYYY-MM-DD или YYYY-MM-DDTHH:mm:ssZ). */
export const isIsoDate = (v: string | undefined): v is string =>
  !!v && DATE_RE.test(v);
```

**Использование в logic function:**

```typescript
import { isUuid, isIsoDate } from './params-validate';

// В handler:
const params = (event.queryStringParameters ?? {}) as Record<string, string>;

// UUID-параметры — employeeId, projectId, workTypeId, stageId, id
const employeeId = isUuid(params.employeeId)
  ? params.employeeId
  : (() => { throw new Error('invalid employeeId'); })();

// Дата-параметры — from, to, date
const from = isIsoDate(params.from)
  ? params.from
  : (() => { throw new Error('invalid from'); })();

// Теперь безопасно интерполировать в filter-строку:
const filter = `employeeId[eq]:${employeeId},date[gte]:${from}`;
```

> ⚠️ **Важно:** не использовать `params.employeeId` напрямую в строке фильтра. Даже если значение "выглядит правильно", атакующий может передать `"VICTIM_UUID,status[neq]:DRAFT"` — запятая разделяет условия в формате фильтра Twenty REST API.

**Что НЕ нужно валидировать:** server-generated значения (`event.userWorkspaceId`, результаты предыдущих API-вызовов, UUID из `universal-identifiers.ts`).

---

## Паттерн CISO-007: revealNames=false

**Правило:** именные данные (ФИО сотрудников) не включаются в ответ `/s/reports` по умолчанию. Только если запрашивает авторизованный руководитель (`isManager=true`).

```typescript
// В handler /s/reports:
const params = (event.queryStringParameters ?? {}) as Record<string, string>;
const revealNames = params.revealNames === 'true';  // дефолт false

// При группировке byEmployee:
const rows = entries.map((e) => ({
  employeeId: e.employeeId,
  // ФИО только если revealNames && actor isManager
  employeeName: revealNames && actorIsManager ? e.employeeName : undefined,
  hours: e.hours,
}));
```

Когда будет реализован server-side actor (CISO-005), условие ужесточится:

```typescript
const actorIsManager = await resolveIsManager(event.userWorkspaceId);
const revealNames = params.revealNames === 'true' && actorIsManager;
```

---

## Паттерн CISO-011: блокировка APPROVED-записей

**Правило:** запись со статусом `APPROVED` не может быть изменена или удалена через `/s/time-entry`.

```typescript
import { ENTRY_STATUS } from 'src/constants/approval';

// В op=upsert (update существующей):
const existing = await fetchEntry(id);
if (existing.status === ENTRY_STATUS.APPROVED) {
  return {
    statusCode: 403,
    body: JSON.stringify({ ok: false, error: 'cannot_modify_approved' }),
  };
}

// В op=delete:
const toDelete = await fetchEntry(id);
if (toDelete.status === ENTRY_STATUS.APPROVED) {
  return {
    statusCode: 403,
    body: JSON.stringify({ ok: false, error: 'cannot_modify_approved' }),
  };
}
```

`ENTRY_STATUS` — SSOT из `src/constants/approval.ts`. Не хардкодить строки `'APPROVED'` напрямую.

---

## Правила: что нельзя коммитить

```
❌  Реальные ФИО, email сотрудников в любых файлах кода/данных
❌  Реальные названия клиентов/заказчиков (ООО/ГУП/ФГБУ) в seed-скриптах
❌  .env файлы и любые файлы с токенами/секретами
❌  UUID в коде напрямую (только через universal-identifiers.ts)
❌  Inline-хардкод TWENTY_APP_ACCESS_TOKEN
```

```
✅  Синтетические данные в seed-скриптах (@example.test, «Рога и Копыта ООО»)
✅  process.env.TWENTY_APP_ACCESS_TOKEN (переменная окружения)
✅  gitignored-файлы для реальных данных (см. .gitignore секцию «ПДн»)
```

---

## Pre-commit security checklist

Перед каждым коммитом, затрагивающим logic-functions или seed-скрипты:

```
[ ] Нет ФИО/email в коде → grep -r "@credos.ru\|@gmail\|firstname\|lastname" apps/
[ ] Нет токенов/секретов → grep -r "TWENTY_APP_ACCESS_TOKEN\s*=" apps/ (только process.env)
[ ] UUID/date params в logic functions валидируются через isUuid()/isIsoDate() (CISO-006)
[ ] revealNames=false по умолчанию в /s/reports (CISO-007)
[ ] APPROVED-записи заблокированы в op=delete/upsert (CISO-011)
[ ] Новые поля с ПДн внесены в docs/security/PII_INVENTORY.md
```

Полный security checklist: `docs/security/checklists/pre-commit-security.md`.

---

## Связи с документацией безопасности

| Документ | Содержание |
|---------|-----------|
| `docs/security/RISK_REGISTER.md` | Полный реестр рисков с mitigation |
| `docs/security/findings/CISO-006-filter-injection.md` | Детальный разбор filter injection: сценарии, PoC, DoD |
| `docs/security/findings/CISO-007-reports-data-disclosure.md` | ФИО в /s/reports: scope, требования |
| `docs/security/findings/CISO-011-approved-record-mutability.md` | Lock APPROVED: уровни L1/L2/L3 |
| `docs/security/specs/RBAC_MODEL.md` | Модель ролей: сотрудник / руководитель / admin |
| `docs/security/PII_INVENTORY.md` | Реестр персональных данных (152-ФЗ) |
| `docs/security/CISO_POLICY.md` | Политика безопасности проекта |
