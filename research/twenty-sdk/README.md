# Twenty SDK — документация (для контекста LLM/агентов)

Скачанная и спарсенная документация Twenty Apps SDK — опора для точного планирования и разработки модуля time.

## Состав
| Папка | Что |
|---|---|
| `fresh/` | **актуальные** доки с docs.twenty.com (скачано 2026-06-20, verbatim): getting-started, data, config, layout, logic, operations, misc |
| `developers/`, `community/`, `twenty-docs-main/` | копия `twenty-reference` из CredosCRM (март 2026) |
| `extensibility-guide.md`, `twenty-platform-reference.md` | обзорные (CRM-копия) |
| `SDK_PACKAGE_README.md` | README пакета twenty-sdk |

**Приоритет — `fresh/`** (актуальнее CRM-копии марта).

---

## Ключевые факты SDK (из свежих доков) — для планирования

### Скаффолд и dev
- `npx create-twenty-app@latest my-app`. Node 24+, Yarn 4 (`corepack enable`), Docker.
- Локальная разработка: **локальный Twenty-сервер в Docker** (`http://localhost:3000`/`2020`) + `yarn twenty dev` (live-sync). **Не требует нашего форка** — дев против локального Twenty 2.x.
- Структура: `application-config.ts` (defineApplication), дефолтная роль, CI-workflow, integration-тесты.

### Data
- `defineObject({ universalIdentifier, nameSingular, namePlural, labelSingular, labelPlural, icon, fields:[...] })`. Базовые поля (id, name, createdAt…) авто.
- `defineField` + `FieldType` (TEXT, NUMBER, DATE_TIME, SELECT, RELATION, FULL_NAME, ADDRESS…). `defaultValue`: строки в кавычках, `'uuid'`, `'now'`.
- **Связи:** `FieldType.RELATION`, двусторонние MANY_TO_ONE/ONE_TO_MANY. Линковка на стандартные объекты (Company/Person) через `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS`.
- `defineIndex` (uniq, ≤10 на объект).
- `defineField` с `objectUniversalIdentifier` — **расширение чужих объектов** (Person/Company).

### ⚠️ Видимость объекта
Кастомный объект НЕвидим пользователю без **пары: defineView (дефолтный) + defineNavigationMenuItem**. Каждому объекту в UI — и view, и пункт сайдбара.

### Layout/UI
- **`defineFrontComponent`** — React в **песочнице (Web Worker, Remote DOM, НЕ iframe)**. Нет доступа к host DOM. Секретные app-переменные недоступны во front (только в logic). Серверная логика — только по HTTP через `RestApiClient` на `/s/`-роуты. Headless-режим + Command-компоненты.
- **`defineNavigationMenuItem`** — типы VIEW/LINK/FOLDER/OBJECT/PAGE_LAYOUT; вложенность через `folderUniversalIdentifier`. **Подтверждает наш раздел-папку «Время».**
- **`defineView`** (ViewKey.INDEX, fields-колонки, фильтры; операнд должен соответствовать типу поля).
- `definePageLayout`/`definePageLayoutTab` — табы, в т.ч. к стандартным страницам.

### Logic
- **`defineLogicFunction`** + триггеры (комбинируются):
  - `httpRouteTriggerSettings` (`/s/<path>`, `isAuthRequired:true` → `event.userWorkspaceId` — кто нажал; **для кнопок approve/reject**).
  - `cronTriggerSettings` (CRON — периодические расчёты).
  - `databaseEventTriggerSettings` (`created/updated/destroyed`, фильтр по полям — **ловить смену статуса для approval**).
  - tool / workflowAction.
- **Сид:** `definePostInstallLogicFunction` (post-install) ИЛИ ручной `yarn twenty dev:function:exec -n <name> -p '{...}'`.
- `CoreApiClient` (CRUD records, типизирован под схему воркспейса) + `MetadataApiClient`. Креды инжектятся в `process.env`; права — от роли.

### Config/Roles
- `defineApplication({ universalIdentifier, displayName, description, applicationVariables })`. `applicationVariables` с `isSecret`.
- **`defineApplicationRole`** — ровно одна дефолтная роль на app. `objectPermissions`/`fieldPermissions`/`SystemPermissionFlag`. (`defaultRoleUniversalIdentifier` deprecated.)
- install-hooks: pre/post с `InstallPayload {previousVersion?, newVersion}`, флаги `shouldRunOnVersionUpgrade`/`shouldRunSynchronously`.

### Operations (установка)
- `yarn twenty remote:add --url <server> --as production` → `yarn twenty dev:build [--tarball]` → `yarn twenty app:publish --private` → `yarn twenty app:install`.
- Версия в `package.json` строго растёт (иначе `VERSION_ALREADY_EXISTS`/`CANNOT_DOWNGRADE`).
- Совместимость сервера: `engines.twenty` semver (`>=2.x`), иначе `SERVER_VERSION_INCOMPATIBLE`.
- ⚠️ **Шеринг приватного (tarball) app между workspace — Enterprise-фича.** Для нашего ОДНОГО workspace на своём сервере шеринг не нужен — устанавливаем напрямую.
- CI/CD из коробки (`ci.yml`/`cd.yml`).

### API / Self-host
- Core API `/rest/` + `/graphql/`, `Authorization: Bearer KEY`, 100 req/min, батч ≤60.
- **В Twenty нет встроенного Employee** — сотрудники = `Person` или кастомный объект. Company есть.
- Upgrade: кросс-версия с v1.22; **v2.5 — `ENCRYPTION_KEY` для секретов at-rest (задать ДО апгрейда).** Важно для upstream-sync форка.

---

См. `CONSISTENCY_CHECK.md` — сверка этих фактов с нашими планами и правки.
