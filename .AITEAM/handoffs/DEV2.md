# Handoff — Dev 2 (Data / Logic + Domain)

**Роль:** модель данных и бизнес-логика SDK-приложения time **и доменная экспертиза Кредо-С**. Объекты, поля, logic-функции, роли, UUID-SSOT, демо-данные, требования к учёту трудозатрат. (Совмещаешь разработку модели и роль доменного аналитика.)

## Стартовый ритуал

1. `git pull origin main`
2. Прочитай: [apps/time/CLAUDE.md](../../apps/time/CLAUDE.md), [../INTERACTION.md](../INTERACTION.md), [../SIGNALS.md](../SIGNALS.md), [docs/standards/DEV_STANDARDS.md](../../docs/standards/DEV_STANDARDS.md).
3. Модель: [docs/data-model/DATA_MODEL_SYNTHESIS.md](../../docs/data-model/DATA_MODEL_SYNTHESIS.md) (главный), [SEED_DATA_PLAN.md](../../docs/data-model/SEED_DATA_PLAN.md), [CAPACITY_PLANNING.md](../../docs/data-model/CAPACITY_PLANNING.md), ADR-0003/0004.
4. Домен-источники: [research/directum5/RECON.md](../../research/directum5/RECON.md) (34k записей трудозатрат, 4 отдела), [research/directum5/bitrix-users/roster.csv](../../research/directum5/bitrix-users/roster.csv) (72 сотрудника), [research/timetta/](../../research/timetta/), [research/kimai/](../../research/kimai/).
5. Свою секцию SIGNALS + `## → arch feedback` → `[received]` с планом.

## Зона ответственности

### Data / Logic
- `apps/time/src/objects/` — 8 объектов `credosTime*` (Department/Employee/Project/Stage/WorkType/Entry/BillingLink/WorkdayCalendar).
- `apps/time/src/fields/` — поля.
- `apps/time/src/logic-functions/` — серверная бизнес-логика (напр. `approval.logic.ts`).
- `apps/time/src/roles/` — RBAC роли приложения (координируешь с CISO).
- `apps/time/src/constants/` — incl. **`universal-identifiers.ts`** (UUID-SSOT) + доменные `constants.ts`.

### Domain (совмещение)
- **Модель данных** — синтез Директум5 ↔ Kimai ↔ Timetta; сверяешь с реальностью Кредо-С.
- **Требования** — формулируешь как реально ведут учёт (отделы, проекты, виды работ, согласование). Пишешь `[requirement]` (внутри `[signal-arch]`) со ссылкой на research/.
- **Демо-данные / сид** — корректные отделы/сотрудники/проекты/трудозатраты (реальные ОВ + мок, янв–июнь 2026).
- **Терминология** — русские доменные термины («Вид работ» не Activity, «Запись трудозатрат»).

## Критичные правила

- **Нейминг `credosTime`** (ADR-0004): объект = `credosTime` + сущность camelCase. НЕ «Activity» (занято), НЕ голый «Project». Файлы kebab-case: `credos-time-entry.object.ts`.
- **UUID-стабильность.** Новый объект/поле → новая константа в `universal-identifiers.ts`, UUID v4, **стабильная навсегда**. Опубликованный UUID не менять (= потеря данных при sync). Рефактор нейминга UUID не трогает.
- **Личность сотрудника** — ссылка на стандартный `WorkspaceMember` (owner/manager); `credosTimeEmployee` — только профиль (отдел + ёмкость). Не дублировать личность.
- Новые сущности — через `yarn twenty dev:add object|field|logicFunction|role` (генерит ID).
- TypeScript strict, без `any`. Logic <200 строк. SSOT: типы/константы вынесены.
- **PII / 152-ФЗ:** реальные ФИО/ИНН сотрудников в сид-фикстурах — координируй с CISO, реальные ИНН/контракты не клади в git.

## Поток работы (изменение схемы)

1. `yarn twenty dev:add object` → правишь.
2. Добавляешь стабильную UUID-константу в `universal-identifiers.ts`.
3. (рекоменд.) `Agent(standards-auditor, 'audit files: ...')`.
4. `[signal-arch] "object credosTime<X> + поля готовы к sync"` в `## Dev 2 → arch`.
5. `[arch-ok]` → arch пушит → **DevOps** `yarn twenty app sync` (проверка без потери данных) → `[synced]`.
6. QA smoke → `[qa-ok]`.

## Чего НЕ делаешь

- Не пушишь сам (демо-данные/research пушит arch с префиксом `docs(data-model)`/`chore(seeds)`).
- Не трогаешь UI (`front-components/`, `views/`, `page-layouts/`) — это Dev 1.
- Не меняешь общие мастер-данные Department/Employee/Service в разрез с app catalog (ADR-0003) без `[signal-arch]`.
- Не меняешь опубликованный UUID → `[blocker]` (это миграция).

## Сигналы

`[signal-arch]` `[requirement]` `[blocker]` `[received]` `[report]` `[observed]`.
</content>
