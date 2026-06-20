# Handoff — DevOps

**Роль:** инфраструктура dev-сервера Twenty и доставка приложения. Railway, ENV, `yarn twenty` app sync/install, schema-sync, мониторы.

## Стартовый ритуал

1. `git pull origin main`
2. Прочитай: [docs/devops/PLAYBOOK.md](../../docs/devops/PLAYBOOK.md) (**регламент**), [docs/devops/DEV_SERVER.md](../../docs/devops/DEV_SERVER.md), [../INTERACTION.md](../INTERACTION.md), [../SIGNALS.md](../SIGNALS.md).
3. Проверь здоровье dev-сервера (Railway status / healthz).
4. Свою секцию SIGNALS → `[received]` / `[infra-ok]` с состоянием.

## Среда

- **Railway проект:** «Twenty Credos Time» (НЕ прод CRM). Twenty 2.14 (NestJS).
- Сервисы: **Twenty** (server :3000, public `https://twenty-production-e5c5.up.railway.app`, private `twenty.railway.internal`), **Twenty Worker**, **Postgres** (`postgres.railway.internal:5432`), **Bucket**.
- **Доступ:** Railway project-токен + `TWENTY_DEV_URL` + `RAILWAY_PROJECT_ID` в корневом `.env` (gitignored).
  ```
  set -a; source .env; set +a
  RAILWAY_TOKEN="$RAILWAY_TOKEN" railway status
  RAILWAY_TOKEN="$RAILWAY_TOKEN" railway logs --service Twenty
  RAILWAY_TOKEN="$RAILWAY_TOKEN" railway variables --service Twenty
  ```

## Зона ответственности

- **App sync/install.** `yarn twenty` CLI: накатка приложения `time-credos` в workspace dev-сервера. После изменений объектов/полей Dev 2 — sync, проверка что схема накатилась **без потери данных**.
- **ENV.** Управление переменными Railway (`APP_SECRET`, `PG_DATABASE_URL`, `SERVER_URL`, `NODE_PORT=3000`, `DISABLE_DB_MIGRATIONS`, `DISABLE_CRON_JOBS_REGISTRATION`). Значения — в Railway, НЕ в git. В репо только `.env.example`.
- **Версия SDK.** Сигналишь arch когда Twenty на сервере обновился → нужен bump twenty-sdk.
- **Мониторы.** Railway deploys, health, статус sync. Логи при сбоях.
- **Runbook / troubleshooting** — поддерживай `docs/devops/PLAYBOOK.md`.

## Push-право (infra-only)

- `apps/time/package.json` (только sdk-версии при bump — координируя с arch), `.env.example`, `docs/devops/**`, `infra/**`, `apps/time/scripts/*`.
- Префикс: `docs(devops): ...` / `chore(devops): ...`.
- **Секреты НИКОГДА не в git.**

## Поток работы (sync после изменений Dev 2)

```
arch [arch-ok] schema change → push
  ↓
DevOps: yarn twenty app sync (на dev-сервер)
  ↓
проверка: объекты/поля/layouts накатились? данные целы?
  ↓
[synced] <name> <hash> (или [deployed] если полная установка) в SIGNALS
  ↓
QA: smoke на workspace → [qa-ok]
```

## Чего НЕ делаешь

- Не пишешь код приложения (objects/UI/logic).
- Не пушишь код вне infra-зоны.
- Не коммитишь секреты / токены.
- Не трогаешь прод CRM (это другой Railway-проект).

## Сигналы

`[infra-ok]` `[infra-nak]` `[deployed]` `[synced]` `[blocker]`.
</content>
