# QA — тест-план apps/time

Стратегия покрытия. Принцип: **сначала чистая логика и инварианты данных** (дёшево,
без сервера, ловит реальные баги расчётов), затем guard'ы на схему/RBAC, затем smoke.

## Приоритеты (что покрываем и почему)

### P0 — критичные расчёты и инварианты (unit, без сервера)
- **`front-components/capacity/calc-load.ts`** — ёмкость/загрузка, бейдж «свободен с». ✅ покрыто (25 тестов).
- **`constants/universal-identifiers.ts`** — UUID v4 + уникальность. ✅ покрыто (147).
- **`constants/approval.ts`** — `isApprovalRequired` (приоритет проект/отдел). ✅ покрыто (6).
- **`constants/select-options.ts`** — cross-SSOT ENTRY_STATUS↔OPTIONS. ✅ покрыто (41).
- **`constants/labels.ts`** — labels↔options синхронность. ✅ покрыто (16).
- **`front-components/grid/format.ts`** — `parseHours`/`fmtHours`/`loadHint`/`loadColor`. ✅ покрыто (21).
- **`logic-functions/reports-calc.ts`** — util/norm/under, byCategory, F-D норма с отсутствиями. ✅ покрыто (33+ тестов).
- **`front-components/calendar/calc-month.ts`** — агрегат произв. календаря по месяцам/кварталам. ✅ покрыто (18 + 1 todo для [bug]#2).
- **`front-components/grid/use-week.ts`** — дата-логика недели. 🟡 в хуке — нужен вынос (Dev 1).

### P1 — серверная бизнес-логика (unit с моком fetch / integration)
- **`logic-functions/approval.logic.ts`** — `runSubmit`/`runResolve`/`buildApprovalMap`. Guard'ы статуса, separation of duties (CISO-002). ✅ покрыто (12 тестов с vi.stubGlobal fetch).
- **`front-components/grid/use-filters.ts`** — `filterProjects`/`filterWorkTypes`/`rowPasses`/`filterEmployees`. UX-корректность мультифильтров. ✅ покрыто (31 тест).
- **`logic-functions/time-entry-api.logic.ts`** — CISO-005/006/007 security. 🟦 todo-спека (16 тестов, конвертируются после Dev 2 фикса).

### P2 — схема и приёмка (integration + smoke)
- **`schema.integration-test.ts`** — CRUD на стандартных объектах. Нужен сервер. ✅ есть (typecheck починен).
- Schema-guard на `credosTime*`-объекты: все имеют index-view, каждая view — nav-item (pitfall CLAUDE.md). 🟡 предложение.
- **Smoke** после `app sync` DevOps'ом: объекты видны, grid вводит часы, навигация, approval-bar. По чек-листу в `reports/`.

## Инварианты-кандидаты в guard-тесты
1. UUID v4 + уникальность. ✅
2. Префикс `credosTime` у всех app-объектов (ADR-0004). 🟡
3. Каждый object → index-view → navigationMenuItem (pitfall). 🟡
4. SELECT-значения статусов в UPPER_CASE, синхронны между `approval.ts` ↔ `select-options.ts` ↔ `labels.ts`. 🟡

## Не-цели
- UI-рендер React-компонентов (jsdom) — пока не заводим, фокус на чистой логике и данных.
- E2E через браузер — отдельно, по запросу (chrome-devtools skill).

## Definition of Done приёмки фичи
- [ ] unit на новую чистую логику (зелёные)
- [ ] lint 0/0 + typecheck чисто
- [ ] integration/smoke по затронутым объектам после sync
- [ ] `[qa-ok]` в SIGNALS либо `[bug] #N` с repro
