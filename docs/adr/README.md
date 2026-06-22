# ADR — реестр архитектурных решений (time.credos.ru)

Architecture Decision Records. Один файл = одно решение. Статусы: PROPOSED · ACCEPTED · SUPERSEDED · REJECTED.

| ADR | Тема | Статус | Кратко |
|---|---|---|---|
| [0001](0001-platform-and-data.md) | Платформа и данные | ACCEPTED | Twenty/CRM как платформа, один workspace |
| [0002](0002-sdk-app-isolated-repo.md) | SDK-app в отдельном репо | ACCEPTED | time = самостоятельный install-юнит (не форк ядра) |
| [0003](0003-catalog-separate-app-shared-master-data.md) | Каталог — отдельный app, общие мастер-данные | ACCEPTED (concern CISO-004) | Company/Department/Service общие; PII-видимость — риск |
| [0004](0004-naming-alignment-credos-crm.md) | Нейминг `credosTime*` | ACCEPTED | объект = `credosTime`+сущность; UUID-стабильность |
| [0005](0005-prod-topology.md) | Прод-топология (2 инстанса) | ACCEPTED | Стратегия C: отдельный Twenty 2.14 в РФ + синк Company по API; форк v1.19→2.x отдельным треком; прод-гейты 152-ФЗ |
| [0006](0006-employee-model.md) | Модель сотрудника | ACCEPTED | `credosTimeEmployee` (профиль) + `workspaceMemberRef`→WorkspaceMember (источник ФИО/email); staff≠users |
| [0007](0007-single-norm-source.md) | Единый источник нормы часов | ACCEPTED | `credosTimeWorkdayCalendar` — одна норма дня для сетки/дашборда/сервера |
| [0008](0008-field-change-log-pattern.md) | Паттерн журнала изменений полей | ACCEPTED | свой `{entity}Log` + onUpdate-триггер/write-log; ядро per-field историю не даёт |
| [0009](0009-cross-app-object-references.md) | Cross-app ссылки (catalog↔time) | ACCEPTED | каталог ссылается на оргмастер time по UUID + расширяет time-объекты полем →service; time чистый |
| [E1](E1-rate-matrix.md) | Матрица ставок (себестоимость) | PROPOSED | cost-rate, отложено (no-billable) |

## Связанные документы
- Требования: [`../requirements/`](../requirements/) (REQ-NNNN)
- Модель данных: [`../data-model/DATA_MODEL_SYNTHESIS.md`](../data-model/DATA_MODEL_SYNTHESIS.md)
- Глоссарий: [`../domain/GLOSSARY.md`](../domain/GLOSSARY.md)
- Безопасность: [`../security/`](../security/) (CISO findings, RISK_REGISTER)
- Состояние модуля: [`../STATUS.md`](../STATUS.md)

> Правила: опубликованный ADR не переписывается «по месту» — новое решение = новый ADR со ссылкой «supersedes». UUID-стабильность (ADR-0004) обязательна при любых рефакторах.
