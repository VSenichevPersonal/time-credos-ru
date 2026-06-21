# CISO Policy — time.credos.ru

Security policy + 152-ФЗ posture внутреннего инструмента учёта трудозатрат. Пропорционально dev-среде; ужесточить при выходе в прод.

## 1. Классификация данных

| Класс | Примеры | Правила |
|---|---|---|
| **PII (ПДн, 152-ФЗ)** | ФИО (`firstName/lastName/middleName`), `email`, `jobTitle`, `workspaceMemberRef` сотрудника | Не в git в виде реальных значений. В коде/сиде — синтетика. Реальные — из `.env`/`research/` (gitignored). |
| **Чувствительное (HR/коммерч.)** | трудозатраты (`credosTimeEntry`: hours, проект, статус, approvedBy) | Доступ по ролям. Сотрудник видит свои; руководитель — своего отдела. |
| **Секреты** | Railway-токены, `APP_SECRET`, `TWENTY_*_API_KEY/ACCESS_TOKEN` | Только `.env`/Railway/CI-secrets. Никогда в git/логах/коде. |

## 2. PII в репозитории

1. Реальные ФИО/email/ИНН/СНИЛС сотрудников **запрещены** в трекаемых файлах (сид, тесты, фикстуры, docs).
2. Сид-скрипты используют синтетические ФИО + домен `@example.test`/`@example.com`.
3. Источник реальных данных — выгрузка `research/` (gitignored) или `.env`, читается в рантайме.
4. Ревью сид-фикстур от Dev 2 — обязателен перед коммитом (CISO).

## 3. RBAC ролей приложения

1. **Least privilege.** Роль даёт минимум прав. `canDestroyAllObjectRecords` / `canUpdateAllSettings` = `false` по умолчанию.
2. **Separation of duties (approval).** Согласующий ≠ автор записи. Logic-function согласования обязана проверять `actor != entry.employee` и роль actor.
3. **Scope.** Руководитель правит/согласует записи своего отдела/проектов, не всех.
4. **Сервис-токен** (`TWENTY_APP_ACCESS_TOKEN`) даёт logic-function полный доступ к REST → авторизацию вызывающего проверяет сама функция, не полагаясь на токен.

## 4. Секреты

1. `.gitignore`: `.env`, `.env.*`, `**/secrets/**` — на месте ✅.
2. В коде — только `process.env.*`. В CI — `secrets.*`. Хардкод запрещён.
3. Найден секрет в git → `[ciso-finding] P0`, ротация токена, чистка истории.

## 5. ADR security-review

Каждый новый ADR → `[ciso-review ADR-NNNN approve|concern|block]`. `block` останавливает arch (только при обоснованном риске).

## 6. Эскалация findings

`[ciso-finding] #N <P0-P3>` в SIGNALS. P0 = freeze коммитов до устранения. Регистрация в [RISK_REGISTER.md](RISK_REGISTER.md). Реализацию правок делает Dev 2 (Responsible по RBAC/PII), CISO даёт требования и ревьюит.

## 7. Валидация client-params в logic-functions (anti-filter-injection)

**Правило:** любой client-supplied параметр, интерполируемый в строку фильтра Twenty REST API, **обязан** быть валидирован по формату до интерполяции. Нарушение = injection условий в запрос (CISO-006).

```typescript
// UUID (employeeId, workspaceMemberRef, id, projectId, workTypeId, departmentId)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// ISO DateTime (from, to)
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;
```

Паттерн нарушения: `` `field[op]:${clientParam},status[eq]:DRAFT` `` без валидации → клиент инъецирует дополнительные условия.

Применять во всех logic-functions: `time-entry-api`, `approval`, `reports` (и любых будущих). Исключение: параметры, полностью заданные сервером (hardcoded, не из client input).

## 8. Авторизация агрегатных эндпоинтов

**Правило:** эндпоинты, возвращающие данные нескольких сотрудников (`byEmployee`, `byDept` с детализацией до физлица), **обязаны** проверять роль actor до включения персональных данных в ответ.

- `POST /s/reports` → `byEmployee` (ФИО + часы/утилизация): целевой доступ только `isManager` (после RBAC-волны/CISO-005).
- **[user-direct 2026-06-22] Временное исключение (CISO-007 ACCEPTED):** `credosTimeSettings.revealEmployeeNames=true` по решению владельца системы — ФИО всех 42 сотрудников видны ЛЮБОМУ авторизованному до RBAC-волны. Основание: ст. 91 ТК РФ + ст. 88 ТК РФ (внутренний учёт, все пользователи = сотрудники). Действует до реализации CISO-005 + fieldPermissions.
- Любой будущий агрегатный endpoint с ФИО/часами физлиц — применить role-guard (целевое состояние).
- Зависимость: role-check через client `workspaceMemberRef` (временно) → server-side identity (CISO-005, целевое состояние).

## 9. Медицинские ПДн (absence.note)

**Правило:** поле `credosTimeAbsence.note` (TEXT) не должно содержать медицинских сведений (диагнозы, симптомы). Медицинские данные = спецкатегория 152-ФЗ ст. 10, требуют явного согласия и повышенной защиты.

- UI: placeholder/help-текст «Примечание — не указывайте диагноз/медицинские сведения».
- `PII_INVENTORY.md`: absence.note = «факт отсутствия без медицинских деталей».
- При появлении HR-роли: field-level restriction (скрыть note от не-HR).

## 10. Прод-гейты 152-ФЗ (до production deploy)

1. РФ-контур хостинга (не Railway — нет РФ-региона) — ст. 18.5.
2. ЛНА (локальные нормативные акты): реестр операций по обработке ПДн, согласия (не нужны для трудовых функций по ТК), инструктаж пользователей.
3. API-ключ синка CRM↔time — в env secrets, TLS-канал. Синк = новая операция обработки ПДн → в ЛНА.
4. `ENCRYPTION_KEY`/`APP_SECRET` зафиксированы до запуска.
5. `seed-real.mjs` обезличен (CISO-001) — нет реальных ФИО/email в прод-деплое.
