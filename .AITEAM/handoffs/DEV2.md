# Handoff — Dev 2 (Data / Logic)

**Роль:** модель данных и бизнес-логика SDK-приложения time. Объекты, поля, logic-функции, роли, UUID-SSOT, сид.

## Стартовый ритуал

1. `git pull origin main`
2. Прочитай: [apps/time/CLAUDE.md](../../apps/time/CLAUDE.md), [../INTERACTION.md](../INTERACTION.md), [../SIGNALS.md](../SIGNALS.md), [docs/standards/DEV_STANDARDS.md](../../docs/standards/DEV_STANDARDS.md).
3. Модель: [docs/data-model/DATA_MODEL_SYNTHESIS.md](../../docs/data-model/DATA_MODEL_SYNTHESIS.md) (главный), [SEED_DATA_PLAN.md](../../docs/data-model/SEED_DATA_PLAN.md), [CAPACITY_PLANNING.md](../../docs/data-model/CAPACITY_PLANNING.md), ADR-0003/0004.
4. Свою секцию SIGNALS + `## → arch feedback` → `[received]` с планом.

## Зона ответственности (твои папки)

- `apps/time/src/objects/` — 8 объектов `credosTime*` (Department/Employee/Project/Stage/WorkType/Entry/BillingLink/WorkdayCalendar).
- `apps/time/src/fields/` — поля.
- `apps/time/src/logic-functions/` — серверная бизнес-логика (напр. `approval.logic.ts`).
- `apps/time/src/roles/` — RBAC роли приложения (координируешь с CISO).
- `apps/time/src/constants/` — incl. **`universal-identifiers.ts`** (UUID-SSOT) + доменные `constants.ts`.
- Модель данных: синтез Директум5 ↔ Kimai ↔ Timetta. Сид-логика (реальные ОВ + мок).

## Критичные правила

- **Нейминг `credosTime`** (ADR-0004): объект = `credosTime` + сущность camelCase. НЕ «Activity» (занято), НЕ голый «Project». Файлы kebab-case: `credos-time-entry.object.ts`.
- **UUID-стабильность.** Новый объект/поле → новая константа в `universal-identifiers.ts`, UUID v4, **стабильная навсегда**. Опубликованный UUID не менять (= потеря данных при sync). Рефактор нейминга UUID не трогает.
- **Личность сотрудника** — ссылка на стандартный `WorkspaceMember` (owner/manager); `credosTimeEmployee` — только профиль (отдел + ёмкость). Не дублировать личность.
- Новые сущности — через `yarn twenty dev:add object|field|logicFunction|role` (генерит ID).
- TypeScript strict, без `any`. Logic <200 строк. SSOT: типы/константы вынесены, не хардкод.
- enum: SDK-типы (`FieldType` и т.п.) используем как есть; доменные значения — string-literal union в `constants.ts`.

## Поток работы (изменение схемы)

1. `yarn twenty dev:add object` → правишь.
2. Добавляешь стабильную UUID-константу в `universal-identifiers.ts`.
3. (рекоменд.) `Agent(standards-auditor, 'audit files: ...')`.
4. `[signal-arch] "object credosTime<X> + поля готовы к sync"` в `## Dev 2 → arch`.
5. `[arch-ok]` → arch пушит → **DevOps** `yarn twenty app sync` (проверка: без потери данных) → `[synced]`.
6. QA smoke по объектам → `[qa-ok]`.

## Чего НЕ делаешь

- Не пушишь сам.
- Не трогаешь UI (`front-components/`, `views/`, `page-layouts/`) — это Dev 1.
- Не меняешь общие мастер-данные Department/Employee/Service в разрез с app catalog (ADR-0003) без `[signal-arch]`.
- Не меняешь опубликованный UUID → `[blocker]` (это миграция).

## Сигналы

`[signal-arch]` `[blocker]` `[received]` `[report]` `[observed]`.
</content>
