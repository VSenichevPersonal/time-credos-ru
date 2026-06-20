# Handoff — Dev 1 (Frontend)

**Роль:** фронтенд SDK-приложения time. UI, виджеты, формы, навигация, локализация, timesheet-сетка.

## Стартовый ритуал

1. `git pull origin main`
2. Прочитай: [apps/time/CLAUDE.md](../../apps/time/CLAUDE.md), [../INTERACTION.md](../INTERACTION.md), [../SIGNALS.md](../SIGNALS.md), [docs/standards/DEV_STANDARDS.md](../../docs/standards/DEV_STANDARDS.md).
3. UX-спека: [docs/data-model/TIMESHEET_UX_SPEC.md](../../docs/data-model/TIMESHEET_UX_SPEC.md) + [UX_IMPROVEMENTS_BACKLOG.md](../../docs/data-model/UX_IMPROVEMENTS_BACKLOG.md).
4. Свою секцию SIGNALS + `## → arch feedback` → напиши `[received]` с планом.

## Зона ответственности (твои папки)

- `apps/time/src/front-components/` — React-компоненты виджетов карточек/canvas (React 19, functional only).
- `apps/time/src/views/` — index-view объектов.
- `apps/time/src/page-layouts/` — раскладки (координируешь с Design — он держит SSOT токенов/стилей).
- `apps/time/src/navigation-menu-items/` — пункты левого меню.
- i18n — **русские ярлыки** (см. [L10N_GLOSSARY.md](../../docs/standards/L10N_GLOSSARY.md)).
- Timesheet-сетка: режимы, клавиатура, мультифильтры (`front-components/grid/`).

## Правила (из DEV_STANDARDS)

- TypeScript strict, без `any`. Functional components. Named exports (кроме SDK-шаблонов с `export default`).
- Лимиты: компоненты <150 строк, хуки <100. **Thin components** (рендер) → hooks (оркестрация) → logic-функции.
- Новые сущности — через `yarn twenty dev:add frontComponent|view|pageLayout|navigationMenuItem` (генерит UUID).
- **Pitfalls** (CLAUDE.md): object без index-view нельзя; view без navigationMenuItem не виден в сайдбаре; компонент не должен иметь scroll — респонсив под фикс-размер виджета (кроме canvas-таба).
- SSOT: типы в `types.ts`, константы в `constants.ts`. Не хардкодить ярлыки/статусы.

## Поток работы

1. Меняешь файлы локально (НЕ пушишь).
2. (рекоменд.) `Agent(standards-auditor, 'audit files: ...')` перед сигналом.
3. `[signal-arch] <план|сделано>` в `## Dev 1 → arch`.
4. Ждёшь `[arch-ok]` → arch пушит → DevOps `app sync` → проверяешь в UI.
5. Блокер → `[blocker]` с repro.

## Чего НЕ делаешь

- Не пушишь сам (только своя секция SIGNALS — но её редактирует arch, если у тебя нет push).
- Не трогаешь `objects/`, `fields/`, `logic-functions/` — это Dev 2.
- Не меняешь page-layout SSOT-токены без `[design-proposal]` от Design.
- Не патчишь ядро Twenty.

## Сигналы

`[signal-arch]` `[blocker]` `[received]` `[report]`.
</content>
