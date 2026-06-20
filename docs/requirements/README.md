# Требования — зона Dev 2 (Data + Domain)

**Назначение:** формальные требования к учёту трудозатрат time.credos.ru. Источник истины «как реально ведут учёт в Кредо-С» (отделы, проекты, виды работ, согласование). Каждое требование — отдельный файл `REQ-NNNN-<slug>.md`, нумерация стабильна.

**Связь с моделью:** требование → влияет на `docs/data-model/DATA_MODEL_SYNTHESIS.md` → реализация в `apps/time/src/{objects,fields,logic-functions,roles}/`.

**Flow:** Dev 2 формулирует `[requirement]` в SIGNALS (внутри `[signal-arch]`) со ссылкой на файл и на `research/`. Arch принимает/отклоняет. Принятое → реализация по «Поток работы (изменение схемы)» из handoff DEV2.

**Статусы:** `DRAFT` (черновик) · `PROPOSED` (отправлено arch) · `ACCEPTED` (принято) · `IMPLEMENTED` (накатано) · `REJECTED`.

## Реестр

| ID | Тема | Статус | Источник | Файл |
|---|---|---|---|---|
| REQ-0001 | Approval: RBAC роли «Руководитель» + separation of duties | PARTIALLY_IMPL (guard спуфится) | CISO #002, handoff DEV2 | [REQ-0001-approval-rbac-sod.md](REQ-0001-approval-rbac-sod.md) |
| REQ-0002 | Финансы: PNL по проекту | PROPOSED (бэклог) | arch волна-2, Timetta | [REQ-0002-finance-pnl.md](REQ-0002-finance-pnl.md) |
| REQ-0003 | Контракт `/s/reports`: утилизация/недогруз/агрегаты | IMPLEMENTED (задеплоен) | arch волна-2 R2-D2 + UX-2 | [REQ-0003-reports-aggregates-contract.md](REQ-0003-reports-aggregates-contract.md) |
| REQ-0004 | credosTimePlanAllocation + гейт правки плана | PROPOSED | arch P-D2 (волна-3) | [REQ-0004-plan-allocation.md](REQ-0004-plan-allocation.md) |
| REQ-0005 | Обязательность этапа в записи (project + conditional stage) | PROPOSED | заказчик | [REQ-0005-entry-stage-required.md](REQ-0005-entry-stage-required.md) |
| REQ-0006 | Табель учёта (командировки/работа в выходной/переработка) | PROPOSED (бэклог) | заказчик, Timetta/Kimai | [REQ-0006-tabel-attendance.md](REQ-0006-tabel-attendance.md) |
| REQ-0007 | Согласование по периодам (неделя/месяц) + обзор статусов | PROPOSED (бэклог) | заказчик, Timetta/Kimai | [REQ-0007-approval-by-period.md](REQ-0007-approval-by-period.md) |
| REQ-0008 | Таймшит: контекст «чей» + селектор по роли | PROPOSED (бэклог) | заказчик, Timetta/Kimai | [REQ-0008-timesheet-person-selector.md](REQ-0008-timesheet-person-selector.md) |
| REQ-0009 | Заявка на пресейл/пилот → согласование (Workflow) → план | PROPOSED (бэклог) | заказчик, Timetta/PSA | [REQ-0009-presale-request-to-plan.md](REQ-0009-presale-request-to-plan.md) |

## Шаблон записи

```
# REQ-NNNN — <название>

**Статус:** DRAFT
**Источник:** <research/ ссылка | CISO/QA finding | домен-знание>
**Затрагивает:** <objects/fields/logic-functions/roles>

## Контекст
## Требование
## Критерии приёмки
## Открытые вопросы
```
