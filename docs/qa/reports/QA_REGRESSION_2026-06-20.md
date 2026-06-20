# QA — полная регрессия (QA-STAB), 2026-06-20

**Роль:** QA. **Задача:** стабилизационная регрессия time.credos.ru.
**Доступ:** REST Core (`TWENTY_DEV_URL`, Bearer admin API-key), `/s/` logic-routes (POST).
**Сервер:** `https://twenty-production-e5c5.up.railway.app`.
**Режим:** только чтение/тесты, код не правил. Все тест-данные созданы/откатаны, итоговый totalCount записей восстановлен (422).

**Итог:** `[smoke-ok]` по всем осям регрессии. Найден **1 баг P1** (delete через `/s/time-entry`) + несколько наблюдений (не баги).

---

## 1. Код-проверки — все зелёные

| Проверка | Команда | Результат |
|---|---|---|
| Lint | `yarn lint` (oxlint) | **0 warnings / 0 errors**, 122 файла, 61 правило |
| Typecheck | `npx tsc -b tsconfig.spec.json` | **exit 0**, без ошибок |
| Unit | `npx vitest run -c vitest.unit.config.ts` | **467 passed / 8 todo**, 7 файлов passed + 1 skipped |

`[smoke-ok]` Skipped-файл — `logic-functions/time-entry-api.logic.test.ts` (8 todo, интеграционный набор поверх живого REST, помечен skip намеренно).

---

## 2. REST-smoke 8 объектов credosTime*

| Объект | totalCount | Статус |
|---|---|---|
| credosTimeDepartments | 5 | ok |
| credosTimeEmployees | 43 | ok |
| credosTimeProjects | 42 | ok |
| credosTimeStages | **0** | наблюдение (см. §6) |
| credosTimeWorkTypes | 38 | ok |
| credosTimeEntries | 422 | ok |
| credosTimeBillingLinks | 1 | ok (задел M:N) |
| credosTimeWorkdayCalendars | 365 | ok |

**Записи трудозатрат (полная пагинация, 422 шт):**
- `[smoke-ok]` Связи не битые: **0** записей с пустым employeeId/projectId/workTypeId.
- `[smoke-ok]` **0 orphan** — все employeeId/projectId/workTypeId ссылаются на существующие справочники.
- `[smoke-ok]` Диапазон дат: `2026-01-01 … 2026-06-30` (H1 2026, в норме).
- `[smoke-ok]` Часы: min 0.5 / max 8.0, **0 out-of-range**.
- Статусы: APPROVED 234, DRAFT 188 (SUBMITTED/REJECTED в данных нет — согласование через UI).

**Коды проектов:**
- `[smoke-ok]` Все 42 кода соответствуют формату `[ОТДЕЛ]-[ГОД]-[NNN]` (напр. `ОИБ-2026-004`), **0 невалидных**, **0 дублей**.
- Категории: CLIENT 32, INTERNAL 3, PRESALE 3, PILOT 2, INFRASTRUCTURE 1, TRAINING 1.

---

## 3. Целостность данных — `check-consistency.mjs`

`[smoke-ok]` Штатный скрипт `apps/time/scripts/check-consistency.mjs` — **exit 0, «Все проверки пройдены»**:
- totalCount непусто по всем объектам;
- 0 битых связей записей;
- 34 клиентских/пилотных проекта привязаны к реальным Company, **0 демо-компаний**, 0 без companyId;
- 0 невалидных category/group;
- 42 проекта = 42 уникальных кода, **0 дублей**.

`[smoke-ok]` Производственный календарь: 365 дней 2026, **0 дублей дат**, dayTypes WORKDAY/WEEKEND/HOLIDAY валидны.

---

## 4. Logic-smoke `/s/`

### 4.1 `/s/time-entry`
- `[smoke-ok]` **list** — отдаёт entries за период + 42 проекта + workTypes, `ok:true`.
- `[smoke-ok]` **upsert (create)** — создаёт DRAFT-запись (createdBy.source=APPLICATION), `ok:true`.
- `[smoke-ok]` **upsert (update)** — обновляет hours/description по id, `ok:true`.
- `[smoke-ok]` **валидация hours** — границы HOURS_MIN=0 / HOURS_MAX=24 inclusive: `-1`, `24.5`, `"abc"` → `hours out of range`; `0` и `24` приняты.
- **[bug] #1 delete** — `op:delete` падает `400 PERMISSION_DENIED` (см. §5). **P1.**

### 4.2 `/s/approval` (на тест-записи, откат после)
- `[smoke-ok]` **submit** — DRAFT-записи периода сотрудника, где проект требует согласования, → SUBMITTED (`updated:1`).
- `[smoke-ok]` **approve** — SUBMITTED → APPROVED, `approvedAt` проставлен.
- `[smoke-ok]` **reject** — SUBMITTED → REJECTED.
- `[smoke-ok]` **RBAC-guard actor≠owner** (отдельный тест с временным workspaceMemberRef):
  - actor == owner → запись НЕ согласована (`skippedOwn:1`, статус остался SUBMITTED) — separation of duties работает;
  - actor не isManager → `forbidden: только руководитель может согласовывать`.
- `[smoke-ok]` unknown op → `unknown op: xyz`; пустой ids → `ids required`.
- Наблюдение: `approvedBy` пустой при вызове по API-key (event.userWorkspaceId = null вне Uar-сессии). В UI заполнится. См. §6.

### 4.3 `/s/reports` (накатан Dev2)
- `[smoke-ok]` Структура ответа соответствует контракту: `ok, period, groupBy, totals{fact,client,norm,util,under}, byDept[], byProject[], byEmployee[]`.
- `[smoke-ok]` Пагинация `restGetAll` доходит до всех данных: 422/422 entries, 365/365 дней календаря (проверено воспроизведением курсора).
- `[smoke-ok]` util не делит на 0 (null при fact=0).

---

## 5. [bug] #1 — delete записи через /s/time-entry → PERMISSION_DENIED (P1)

**Repro:**
1. `POST /s/time-entry {op:"upsert", date, hours, projectId, workTypeId}` → запись создаётся (ok).
2. `POST /s/time-entry {op:"delete", id:<созданный>}`.
3. Факт: `{ok:false, error:"DELETE /rest/credosTimeEntries/<id> -> 400 ... PERMISSION_DENIED: Entity performing the request does not have permission"}`. Запись НЕ удалена.

**Ожидалось:** запись удаляется, `{ok:true}` (как в коде `time-entry-api.logic.ts:113-117`).

**Анализ:** logic-function исполняется под токеном приложения (`TWENTY_APP_ACCESS_TOKEN`). У роли приложения есть права create/patch на `credosTimeEntries` (create/update в smoke прошли), но **нет права delete**. Admin REST DELETE тем же объектом работает (откат тест-данных выполнен через него). Значит проблема в правах роли приложения, а не в коде функции.

**Эффект на UX:** пользователь не сможет удалить запись из недельной сетки (кнопка удаления вызывает `op:delete`) — операция молча вернёт ok:false.

**Файл/эндпоинт:** `apps/time/src/logic-functions/time-entry-api.logic.ts:113-117` (вызов `api.delete`); первопричина — роль приложения (`apps/time/src/roles/*`) / права на delete `credosTimeEntries`.

**Severity:** P1 (ломает удаление в основном сценарии сетки).
**Assign-хинт:** Dev 2 / DevOps — добавить delete-permission роли приложения на credosTimeEntries (либо подтвердить, что delete делается иным путём).

---

## 6. Наблюдения (не баги)

- **[observed] credosTimeStages = 0** — этапы не засижены. Вкладка «Этапы» в карточке проекта пуста, capacity по этапам нет. Совпадает с задачей досева Dev 2. Не баг.
- **[observed] approvalRequired у всех 42 проектов = null** — согласование резолвится наследованием от отдела (`isApprovalRequired(null, dept)`). Отделы OIB и OV = true, OPIB/TC/OPR = false. Логика верна (проверено submit вкл/выкл, §7). Если по требованию заказчика согласование должно зависеть от проекта — флаги проектов сейчас не заданы.
- **[observed] 42/43 сотрудников без workspaceMemberRef** — в DEV approval-RBAC-guard пропускается (fallback с console.warn, by design, есть TODO(prod) в коде). В проде ref нужно заполнить, иначе guard actor≠owner и проверка роли не активны для боевых пользователей.
- **[observed] approvedBy пустой при API-вызове** — `event.userWorkspaceId` = null вне UI-сессии. В реальном UI поле заполнится. Smoke-ограничение, не дефект.
- **[minor] unknown op в /s/time-entry** молча трактуется как list (op-default='list'). Не валидирует op (в /s/approval — валидирует). Косметика.

---

## 7. Edge-кейсы — все зелёные

- `[smoke-ok]` **Пустая неделя** (период 2030 без записей): reports `fact:0, norm:0, util:null, under:0`, byEmployee/byProject пусты; `/s/time-entry list` → 0 entries, без краха.
- `[smoke-ok]` **Праздничная неделя ≠ 40ч** (норма из WorkdayCalendar, не фикс): база-норма недели 01-11 янв = **8ч** (1 рабочий день среди праздников) против обычной недели 09-15 фев = **40ч**. reports totals.norm: янв **268.8**, фев **1344** — точно совпадает с формулой `база × Σ(headcount × capacityFactor)` = `8 × 33.6` и `40 × 33.6`. Capacity читается из календаря корректно.
- `[smoke-ok]` **approvalRequired вкл/выкл** (наследование dept): OIB (dept=true) — submit двигает DRAFT→SUBMITTED (updated:1); OPIB (dept=false) — submit не трогает (updated:0, остался DRAFT).

---

## Сводка статусов

| Ось | Статус |
|---|---|
| Lint / Typecheck / Unit | `[smoke-ok]` (0/0, exit 0, 467 passed) |
| REST 8 объектов | `[smoke-ok]` (7 с данными, Stages=0 наблюдение) |
| Целостность (orphan/дубли/коды) | `[smoke-ok]` (0/0/0) |
| /s/time-entry | `[smoke-ok]` list/upsert/валидация · `[bug] #1` delete |
| /s/approval | `[smoke-ok]` submit/approve/reject + RBAC-guard |
| /s/reports | `[smoke-ok]` структура + пагинация |
| Edge (пустая/праздничная неделя, approvalReq) | `[smoke-ok]` |

**Регрессия чистая, кроме [bug] #1 (P1, delete-permission роли приложения).**

— QA
