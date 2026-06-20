# QA — карта покрытия apps/time

Живой документ. Обновляется при каждом приросте тестов. Дата среза: **2026-06-20**.

## Сводка

| Метрика | Значение |
|---|---|
| unit-тестов | **315 + 8 todo** (8 файлов, все зелёные) |
| integration-тестов | 1 (`schema`, нужен сервер) |
| browser-smoke (QA-1) | ⬜ чеклист готов (`reports/QA_SMOKE_CHECKLIST.md`), прогон блокирован (см. ниже) |
| lint | ✅ 0/0 (112 файлов) |
| typecheck | ✅ `tsc -b tsconfig.spec.json` exit 0 |

## Покрытие по модулям

| Модуль | Тип | Статус | Файл теста |
|---|---|---|---|
| `constants/approval.ts` | чистая логика | ✅ covered | `constants/approval.test.ts` |
| `constants/universal-identifiers.ts` | инвариант данных | ✅ covered | `constants/universal-identifiers.test.ts` |
| `constants/select-options.ts` | UI-пиклисты + cross-SSOT | ✅ covered | `constants/select-options.test.ts` |
| `front-components/capacity/calc-load.ts` | расчёты | ✅ covered | `front-components/capacity/calc-load.test.ts` |
| `front-components/grid/format.ts` | UX-логика ячеек/индикаторов | ✅ covered | `front-components/grid/format.test.ts` |
| `objects/` ↔ `views/` ↔ `navigation-menu-items/` | schema-guard (pitfall) | ✅ covered | `__tests__/schema-guard.test.ts` |
| `front-components/grid/use-week.ts` | дата-логика недели | 🟡 в хуке — нужен вынос чистой части (Dev 1) | — |
| `constants/labels.ts` | cross-SSOT labels↔options | ✅ covered | `constants/labels.test.ts` |
| `logic-functions/time-entry-api.logic.ts` | security-регресс | 🟦 todo-спека (CISO-005) | `logic-functions/time-entry-api.logic.test.ts` |
| `logic-functions/approval.logic.ts` | серверная логика | 🔴 gap (P1, мок fetch, после роли REQ-0001) | — |
| `logic-functions/time-entry-api.logic.ts` | серверная логика | 🔴 gap (P1) | — |
| **UI-экраны (timesheet/capacity/карточки/нав)** | **browser-smoke** | **⬜ QA-1, приоритет волны** | `reports/QA_SMOKE_CHECKLIST.md` |
| `objects/*` (схема `credosTime*`) | schema-guard | 🟡 предложено | — |

Легенда: ✅ covered · 🔴 gap (приоритет) · 🟡 предложено · ⚪ низкий приоритет.

## Очередь (next, UX/UI-first)
1. 🔴 **QA-1 browser-smoke всех экранов** (`QA_SMOKE_CHECKLIST.md`) — как освободится браузер + будут тест-креды.
2. 🟡 grid: вынести чистую дата-логику из `use-week`/grid-model → покрыть тоталы/дни.
3. 🟡 schema-guard: префикс `credosTime` + object→view→nav-item (pitfall).
4. 🔴 `approval.logic.ts` — guard'ы `runResolve` через мок `fetch` (после роли «Руководитель», связка CISO-002 / REQ-0001).
