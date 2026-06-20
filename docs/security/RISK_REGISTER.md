# Risk Register — time.credos.ru

Owner: CISO. Severity: P0 (freeze) · P1 (high) · P2 (medium) · P3 (low). Статус: OPEN · MITIGATING · ACCEPTED · CLOSED.

Контекст: внутренний инструмент, dev/staging, 15–20 пользователей. Базовый posture 🟢 LOW. Severity указаны с поправкой на dev-среду; при выходе в прод — пересмотреть вверх.

| ID | Sev | Риск | Актив | Статус | Митигизация |
|---|---|---|---|---|---|
| CISO-001 | **P1** | Реальные ПДн сотрудников (42 × ФИО+корп-email) закоммичены в git — `apps/time/scripts/seed-real.mjs` (коммит 56bc320). Нарушение собственного правила команды («реальные ФИО/email — не в git») и 152-ФЗ (обработка/хранение ПДн без обоснования в VCS). | PII сотрудников | OPEN | Обезличить сид (синтетические ФИО + `@example.test`); реальные ФИО грузить из `.env`/локальной выгрузки `research/` (gitignored). История git — обсудить с arch (приватный internal-repo → переписывание истории опционально, пропорционально). |
| CISO-002 | **P2** | `approval.logic.ts` `runResolve` (approve/reject) не проверяет: (1) роль actor = «Руководитель»; (2) **separation of duties** — actor ≠ автор записи (сотрудник может согласовать свои трудозатраты); (3) scope отдела/проекта. REST идёт под `TWENTY_APP_ACCESS_TOKEN` (сервис-токен), per-user RBAC обходится на уровне logic-function. | Целостность согласования трудозатрат | OPEN | Dev 2: добавить guard actor-role + проверку `actor != entry.employee.workspaceMemberRef` + scope по отделу руководителя. CISO даёт требования. |
| CISO-003 | P3 | `manager.role.ts` `fieldPermissions: []` — нет field-level ограничений: роль видит все поля объектов целиком (PII всё-или-ничего). | PII / least privilege | OPEN | Оценить нужность field-level (email/middleName) при появлении ролей с частичным доступом. Пока dev — ACCEPTED-кандидат. |

## Закрытые / принятые

| ID | Sev | Решение |
|---|---|---|
| — | — | Секреты (Railway-токены, API-ключи): `.env`/`.env.*`/`**/secrets/**` в `.gitignore`, в коде только `process.env`, в CI — `secrets.*`. ✅ Утечек не найдено. |
