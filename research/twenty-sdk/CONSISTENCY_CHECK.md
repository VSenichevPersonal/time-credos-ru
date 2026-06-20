# Проверка консистентности: свежие доки Twenty SDK ↔ наши планы

**Дата:** 2026-06-20
**Цель:** сверить факты из актуальной документации Twenty SDK с принятыми решениями и моделью; зафиксировать подтверждения и правки.

---

## ✅ Подтверждено (планы верны)

| Наше решение | Подтверждение в доках |
|---|---|
| SDK-app, разработка изолированно, установка в workspace (ADR-0002) | `operations/`: `remote:add` → `dev:build` → `app:publish --private` → `app:install` |
| Раздел-папка «Время» в сайдбаре | `defineNavigationMenuItem` тип FOLDER + вложенность `folderUniversalIdentifier` |
| Сетка/таймер как front-компоненты | `defineFrontComponent` — React внутри Twenty |
| Company читаем из CRM | Core API `/rest`+`/graphql`; relation на стандартный Company через `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS` |
| Approval через logic-функции | `httpRouteTriggerSettings` (кнопки, `userWorkspaceId`) + `databaseEventTriggerSettings` (смена статуса) |
| Сид-данные | `definePostInstallLogicFunction` + ручной `dev:function:exec` |
| Decimal-часы, поля, связи | `defineField` FieldType.NUMBER, RELATION (MANY_TO_ONE/ONE_TO_MANY) |
| Локализация (русские labels) | `label` задаётся явно в `defineObject`/`defineField` |

---

## 🔧 Правки и уточнения (новые факты)

### 1. Employee — НЕ встроенный объект
**Факт:** в Twenty нет встроенного Employee; сотрудники = `Person` или кастомный объект.
**Правка модели:** наш **Employee — кастомный `defineObject`** (ФИО, отдел, email), связанный с workspaceMember/Person. НЕ полагаемся на готовый Employee. Отражено в плане (объект Employee создаём сами; маппинг на пользователя workspace — через поле).

### 2. Видимость объекта = view + nav item (обязательно)
**Факт:** объект невидим без пары defineView + defineNavigationMenuItem.
**Правка плана:** для каждого пользовательского объекта (Project, TimeEntry…) — обязательно и `defineView`, и пункт навигации. Учтено в волне UI/навигации (не забыть view для каждого видимого объекта).

### 3. Front-компоненты — песочница (Web Worker, Remote DOM)
**Факт:** нет доступа к host DOM; секреты недоступны; серверные вызовы только по HTTP `/s/`-роутам через `RestApiClient`.
**Правка плана:** недельная сетка/таймер **сохраняют данные через `/s/`-route logic-функции** (не прямой доступ к БД из компонента). Заложить в план логики: CRUD TimeEntry — через route-функцию или CoreApiClient на бэке. Влияет на дизайн грид-компонента.

### 4. Дефолтная роль — `defineApplicationRole`, ровно одна
**Факт:** одна `defineApplicationRole()` на app; `defaultRoleUniversalIdentifier` deprecated.
**Правка плана:** роли — одна дефолтная через `defineApplicationRole`; доп. ограниченные роли — `defineRole`. Учтено в плане RBAC.

### 5. Локальная разработка — Docker Twenty 2.x, НЕ форк
**Факт:** дев против локального Twenty-сервера в Docker + `yarn twenty dev`.
**Уточнение ADR-0002:** разработку ведём против **локального Twenty 2.x** (Docker), независимо от пред-GA форка. Форк нужен только для финальной установки в прод-workspace. **Снимает блокер для старта кодинга.**

### 6. Установка приватного app между workspace — Enterprise
**Факт:** шеринг приватного tarball-app между несколькими workspace — Enterprise-фича.
**Уточнение ADR-0002:** у нас ОДИН workspace на своём сервере — шеринг не нужен, ставим напрямую. Риск только если захотим мульти-workspace распространение. Зафиксировать.

### 7. Версионирование и совместимость сервера
**Факт:** `package.json` version строго растёт; `engines.twenty` semver-range; иначе ошибки публикации/установки.
**Правка плана:** в манифест/`package.json` заложить `engines.twenty` (целевая 2.x) и дисциплину версий. Учтено в SETUP-плане.

### 8. v2.5 ENCRYPTION_KEY (для upstream-sync форка)
**Факт:** с v2.5 секреты at-rest шифруются; `ENCRYPTION_KEY` задать ДО апгрейда.
**Правка ADR-0002 (открытые риски):** при upstream-sync форка до 2.5+ — заранее задать `ENCRYPTION_KEY`, иначе key rotation. Добавить в чек-лист upstream-sync.

---

## Итог
**Планы консистентны с актуальной документацией.** Внесены 8 уточнений (Employee-объект, view+nav обязательны, песочница front → `/s/`-роуты, defineApplicationRole, локальный Docker-дев снимает блокер, Enterprise-шеринг не нужен, версии/engines, ENCRYPTION_KEY). Все учтены в GSD-плане (REQUIREMENTS/ROADMAP/PLAN) и отражены в ADR-0002.

Связано: `README.md` (индекс фактов), `../../docs/adr/0002-sdk-app-isolated-repo.md`, `../../apps/time/.planning/`.
