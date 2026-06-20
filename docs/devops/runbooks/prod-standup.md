# Runbook — Прод-standup time-app (ADR-0005, Стратегия C)

**Триггер:** arch назначил прод-развёртывание time.credos.ru. Основание — [ADR-0005 «Прод-топология»](../../adr/0005-prod-topology.md) + [UPSTREAM_SYNC_ASSESSMENT.md](../UPSTREAM_SYNC_ASSESSMENT.md) (DO-1).

> **Стратегия C:** time-app ставится на **отдельный чистый Twenty 2.14** в РФ-контуре (НЕ в форк CredosCRM1 — он на v1.19, app туда не встанет). Company синкается из CRM по REST API. Апгрейд форка до 2.x — независимый трек.

## Предусловия (152-ФЗ прод-гейт)
- Хостинг в РФ-контуре (ст. 18.5 — локализация ПДн). dev-сервер Railway — НЕ для прод-ПДн.
- ЛНА по обработке ПДн оформлены (CISO, `docs/security/PII_152FZ_REVIEW.md`).
- CISO подтвердил минимизацию ПДн (ADR-0006: ФИО/email из WorkspaceMember, не дублируем).

## Шаги развёртывания

### 1. Поднять чистый Twenty 2.x (РФ-хостинг)
- Версия сервера ≥ `engines.twenty` app (сейчас 2.14). Сверить совместимость.
- Сервисы: Twenty server, Worker, Postgres, Redis, Bucket (как dev — см. `DEV_SERVER.md`).

### 2. ⚠️ ENCRYPTION_KEY ДО первого старта (КРИТИЧНО, v2.5+)
```bash
# Сгенерировать выделенный ключ и задать в env ДО первого запуска сервера:
ENCRYPTION_KEY=<32+ байт base64>
```
- Иначе backfill at-rest секретов (OAuth/app-variables/TOTP) зашифрует под `APP_SECRET` → смена ключа потом = дорогая key-rotation.
- Также задать: `APP_SECRET`, `PG_DATABASE_URL`, `SERVER_URL`, `NODE_PORT`, `LOGIC_FUNCTION_TYPE=LOCAL` (для `/s/` logic — approval/reports), `DISABLE_DB_MIGRATIONS=false`.

### 3. Создать workspace/админа + API-ключ
- Браузер → регистрация → workspace.
- Settings → API & Webhooks → **админский** API key → в прод-`.env` (gitignored).

### 4. Установить app (прод-режим, не dev-sync)
```bash
cd apps/time
yarn twenty remote:add --url "$PROD_URL" --as prod --api-key "$PROD_API_KEY"
yarn twenty dev:build                 # сборка → .twenty/output
yarn twenty app:publish --private     # публикация
yarn twenty app:install               # установка в workspace
```
- Версия app в `package.json` строго растёт (иначе `VERSION_ALREADY_EXISTS`).
- `engines.twenty` ↔ версия сервера (иначе `SERVER_VERSION_INCOMPATIBLE`).

### 5. Company-sync из CRM (ADR-0005)
- time-app на отдельном инстансе → Company не шарится напрямую с CRM-форком.
- Синк контрагентов из CRM по REST API (периодический job / on-demand). Спроектировать отдельно (REQ при назначении).
- Открытый вопрос (CISO-004): дублирование мастер-данных Employee между инстансами — RBAC/минимизация ПДн решить ДО старта.

### 6. Сид + проверка
```bash
set -a; source .env; set +a
node apps/time/scripts/seed-real.mjs   # ОБЕЗЛИЧЕННЫЙ источник (CISO-001) или реальные из gitignored
node apps/time/scripts/seed-calendar.mjs
node apps/time/scripts/check-consistency.mjs
./infra/scripts/health.sh              # все 200
```
- Маппинг `credosTimeEmployee.workspaceMemberRef` → реальные WorkspaceMember (иначе сетка/«Планировать» не работают per-user; известный gap — 42/43 не маплены на dev).

### 7. Приёмка
- QA: полный smoke на прод-URL. CISO: 152-ФЗ-гейт пройден. arch: `[deployed]` прод.

## Откат
Прод-установку откатывают установкой предыдущей версии app (`app:install` нужной версии — версии в package.json растут, прежние доступны). БД — бэкап `pg_dumpall` до старта.

## Бэкапы и мониторинг (D5)

**Бэкапы БД (РФ-контур):**
- Регулярный `pg_dumpall` (или provider-snapshot) Postgres прод — расписание (ежедневно + перед каждым app-upgrade/sdk-bump). Хранить в РФ-контуре (152-ФЗ).
- Перед `app:install`/миграцией — обязательный ручной дамп (точка отката, см. `rollback.md`).
- Проверять восстановимость дампа (test-restore периодически), иначе бэкап = иллюзия.

**Мониторинг:**
- Health: `./infra/scripts/health.sh` периодически (healthz/metadata/graphql/mcp) — как на dev. Loop/cron + алерт при FAIL.
- Сервисы провайдера (Twenty server/Worker/Postgres/Redis) — рестарт-петли/OOM/деградация (см. `incident-health.md`).
- App-sync дрейф: `dev --once --dry-run` — на прод НЕ применять автоматически (прод = `app:publish`+`app:install`, не dev-sync).
- ENCRYPTION_KEY/секреты в env, не в git (`secret-scan.sh` + pre-commit hook).

## Карта задач очереди DevOps (BACKLOG_BOARD)
- **D1** Прод-инстанс Twenty 2.14 (Стратегия C) → §1 + §3-4.
- **D2** ENCRYPTION_KEY до первого старта → §2 (КРИТИЧНО).
- **D3** 152-ФЗ локализация БД РФ + ЛНА → «Предусловия» + §7 (CISO-гейт).
- **D4** Синк Company из CRM по REST API → §5.
- **D5** Бэкапы/мониторинг прод + healthz → этот раздел.

> Исполнение D1-D5 **гейтится появлением прод-инстанса + бизнес-решением по РФ-хостингу** (152-ФЗ). До этого — план готов (этот runbook), dev-сервер работает по Стратегии C де-факто.
</content>
