# QA — карта покрытия apps/time

Живой документ. Обновляется при каждом приросте тестов. Дата среза: **2026-06-21**.

## Сводка

| Метрика | Значение |
|---|---|
| unit-тестов | **671 + 21 todo** (17 файлов, все зелёные) |
| integration-тестов | 1 (`schema`, нужен сервер) |
| backend-smoke (REST) | ✅ health 200 + 9/9 объектов 200 (incl. credosTimeAbsences) |
| logic-smoke `/s/reports` | ✅ live: byCategory 6 кат., Σ==fact, byDept/byEmployee/byProject |
| logic-smoke P-D1 | ✅ live: PATCH plannedEffort 200 (restore ok) |
| logic-smoke F-D | ✅ live: 11 absences (VACATION:4/SICK:3/UNPAID:2/OTHER:2) |
| browser-smoke UI (QA-1) | ⬜ §1-7 — блокирован (chrome-devtools --isolated ждёт arch) |
| oxlint | ✅ correctness=warn (61 правило, было 1) |
| [bug]#1 op:delete | ❌ всё ещё 400 — soft-delete не работает, нужен `canDestroyObjectRecords` |
| [bug]#2 NaN guard | ⚠️ calc-month.ts L19 — NaN не проходит `m<0||m>11`, crash вместо skip (P3) |
| lint | ✅ 0/0 |
| typecheck | ✅ `tsc -b tsconfig.spec.json` exit 0 |

## Покрытие по модулям

| Модуль | Тип | Статус | Файл теста |
|---|---|---|---|
| `constants/approval.ts` | чистая логика | ✅ covered | `constants/approval.test.ts` |
| `constants/universal-identifiers.ts` | инвариант данных | ✅ covered | `constants/universal-identifiers.test.ts` |
| `constants/select-options.ts` | UI-пиклисты + cross-SSOT | ✅ covered | `constants/select-options.test.ts` |
| `constants/labels.ts` | cross-SSOT labels↔options | ✅ covered | `constants/labels.test.ts` |
| `front-components/capacity/calc-load.ts` | расчёты ёмкости/загрузки | ✅ covered | `front-components/capacity/calc-load.test.ts` |
| `front-components/grid/format.ts` | UX-логика ячеек/индикаторов | ✅ covered | `front-components/grid/format.test.ts` |
| `front-components/calendar/calc-month.ts` | агрегат произв. календаря | ✅ covered | `front-components/calendar/calc-month.test.ts` |
| `logic-functions/reports-calc.ts` | отчёты: util/norm/under/byCategory/F-D норма | ✅ covered | `logic-functions/reports-calc.test.ts` |
| `objects/` ↔ `views/` ↔ `navigation-menu-items/` | schema-guard (pitfall+UUID+fields) | ✅ covered | `__tests__/schema-guard.test.ts` |
| `front-components/grid/use-filters.ts` | UX-фильтры таймшита (4 чистые ф-ции) | ✅ covered | `front-components/grid/use-filters.test.ts` |
| `front-components/grid/types.ts` | `makeRowKey`/`splitRowKey` контракт | ✅ covered | `front-components/grid/types.test.ts` |
| `front-components/grid/tokens.ts` | дизайн-токены + `cellFill` alpha | ✅ covered | `front-components/grid/tokens.test.ts` |
| `front-components/reports/report-tokens.ts` | `fmtUtil`/`fmtHrs`/`fmtUnder`/`underTone`/`utilTone` | ✅ covered | `front-components/reports/report-tokens.test.ts` |
| `front-components/capacity/capacity-rest.ts` | `resolveSelfIsManager` (byRef + fallback) | ✅ covered + 1 todo [bug]#3 | `front-components/capacity/capacity-rest.test.ts` |
| **SSOT-guard категорий** | `domain-types → select-options → tag-color-hex → category-meta` | ✅ 13 тестов + 3 todo | `__tests__/ssot-categories.test.ts` |
| `logic-functions/approval.logic.ts` | RBAC runSubmit/runResolve + SoD (CISO-002) | ✅ covered | `logic-functions/approval.logic.test.ts` |
| `logic-functions/time-entry-api.logic.ts` | security-регресс CISO-005/006/007/008 | 🟦 todo-спека | `logic-functions/time-entry-api.logic.test.ts` |
| `front-components/grid/use-week.ts` | дата-логика недели | 🟡 в хуке — нужен вынос (Dev 1) | — |
| **UI-экраны (timesheet/capacity/настройки/календарь)** | **browser-smoke** | **⬜ QA-1** | `reports/QA_SMOKE_CHECKLIST.md` |

Легенда: ✅ covered · 🟦 todo-спека · 🔴 gap · 🟡 предложено · ⚪ низкий приоритет.

## Открытые баги

| # | Severity | Описание | Файл | Статус |
|---|---|---|---|---|
| [bug]#1 | P1 | `op:delete` → 400 PERMISSION_DENIED (нужен `canDestroyObjectRecords` в default-role) | `roles/default-role.ts` | ❌ ждёт arch |
| [bug]#2 | P3 | `calc-month.ts`: NaN month-index проходит guard (crash вместо skip) | `front-components/calendar/calc-month.ts:19` | ⚠️ задокументирован `it.todo` |

## Очередь (next)
1. 🔴 **[bug]#1** → пере-валидация после `canDestroyObjectRecords` fix (ждёт `[synced]`)
2. 🔴 **QA-1 browser-smoke** (`QA_SMOKE_CHECKLIST.md`) — ждёт --isolated в chrome-devtools-mcp
3. 🔴 **CISO-005/006/007** → конвертировать `it.todo` в реальные тесты после Dev 2 фикса
4. 🟡 grid: вынести чистую логику из `use-week` → покрыть тоталы/дни (arch arch-ok #10)
5. 🟡 `use-period.ts`: вынести `computeRange` → покрыть месяц/квартал/год границы (не exported сейчас)
6. 🟡 `use-grid-model.ts` агрегация (dayTotals/weekTotal) — нужен `@testing-library/react` или вынос логики
