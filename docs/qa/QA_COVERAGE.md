# QA — карта покрытия apps/time

Живой документ. Обновляется при каждом приросте тестов. Дата среза: **2026-06-20**.

## Сводка

| Метрика | Значение |
|---|---|
| unit-тестов | **152** (3 файла, все зелёные) |
| integration-тестов | 1 (`schema`, нужен сервер) |
| lint | ✅ 0/0 (107 файлов) |
| typecheck | ✅ `tsc -b tsconfig.spec.json` exit 0 |

## Покрытие по модулям

| Модуль | Тип | Статус | Файл теста |
|---|---|---|---|
| `constants/approval.ts` | чистая логика | ✅ covered | `constants/approval.test.ts` |
| `constants/universal-identifiers.ts` | инвариант данных | ✅ covered | `constants/universal-identifiers.test.ts` |
| `front-components/capacity/calc-load.ts` | расчёты | ✅ covered | `front-components/capacity/calc-load.test.ts` |
| `constants/select-options.ts` (`buildOptions`) | чистая логика | 🔴 gap | — |
| `constants/labels.ts` | статика | ⚪ low | — |
| `front-components/grid/` хелперы (тоталы/дни) | расчёты | 🔴 gap (P0) | — |
| `logic-functions/approval.logic.ts` | серверная логика | 🔴 gap (P1, нужен мок fetch) | — |
| `logic-functions/time-entry-api.logic.ts` | серверная логика | 🔴 gap (P1) | — |
| `objects/*` (схема `credosTime*`) | schema-guard | 🟡 предложено | — |
| `views/` ↔ `navigation-menu-items/` | pitfall-guard | 🟡 предложено | — |

Легенда: ✅ covered · 🔴 gap (приоритет) · 🟡 предложено · ⚪ низкий приоритет.

## Очередь (next)
1. 🔴 `front-components/grid/` — расчёт тоталов/дней недели (P0, чистая логика, высокая отдача).
2. 🟡 `constants/select-options.ts` — `buildOptions` + синхронность статусов approval↔select↔labels.
3. 🟡 schema-guard: префикс `credosTime` + object→view→nav-item (pitfall).
4. 🔴 `approval.logic.ts` — guard'ы `runResolve` через мок `fetch` (после введения роли «Руководитель», связка CISO-002).
