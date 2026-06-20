# SUMMARY 01-01 — SETUP (каркас app)

**Дата:** 2026-06-20
**Статус:** выполнено (кроме dry-run — нужен Docker, отложено)

## Что сделано
- Скаффолд через `npx create-twenty-app@latest` → слит в `apps/time/` (наш README и `.planning/` сохранены; вложенный `.git` удалён; скаффолдный README → `README-scaffold-reference.md`).
- `application-config.ts` уже с русским `displayName` «Трудозатраты» + описание (заданы через флаги CLI).
- `package.json`: добавлен `engines.twenty: ">=2.14.0"`.
- Доменный SSOT: `src/constants/domain-types.ts` (union-типы) + `src/constants/labels.ts` (русские ярлыки: отделы, категории, группы, статусы, docType + BILLABLE_CATEGORIES, WEEKLY_NORM_HOURS).

## ⚠️ Важные факты (уточняют downstream-планы)
1. **SDK = 2.14.0** (create-twenty-app@latest), НЕ pre-GA 0.7 форка. Импорт — `twenty-sdk/define` (не `twenty-sdk`).
2. **Реальные папки SDK** (канон из scaffold CLAUDE.md):
   `src/objects/ · src/fields/ · src/logic-functions/ · src/front-components/ · src/roles/ · src/views/ · src/navigation-menu-items/ · src/page-layouts/ · src/skills/ · src/agents/`. Дефолтная роль — `src/default-role.ts` (корень src).
3. **Генерация сущностей — через `yarn twenty dev:add <type>`** (object/field/logicFunction/frontComponent/role/view/navigationMenuItem/pageLayout) — автогенерит валидные UUID v4. Использовать вместо ручного создания файлов.
4. **UUID v4 обязательны**; централизуются в `src/constants/universal-identifiers.ts`.
5. **Пиалы (pitfalls):** объект без index-view невидим; view без navigationMenuItem не в сайдбаре; front-компонент — фиксированный размер виджета, без скролла (если не canvas-таб).
6. **Богатый пример:** `packages/twenty-apps/examples/postcard` (twentyhq/twenty) — образец.

## Коррекции путей в планах 01-02…01-09
- `src/objects/*.object.ts` → `src/objects/<name>.ts` (через `dev:add object`)
- `src/front/*` → `src/front-components/*`
- `src/navigation/*` → `src/navigation-menu-items/*`
- `src/logic/*` → `src/logic-functions/*`
- роли: доп. → `src/roles/*`, дефолтная — `src/default-role.ts`
- импорт всегда `from 'twenty-sdk/define'`; пути `from 'src/...'`
- ярлыки брать из `src/constants/labels.ts`

## Блокер
- **Docker daemon не запущен** → `yarn twenty dev`/`--dry-run` и установка не проверены. Дев требует локального Twenty 2.x в Docker. Скаффолд и код-файлы делаются без Docker; верификация — после старта Docker.
- Подтверждено решение ADR-0002: дев против локального Twenty 2.x (SDK 2.14), форк (pre-GA) — только для прод-установки после upstream-sync.

## Чек-лист
- [x] Скаффолд в apps/time
- [x] defineApplication «Трудозатраты»
- [x] engines.twenty
- [x] SSOT (типы + русские ярлыки)
- [ ] dry-run (отложено — Docker)
