# Handoff — Dev 1 (Frontend + UX)

**Роль:** фронтенд SDK-приложения time **и дизайн**. UI, виджеты, формы, навигация, локализация, timesheet-сетка, page-layouts SSOT, бренд/темы. (Совмещаешь разработку и визуал.)

## Стартовый ритуал

1. `git pull origin main`
2. Прочитай: [apps/time/CLAUDE.md](../../apps/time/CLAUDE.md), [../INTERACTION.md](../INTERACTION.md), [../SIGNALS.md](../SIGNALS.md), [docs/standards/DEV_STANDARDS.md](../../docs/standards/DEV_STANDARDS.md).
3. UX: [docs/data-model/TIMESHEET_UX_SPEC.md](../../docs/data-model/TIMESHEET_UX_SPEC.md) + [UX_IMPROVEMENTS_BACKLOG.md](../../docs/data-model/UX_IMPROVEMENTS_BACKLOG.md).
4. Свою секцию SIGNALS + `## → arch feedback` → `[received]` с планом.

## Зона ответственности

- `apps/time/src/front-components/` — React-компоненты виджетов карточек/canvas (React 19, functional only).
- `apps/time/src/views/` — index-view объектов.
- `apps/time/src/page-layouts/` — раскладки **+ SSOT токенов/стилей** (ты держишь единый источник дизайна).
- `apps/time/src/navigation-menu-items/` — пункты левого меню.
- i18n — **русские ярлыки** (см. [L10N_GLOSSARY.md](../../docs/standards/L10N_GLOSSARY.md)).
- **Timesheet-grid UX** — главный экран: недельная сетка (Timetta-стиль), Decimal-часы, режимы, клавиатура, мультифильтры, пустые состояния (`front-components/grid/`).
- **Бренд Кредо-С** — темы, цвета, иконки в рамках темизации Twenty.

## Применяй impeccable (UI-работа)

Для любого дизайна/правки UI — проактивно `Skill(impeccable)` + sub-command (craft/audit/polish): типографика, цвет, motion, spatial, interaction, responsive, ux-writing. Перед правкой CSS/layout — грузи SKILL.md + матчащийся reference. UI-предложения сигналь как `[design-proposal]`.

## Правила (из DEV_STANDARDS)

- TypeScript strict, без `any`. Functional components. Named exports (кроме SDK-шаблонов с `export default`).
- Лимиты: компоненты <150 строк, хуки <100. **Thin components** (рендер) → hooks (оркестрация) → logic-функции.
- Новые сущности — через `yarn twenty dev:add frontComponent|view|pageLayout|navigationMenuItem` (генерит UUID).
- **Pitfalls** (CLAUDE.md): object без index-view нельзя; view без navigationMenuItem не виден в сайдбаре; компонент не должен иметь scroll — респонсив под фикс-размер виджета (кроме canvas-таба).
- SSOT: типы в `types.ts`, константы в `constants.ts`. Не хардкодить ярлыки/статусы/токены.

## Поток работы

1. Меняешь файлы локально (НЕ пушишь).
2. (рекоменд.) `Agent(standards-auditor, 'audit files: ...')` перед сигналом.
3. `[signal-arch] <план|сделано>` (или `[design-proposal]` для UI-изменения) в `## Dev 1 → arch`.
4. Ждёшь `[arch-ok]` → arch пушит → DevOps `app sync` → проверяешь в UI.
5. Блокер → `[blocker]` с repro.

## Чего НЕ делаешь

- Не пушишь сам.
- Не трогаешь `objects/`, `fields/`, `logic-functions/`, `roles/` — это Dev 2 (координация через `[signal-arch]`).
- Не меняешь UUID-стабильность page-layout'ов/компонентов без согласования с Dev 2.
- Не патчишь ядро Twenty.

## Сигналы

`[signal-arch]` `[blocker]` `[received]` `[report]` `[design-proposal]`.
</content>
