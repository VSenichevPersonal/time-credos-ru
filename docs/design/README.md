# Зона Dev 1 — Frontend + UX/дизайн

Рабочее пространство **Dev 1** (Front + UX) проекта time.credos.ru. Здесь живут дизайн-решения, гардрейлы UI и предложения по интерфейсу — то, что не место в коде, но управляет кодом.

> Код фронта — в `apps/time/src/{front-components,views,page-layouts,navigation-menu-items}/`. Здесь — **почему** он такой и **куда** движется.

## Структура

```
docs/design/
├── README.md          ← этот файл (индекс зоны)
├── UI_PLAYBOOK.md     ← гардрейлы UX/UI: как НЕ ловить баги фикс-виджетов (переполнение, клиппинг, скролл)
├── BACKLOG.md         ← очередь задач Dev 1 (фичи, баги, предложения) с приоритетами
├── proposals/         ← design-proposals (DP-NNNN): крупные изменения UI до реализации
│   └── DP-0001-capacity-board-redesign.md
└── audits/            ← критики/аудиты impeccable (снимки качества)
```

## Где SSOT дизайна

Дизайн-токены — **в коде** (единственный источник, не дублировать):

| SSOT | Файл | Что |
|---|---|---|
| Токены сетки/таймшита | `apps/time/src/front-components/grid/tokens.ts` | `T` (палитра, тинтованные нейтрали), `FONT`, `cellFill()` |
| Токены доски планирования | `apps/time/src/front-components/capacity/cap-tokens.ts` | реэкспорт `T`/`FONT` + `loadTone()`, `formatPct()` |
| Русские ярлыки | `docs/standards/L10N_GLOSSARY.md` + `docs/domain/GLOSSARY.md` (Dev 2) | термины, статусы UPPER_CASE↔RU |

Регистр (impeccable): **product** — внутренний инструмент, плотные таблицы, спокойная палитра, акцент ≤10%.

## Поток (handoff DEV1)

1. Правка локально (НЕ пуш).
2. Перед сигналом — свериться с [UI_PLAYBOOK.md](UI_PLAYBOOK.md) + (рекоменд.) `Agent(standards-auditor)`.
3. `[signal-arch]` (баг/готово) или `[design-proposal]` (новое UI) в `## Dev 1 → arch` SIGNALS.
4. `[arch-ok]` → arch пушит → DevOps sync → проверка в UI.

## Связано

- [.AITEAM/handoffs/DEV1.md](../../.AITEAM/handoffs/DEV1.md) — роль-промпт.
- [docs/standards/DEV_STANDARDS.md](../standards/DEV_STANDARDS.md) — нейминг `credosTime`, лимиты, SSOT.
- [docs/data-model/TIMESHEET_UX_SPEC.md](../data-model/TIMESHEET_UX_SPEC.md), [UX_IMPROVEMENTS_BACKLOG.md](../data-model/UX_IMPROVEMENTS_BACKLOG.md) — продуктовые UX-спеки.
