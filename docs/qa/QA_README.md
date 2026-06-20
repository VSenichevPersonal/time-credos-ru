# QA — индекс зоны качества

Рабочее пространство роли **QA** (см. [.AITEAM/handoffs/QA.md](../../.AITEAM/handoffs/QA.md)).
Цель: держать `apps/time` зелёным — unit, lint, typecheck, smoke на dev-workspace, приёмка фич.

## Структура

```
docs/qa/
├── QA_README.md       ← этот файл (навигация по QA)
├── QA_TEST_PLAN.md    ← стратегия: уровни тестов, что покрываем, приоритеты
├── QA_COVERAGE.md     ← живая карта покрытия (модуль → статус)
└── reports/
    └── QA_<feature>.md ← приёмка по фиче (по мере выхода фич)
```

Тест-код живёт **рядом с кодом** в `apps/time/`:
```
apps/time/
├── vitest.config.ts            ← integration (*.integration-test.ts, нужен живой Twenty)
├── vitest.unit.config.ts       ← unit (*.test.ts, чистые функции, без сервера)  ⟵ добавлен QA
└── src/**/*.test.ts            ← unit-тесты рядом с модулями
```

## Команды

```bash
cd apps/time
yarn lint                                  # oxlint (должно быть 0/0)
npx tsc -b tsconfig.spec.json              # typecheck (НЕ `tsc --noEmit` — даёт ложный TS6305)
npx vitest run -c vitest.unit.config.ts    # unit-тесты (без сервера)
yarn test                                  # integration (нужен Twenty на localhost:2020)
```

## Уровни тестов

| Уровень | Где гоняется | Нужен сервер | Что проверяет |
|---|---|---|---|
| **unit** | локально, CI | нет | чистые функции: расчёты, SSOT-логика, валидность констант |
| **integration** | локально (docker) / dev | **да** (`localhost:2020`) | схема объектов, CRUD через Core API |
| **smoke** | dev-workspace Railway | dev-сервер | объекты видны, view/grid работают, навигация |

## Поток бага

QA находит регрессию → `[bug] #N` в `## QA → arch` SIGNALS (repro, severity P0/P1/P2, assign-хинт) → arch triage → dev фиксит → QA регрессит `[qa-ok]`.

## Push-зона QA (tests-only)

`**/*.test.ts`, `apps/time/vitest*.config.ts`, `.oxlintrc.json`, `docs/**/QA_*.md`. Префикс: `test(time): …` / `qa(time): …`. Только после чистых lint+typecheck.
