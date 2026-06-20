# DEV2_LOG — рабочий журнал Dev 2 (Data + Domain)

Хронология решений/действий Dev 2. Детали — в связанных доках. Новые записи сверху.

---

## 2026-06-20 — онбординг + структура зоны

**Сделано:**
- Принял CISO findings #001/#002/#003 (все в зоне Dev 2), план фиксов в SIGNALS.
- Завёл структуру зоны Dev 2:
  - `docs/requirements/` — формальные требования (REQ-NNNN). Создан индекс + **REQ-0001** (approval RBAC + SoD).
  - `docs/domain/GLOSSARY.md` — SSOT русской доменной терминологии.
  - `docs/data-model/DEV2_LOG.md` — этот журнал.

**Открыто (ждёт arch):**
- Приоритет: #001 (P1 ПДн) → роль «Руководитель» + #002 guard (пакет) → Dev 1 UI gate.
- Решение по истории git (переписывать или нет) для ПДн.

---

## 2026-06-20 — фикс #001 (ПДн в seed) + ревью guard #002

**#001 P1 — сделано (dev-часть):**
- `seed-real.mjs`: убраны 42 реальных ФИО+email. Лоадер: `.employees.local.json` (gitignored) если есть → реальный сид; иначе синтетический `@example.test` (распределение по отделам сохранено: OV11/OIB11/OPIB9/TC6/OPR5).
- Реальные данные вынесены в `apps/time/scripts/.employees.local.json` (gitignored).
- `.gitignore` += `.employees.local.json`. `node --check` чисто.
- Сырые ПДн-источники (`research/.../roster.csv`, `trudozatraty-dir5.xlsx`, timetta Users) — уже `git rm` (staged) силами CISO/arch.

**#002 — ревью реализованного guard (другой агент уже добавил):** структурно ок, но **обходится** (spoofable client-param + fail-open). CISO-002 НЕ закрыт. Детали → [REQ-0001 «Ревью реализации»](../requirements/REQ-0001-approval-rbac-sod.md). Отписал arch/CISO.

**Наблюдение (новое, к CISO):** в `seed-real.mjs` остаются реальные клиенты + юрлица (ООО/ГУП, `legal:`) + трудозатраты по ним — confidential business data вне scope #001 (employee PII). Кандидат в отдельный finding.

**Исследование SDK (D2-1 / CISO-002 корень):** проверил twenty-sdk + openapi. `LogicFunctionEvent` несёт только `userWorkspaceId`; `/rest/workspaceMembers` без поля `userWorkspaceId`; `/userWorkspaces` не в REST → **чистого REST-резолва `userWorkspaceId→workspaceMember` нет**. Итог + 4 опции + рекомендация (ENV-allowlist по userWorkspaceId как interim + DevOps probe GraphQL) → [REQ-0001 «Исследование SDK»](../requirements/REQ-0001-approval-rbac-sod.md). Тегнул DevOps на probe.

---

## 2026-06-20 — волна-2: контракт reports + REQ-0002

- **REQ-0003** `/s/reports` контракт (design-proposal): утилизация (`project.category==='Client'`), норма из WorkdayCalendar × capacityFactor, недогруз, groupBy department/employee/project/category/period, JSON-схема rows+totals, UX-2 по сотруднику, критерии приёмки QA. Цель — Dev1/QA параллельно с кодом.
- **REQ-0002** Финансы PNL (PROPOSED, бэклог) по ask arch — stub: ставки + доход BillingLink + `/s/pnl`, блок=связка 1С.
- Реестр REQ обновлён (README). Ждём arch: аппрув формул + кто реализует reports.logic (я / параллельный Dev2-агент).

---

## 2026-06-20 — R-EMP: ADR-0006 «Модель сотрудника»

Задача arch (вопрос заказчика «справочники для работников — норм?»). Свёрился с native Twenty 2.14 (WorkspaceMember/Person/Company по openapi).
- **ADR-0006** PROPOSED (`docs/adr/0006-employee-model.md`): решение = оставить `credosTimeEmployee` (профиль) + `workspaceMemberRef`→WorkspaceMember (источник истины ФИО/email для юзеров). Паттерн staff≠users.
- 3 альтернативы отклонены (только WorkspaceMember / только Person / extend WM как профиль) с обоснованием.
- Предложение: убрать дубль ФИО/email для юзеров (читать из WorkspaceMember) — миграция дешёвая (1 затронутая запись сейчас). Связал CISO-004, ADR-0003/0005.

---

## 2026-06-20 — координация волна-2 + ADR-0005

- Параллельный Dev2-агент ведёт код-пакет (seed/D2-2/R2-D2). Мой трек — доки/контракты/ADR/ревью (без коллизий кода).
- **REQ-0003 выровнен** под форму arch `{byDept,byProject,byEmployee,totals,period}` (был groupBy/rows) → Dev1 стартует дашборд на mock.
- **ADR-0005 «Прод-топология»** PROPOSED (`docs/adr/0005-prod-topology.md`): вариант B (отдельный Twenty 2.14 в РФ-контуре + синк Company по API). Отклонены A (апгрейд форка) и shared-DB. Прод-гейты: РФ-хостинг (152FZ-001 P0), локализация, синк-модель. Связал ADR-0002/0003/0006, CISO-004.
- Открыто к arch: approve ADR-0005/0006; ENV-allowlist (REQ-0001).

---

## 2026-06-20 — Dev 2 BACK: backend-фиксы волны-2

Роль уточнена: Dev 2 **BACK** (бэкенд-имплементатор).
- **reports.logic.ts P1-фикс:** Core REST max 60/страница → код брал 60 вместо ~420 записей (норма календаря врала). Добавил `restGetAll()` пагинацию (starting_after+pageInfo), заменил 5 fetch'ей. oxlint/tsc чисто.
- **D2-2 seed H2:** project endDate раскинуты `nextEndDate()` по июн–дек 2026 (CAPACITY июль+ оживёт). `node --check` ок.
- На сервере не прогонял (creds/мутация) → DevOps при reseed/sync.
- **reports-calc.ts:** вынес чистый расчёт из reports.logic в тестируемый модуль (паттерн «calc в .ts»). `computeReports()` без сети. reports.logic = fetch+пагинация+вызов.
- **reports-calc.test.ts:** 14 unit (vitest.unit.config) — edge по запросу arch: праздники вне нормы, 0 ёмкость→norm0/under=-fact, пустой период→util=null, capacityFactor 0.8, запись без employeeId→через проект, Σ byDept==totals. Всё зелёное. oxlint/tsc чисто.

---

## Карта рабочих доков Dev 2

| Что | Где |
|---|---|
| Синтез модели (главный) | `docs/data-model/DATA_MODEL_SYNTHESIS.md` |
| План сид-данных | `docs/data-model/SEED_DATA_PLAN.md` |
| Capacity | `docs/data-model/CAPACITY_PLANNING.md` |
| Прослеживаемость источников | `docs/data-model/SOURCE_TRACEABILITY.md` |
| Аудит целостности данных | `docs/data-model/DATA_INTEGRITY_AUDIT.md` |
| Требования | `docs/requirements/` |
| Глоссарий домена | `docs/domain/GLOSSARY.md` |
| UUID-SSOT | `apps/time/src/constants/universal-identifiers.ts` |
| Источники домена | `research/{directum5,timetta,kimai}/` |
