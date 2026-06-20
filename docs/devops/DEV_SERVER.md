# Dev-сервер Twenty (Railway) — devops-пути

**Дата:** 2026-06-20
**Назначение:** dev/staging-сервер Twenty 2.x для разработки и установки модуля time. Отдельный Railway-проект (НЕ прод CRM).
**Версия:** **Twenty 2.14** (подтверждено из логов: `V2_14_UpgradeVersionCommandModule`). Совместимо с SDK 2.14 (`engines.twenty >=2.14.0`). ✓

> ⚠️ Секреты (токены, пароли, APP_SECRET) — НЕ в этом файле и НЕ в git. Они в `.env` (gitignored) и в самом Railway. Здесь — только не-секретные пути/идентификаторы.

---

## Проект Railway

| Параметр | Значение |
|---|---|
| Имя проекта | Twenty Credos Time |
| Project ID | `0f4c3f20-1af6-463f-9c69-3a5f953c8d07` |
| Окружение | production (ID `e4d88262-5237-4297-8fe1-20f583ca0aad`) |
| Workspace | vsenichevpersonal's Projects |

## Сервисы (все Online)

| Сервис | Роль | Адрес / том |
|---|---|---|
| **Twenty** | сервер (NestJS) | public: `https://twenty-production-e5c5.up.railway.app`; private: `twenty.railway.internal`; порт 3000; том `twenty-volume`; service ID `51ee7951-a83c-47c3-aad2-31b026fc124f` |
| **Twenty Worker** | фоновые задачи | том общий; Online |
| **Postgres** | БД | `postgres.railway.internal:5432` (db `postgres`); том `postgres-volume` |
| **Redis** | кэш/очереди | том `redis-volume` |
| **Bucket** | хранилище файлов | Railway bucket |

## Health (прозвон 2026-06-20)
- `GET /` → HTTP 200 (~0.48s)
- `GET /healthz` → `{"status":"ok"}`
- `GET /graphql` → HTTP 200
- `GET /rest/metadata/objects` → HTTP 403 (нужна авторизация — ожидаемо)

---

## Доступ через Railway CLI

Токен и URL — в `.env` (gitignored, в корне репо). Использование:
```bash
cd <repo>
set -a; source .env; set +a            # RAILWAY_TOKEN, TWENTY_DEV_URL, RAILWAY_PROJECT_ID

RAILWAY_TOKEN="$RAILWAY_TOKEN" railway status
RAILWAY_TOKEN="$RAILWAY_TOKEN" railway variables --service Twenty
RAILWAY_TOKEN="$RAILWAY_TOKEN" railway logs --service Twenty
```
(`.env` содержит project-токен — scoped на проект «Twenty Credos Time».)

## Ключевые env сервера (заданы в Railway, НЕ в репо)
`APP_SECRET`, `PG_DATABASE_URL` (postgres.railway.internal), `SERVER_URL`, `NODE_PORT=3000`, `DISABLE_DB_MIGRATIONS=false`, `DISABLE_CRON_JOBS_REGISTRATION=false`, приватная сеть включена. (Значения — в Railway.)

---

## Как подключить наш app (apps/time)

Поток разработки против этого сервера:
```bash
cd apps/time
# 1) Зарегистрироваться на сервере (браузер): создать workspace/админа
#    https://twenty-production-e5c5.up.railway.app
# 2) Settings → API & Webhooks → создать API key (показывается один раз)
# 3) Подключить удалённый сервер как dev-таргет:
yarn twenty remote:add --url https://twenty-production-e5c5.up.railway.app --as dev
# 4) Разработка с live-sync:
yarn twenty dev
#    предпросмотр без применения:
yarn twenty dev --once --dry-run
# 5) Установка (когда готово):
yarn twenty dev:build
yarn twenty app:publish --private
yarn twenty app:install
```

## Следующие шаги (блокеры)
1. **Регистрация на сервере** (браузер) — создать workspace/админа. Сервер свежий, workspace ещё нет.
2. **API key** из Settings → положить в `.env` (например `TWENTY_DEV_API_KEY`).
3. Затем `remote:add` → `dev` → валидация Wave 1 + Wave 2 (объекты через `yarn twenty dev:add object`).

## API-доступы и прозвон (2026-06-20)

**Ключ/креды — в `.env` (gitignored):** `TWENTY_DEV_API_KEY` (playground-токен, живёт ~2ч — для постоянной работы создать обычный API key в Settings → API & Webhooks), `TWENTY_DEV_EMAIL`, `TWENTY_DEV_PASSWORD`.

**Эндпоинты (все 200):**
| Endpoint | Назначение | Статус |
|---|---|---|
| `/` | фронт | 200 |
| `/healthz` | health | 200 `{"status":"ok"}` |
| `/graphql` | core GraphQL (данные workspace) | 200 |
| `/rest` | REST playground | 200 |
| `/metadata` | metadata GraphQL playground | 200 |
| `/rest/metadata/objects` (Bearer) | список объектов | 200 |
| `/rest/companies` (Bearer) | CRUD компаний | 200 |
| **`/mcp`** (POST, Bearer) | **MCP-сервер** (tools/list → 200) | 200 |

**Формат REST metadata:** `{ data: [...объекты...], pageInfo, totalCount }` (в 2.14 `data` — массив напрямую).

**Стандартные объекты (id — для связей Wave 2):**
| Объект | id |
|---|---|
| company | `0c3126cb-f936-4bc3-ae72-5a93b933b5a1` |
| person | `06d2ffb2-baa7-4d73-ba1a-bb5172c9512b` |
| workspaceMember | `f3606d2d-d830-4ee6-a126-6dbebda8131c` |

Всего объектов: 28. Кастомных пока нет (Wave 2 создаст `tt*`).

**Состояние app:** remote «dev» добавлен; app «Трудозатраты» (`9c5fbbb6-…`) **установлен** в workspace `fb9ff9ef-…` (создано: role, frontComponent, pageLayout, pageLayoutTab, pageLayoutWidget, navigationMenuItem). `dev --once --dry-run` и `dev --once` проходят.

## Twenty MCP (нативный)
Сервер отдаёт MCP на `/mcp` (Bearer API key) — `tools/list` отвечает 200. Можно подключить как MCP-сервер в Claude Code (`settings.json`):
```json
{ "mcpServers": { "twenty": { "url": "https://twenty-production-e5c5.up.railway.app/mcp",
  "headers": { "Authorization": "Bearer <API_KEY>" } } } }
```
Даёт чтение/запись CRM из LLM. ⚠️ Для постоянного MCP нужен НЕ playground-токен (2ч), а обычный API key.

## Прод-таргет (позже)
Прод-установка time-app — в CredosCRM1 после upstream-sync форка до 2.x (ADR-0002). Этот Railway-сервер — dev/staging.
