# ADR-0002. Time tracking как SDK-app в изолированном репозитории

**Дата:** 2026-06-20
**Статус:** Принято (с предусловием — см. ниже)
**Зависит от:** ADR-0001 (платформа Twenty)
**Контекст-документ:** `../../ARCHITECTURE_QA.md` (Вопросы 7–8)

---

## Контекст

ADR-0001 зафиксировал: time tracking строим на Twenty. Открыт был механизм реализации.
Найден официальный **Twenty Apps SDK** (`twenty-sdk`, `npx create-twenty-app`), выпущенный с Twenty 2.0 GA (**21 апреля 2026**; v2.1.0 от 24 апреля — первый production-ready self-host). SDK даёт установочные app-приложения БЕЗ правок ядра.

## Решение

1. **Time tracking реализуем как SDK-app**, а не через старый паттерн «код в `credos/` + правки ядра (жёлтая зона)».
   - `defineObject` — TimeSheet, TimeSheetEntry, Project, Activity, Rate
   - `defineView`, `definePageLayout` — списки и карточки
   - `defineFrontComponent` — недельная сетка + таймер (React внутри Twenty)
   - `defineNavigationMenuItem` — раздел «Время» в сайдбаре (+ folder-группировка)
   - `defineLogicFunction` — approval-флоу и расчёты (триггеры route `/s/`, cron, db-event)
   - `defineRole` — RBAC приложения
   - `defineApplication` — манифест

2. **Разработка — в изолированном репозитории** (этот, `time-credos-ru`). App — самостоятельный пакет, не часть монорепо Twenty.

3. **Поставка в Twenty — установка, не merge.** App собирается и ставится в workspace через install-механизм (`application-install` / `application-registration` / `application-tarball` / marketplace). Исходники в форк не мерджим.

4. **Существующие доработки НЕ мигрируем** на SDK. Старые credos-модули (quotes, beeline, dadata, 1С, reports, AI, audit) остаются на старом паттерне. Паттерны сосуществуют. Причины: работают в проде; часть (core-патчи рендереров) в SDK невыразима; интеграции — отдельный микросервис.

## Предусловие — только к моменту УСТАНОВКИ (не для разработки)

**Важно:** код app пишем в этом репо уже сейчас — sync форка для разработки не нужен. Предусловие срабатывает лишь когда захотим реально установить app в workspace.

- **Upstream-sync форка CredosCRM1 до Twenty 2.x GA** — **ОТЛОЖЕНО, смотрим по ходу** (решение user 2026-06-20). Форк создан 14 марта 2026 — за ~5 недель до 2.0 GA; SDK-файлы в нём — пред-GA снимок (13 марта). Рабочий app-runtime 2.x нужен для install, к нему и вернёмся.
- **PoC «hello-world» SDK-app** — собрать и установить минимальный app в dev-workspace (после sync), убедиться что install/runtime работает.
- Если upstream-sync окажется неоправданно дорогим — fallback на старый credos-паттерн (раздел-папка + виджеты), решение пересматривается.

## Последствия

**Плюсы:**
- Изоляция: app декаплен от форка, свой git/PR/rollback.
- Upgrade-safe: ноль записей в `core-changes.md`, нет merge-конфликтов с ядром.
- Удаляется/ставится как юнит; свой scope ролей и API-ключа; marketplace-ready.

**Минусы / риски:**
- SDK молодой (~2 мес GA), у команды нулевой опыт.
- Нужен upstream-sync (предусловие) — форк с марта разошёлся.
- **СБИС-style продукт-селектор** (полная смена сайдбара) НЕ нативен в SDK v0.7 (`NavigationMenuItemManifest` даёт пункты + folder, не рельсу). Раздел-папка «Время» — нативно. Полная рельса — только отдельным жёлтым core-PR в форк; отложено до подтверждения потребности.

## Схема

```
time-credos-ru (этот репо)            CredosCRM1 (форк, 2.x GA)
┌──────────────────────────┐          ┌──────────────────────────┐
│ SDK-app: defineObject/    │          │ Twenty ядро + старые      │
│ View/PageLayout/Front-    │──build──▶│ credos-модули (как есть)  │
│ Component/Nav/Logic/Role  │ tarball  │                           │
│ (разработка здесь)        │─install─▶│ workspace ← app живёт тут │
└──────────────────────────┘          └──────────────────────────┘
```

## Открыто (не входит в это ADR)

- Стоимость upstream-sync форка до 2.x (оценить первой задачей).
- Нужна ли полная СБИС-рельса продуктов (→ отдельный жёлтый core-PR) или хватает раздела-папки.
- Auth/IdP (Keycloak vs Entra) → ADR-0003.
