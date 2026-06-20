# Risk Register — time.credos.ru

Owner: CISO. Severity: P0 (freeze) · P1 (high) · P2 (medium) · P3 (low). Статус: OPEN · MITIGATING · ACCEPTED · CLOSED.

Контекст: внутренний инструмент, dev/staging, 15–20 пользователей. Базовый posture 🟢 LOW. Severity указаны с поправкой на dev-среду; при выходе в прод — пересмотреть вверх.

| ID | Sev | Риск | Актив | Статус | Митигизация |
|---|---|---|---|---|---|
| CISO-001 | **P1** | Реальные ПДн сотрудников в git: (а) сырые дампы-источники — `research/directum5/trudozatraty-dir5.xlsx` (13k строк), `bitrix-users/roster.csv` (72 ФИО+email), `users-bitrix.html`, `timetta/raw-odata-Users-deep.json`; (б) хардкод 42 ФИО+email в `apps/time/scripts/seed-real.mjs` (коммит 56bc320). Нарушение правила команды и 152-ФЗ. | PII сотрудников | **MITIGATING** | ✅ CISO: дампы (а) сняты с tracking (`git rm --cached`) + добавлены в `.gitignore` (секция ПДн + конвенция `**/pii/**`, `roster*.csv`). Файлы на диске целы. ⏳ Dev 2: обезличить `seed-real.mjs` (синтетика + `@example.test`, реальные грузить из gitignored-источника). ⏳ arch: решение по истории git (internal-repo → переписывание опционально). |
| CISO-002 | **P2** | `approval.logic.ts` `runResolve` (approve/reject) не проверяет: (1) роль actor = «Руководитель»; (2) **separation of duties** — actor ≠ автор записи (сотрудник может согласовать свои трудозатраты); (3) scope отдела/проекта. REST идёт под `TWENTY_APP_ACCESS_TOKEN` (сервис-токен), per-user RBAC обходится на уровне logic-function. | Целостность согласования трудозатрат | OPEN | Dev 2: добавить guard actor-role + проверку `actor != entry.employee.workspaceMemberRef` + scope по отделу руководителя. CISO даёт требования. |
| CISO-003 | P3 | `manager.role.ts` `fieldPermissions: []` — нет field-level ограничений: роль видит все поля объектов целиком (PII всё-или-ничего). | PII / least privilege | OPEN | Оценить нужность field-level (email/middleName) при появлении ролей с частичным доступом. Пока dev — ACCEPTED-кандидат. |
| CISO-005 | **P1** | `time-entry-api.logic.ts`: личность сотрудника берётся из client-supplied `params.workspaceMemberRef`, не из аутентифицированного `event.userWorkspaceId`. `delete` (L113) удаляет любую запись без проверки владельца; `upsert` создаёт/правит записи от имени любого сотрудника (impersonation); `list` читает чужие. + DEV-fallback на «первого активного». Класс broken access control / IDOR. | Целостность+конфиденц. трудозатрат | OPEN | Server-side резолв `userWorkspaceId`→employee (исследовать SDK / маппинг-таблица); ownership-guard на delete/patch; убрать prod-fallback. Системно связан с CISO-002 C2. [findings/CISO-005](findings/CISO-005-time-entry-idor.md). |
| CISO-004 | **P2** | ADR-0003: общий мастер-объект **Employee** (ФИО/email) делится между time / catalog / CRM-Sales. Владелец и RBAC общих мастер-данных — «Открыто» в ADR. PII сотрудников станет видна продажам/каталогу без явного разграничения. | PII / межапповый доступ | OPEN | Определить владельца + RBAC общих мастер-объектов (особенно PII Employee) ДО старта catalog-app. `[ciso-review ADR-0003 concern]`. Не блокирует time (каталог — следующая итерация). См. [reviews/ADR-REVIEW-LOG.md](reviews/ADR-REVIEW-LOG.md). |

## Закрытые / принятые

| ID | Sev | Решение |
|---|---|---|
| — | — | Секреты (Railway-токены, API-ключи): `.env`/`.env.*`/`**/secrets/**` в `.gitignore`, в коде только `process.env`, в CI — `secrets.*`. ✅ Утечек не найдено. |
