# QA — карта покрытия apps/time

Живой документ. Обновляется при каждом приросте тестов. Дата среза: **2026-06-21**.

## Сводка

| Метрика | Значение |
|---|---|
| unit-тестов | **1702 + 15 todo** (55 файл, все зелёные) |
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
| `front-components/capacity/capacity-rest.ts` | `resolveSelfIsManager`/`fetchDepartments`/`fetchProjects`/`fetchDeptPlans`/`fetchEmployees`/`fetchCalendar`/`patchProject`/`patchDeptPlan` + mockPatch | ✅ 23 тестов + 1 todo [bug]#3 | `front-components/capacity/capacity-rest.test.ts` |
| **SSOT-guard категорий** | `domain-types → select-options → tag-color-hex → category-meta` | ✅ 13 тестов + 2 todo | `__tests__/ssot-categories.test.ts` |
| `front-components/shared/category-meta.ts` | `categoryMeta` SSOT-резолв + fallback OTHER/неизвестный | ✅ 7 тестов | `front-components/shared/category-meta.test.ts` |
| `front-components/reports/category-bar.ts` | `toSegments` — порядок/ширина/цвет/фильтрация ([bug]#4 регресс-guard) | ✅ 7 тестов | `front-components/reports/category-bar.test.ts` |
| `front-components/reports/bar.ts` | `pctOfNorm` — форматирование % (null/0/over-100) | ✅ 8 тестов | `front-components/reports/bar.test.ts` |
| `front-components/capacity/cap-tokens.ts` | `loadTone`/`formatPct`/`formatCell` — тон ёмкости/метрики | ✅ 15 тестов | `front-components/capacity/cap-tokens.test.ts` |
| `front-components/grid/use-timesheet-actions.ts` | `calcCopyWithHours` — копирование недели со часами (Timetta UX) | ✅ 9 тестов | `front-components/grid/use-timesheet-actions.test.ts` |
| `front-components/shared/tag-color-hex.ts` | `TAG_COLOR_HEX` palette guard + `tagColorHex` fallback | ✅ 8 тестов | `front-components/shared/tag-color-hex.test.ts` |
| `front-components/reports/use-period.ts` | `calcPeriodRange` — month/quarter/year границы (UTC, високос) | ✅ 11 тестов | `front-components/reports/use-period.test.ts` |
| `front-components/settings/settings-rest.ts` | `fetchDeptSettings`/`fetchHeadcounts`/`patchDept` — REST + дефолты | ✅ 10 тестов | `front-components/settings/settings-rest.test.ts` |
| `front-components/reports/reports-rest.ts` | `fetchReports` — ok/ok=false/null/throw Error/throw non-Error | ✅ 8 тестов | `front-components/reports/reports-rest.test.ts` |
| `front-components/calendar/calendar-rest.ts` | `fetchCalendarYear` — дефолты/paginация/cursor/стоп без cursor | ✅ 7 тестов | `front-components/calendar/calendar-rest.test.ts` |
| `front-components/grid/time-rest.ts` | `resolveEmployeeId`/`fetchProjects`/`fetchEntries`/`upsertEntry`/`deleteEntry` | ✅ 16 тестов | `front-components/grid/time-rest.test.ts` |
| `front-components/grid/approval-rest.ts` | `submitEntries`/`resolveEntries` — route+fallback+approve/reject | ✅ 9 тестов | `front-components/grid/approval-rest.test.ts` |
| `front-components/project-summary/summary-rest.ts` | `fetchProjectSummary` — fact/team/lastDate/null-дефолты/ISO-slice | ✅ 7 тестов | `front-components/project-summary/summary-rest.test.ts` |
| `front-components/project-team/team-rest.ts` | `fetchProjectEntries`/`fetchEmployees` — filter/limit/пустой | ✅ 5 тестов | `front-components/project-team/team-rest.test.ts` |
| `front-components/grid/use-grid-model.ts` | `calcGridModel` — агрегация/dayTotals/weekTotal/сортировка/extraRowKeys | ✅ 11 тестов | `front-components/grid/use-grid-model.test.ts` |
| `logic-functions/approval.logic.ts` | RBAC runSubmit/runResolve + SoD (CISO-002) | ✅ covered | `logic-functions/approval.logic.test.ts` |
| `logic-functions/time-entry-api.logic.ts` | **CISO-006 реальные тесты**: inject guard `workspaceMemberRef`/`id`/`from,to`, 4 инъекции отклонены | ✅ 7 real + 12 todo (CISO-005/008 + runResolve RBAC) | `logic-functions/time-entry-api.logic.test.ts` |
| `logic-functions/reports.logic.ts` | **CISO-007 ✅ CLOSED** P1: ФИО (ПДн) затёрты в detail/byEmployee/OLAP/CSV (152-ФЗ) — 3 реальных теста | ✅ 24 тестов | `logic-functions/reports.logic.test.ts` |
| `front-components/grid/use-week.ts` | `mondayOf`/`toIso` — дата-логика (UTC Пн, переходы месяц/год) | ✅ 10 тестов | `front-components/grid/use-week.test.ts` |
| `front-components/grid/use-keyboard.ts` | `keyAction` (стрелки/Tab/Enter/цифры/Delete) + `clampCell` (границы сетки) | ✅ 28 тестов | `front-components/grid/use-keyboard.test.ts` |
| `front-components/capacity/calc-load.ts` | W3-1: `buildHoursByDay`/`absenceHoursInPeriod`/`absenceHoursByEmpInPeriod` + вычет из `deptCapacity`/`employeeLoadCells` | ✅ +20 тестов (Dev2) | `front-components/capacity/calc-load.test.ts` |
| `front-components/grid/use-approval.ts` | `calcApprovalByProject` (резолв флага проект+отдел) + `calcPeriodStatus` (приоритет REJECTED>SUBMITTED>APPROVED>DRAFT) | ✅ 17 тестов | `front-components/grid/use-approval.test.ts` |
| `front-components/capacity/use-capacity.ts` | `HORIZON` (16 нед/6 мес) + `horizonRange` (from/to для REST, переходы через год) | ✅ 11 тестов | `front-components/capacity/use-capacity.test.ts` |
| `front-components/grid/use-grid-model.ts` | **[bug-fix]** `FilterState.status` (W3-3): NO_FILTERS обновлён + 6 тестов фильтрации по статусу согласования | ✅ 17 тестов | `front-components/grid/use-grid-model.test.ts` |
| `default-role.ts` + `roles/manager.role.ts` | **security-guard** CISO-002/[bug]#1: canDestroy=false, canSoftDelete=true (8 и 7 объектов), уникальные UUIDs, canBeAssignedToApiKeys=false | ✅ 19 тестов | `__tests__/role-guard.test.ts` |
| `logic-functions/reports-calc.ts` | **+computeOlap W4-1**: groupBy×5 осей, фильтры, норма (dept/emp/null для factCutting), сортировка, пагинация, availableDims, dimLabel | ✅ +28 тестов | `logic-functions/reports-calc.test.ts` |
| `logic-functions/backfill-project-departments.post-install.ts` | REQ-0013 13a: идемпотентность + skip(no-dept) + created + POST body + partial errors | ✅ 8 тестов | `logic-functions/backfill-project-departments.test.ts` |
| `front-components/my-time/period-status.ts` | `aggregateStatus` (vacuous-truth фикс) + `summarizeWeeks` (round2, weekBoundaries) | ✅ 10 тестов | `front-components/my-time/period-status.test.ts` |
| `front-components/my-time/use-my-hours.ts` | `buildProjectHours` — sum/sort/fallback/null/round2 | ✅ 7 тестов (incl. round2 guard) | `front-components/my-time/use-my-hours.test.ts` |
| `front-components/my-time/status-meta.ts` | `statusMeta` — метка/тон 4 статусов + fallback + SSOT-guard | ✅ 6 тестов | `front-components/my-time/status-meta.test.ts` |
| `logic-functions/reports-detail.ts` | `computeDetail` drill-down фильтры+маппинг + `detailToCsv` RFC 4180 | ✅ 14 тестов | `logic-functions/reports-detail.test.ts` |
| `logic-functions/project-fact-rollup-events.ts` | `onEntryCreated/Updated/Deleted` + `wrapEvent` catch | ✅ 11 тестов | `logic-functions/project-fact-rollup-events.test.ts` |
| `front-components/reports/trend-rest.ts` | `fetchTimeseries` REST-контракт тренда | ✅ 35 тестов (Dev 2) | `front-components/reports/trend-rest.test.ts` |
| **UI-экраны (timesheet/capacity/настройки/календарь)** | **browser-smoke** | **⬜ QA-1** | `reports/QA_SMOKE_CHECKLIST.md` |

Легенда: ✅ covered · 🟦 todo-спека · 🔴 gap · 🟡 предложено · ⚪ низкий приоритет.

## SSOT-статус (обновлено 2026-06-21)

| # | Severity | Описание | Статус |
|---|---|---|---|
| [ssot-bug]#1 | P1 | `CLIENT_CATEGORY` хардкод в reports-calc → тихое обнуление утилизации | ✅ CLOSED Dev 2: типовая завязка через `WorkCategory` |
| [ssot-bug]#2 | P2 | `category-bar.tsx` не использует `categoryMeta()` | ✅ CLOSED Dev 1 (DP-0003): 0 хардкода |
| [ssot-bug]#4 | P3 | `'OTHER'` нет в `WORK_CATEGORY_OPTIONS` | ⚠️ graceful в category-meta, low prio |

## Открытые баги

| # | Severity | Описание | Файл | Статус |
|---|---|---|---|---|
| [bug]#1 | P1 | `op:delete` → 400 PERMISSION_DENIED (нужен `canDestroyObjectRecords` в default-role) | `roles/default-role.ts` | ❌ ждёт [synced] |
| [bug]#2 | P3 | `calc-month.ts`: NaN month-index проходит guard (crash вместо skip) | `front-components/calendar/calc-month.ts:19` | ⚠️ задокументирован `it.todo` |
| [bug]#3 | P2 | `resolveSelfIsManager` fallback: `orderBy=boolean` не работает в Twenty REST | `capacity/capacity-rest.ts` | ✅ CLOSED Dev 1: `filter=isManager[eq]:true` |
| [ciso-006-gap]#1 | P2 | `fetchProjectEntries(projectId)` — нет isUuid guard, прямая интерполяция в filter | `project-team/team-rest.ts` | ⚠️ регрессионный тест добавлен, ждёт guard от Dev2 |
| [ciso-006-gap]#2 | P2 | `fetchProjectSummary(projectId)` — нет isUuid guard, прямая интерполяция в URL+filter | `project-summary/summary-rest.ts` | ⚠️ регрессионный тест добавлен, ждёт guard от Dev2 |
| `shared/use-self-employee.ts` | `resolveSelfEmployee` A1 резолвер | ✅ 11 тестов | `shared/use-self-employee.test.ts` |

## Очередь (next)
1. 🔴 **[bug]#1** → пере-валидация после `canDestroyObjectRecords` (arch `[synced]`)
2. 🔴 **QA-1 browser-smoke** (`QA_SMOKE_CHECKLIST.md`) — ждёт --isolated в chrome-devtools-mcp
3. 🔴 **CISO-005/006/007** → конвертировать `it.todo` в реальные тесты после Dev 2 фикса
4. 🟡 grid: вынести чистую логику из `use-week` → покрыть тоталы/дни (arch arch-ok #10)
5. ✅ `use-period.ts`: `calcPeriodRange` вынесена, 11 тестов
6. 🟡 `use-grid-model.ts` агрегация (dayTotals/weekTotal) — нужен `@testing-library/react` или вынос логики
