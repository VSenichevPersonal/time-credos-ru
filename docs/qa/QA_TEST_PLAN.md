# QA — тест-план apps/time

Стратегия покрытия. Принцип: **сначала чистая логика и инварианты данных** (дёшево,
без сервера, ловит реальные баги расчётов), затем guard'ы на схему/RBAC, затем smoke.

## Приоритеты (что покрываем и почему)

### P0 — критичные расчёты и инварианты (unit, без сервера)
- **`front-components/capacity/calc-load.ts`** — ёмкость/загрузка отделов. Ошибка = неверное планирование. ✅ покрыто (17).
- **`constants/universal-identifiers.ts`** — UUID v4 + уникальность. Дубль/невалид = коллизия данных при sync. ✅ покрыто (129).
- **`constants/approval.ts`** — `isApprovalRequired` (приоритет проект/отдел). ✅ покрыто (6).
- **`front-components/grid/` хелперы** — расчёт тоталов сетки, дни недели, агрегаты часов (Decimal). 🔴 gap.
- **`constants/select-options.ts`** — `buildOptions` (форма SELECT-значений для БД). 🟡 gap.

### P1 — серверная бизнес-логика (unit с моком fetch / integration)
- **`logic-functions/approval.logic.ts`** — `runSubmit`/`runResolve`/`buildApprovalMap`. Guard'ы статуса, фиксация actor. Связано с **CISO-002** (approve без авторизации). 🔴 gap — тест зафиксирует контракт guard'ов после введения роли «Руководитель».
- **`logic-functions/time-entry-api.logic.ts`** — REST-фоллбэк. 🔴 gap.

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
