# DevOps Playbook — time.credos.ru (чтобы работало как часы)

**Дата:** 2026-06-20
**Назначение:** единый рабочий регламент: от нуля до наката app. Все команды проверены на живом dev-сервере.
**Связано:** `DEV_SERVER.md` (пути/доступы сервера), `../standards/DEV_STANDARDS.md` (код/нейминг).

---

## 0. Предусловия (один раз)
```bash
node --version      # ^24.5.0
corepack enable     # включает Yarn 4
docker --version    # для локального Twenty (НЕ нужен — дев против Railway 2.14)
```
- Dev-сервер: Twenty **2.14** на Railway (см. `DEV_SERVER.md`). Локальный Docker не требуется.
- Секреты — в `.env` (корень репо, gitignored): `TWENTY_DEV_URL`, `TWENTY_DEV_API_KEY` (админский!), `RAILWAY_TOKEN`.

## 1. Загрузка окружения (каждая сессия)
```bash
cd <repo>
set -a; source .env; set +a       # TWENTY_DEV_URL, TWENTY_DEV_API_KEY, RAILWAY_*
```

## 2. Подключение app к серверу (один раз / при смене ключа)
```bash
cd apps/time
yarn twenty remote:add --url "$TWENTY_DEV_URL" --as dev --api-key "$TWENTY_DEV_API_KEY"
```
⚠️ Ключ должен быть с **админ-ролью** (иначе «Entity does not have permission» на синке). Проверка: `curl -s -o /dev/null -w '%{http_code}' "$TWENTY_DEV_URL/rest/metadata/objects" -H "authorization: Bearer $TWENTY_DEV_API_KEY"` → 200.

## 3. Рабочий цикл разработки
```bash
cd apps/time
yarn twenty dev --once --dry-run    # предпросмотр: typecheck + diff, НИЧЕГО не применяет
yarn twenty dev --once              # НАКАТ: применяет изменения на dev-сервер
yarn twenty dev                     # watch-режим (live-sync при сохранении файлов)
yarn lint                           # oxlint
yarn test:unit                      # vitest unit (без сервера, vitest.unit.config.ts)
yarn test                           # vitest integration (нужен сервер)
```
Правило: сперва `--dry-run` (чисто) → потом `dev --once` (накат).

**DevOps-обёртки ([infra/scripts/](../../infra/scripts/)):**
- `./infra/scripts/sync.sh` — безопасный накат: dry-run → подтверждение → apply (вместо ручного `dev --once`).
- `./infra/scripts/health.sh [--quiet]` — прозвон healthz/metadata/graphql/mcp (запускать из КОРНЯ репо).
- `./infra/scripts/secret-scan.sh [--all]` — скан секретов+ПДн (см. §10).
- Регламенты: [runbooks/](runbooks/) (deploy-sync, rollback, sdk-bump, incident-health, secrets-pii, prod-standup).

## 4. Создание сущностей
- **Рекомендуется CLI** (автогенерит UUID v4): `yarn twenty dev:add <type>`
  типы: `object|field|logicFunction|frontComponent|role|view|navigationMenuItem|pageLayout|pageLayoutTab|commandMenuItem|skill|agent`
- CLI интерактивный (без флагов имени) → можно писать файлы вручную по образцу, UUID v4 в `src/constants/universal-identifiers.ts`.
- Папки: `src/objects/ fields/ logic-functions/ front-components/ roles/ views/ navigation-menu-items/ page-layouts/`. Импорт всегда `from 'twenty-sdk/define'`.

## 5. Накат в прод (позже)
```bash
yarn twenty dev:build                 # сборка → .twenty/output (--tarball для .tgz)
yarn twenty app:publish --private     # публикация на сервер
yarn twenty app:install               # установка в workspace
```
- Версия в `package.json` строго растёт (иначе `VERSION_ALREADY_EXISTS`).
- `engines.twenty` (`>=2.14.0`) ↔ версия сервера (иначе `SERVER_VERSION_INCOMPATIBLE`).
- **Прод-таргет (решено DO-1, см. `UPSTREAM_SYNC_ASSESSMENT.md`):** НЕ ждём upstream-sync форка CredosCRM1 (он на **v1.19.0**, SDK 0.7 — app туда физически не встанет). Прод time-app = **отдельный чистый Twenty 2.x** (клон dev-сервера, Стратегия C). Апгрейд форка CRM до 2.x — независимый трек.
- ⚠️ **ENCRYPTION_KEY ДО первого старта на 2.5+** (КРИТИЧНО): на свежем прод-инстансе задать выделенный `ENCRYPTION_KEY` в env **до** первого запуска. Иначе Twenty при backfill зашифрует at-rest секреты (OAuth/app-variables/TOTP) под `APP_SECRET`, и смена ключа потом = дорогая key-rotation. На dev-сервере (2.14) проверить наличие до апгрейда.

## 6. Прозвон (health)
```bash
URL="$TWENTY_DEV_URL"; K="$TWENTY_DEV_API_KEY"
curl -s -o /dev/null -w '%{http_code}\n' "$URL/healthz"                                    # 200
curl -s -o /dev/null -w '%{http_code}\n' "$URL/rest/metadata/objects" -H "authorization: Bearer $K"   # 200 (admin)
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$URL/mcp" -H "authorization: Bearer $K" \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'                                   # 200
```

## 7. Railway (инфра)
```bash
RAILWAY_TOKEN="$RAILWAY_TOKEN" railway status                       # сервисы/состояние
RAILWAY_TOKEN="$RAILWAY_TOKEN" railway variables --service Twenty   # env сервера
RAILWAY_TOKEN="$RAILWAY_TOKEN" railway logs --service Twenty        # логи (версия V2_x при старте)
```

## 8. MCP (опционально — дать LLM доступ к workspace)
Settings → AI → MCP в Twenty. Endpoint `/mcp`. Конфиг Claude Code (`settings.json`):
```json
{ "mcpServers": { "twenty": { "url": "<URL>/mcp", "headers": { "Authorization": "Bearer <ADMIN_API_KEY>" } } } }
```

## 9. Troubleshooting (грабли, уже пойманные)
| Симптом | Причина | Решение |
|---|---|---|
| `Entity does not have permission` на dev/sync | API-ключ не админ | взять ключ с админ-ролью (Settings → API & Webhooks) |
| `App ... is not installed` (dry-run) | app ещё не зарегистрирован | `yarn twenty dev --once` (регистрирует) |
| `Server does not expose a CLI client ID` | community-образ без OAuth-клиента | использовать `--api-key`, не OAuth |
| SELECT reject на sync | значения не UPPER_SNAKE | опции SELECT в UPPER_CASE (ярлыки русские, коды латиницей) |
| поле `position` конфликтует | системное поле POSITION | переименовать (напр. `jobTitle`) |
| `INVALID_FIELD_INPUT: name "type" is reserved` (dry-run) | поле объекта названо `type` (зарезервировано Twenty) | переименовать поле (напр. `absenceType`); label/UUID-константу не трогать. Каскадом часто даёт ложную `INVALID_VIEW_DATA: Field metadata not found` — уходит после фикса имени |
| `yarn test` → `Cannot connect to Twenty server` | дефолтный `test` = интеграционные (нужен сервер) | для юнитов `yarn test:unit` (vitest.unit.config.ts); интеграционные — только при живом сервере |
| сид-скрипт падает `GET → 400 / exit 2` | объект ещё не задеплоен (dry-run only) | сперва `dev --once` (накат объекта), потом запуск сид-скрипта; скрипты идемпотентны |
| right `403 PERMISSION_DENIED` на REST DELETE/PATCH под app-токеном | у дефолт-роли app нет per-object permissions (только top-level флаги) | задать явные `objectPermissions` (read/update/softDelete) на объекты в `default-role.ts` |
| объект не виден в UI | нет view+nav | добавить `defineView` + `defineNavigationMenuItem` |
| токен истёк (playground 2ч) | playground-токен | использовать постоянный API_KEY (exp далеко) |
| front-component краш `getBoundingClientRect is not a function` | песочница Web Worker (Remote DOM) — НЕТ host DOM | не использовать getBoundingClientRect/window.innerHeight/document.* в front; направление/замеры — без DOM |
| `/rest/core/...` → 400 | нюанс пути | данные через `/rest/<object>` (напр. `/rest/companies`) |

## 10. Безопасность (нерушимо)
- Секреты ТОЛЬКО в `.env` (gitignored). Никогда не коммитить токены/пароли. Реальные ПДн сотрудников (ФИО/`@credos.ru`) в коде — недопустимо (CISO-001/152-ФЗ).
- **Автоматический guard:** `./infra/scripts/secret-scan.sh` — скан staged (`--all` по всему дереву) на токены (`eyJ…`, `RAILWAY_TOKEN=`, `Bearer …`) + ПДн (`@credos.ru`). Scope ПДн — только код `apps/**`/`infra/**` (research/docs/.AITEAM — политика CISO, см. `runbooks/secrets-pii.md`).
- **Pre-commit hook** (блокирует коммит при находке): включить один раз — `git config core.hooksPath infra/git-hooks`. Обход в исключении — `git commit --no-verify`.
- Токены — только в заголовке Authorization, не в URL.

## 11. Git
- Conventional commits: `feat(time):`, `fix(time):`, `docs(devops):`. Описания — по-русски.
- Ветка по умолчанию `main`; работаем инкрементально, коммит на атом.
