# Бэклог Dev 1 (Front + UX)

Очередь задач фронта. Приоритет: 🔴 высокий · 🟡 средний · 🟢 потом. Статусы: TODO / WIP / DONE / BLOCKED.

> Два фронт-инстанса Dev 1: **я** — `settings/grid/cards/calendar`, **второй** — `reports/capacity` (делёж в SIGNALS 23:58). Продуктовые UX-идеи — [docs/data-model/UX_IMPROVEMENTS_BACKLOG.md](../data-model/UX_IMPROVEMENTS_BACKLOG.md). Рецепты добавления поверхностей — [FRONT_COMPONENT_RECIPES.md](FRONT_COMPONENT_RECIPES.md).

## ✅ Сделано + задеплоено

| # | Задача | Файлы |
|---|---|---|
| FE-1 | Фикс переполнения дропдаунов (DOM-free, структурный `dropUp`) | `grid/{autocomplete,add-row}` |
| FE-5 / U1 | Автосейв + индикатор «Сохранено» | `grid/{use-save-status,save-indicator}` |
| FE-2 / DP-0001 | Редизайн «Планирование» (метрика-тоггл, «свободен с», месяц-бэнды, перекрас) | `capacity/*` · [DP-0001](proposals/DP-0001-capacity-board-redesign.md) ✅ |
| FE-11 | Карточка проекта → «Команда»: таблица участников | `project-team/*` |
| — | (второй фронт) дашборд «Отчёты», «Бюджет», ось «по людям», UX-1/4/5, P-D1 ввод планов | `reports/*`, `capacity/*` |

## 🔧 Готово локально — ждёт батч/sync (arch)

| # | Задача | Файлы |
|---|---|---|
| S1-D1 | Подраздел Settings «Настройки Time Credos» (отделы inline + справочники) | `settings/*`, `application-config.ts` |
| CAL-D1 | Помесячный производственный календарь (5/2) — раздел сайдбара | `calendar/*`, page-layout + nav |

## 📋 Моя очередь (settings/grid/cards/calendar)

| # | Задача | Приор | Статус |
|---|---|---|---|
| PRJ-FACT | В views проектов/этапов: факт списано + остаток + перерасход | 🔴 | BLOCKED — жду Dev 2: rollup-поле `factHours` (бэк) vs front-component? |
| UI-A | Дублировать строку таймшита (Kimai Duplicate) | 🟡 | TODO (волна-3, grid) |
| UI-B | Сохранённые фильтры (Timetta) | 🟡 | TODO (волна-3, grid) |
| UI-D | Цвет-кодинг проектов (grid-часть; capacity/reports — второй фронт) | 🟡 | TODO |
| QA-CALC | Вынести pure-calc из `use-week`/`use-grid-model` в `grid/week-calc.ts` (под unit QA) | 🟡 | TODO (arch-ok, волна-3) |
| currentStage | Дефолт «текущий этап» (ACTIVE / дата в [start,end]) в гриде | 🟡 | TODO (research, ждёт раздачу arch; бэк `currentStage()` — Dev 2) |
| DP-0002 | **Объяснимые числа (click-to-explain / drilldown)** — по каждой цифре в Отчётах И Планировании клик → формула + состав. Спека [DP-0002](proposals/DP-0002-explainable-numbers-drilldown.md). Кросс-зона: P0 shared `<Explainable>` (я) → P1 reports/capacity (второй фронт) + grid-тоталы (я). | 🔴 | PROPOSED (ждёт раздачу arch) |
| FE-3 | Карточка проекта «Трудозатраты»: проверить инлайн-таблицу в UI, стилизация | 🟢 | TODO (верифицировать) |
| FE-4 | Ревизия вкладок карточек на табличный вью | 🟢 | TODO |

## 🚫 Не моя зона (второй фронт-инстанс)
R3-viz (категорийный разрез в дашборде «Отчёты»), reports/*, capacity/* (absence-отображение).

## Координация (входящее)
- **CISO:** RBAC Settings (write полей отдела — админ/свой отдел) → RBAC-волна (field-perms серверно), мой v1 фронт-only.
- **Dev 2:** absence→ёмкость phase2 — он logic/reports-calc, я отображение (раздельно, след. волна).
- **FE-10 approval-bar gate:** поле `isManager` есть; UI-gate в RBAC-волну (фронт-гейт = известное dev-ограничение).
