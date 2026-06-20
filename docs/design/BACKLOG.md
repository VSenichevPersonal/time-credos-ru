# Бэклог Dev 1 (Front + UX)

Очередь задач фронта/дизайна. Приоритет: 🔴 высокий · 🟡 средний · 🟢 потом. Статусы: TODO / WIP / DONE / BLOCKED.

> Продуктовые UX-идеи (T1–U11) — в [docs/data-model/UX_IMPROVEMENTS_BACKLOG.md](../data-model/UX_IMPROVEMENTS_BACKLOG.md). Здесь — рабочая очередь Dev 1 с привязкой к коду.

## В работе / срочное

| # | Задача | Приор | Статус | Файлы / связь |
|---|---|---|---|---|
| FE-1 | **Фикс переполнения дропдаунов** (add-row таймшита у нижней кромки → клип). Системный авто-флип + кап высоты, вынесен в SSOT-хук `use-dropdown-direction`. | 🔴 | **DONE (локально)** — lint+tsc+аудит чисто, ждёт пуша arch | `grid/autocomplete.tsx`, `grid/use-dropdown-direction.ts`. [UI_PLAYBOOK §2.1](UI_PLAYBOOK.md) |
| FE-2 | **Редизайн доски «Планирование»** (P0+P1: «свободен с», метрика-тоггл, каркас времени, перекрас, убрать mode-switcher). | 🔴 | **`[arch-ok]` 19:35 — следующий после волны-1** | [DP-0001](proposals/DP-0001-capacity-board-redesign.md), `capacity/*` |
| FE-9 | **R2-D1 Дашборд «Отчёты»** (front+nav, reuse filters-bar, impeccable) — волна-2 от arch. | 🔴 | TODO (волна-2) | новый front-component + nav-item |
| FE-10 | **approval-bar UI-gate** — прятать approve/reject при `!isManager`. Контракт: читать employee текущего юзера по `workspaceMemberRef` → `isManager`; в logic-функцию approve/reject передавать `workspaceMemberRef` actor'а в params. | 🔴 | TODO (Dev 2 поле `isManager` накатано) | `grid/approval-bar.tsx`, `grid/use-approval.ts` |
| FE-3 | **Карточка проекта → вкладка «Трудозатраты»: табличный вью** как в таблице трудозатрат. | 🔴 | TODO (дизайн + коорд. Dev 2 по агрегатам) → `[design-proposal]` | front-component (page-layout проекта) |
| FE-4 | **Ревизия вкладок карточек на табличный вью** — где список лучше заменить на грид. | 🟡 | TODO | `views/`, `page-layouts/` |

## Из UX-бэклога (моя зона, чистый фронт)

| # | Задача | Приор | Статус |
|---|---|---|---|
| FE-5 | U1 автосейв + индикатор «сохранено» в grid | 🔴 | **DONE (локально)** — `use-save-status` + `save-indicator` в тулбаре, ждёт пуша |
| FE-6 | K2 дублировать строку/запись в недельной сетке | 🔴 | TODO |
| FE-7 | U7 цвет-кодинг проектов + U8 сохранённые фильтры | 🟡 | TODO |
| FE-8 | K4 отчёты/экспорт + U4 дашборд утилизации (нужна коорд. Dev 2) | 🟡 | TODO (→ `[design-proposal]`) |

## Координация (входящее)

| От кого | Запрос | Статус |
|---|---|---|
| QA | Вынести чистую calc-логику тоталов сетки из компонентов в отдельные `.ts` → покроют тестами. «Где живёт расчёт тоталов?» | TODO — ответить: `grid/footer-totals.tsx` + хелперы; вынести в `grid/calc-totals.ts` |
| Dev 2 | Контракт «как фронту узнать роль actor'а» для approval-UI gate (флаг `canApprove` / RBAC-контекст). | BLOCKED — жду механизм от Dev 2 |
| Dev 2 | GLOSSARY.md — звать сущности одинаково (Вид работ ≠ Activity). | принять в работу при правках ярлыков |
