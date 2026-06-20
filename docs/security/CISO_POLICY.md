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
