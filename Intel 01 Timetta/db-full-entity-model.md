# Полная модель сущностей (Entity Model)

Всего сущностей: 186

---

## 1. AccountingEntry — Проводка

- **FullName**: Timetta.Domain.Aggregates.Entities.AccountingEntry
- **DisplayName (Ru)**: Проводка
- **DisplayName (En)**: Accounting entry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| Hours | Decimal | Нет | Нет | Нет |  |  |  |  |
| DocumentDescription | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| ProjectCostCenter | Navigation | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |
| TimeOffType | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 2. AccountingPeriod — Учётный период

- **FullName**: Timetta.Domain.Aggregates.Entities.AccountingPeriod
- **DisplayName (Ru)**: Учётный период
- **DisplayName (En)**: Accounting period
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Start | DateOnly | Нет | Да | Нет |  |  |  |  |
| End | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 3. Activity — Вид работы

- **FullName**: Timetta.Domain.Aggregates.Entities.Activity
- **DisplayName (Ru)**: Вид работы
- **DisplayName (En)**: Activity
- **Description**: Represents the type of work. Used as a classifier in the process of time tracking.
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 4. ActOfAcceptance — Акт

- **FullName**: Timetta.Domain.Aggregates.Entities.ActOfAcceptance
- **DisplayName (Ru)**: Акт
- **DisplayName (En)**: Act of acceptance
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| DateOfAcceptance | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 5. ActOfAcceptanceLine — Строка акта

- **FullName**: Timetta.Domain.Aggregates.Entities.ActOfAcceptanceLine
- **DisplayName (Ru)**: Строка акта
- **DisplayName (En)**: Act of acceptance Line
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| ExchangeRate | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Account | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| ActOfAcceptance | Navigation | Нет |  |  |  |

---

## 6. Agent — Agent

- **FullName**: Timetta.Domain.Aggregates.Entities.Agent
- **DisplayName (Ru)**: Agent
- **DisplayName (En)**: Agent
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| RunEndpoint | Url | Нет | Нет | Нет |  |  |  |  |
| CancelEndpoint | Url | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

### Комплексные свойства (Complex Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| Properties | String | Нет |  |

---

## 7. AgentRun — AgentRun

- **FullName**: Timetta.Domain.Aggregates.Entities.AgentRun
- **DisplayName (Ru)**: AgentRun
- **DisplayName (En)**: AgentRun
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Status | Enum | Нет | Да | Нет |  |  |  |  |
| Finished | DateOnly | Нет | Нет | Нет |  |  |  |  |
| EntityId | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Agent | Navigation | Нет |  |  |  |

### Комплексные свойства (Complex Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| Properties | String | Нет |  |

---

## 8. AiContextSchema — Модель контекста ИИ

- **FullName**: Timetta.Domain.Aggregates.Entities.AiContextSchema
- **DisplayName (Ru)**: Модель контекста ИИ
- **DisplayName (En)**: AI context model
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| EntityType | String | Нет | Да | Нет | 255 |  |  |  |
| TextTemplate | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 9. AiPrompt — Запрос к ИИ

- **FullName**: Timetta.Domain.Aggregates.Entities.AiPrompt
- **DisplayName (Ru)**: Запрос к ИИ
- **DisplayName (En)**: AI prompt
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| EntityType | String | Нет | Да | Нет | 255 |  |  |  |
| Text | Text | Нет | Нет | Нет |  |  |  |  |
| SystemInstruction | Text | Нет | Нет | Нет |  |  |  |  |
| ShowInList | Boolean | Нет | Да | Нет |  |  |  |  |
| ShowInCard | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| AiContextSchema | Navigation | Нет |  |  |  |

---

## 10. ApiToken — API-токен

- **FullName**: Timetta.Domain.Aggregates.Entities.ApiToken
- **DisplayName (Ru)**: API-токен
- **DisplayName (En)**: API token
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 11. BillCode — Код оплаты

- **FullName**: Timetta.Domain.Aggregates.Entities.BillCode
- **DisplayName (Ru)**: Код оплаты
- **DisplayName (En)**: Bill code
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| CostAdjustment | Decimal | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 12. BookingEntry — Бронирование

- **FullName**: Timetta.Domain.Aggregates.Entities.BookingEntry
- **DisplayName (Ru)**: Бронирование
- **DisplayName (En)**: Booking entry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| From | DateOnly | Нет | Нет | Нет |  |  |  |  |
| To | DateOnly | Нет | Нет | Нет |  |  |  |  |
| BookedHours | Decimal | Нет | Да | Нет |  |  |  |  |
| RequiredHours | Decimal | Нет | Да | Нет |  |  |  |  |
| PlanningMethod | Enum | Нет | Нет | Нет |  |  |  |  |
| RequiredSchedulePercent | Decimal | Нет | Да | Нет |  |  |  |  |
| Type | Enum | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Resource | Navigation | Нет |  |  |  |

---

## 13. CalculatedField — Вычисляемое поле

- **FullName**: Timetta.Domain.Aggregates.Entities.CalculatedField
- **DisplayName (Ru)**: Вычисляемое поле
- **DisplayName (En)**: Calculated field
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ReportType | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 14. Campaign — Кампания

- **FullName**: Timetta.Domain.Aggregates.Entities.Campaign
- **DisplayName (Ru)**: Кампания
- **DisplayName (En)**: Campaign
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Manager | User [Entity] | Нет |  |  |  |

---

## 15. CampaignEntry — Элемент кампании

- **FullName**: Timetta.Domain.Aggregates.Entities.CampaignEntry
- **DisplayName (Ru)**: Элемент кампании
- **DisplayName (En)**: Campaign entry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Campaign | Navigation | Нет |  |  |  |
| Organization | Navigation | Нет |  |  |  |

---

## 16. Certificate — Сертификат

- **FullName**: Timetta.Domain.Aggregates.Entities.Certificate
- **DisplayName (Ru)**: Сертификат
- **DisplayName (En)**: Certificate
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| EffectiveDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| ExpiryDate | DateOnly | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Owner | User [Entity] | Нет |  |  |  |

---

## 17. Checkpoint — Контрольная точка

- **FullName**: Timetta.Domain.Aggregates.Entities.Checkpoint
- **DisplayName (Ru)**: Контрольная точка
- **DisplayName (En)**: Checkpoint
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| CrossId | String | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ActualDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Weight | Integer | Нет | Нет | Нет |  |  |  |  |
| AssignedRoleCode | String | Нет | Нет | Нет |  |  |  |  |
| VerifierRoleCode | String | Нет | Нет | Нет |  |  |  |  |
| VerifiersComment | String | Нет | Нет | Нет |  |  |  |  |
| Result | String | Нет | Нет | Нет |  |  |  |  |
| Comment | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |
| Assigned | User [Entity] | Нет |  |  |  |
| Verifier | User [Entity] | Нет |  |  |  |
| ModelStage | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| Stage | Directory | Нет |  |  |
| CheckpointType | Directory | Нет |  |  |
| CheckpointLevel | Directory | Нет |  |  |
| CheckpointForecast | Directory | Нет |  |  |

---

## 18. Competence — Компетенция

- **FullName**: Timetta.Domain.Aggregates.Entities.Competence
- **DisplayName (Ru)**: Компетенция
- **DisplayName (En)**: Competence
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Role | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 19. Contact — Контакт

- **FullName**: Timetta.Domain.Aggregates.Entities.Contact
- **DisplayName (Ru)**: Контакт
- **DisplayName (En)**: Contact
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Email | Email | Нет | Нет | Нет |  |  |  |  |
| FirstName | String | Нет | Нет | Нет |  |  |  |  |
| LastName | String | Нет | Нет | Нет |  |  |  |  |
| Patronymic | String | Нет | Нет | Нет |  |  |  |  |
| Phone | Phone | Нет | Нет | Нет |  |  |  |  |
| MobilePhone | Phone | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Position | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Organization | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| Role | Directory | Нет |  |  |

---

## 20. ContactInteraction — ContactInteraction

- **FullName**: Timetta.Domain.Aggregates.Entities.ContactInteraction
- **DisplayName (Ru)**: ContactInteraction
- **DisplayName (En)**: ContactInteraction
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Interaction | Navigation | Нет |  |  |  |
| Contact | Navigation | Нет |  |  |  |

---

## 21. Contract — Договор

- **FullName**: Timetta.Domain.Aggregates.Entities.Contract
- **DisplayName (Ru)**: Договор
- **DisplayName (En)**: Contract
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Key | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| Number | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Organization | Navigation | Нет |  |  |  |
| Deal | Navigation | Нет |  |  |  |

---

## 22. CostNormalizationRule — Правило нормализации себестоимости

- **FullName**: Timetta.Domain.Aggregates.Entities.CostNormalizationRule
- **DisplayName (Ru)**: Правило нормализации себестоимости
- **DisplayName (En)**: Cost normalization rule
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Method | Enum | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

### Коллекции (Collection Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| ExcludedTimeOffTypes | Collection | Нет |  |

---

## 23. CostNormalizationRuleExcludedTimeOffType — CostNormalizationRuleExcludedTimeOffType

- **FullName**: Timetta.Domain.Aggregates.Entities.CostNormalizationRuleExcludedTimeOffType
- **DisplayName (Ru)**: CostNormalizationRuleExcludedTimeOffType
- **DisplayName (En)**: CostNormalizationRuleExcludedTimeOffType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CostNormalizationRule | Navigation | Нет |  |  |  |
| TimeOffType | Navigation | Нет |  |  |  |

---

## 24. Currency — Валюта

- **FullName**: Timetta.Domain.Aggregates.Entities.Currency
- **DisplayName (Ru)**: Валюта
- **DisplayName (En)**: Currency
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Alpha3Code | String | Нет | Да | Нет | 3 |  |  |  |
| Symbol | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 25. CurrencyExchangeRate — CurrencyExchangeRate

- **FullName**: Timetta.Domain.Aggregates.Entities.CurrencyExchangeRate
- **DisplayName (Ru)**: CurrencyExchangeRate
- **DisplayName (En)**: CurrencyExchangeRate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| EffectiveDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ExpiryDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ExchangeRate | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Currency | Navigation | Нет |  |  |  |

---

## 26. CustomField — Дополнительное свойство

- **FullName**: Timetta.Domain.Aggregates.Entities.CustomField
- **DisplayName (Ru)**: Дополнительное свойство
- **DisplayName (En)**: Custom field
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Type | Enum | Нет | Да | Нет |  |  |  |  |
| EntityType | String | Нет | Нет | Нет |  |  |  |  |
| IsOnlyForApi | Boolean | Нет | Да | Нет |  |  |  |  |
| IsShownInReports | Boolean | Нет | Да | Нет |  |  |  |  |
| IsShownInEntityForms | Boolean | Нет | Да | Нет |  |  |  |  |
| IsShownInEntityLists | Boolean | Нет | Да | Нет |  |  |  |  |
| IsShownInEntityListFilters | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 27. Dashboard — Дашборд

- **FullName**: Timetta.Domain.Aggregates.Entities.Dashboard
- **DisplayName (Ru)**: Дашборд
- **DisplayName (En)**: Dashboard
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| IsPublished | Boolean | Нет | Да | Нет |  |  |  |  |
| ShowInAnalytics | Boolean | Нет | Да | Нет |  |  |  |  |
| LastUpdated | DateTime | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Owner | User [Entity] | Нет |  |  |  |

---

## 28. Deal — Сделка

- **FullName**: Timetta.Domain.Aggregates.Entities.Deal
- **DisplayName (Ru)**: Сделка
- **DisplayName (En)**: Deal
- **Description**: None
- **Lifecycle**: Да | kindType: DirectoryEntry | kindProperty: Type
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Key | String | Нет | Нет | Нет |  |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| ResolutionComment | Text | Нет | Нет | Нет |  |  |  |  |
| Probability | Percent | Нет | Нет | Нет |  |  |  |  |
| Amount | Currency | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Organization | Navigation | Нет |  |  |  |
| Manager | User [Entity] | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| Type | Directory | Нет |  |  |
| Resolution | Directory | Нет |  |  |
| Source | Directory | Нет |  |  |

---

## 29. DealContact — Контакт сделки

- **FullName**: Timetta.Domain.Aggregates.Entities.DealContact
- **DisplayName (Ru)**: Контакт сделки
- **DisplayName (En)**: Deal contact
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Deal | Navigation | Нет |  |  |  |
| Contact | Navigation | Нет |  |  |  |

---

## 30. Department — Подразделение

- **FullName**: Timetta.Domain.Aggregates.Entities.Department
- **DisplayName (Ru)**: Подразделение
- **DisplayName (En)**: Department
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: LeadDepartment
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| LeadDepartment | Navigation | Нет |  |  |  |
| Role | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| EmploymentType | Directory | Нет |  |  |

---

## 31. Directory — Справочник

- **FullName**: Timetta.Domain.Aggregates.Entities.Directory
- **DisplayName (Ru)**: Справочник
- **DisplayName (En)**: Directory
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 32. DirectoryEntry — Запись справочника

- **FullName**: Timetta.Domain.Aggregates.Entities.DirectoryEntry
- **DisplayName (Ru)**: Запись справочника
- **DisplayName (En)**: Directory entry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Icon | String | Нет | Нет | Нет |  |  |  |  |
| Color | String | Нет | Нет | Нет |  |  |  |  |
| IsSystem | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 33. CustomHookLog — CustomHookLog

- **FullName**: Timetta.Domain.Aggregates.Entities.CustomHookLog
- **DisplayName (Ru)**: CustomHookLog
- **DisplayName (En)**: CustomHookLog
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Timestamp | DateOnly | Нет | Да | Нет |  |  |  |  |
| Message | String | Нет | Нет | Нет |  |  |  |  |
| ErrorDetails | String | Нет | Нет | Нет |  |  |  |  |
| Level | Enum | Нет | Да | Нет |  |  |  |  |
| EntityId | String | Нет | Нет | Нет |  |  |  |  |
| EntityTypeName | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 34. ScheduledJobLog — ScheduledJobLog

- **FullName**: Timetta.Domain.Aggregates.Entities.ScheduledJobLog
- **DisplayName (Ru)**: ScheduledJobLog
- **DisplayName (En)**: ScheduledJobLog
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Timestamp | DateOnly | Нет | Да | Нет |  |  |  |  |
| Message | String | Нет | Нет | Нет |  |  |  |  |
| ErrorDetails | String | Нет | Нет | Нет |  |  |  |  |
| Level | Enum | Нет | Да | Нет |  |  |  |  |
| ScheduledJobId | String | Нет | Да | Нет |  |  |  |  |
| ScheduledJobName | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 35. LifecycleRoleResolverLog — LifecycleRoleResolverLog

- **FullName**: Timetta.Domain.Aggregates.Entities.LifecycleRoleResolverLog
- **DisplayName (Ru)**: LifecycleRoleResolverLog
- **DisplayName (En)**: LifecycleRoleResolverLog
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Timestamp | DateOnly | Нет | Да | Нет |  |  |  |  |
| Message | String | Нет | Нет | Нет |  |  |  |  |
| ErrorDetails | String | Нет | Нет | Нет |  |  |  |  |
| Level | Enum | Нет | Да | Нет |  |  |  |  |
| EntityId | String | Нет | Нет | Нет |  |  |  |  |
| LifecycleRoleId | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 36. EmailTemplate — EmailTemplate

- **FullName**: Timetta.Domain.Aggregates.Entities.EmailTemplate
- **DisplayName (Ru)**: EmailTemplate
- **DisplayName (En)**: EmailTemplate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Text | Text | Нет | Нет | Нет |  |  |  |  |
| Subject | String | Нет | Нет | Нет |  |  |  |  |
| AiGeneration | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 37. ExpenseRequest — Заявка на затраты

- **FullName**: Timetta.Domain.Aggregates.Entities.ExpenseRequest
- **DisplayName (Ru)**: Заявка на затраты
- **DisplayName (En)**: Expense request
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| TotalAmount | Decimal | Нет | Да | Нет |  |  |  |  |
| TotalBillable | Decimal | Нет | Да | Нет |  |  |  |  |
| TotalReimbursementBC | Decimal | Нет | Да | Нет |  |  |  |  |
| TotalReimbursementRC | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| ProjectCostCenter | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| Department | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| ReimbursementCurrency | Navigation | Нет |  |  |  |
| Subcontractor | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 38. ExpenseRequestLine — Строка заявки на затраты

- **FullName**: Timetta.Domain.Aggregates.Entities.ExpenseRequestLine
- **DisplayName (Ru)**: Строка заявки на затраты
- **DisplayName (En)**: Expense request line
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Reimburse | Boolean | Нет | Да | Нет |  |  |  |  |
| AmountPC | Decimal | Нет | Да | Нет |  |  |  |  |
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| AmountBC | Decimal | Нет | Да | Нет |  |  |  |  |
| Unit | String | Нет | Нет | Нет |  |  |  |  |
| Quantity | Decimal | Нет | Да | Нет |  |  |  |  |
| Billable | Boolean | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Rate | Decimal | Нет | Да | Нет |  |  |  |  |
| ExchangeRate | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Currency | Navigation | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| ExpenseRequest | Navigation | Нет |  |  |  |

---

## 39. FinancialAccount — Учётная статья

- **FullName**: Timetta.Domain.Aggregates.Entities.FinancialAccount
- **DisplayName (Ru)**: Учётная статья
- **DisplayName (En)**: Financial account
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| IncludedInBalance | Boolean | Нет | Да | Нет |  |  |  |  |
| IsSystem | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Type | Navigation | Нет |  |  |  |

---

## 40. Generic — Generic

- **FullName**: Timetta.Domain.Aggregates.Entities.Generic
- **DisplayName (Ru)**: Generic
- **DisplayName (En)**: Generic
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| EmploymentType | Directory | Нет |  |  |

---

## 41. GitLabRepository — GitLabRepository

- **FullName**: Timetta.Domain.Aggregates.Entities.GitLabRepository
- **DisplayName (Ru)**: GitLabRepository
- **DisplayName (En)**: GitLabRepository
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| GitLabProjectId | Integer | Нет | Да | Нет |  |  |  |  |
| LastBranchesSyncAt | DateTime | Нет | Нет | Нет |  |  |  |  |
| LastSuccessfulSyncAt | DateTime | Нет | Нет | Нет |  |  |  |  |
| LastMergeRequestsSyncAt | DateTime | Нет | Нет | Нет |  |  |  |  |
| LastSyncError | String | Нет | Нет | Нет |  |  |  |  |
| LastMergeRequestsSyncError | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 42. Grade — Грейд

- **FullName**: Timetta.Domain.Aggregates.Entities.Grade
- **DisplayName (Ru)**: Грейд
- **DisplayName (En)**: Grade
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Level | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 43. Group — Группа

- **FullName**: Timetta.Domain.Aggregates.Entities.Group
- **DisplayName (Ru)**: Группа
- **DisplayName (En)**: Group
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 44. HistoryLogEntry — HistoryLogEntry

- **FullName**: Timetta.Domain.Aggregates.Entities.HistoryLogEntry
- **DisplayName (Ru)**: HistoryLogEntry
- **DisplayName (En)**: HistoryLogEntry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| EntityId | String | Нет | Да | Нет |  |  |  |  |
| EntityType | String | Нет | Нет | Нет |  |  |  |  |
| EntityName | String | Нет | Нет | Нет |  |  |  |  |
| Type | Enum | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| User | User [Entity] | Нет |  |  |  |

---

## 45. Import — Import

- **FullName**: Timetta.Domain.Aggregates.Entities.Import
- **DisplayName (Ru)**: Import
- **DisplayName (En)**: Import
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 46. IncomingActOfAcceptance — Входящий акт

- **FullName**: Timetta.Domain.Aggregates.Entities.IncomingActOfAcceptance
- **DisplayName (Ru)**: Входящий акт
- **DisplayName (En)**: Incoming act of acceptance
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| AmountBC | Decimal | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| DateOfAcceptance | DateOnly | Нет | Нет | Нет |  |  |  |  |
| PeriodStart | DateOnly | Нет | Нет | Нет |  |  |  |  |
| PeriodEnd | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Number | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Key | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| Subcontractor | Navigation | Нет |  |  |  |
| Currency | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 47. IncomingActOfAcceptanceLine — Строка входящего акта

- **FullName**: Timetta.Domain.Aggregates.Entities.IncomingActOfAcceptanceLine
- **DisplayName (Ru)**: Строка входящего акта
- **DisplayName (En)**: Incoming act of acceptance line
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| AmountBC | Decimal | Нет | Да | Нет |  |  |  |  |
| ExchangeRate | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Account | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| IncomingActOfAcceptance | Navigation | Нет |  |  |  |

---

## 48. IncomingActOfAcceptanceDocument — Документ акта

- **FullName**: Timetta.Domain.Aggregates.Entities.IncomingActOfAcceptanceDocument
- **DisplayName (Ru)**: Документ акта
- **DisplayName (En)**: Act document
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| IncomingActOfAcceptance | Navigation | Нет |  |  |  |
| TimeSheet | Navigation | Нет |  |  |  |
| ExpenseRequest | Navigation | Нет |  |  |  |

---

## 49. Interaction — Взаимодействие

- **FullName**: Timetta.Domain.Aggregates.Entities.Interaction
- **DisplayName (Ru)**: Взаимодействие
- **DisplayName (En)**: Interaction
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| IsPlanned | Boolean | Нет | Да | Нет |  |  |  |  |
| IsSent | Boolean | Нет | Да | Нет |  |  |  |  |
| SendAutomatically | Boolean | Нет | Да | Нет |  |  |  |  |
| Date | DateTime | Нет | Да | Нет |  |  |  |  |
| Subject | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Type | Navigation | Нет |  |  |  |
| Organization | Navigation | Нет |  |  |  |
| Deal | Navigation | Нет |  |  |  |
| Performer | User [Entity] | Нет |  |  |  |
| Email | Navigation | Нет |  |  |  |

---

## 50. ExtendedInteraction — ExtendedInteraction

- **FullName**: Timetta.Domain.Aggregates.Entities.ExtendedInteraction
- **DisplayName (Ru)**: ExtendedInteraction
- **DisplayName (En)**: ExtendedInteraction
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Interaction | Navigation | Нет |  |  |  |

---

## 51. Email — Email

- **FullName**: Timetta.Domain.Aggregates.Entities.Email
- **DisplayName (Ru)**: Email
- **DisplayName (En)**: Email
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Folder | Enum | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 52. InteractionScenario — InteractionScenario

- **FullName**: Timetta.Domain.Aggregates.Entities.InteractionScenario
- **DisplayName (Ru)**: InteractionScenario
- **DisplayName (En)**: InteractionScenario
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 53. Invoice — Счёт

- **FullName**: Timetta.Domain.Aggregates.Entities.Invoice
- **DisplayName (Ru)**: Счёт
- **DisplayName (En)**: Invoice
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| BillingAddress | String | Нет | Нет | Нет |  |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IssueDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| PaymentDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| PaymentDueDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| InnerNotes | String | Нет | Нет | Нет |  |  |  |  |
| OuterNotes | String | Нет | Нет | Нет |  |  |  |  |
| TotalAmount | Decimal | Нет | Да | Нет |  |  |  |  |
| TotalAmountBC | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Organization | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| InvoiceTemplate | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 54. InvoiceLine — Строка счёта

- **FullName**: Timetta.Domain.Aggregates.Entities.InvoiceLine
- **DisplayName (Ru)**: Строка счёта
- **DisplayName (En)**: Invoice line
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| Quantity | Decimal | Нет | Да | Нет |  |  |  |  |
| Unit | String | Нет | Нет | Нет |  |  |  |  |
| Rate | Decimal | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ExchangeRate | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ProjectCostCenter | Navigation | Нет |  |  |  |
| ProjectTariff | Navigation | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |
| Role | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| Invoice | Navigation | Нет |  |  |  |

---

## 55. InvoiceTemplate — Шаблон счёта

- **FullName**: Timetta.Domain.Aggregates.Entities.InvoiceTemplate
- **DisplayName (Ru)**: Шаблон счёта
- **DisplayName (En)**: Invoice template
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| CompanyAddress | String | Нет | Нет | Нет |  |  |  |  |
| CompanyName | String | Нет | Нет | Нет |  |  |  |  |
| CompanyPhone | String | Нет | Нет | Нет |  |  |  |  |
| PageOrientation | Enum | Нет | Да | Нет |  |  |  |  |
| PageSize | Enum | Нет | Да | Нет |  |  |  |  |
| PaymentRequisites | String | Нет | Нет | Нет |  |  |  |  |
| SignatureNames | String | Нет | Нет | Нет |  |  |  |  |
| SignaturePosts | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| VatRate | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 56. Issue — Задача

- **FullName**: Timetta.Domain.Aggregates.Entities.Issue
- **DisplayName (Ru)**: Задача
- **DisplayName (En)**: Issue
- **Description**: None
- **Lifecycle**: Да | kindType: DirectoryEntry | kindProperty: Type
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Key | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| DueDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ResolutionComment | Text | Нет | Нет | Нет |  |  |  |  |
| StoryPoints | Integer | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Initiator | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| Assigned | User [Entity] | Нет |  |  |  |
| Deal | Navigation | Нет |  |  |  |
| Sprint | Navigation | Нет |  |  |  |
| Parent | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| Type | Directory | Нет |  |  |
| Priority | Directory | Нет |  |  |
| Resolution | Directory | Нет |  |  |

### Наборы справочников (DirectorySet Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| Tags | DirectorySet | Нет |  |

### Коллекции (Collection Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| Followers | Collection | Нет |  |

---

## 57. IssueFollower — Наблюдатель задачи

- **FullName**: Timetta.Domain.Aggregates.Entities.IssueFollower
- **DisplayName (Ru)**: Наблюдатель задачи
- **DisplayName (En)**: Issue follower
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Issue | Navigation | Нет |  |  |  |
| Follower | User [Entity] | Нет |  |  |  |

---

## 58. IssueLink — Связь задачи

- **FullName**: Timetta.Domain.Aggregates.Entities.IssueLink
- **DisplayName (Ru)**: Связь задачи
- **DisplayName (En)**: Issue link
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

_Нет примитивных полей_

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Source | Navigation | Нет |  |  |  |
| Destination | Navigation | Нет |  |  |  |
| LinkType | Navigation | Нет |  |  |  |

---

## 59. IssueLinkType — Тип связи задачи

- **FullName**: Timetta.Domain.Aggregates.Entities.IssueLinkType
- **DisplayName (Ru)**: Тип связи задачи
- **DisplayName (En)**: Issue link type
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| OutwardLinkDescription | String | Нет | Да | Нет |  |  |  |  |
| InwardLinkDescription | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 60. LegalEntity — Юридическое лицо

- **FullName**: Timetta.Domain.Aggregates.Entities.LegalEntity
- **DisplayName (Ru)**: Юридическое лицо
- **DisplayName (En)**: Legal entity
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Manager | User [Entity] | Нет |  |  |  |
| Currency | Navigation | Нет |  |  |  |

---

## 61. Level — Уровень

- **FullName**: Timetta.Domain.Aggregates.Entities.Level
- **DisplayName (Ru)**: Уровень
- **DisplayName (En)**: Level
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 62. Lifecycle — Lifecycle

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.Lifecycle
- **DisplayName (Ru)**: Lifecycle
- **DisplayName (En)**: Lifecycle
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 63. LifecycleRole — Роль жизненного цикла

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.LifecycleRole
- **DisplayName (Ru)**: Роль жизненного цикла
- **DisplayName (En)**: Lifecycle role
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| PublishedResolverCode | Text | Нет | Нет | Нет |  |  |  |  |
| DraftResolverCode | Text | Нет | Нет | Нет |  |  |  |  |
| HasDraft | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Lifecycle | Navigation | Нет |  |  |  |

---

## 64. Location — Локация

- **FullName**: Timetta.Domain.Aggregates.Entities.Location
- **DisplayName (Ru)**: Локация
- **DisplayName (En)**: Location
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 65. LoginLogEntry — LoginLogEntry

- **FullName**: Timetta.Domain.Aggregates.Entities.LoginLogEntry
- **DisplayName (Ru)**: LoginLogEntry
- **DisplayName (En)**: LoginLogEntry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Email | Email | Нет | Нет | Нет |  |  |  |  |
| IpAddress | String | Нет | Нет | Нет |  |  |  |  |
| IsSuccessful | Boolean | Нет | Да | Нет |  |  |  |  |
| UserAgent | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| User | User [Entity] | Нет |  |  |  |
| AuthProvider | Navigation | Нет |  |  |  |

---

## 66. NumberingPolicy — Политика нумерации

- **FullName**: Timetta.Domain.Aggregates.Entities.NumberingPolicy
- **DisplayName (Ru)**: Политика нумерации
- **DisplayName (En)**: Numbering policy
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Template | String | Нет | Нет | Нет |  |  |  |  |
| StartingIndex | Integer | Нет | Да | Нет |  |  |  |  |
| EntityType | String | Нет | Да | Нет |  |  |  |  |
| ScopeProperty | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 67. NumberingPolicyValue — Политика нумерации (значение)

- **FullName**: Timetta.Domain.Aggregates.Entities.NumberingPolicyValue
- **DisplayName (Ru)**: Политика нумерации (значение)
- **DisplayName (En)**: Numbering policy value
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| NextIndex | Integer | Нет | Да | Нет |  |  |  |  |
| ScopeKey | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| NumberingPolicy | Navigation | Нет |  |  |  |

---

## 68. OrganizationBillingInfo — OrganizationBillingInfo

- **FullName**: Timetta.Domain.Aggregates.Entities.OrganizationBillingInfo
- **DisplayName (Ru)**: OrganizationBillingInfo
- **DisplayName (En)**: OrganizationBillingInfo
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| TimeAmountBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| TimeAmountPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| ExpenseAmountBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| ExpenseAmountPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CustomAmountBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CustomAmountPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| Hours | Decimal | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| Organization | Navigation | Нет |  |  |  |

---

## 69. Organization — Организация

- **FullName**: Timetta.Domain.Aggregates.Entities.Organization
- **DisplayName (Ru)**: Организация
- **DisplayName (En)**: Organization
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Да
- **TotalProperty**: {'metaEntityName': 'OrganizationTotal', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'Total', 'kind': 'Total', 'customFieldId': None, 'clrType': 'OrganizationTotal', 'type': 'Navigation', 'annotation': None, 'isRequired': True, 'isReadonly': True, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Показатели'}, {'language': 'En', 'value': 'Indicators'}], 'viewConfiguration': None}
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Key | String | Нет | Нет | Нет |  |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| Contact | String | Нет | Нет | Нет |  |  |  |  |
| ContactEmail | Email | Нет | Нет | Нет |  |  |  |  |
| Phone | Phone | Нет | Нет | Нет |  |  |  |  |
| Site | Url | Нет | Нет | Нет |  |  |  |  |
| PostalAddressRegion | String | Нет | Нет | Нет |  |  |  |  |
| PostalAddressCity | String | Нет | Нет | Нет |  |  |  |  |
| PostalAddressDetail | String | Нет | Нет | Нет |  |  |  |  |
| PostalAddressZipCode | String | Нет | Нет | Нет |  |  |  |  |
| LegalAddressRegion | String | Нет | Нет | Нет |  |  |  |  |
| LegalAddressCity | String | Нет | Нет | Нет |  |  |  |  |
| LegalAddressDetail | String | Нет | Нет | Нет |  |  |  |  |
| LegalAddressZipCode | String | Нет | Нет | Нет |  |  |  |  |
| LegalAddressSameAsPostalAddress | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Legal | Navigation | Нет |  |  |  |
| Manager | User [Entity] | Нет |  |  |  |

---

## 70. OrganizationTotal — Показатели организации

- **FullName**: Timetta.Domain.Aggregates.Entities.OrganizationTotal
- **DisplayName (Ru)**: Показатели организации
- **DisplayName (En)**: Organization indicators
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| EstimatedHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| PlannedHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| PlannedHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursNormalized | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursNormalizedOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedCostBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCostBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualCostBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTmBc | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTMOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| EstimatedProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ProjectCount | Integer | Нет | Нет | Нет |  |  |  |  |
| DealCount | Integer | Нет | Нет | Нет |  |  |  |  |
| ActiveContactCount | Integer | Нет | Нет | Нет |  |  |  |  |
| InteractionCountOverPeriod | Integer | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 71. OrganizationTariff — Тариф организации

- **FullName**: Timetta.Domain.Aggregates.Entities.OrganizationTariff
- **DisplayName (Ru)**: Тариф организации
- **DisplayName (En)**: Organization tariff
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Organization | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 72. OrganizationTariffRate — OrganizationTariffRate

- **FullName**: Timetta.Domain.Aggregates.Entities.OrganizationTariffRate
- **DisplayName (Ru)**: OrganizationTariffRate
- **DisplayName (En)**: OrganizationTariffRate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| EffectiveDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ExpiryDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Value | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Currency | Navigation | Нет |  |  |  |

---

## 73. OrganizationLegal — Клиент (юр. лицо)

- **FullName**: Timetta.Domain.Aggregates.Entities.OrganizationLegal
- **DisplayName (Ru)**: Клиент (юр. лицо)
- **DisplayName (En)**: Organization legal
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| RegistrationNumber | String | Нет | Нет | Нет |  |  |  |  |
| Income | Decimal | Нет | Нет | Нет |  |  |  |  |
| AdditionalInformation | String | Нет | Нет | Нет |  |  |  |  |
| TaxNumber | String | Нет | Нет | Нет |  |  |  |  |
| Headcount | Integer | Нет | Нет | Нет |  |  |  |  |
| LastAutoUpdated | DateTime | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 74. OrganizationRelation — Связь организаций

- **FullName**: Timetta.Domain.Aggregates.Entities.OrganizationRelation
- **DisplayName (Ru)**: Связь организаций
- **DisplayName (En)**: Organization relation
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Parent | Navigation | Нет |  |  |  |
| Child | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| RelationType | Directory | Нет |  |  |

---

## 75. PermissionSet — Набор прав

- **FullName**: Timetta.Domain.Aggregates.Entities.PermissionSet
- **DisplayName (Ru)**: Набор прав
- **DisplayName (En)**: Permission set
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| RoleName | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 76. PermissionSetDetail — PermissionSetDetail

- **FullName**: Timetta.Domain.Aggregates.Entities.PermissionSetDetail
- **DisplayName (Ru)**: PermissionSetDetail
- **DisplayName (En)**: PermissionSetDetail
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| EditEnabled | Boolean | Нет | Да | Нет |  |  |  |  |
| ViewEnabled | Boolean | Нет | Да | Нет |  |  |  |  |
| DeleteEnabled | Boolean | Нет | Да | Нет |  |  |  |  |
| ActionEnabled | Boolean | Нет | Да | Нет |  |  |  |  |
| ScopeName | String | Нет | Нет | Нет |  |  |  |  |
| GranularName | String | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| PermissionSet | Navigation | Нет |  |  |  |

---

## 77. PortfolioContentItem — Элемент портфеля

- **FullName**: Timetta.Domain.Aggregates.Entities.PortfolioContentItem
- **DisplayName (Ru)**: Элемент портфеля
- **DisplayName (En)**: Portfolio content item
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Type | Navigation | Нет |  |  |  |
| Manager | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Program | Navigation | Нет |  |  |  |
| Portfolio | Navigation | Нет |  |  |  |

---

## 78. Program — Программа

- **FullName**: Timetta.Domain.Aggregates.Entities.Program
- **DisplayName (Ru)**: Программа
- **DisplayName (En)**: Program
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Нет
- **TotalProperty**: {'metaEntityName': 'ProgramTotal', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'Total', 'kind': 'Total', 'customFieldId': None, 'clrType': 'ProgramTotal', 'type': 'Navigation', 'annotation': None, 'isRequired': True, 'isReadonly': True, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Показатели'}, {'language': 'En', 'value': 'Indicators'}], 'viewConfiguration': None}
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |
| StartDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| EndDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| SkipManagerApprove | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Manager | User [Entity] | Нет |  |  |  |
| Portfolio | Navigation | Нет |  |  |  |

---

## 79. ProgramTotal — Показатели программы

- **FullName**: Timetta.Domain.Aggregates.Entities.ProgramTotal
- **DisplayName (Ru)**: Показатели программы
- **DisplayName (En)**: Program indicators
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| EstimatedHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| PlannedHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| PlannedHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursNormalized | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursNormalizedOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedCostBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCostBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualCostBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTmBc | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTMOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| EstimatedProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ProjectsCount | Integer | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 80. ProgramCoManager — ProgramCoManager

- **FullName**: Timetta.Domain.Aggregates.Entities.ProgramCoManager
- **DisplayName (Ru)**: ProgramCoManager
- **DisplayName (En)**: ProgramCoManager
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

_Нет примитивных полей_

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| User | User [Entity] | Нет |  |  |  |

---

## 81. ProjectArtifact — Документ проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectArtifact
- **DisplayName (Ru)**: Документ проекта
- **DisplayName (En)**: Project document
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| Content | MarkdownText | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| ProjectArtifactType | Navigation | Нет |  |  |  |

---

## 82. ProjectArtifactType — Тип документа

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectArtifactType
- **DisplayName (Ru)**: Тип документа
- **DisplayName (En)**: Document type
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Template | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 83. ProjectBillingEstimate — ProjectBillingEstimate

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectBillingEstimate
- **DisplayName (Ru)**: ProjectBillingEstimate
- **DisplayName (En)**: ProjectBillingEstimate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| BillingDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| CollectionDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ProjectTask | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |
| FinancialAccount | Navigation | Нет |  |  |  |
| VatRate | Navigation | Нет |  |  |  |

---

## 84. Project — Проект

- **FullName**: Timetta.Domain.Aggregates.Entities.Project
- **DisplayName (Ru)**: Проект
- **DisplayName (En)**: Project
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Да
- **TotalProperty**: {'metaEntityName': 'ProjectTotal', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'Total', 'kind': 'Total', 'customFieldId': None, 'clrType': 'ProjectTotal', 'type': 'Navigation', 'annotation': None, 'isRequired': True, 'isReadonly': True, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Показатели'}, {'language': 'En', 'value': 'Indicators'}], 'viewConfiguration': None}
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Key | String | Нет | Нет | Нет |  |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| StartDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| EndDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| DefaultTaskType | Enum | Нет | Да | Нет |  |  |  |  |
| AllowTimeEntry | Boolean | Нет | Да | Нет |  |  |  |  |
| ExternalUrl | Url | Нет | Нет | Нет |  |  |  |  |
| SkipManagerApprove | Boolean | Нет | Да | Нет |  |  |  |  |
| IsAutoPlanning | Boolean | Нет | Да | Нет |  |  |  |  |
| CorporateTaxRate | Percent | Нет | Нет | Нет |  |  |  |  |
| IsAccrueCapitalCharge | Boolean | Нет | Да | Нет |  |  |  |  |
| BillingDeferment | Duration | Нет | Да | Нет |  |  |  |  |
| CollectionDeferment | Duration | Нет | Да | Нет |  |  |  |  |
| BillingAccumulationPeriod | Duration | Нет | Да | Нет |  |  |  |  |
| BillingMode | Enum | Нет | Да | Нет |  |  |  |  |
| Outdated | Boolean | Нет | Нет | Нет |  |  |  |  |
| PlannedStartWorkDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| PlannedEndWorkDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| EstimatedStartWorkDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| EstimatedEndWorkDate | DateOnly | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Organization | Navigation | Нет |  |  |  |
| Manager | User [Entity] | Нет |  |  |  |
| Portfolio | Navigation | Нет |  |  |  |
| Currency | Navigation | Нет |  |  |  |
| BillingType | Navigation | Нет |  |  |  |
| Program | Navigation | Нет |  |  |  |
| Contract | Navigation | Нет |  |  |  |
| Schedule | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| Model | Navigation | Нет |  |  |  |
| Deal | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| CurrentStage | Directory | Нет |  |  |

### Коллекции (Collection Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| CoManagers | Collection | Нет |  |

---

## 85. ProjectTotal — Показатели проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTotal
- **DisplayName (Ru)**: Показатели проекта
- **DisplayName (En)**: Project indicators
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| EstimatedHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| PlannedHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| PlannedHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursNormalized | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursNormalizedOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedCostBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCostBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualCostBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTmBc | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpensesBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualCostOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTMOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpensesOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| EstimatedProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfitBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitabilityBC | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfitOverPeriodBC | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitabilityOverPeriodBC | Percent | Нет | Нет | Нет |  |  |  |  |
| EstimatedCost | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenue | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpenses | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedCostOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedRevenueOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedExpensesOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCost | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenue | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpenses | Money | Нет | Да | Нет |  |  |  |  |
| PlannedCostOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| PlannedRevenueOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| PlannedExpensesOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| ActualCost | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTM | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenue | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpenses | Money | Нет | Да | Нет |  |  |  |  |
| ActualCostOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueTMOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| ActualRevenueOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| ActualExpensesOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfit | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitability | Percent | Нет | Нет | Нет |  |  |  |  |
| EstimatedProfitOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| EstimatedProfitabilityOverPeriod | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfit | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitability | Percent | Нет | Нет | Нет |  |  |  |  |
| PlannedProfitOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| PlannedProfitabilityOverPeriod | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfit | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitability | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualProfitOverPeriod | Money | Нет | Да | Нет |  |  |  |  |
| ActualProfitabilityOverPeriod | Percent | Нет | Нет | Нет |  |  |  |  |
| LastActualDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| InheritedProjectsCount | Integer | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 86. ProjectCoManager — Со-менеджер проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectCoManager
- **DisplayName (Ru)**: Со-менеджер проекта
- **DisplayName (En)**: Project co-manager
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| User | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |

---

## 87. ProjectCostCenter — Центр затрат

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectCostCenter
- **DisplayName (Ru)**: Центр затрат
- **DisplayName (En)**: Project cost center
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 88. ProjectExpenseEstimate — ProjectExpenseEstimate

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectExpenseEstimate
- **DisplayName (Ru)**: ProjectExpenseEstimate
- **DisplayName (En)**: ProjectExpenseEstimate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ProjectTask | Navigation | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |
| Subcontractor | Navigation | Нет |  |  |  |

---

## 89. ProjectModel — Модель этапов проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectModel
- **DisplayName (Ru)**: Модель этапов проекта
- **DisplayName (En)**: Project stages model
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 90. ProjectModelStage — Этап модели

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectModelStage
- **DisplayName (Ru)**: Этап модели
- **DisplayName (En)**: Model stage
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Model | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| Stage | Directory | Нет |  |  |

---

## 91. ProjectPortfolio — Портфель проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectPortfolio
- **DisplayName (Ru)**: Портфель проекта
- **DisplayName (En)**: Project portfolio
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: Portfolio
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Portfolio | Navigation | Нет |  |  |  |
| Owner | User [Entity] | Нет |  |  |  |

---

## 92. ProjectPortfolioCoOwner — ProjectPortfolioCoOwner

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectPortfolioCoOwner
- **DisplayName (Ru)**: ProjectPortfolioCoOwner
- **DisplayName (En)**: ProjectPortfolioCoOwner
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Portfolio | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 93. ProjectRevenueEstimate — ProjectRevenueEstimate

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectRevenueEstimate
- **DisplayName (Ru)**: ProjectRevenueEstimate
- **DisplayName (En)**: ProjectRevenueEstimate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ProjectTask | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |

---

## 94. ProjectRisk — Риск проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectRisk
- **DisplayName (Ru)**: Риск проекта
- **DisplayName (En)**: Project risk
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: {'metaEntityName': 'ProjectRiskTotal', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'Total', 'kind': 'Total', 'customFieldId': None, 'clrType': 'ProjectRiskTotal', 'type': 'Navigation', 'annotation': None, 'isRequired': True, 'isReadonly': True, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Показатели'}, {'language': 'En', 'value': 'Indicators'}], 'viewConfiguration': None}
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| CrossId | String | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| AccrueRisk | Boolean | Нет | Да | Нет |  |  |  |  |
| CalculationType | Enum | Нет | Нет | Нет |  |  |  |  |
| CalculationBase | Enum | Нет | Нет | Нет |  |  |  |  |
| AccrualFrequency | Enum | Нет | Нет | Нет |  |  |  |  |
| Percent | Percent | Нет | Нет | Нет |  |  |  |  |
| Amount | Currency | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |
| ProjectRiskType | Navigation | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |

---

## 95. ProjectRiskTotal — ProjectRiskTotal

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectRiskTotal
- **DisplayName (Ru)**: ProjectRiskTotal
- **DisplayName (En)**: ProjectRiskTotal
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| EstimatedAmount | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedAmountBC | Currency | Нет | Нет | Нет |  |  |  |  |
| EstimatedAmountPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| EstimatedAmountPeriodBC | Currency | Нет | Нет | Нет |  |  |  |  |
| ReservedAmount | Decimal | Нет | Нет | Нет |  |  |  |  |
| ReservedAmountBC | Currency | Нет | Нет | Нет |  |  |  |  |
| UsedAmount | Decimal | Нет | Нет | Нет |  |  |  |  |
| UsedAmountBC | Currency | Нет | Нет | Нет |  |  |  |  |
| BalanceAmount | Decimal | Нет | Нет | Нет |  |  |  |  |
| BalanceAmountBC | Currency | Нет | Нет | Нет |  |  |  |  |
| ForecastedAmount | Decimal | Нет | Нет | Нет |  |  |  |  |
| ForecastedAmountBC | Currency | Нет | Нет | Нет |  |  |  |  |
| ForecastedAmountPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ForecastedAmountPeriodBC | Currency | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 96. ProjectRiskType — Тип риска проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectRiskType
- **DisplayName (Ru)**: Тип риска проекта
- **DisplayName (En)**: Project risk type
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| CalculationType | Enum | Нет | Нет | Нет |  |  |  |  |
| CalculationBase | Enum | Нет | Нет | Нет |  |  |  |  |
| AccrualFrequency | Enum | Нет | Нет | Нет |  |  |  |  |
| Percent | Percent | Нет | Нет | Нет |  |  |  |  |
| Amount | Currency | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |

---

## 97. ProjectTariff — Тариф проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTariff
- **DisplayName (Ru)**: Тариф проекта
- **DisplayName (En)**: Project tariff
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 98. ProjectTariffRate — ProjectTariffRate

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTariffRate
- **DisplayName (Ru)**: ProjectTariffRate
- **DisplayName (En)**: ProjectTariffRate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| EffectiveDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ExpiryDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Value | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Currency | Navigation | Нет |  |  |  |

---

## 99. ProjectTariffAssignment — ProjectTariffAssignment

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTariffAssignment
- **DisplayName (Ru)**: ProjectTariffAssignment
- **DisplayName (En)**: ProjectTariffAssignment
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| IsAllTeamRole | Boolean | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ProjectTeamMember | Navigation | Нет |  |  |  |
| ProjectTariff | Navigation | Нет |  |  |  |

---

## 100. ProjectTaskAssignment — ProjectTaskAssignment

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTaskAssignment
- **DisplayName (Ru)**: ProjectTaskAssignment
- **DisplayName (En)**: ProjectTaskAssignment
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 101. ProjectTask — Работа проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTask
- **DisplayName (Ru)**: Работа проекта
- **DisplayName (En)**: Project work item
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: LeadTask
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| StructNumber | String | Нет | Нет | Нет |  |  |  |  |
| Number | Integer | Нет | Да | Нет |  |  |  |  |
| Type | Enum | Нет | Нет | Нет |  |  |  |  |
| EffortDriven | Boolean | Нет | Да | Нет |  |  |  |  |
| StartDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| EndDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| AllowTimeEntry | Boolean | Нет | Да | Нет |  |  |  |  |
| Duration | Integer | Нет | Да | Нет |  |  |  |  |
| IsMilestone | Boolean | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| CrossId | String | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| LeadTask | Navigation | Нет |  |  |  |
| Category | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 102. ProjectTeamMember — Член команды

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTeamMember
- **DisplayName (Ru)**: Член команды
- **DisplayName (En)**: Team member
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Resource | Navigation | Нет |  |  |  |
| Role | Navigation | Нет |  |  |  |
| Competence | Navigation | Нет |  |  |  |
| PrimaryTariff | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |

---

## 103. ProjectTeamMemberCostValue — ProjectTeamMemberCostValue

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTeamMemberCostValue
- **DisplayName (Ru)**: ProjectTeamMemberCostValue
- **DisplayName (En)**: ProjectTeamMemberCostValue
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| EffectiveDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ExpiryDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Value | Decimal | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Currency | Navigation | Нет |  |  |  |
| TeamMember | Navigation | Нет |  |  |  |

---

## 104. ProjectVersion — Версия проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectVersion
- **DisplayName (Ru)**: Версия проекта
- **DisplayName (En)**: Project version
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| MainProject | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 105. RateMatrix — Матрица ставок

- **FullName**: Timetta.Domain.Aggregates.Entities.RateMatrix
- **DisplayName (Ru)**: Матрица ставок
- **DisplayName (En)**: Rate matrix
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Type | Navigation | Нет |  |  |  |

---

## 106. RateMatrixLine — RateMatrixLine

- **FullName**: Timetta.Domain.Aggregates.Entities.RateMatrixLine
- **DisplayName (Ru)**: RateMatrixLine
- **DisplayName (En)**: RateMatrixLine
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Rate | Decimal | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Role | Navigation | Нет |  |  |  |
| Level | Navigation | Нет |  |  |  |
| Grade | Navigation | Нет |  |  |  |
| Location | Navigation | Нет |  |  |  |
| Competence | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| ResourcePool | Navigation | Нет |  |  |  |

---

## 107. ReportV2 — ReportV2

- **FullName**: Timetta.Domain.Aggregates.Entities.ReportV2
- **DisplayName (Ru)**: ReportV2
- **DisplayName (En)**: ReportV2
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| IsCommon | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Owner | User [Entity] | Нет |  |  |  |
| ReportType | Navigation | Нет |  |  |  |

---

## 108. Resource — Ресурс

- **FullName**: Timetta.Domain.Aggregates.Entities.Resource
- **DisplayName (Ru)**: Ресурс
- **DisplayName (En)**: Resource
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Role | Navigation | Нет |  |  |  |
| Level | Navigation | Нет |  |  |  |
| Grade | Navigation | Нет |  |  |  |
| Location | Navigation | Нет |  |  |  |
| Competence | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| ResourcePool | Navigation | Нет |  |  |  |
| Department | Navigation | Нет |  |  |  |
| Supervisor | User [Entity] | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| EmploymentType | Directory | Нет |  |  |

---

## 109. ResourcePlanEntry — ResourcePlanEntry

- **FullName**: Timetta.Domain.Aggregates.Entities.ResourcePlanEntry
- **DisplayName (Ru)**: ResourcePlanEntry
- **DisplayName (En)**: ResourcePlanEntry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Hours | Decimal | Нет | Да | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| Week | DateOnly | Нет | Да | Нет |  |  |  |  |
| Month | DateOnly | Нет | Да | Нет |  |  |  |  |
| BillingRate | Decimal | Нет | Нет | Нет |  |  |  |  |
| BillingRateBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| BillingRatePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| Revenue | Decimal | Нет | Нет | Нет |  |  |  |  |
| RevenueBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| RevenuePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| GenericCostRate | Decimal | Нет | Нет | Нет |  |  |  |  |
| GenericCostRatePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| UserStandardCostRatePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| UserStandardCostRateBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| StandardCostBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| StandardCostPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| GenericCost | Decimal | Нет | Нет | Нет |  |  |  |  |
| GenericCostPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| UserCost | Decimal | Нет | Нет | Нет |  |  |  |  |
| UserCostRateBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| UserCostRatePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| UserCostRate | Decimal | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |
| Resource | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| TeamMember | Navigation | Нет |  |  |  |

---

## 110. ResourcePool — Ресурсный пул

- **FullName**: Timetta.Domain.Aggregates.Entities.ResourcePool
- **DisplayName (Ru)**: Ресурсный пул
- **DisplayName (En)**: Resource pool
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: LeadResourcePool
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Manager | User [Entity] | Нет |  |  |  |
| LeadResourcePool | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 111. ResourcePoolCoManager — ResourcePoolCoManager

- **FullName**: Timetta.Domain.Aggregates.Entities.ResourcePoolCoManager
- **DisplayName (Ru)**: ResourcePoolCoManager
- **DisplayName (En)**: ResourcePoolCoManager
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ResourcePool | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 112. ResourceRequest — Запрос ресурсов

- **FullName**: Timetta.Domain.Aggregates.Entities.ResourceRequest
- **DisplayName (Ru)**: Запрос ресурсов
- **DisplayName (En)**: Resource request
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| RequestedHours | Duration | Нет | Нет | Нет |  |  |  |  |
| BookedHours | Duration | Нет | Нет | Нет |  |  |  |  |
| From | DateOnly | Нет | Нет | Нет |  |  |  |  |
| To | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ResourceDescription | Text | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Role | Navigation | Нет |  |  |  |
| Level | Navigation | Нет |  |  |  |
| Grade | Navigation | Нет |  |  |  |
| Location | Navigation | Нет |  |  |  |
| Competence | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| ResourcePool | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| EmploymentType | Directory | Нет |  |  |

---

## 113. RiskRequest — Запрос на использование риска

- **FullName**: Timetta.Domain.Aggregates.Entities.RiskRequest
- **DisplayName (Ru)**: Запрос на использование риска
- **DisplayName (En)**: Risk request
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| RequestDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| Amount | Currency | Нет | Да | Нет |  |  |  |  |
| AmountBC | Decimal | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Applicant | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Type | Navigation | Нет |  |  |  |
| Risk | Navigation | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |

---

## 114. Role — Роль

- **FullName**: Timetta.Domain.Aggregates.Entities.Role
- **DisplayName (Ru)**: Роль
- **DisplayName (En)**: Role
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 115. Schedule — Расписание

- **FullName**: Timetta.Domain.Aggregates.Entities.Schedule
- **DisplayName (Ru)**: Расписание
- **DisplayName (En)**: Schedule
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| DaysCount | String | Нет | Да | Нет |  |  |  |  |
| FirstDay | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ScheduleException | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 116. ScheduledJob — Задание по расписанию

- **FullName**: Timetta.Domain.Aggregates.Entities.ScheduledJob
- **DisplayName (Ru)**: Задание по расписанию
- **DisplayName (En)**: Scheduled job
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |
| Description | MarkdownText | Нет | Нет | Нет |  |  |  |  |
| DraftCode | String | Нет | Нет | Нет |  |  |  |  |
| PublishedCode | String | Нет | Нет | Нет |  |  |  |  |
| HasDraft | Boolean | Нет | Да | Нет |  |  |  |  |
| CronExpression | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 117. ScheduleException — Исключения расписания

- **FullName**: Timetta.Domain.Aggregates.Entities.ScheduleException
- **DisplayName (Ru)**: Исключения расписания
- **DisplayName (En)**: Schedule exception
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 118. ExceptionDay — День исключения

- **FullName**: Timetta.Domain.Aggregates.Entities.ExceptionDay
- **DisplayName (Ru)**: День исключения
- **DisplayName (En)**: Exception day
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| DayLength | Decimal | Нет | Да | Нет |  |  |  |  |
| ExcludeFromCalendarDuration | Boolean | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ScheduleException | Navigation | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 119. Skill — Навык

- **FullName**: Timetta.Domain.Aggregates.Entities.Skill
- **DisplayName (Ru)**: Навык
- **DisplayName (En)**: Skill
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 120. State — Состояние

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.State
- **DisplayName (Ru)**: Состояние
- **DisplayName (En)**: State
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Style | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 121. SubcontractorPaymentEstimate — Оценка платежа субподрядчику

- **FullName**: Timetta.Domain.Aggregates.Entities.SubcontractorPaymentEstimate
- **DisplayName (Ru)**: Оценка платежа субподрядчику
- **DisplayName (En)**: Subcontractor payment estimate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |
| AmountBC | Decimal | Нет | Да | Нет |  |  |  |  |
| BillingDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| PaymentDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| ProjectTask | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Version | Navigation | Нет |  |  |  |
| Subcontractor | Navigation | Нет |  |  |  |
| Account | Navigation | Нет |  |  |  |
| VatRate | Navigation | Нет |  |  |  |

---

## 122. TimeAllocation — Ячейка таймшита

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeAllocation
- **DisplayName (Ru)**: Ячейка таймшита
- **DisplayName (En)**: Timesheet cell
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Hours | Decimal | Нет | Нет | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| Cost | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostRate | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostRateBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostRatePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| BillingRate | Decimal | Нет | Нет | Нет |  |  |  |  |
| BillingRateBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| BillingRatePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostNormalized | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostNormalizedBC | Decimal | Нет | Нет | Нет |  |  |  |  |
| CostNormalizedPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| StandardCostNormalized | Decimal | Нет | Нет | Нет |  |  |  |  |
| StandardCostNormalizedPC | Decimal | Нет | Нет | Нет |  |  |  |  |
| StandardCostRate | Decimal | Нет | Нет | Нет |  |  |  |  |
| StandardCostRatePC | Decimal | Нет | Нет | Нет |  |  |  |  |
| HoursNormalized | Decimal | Нет | Нет | Нет |  |  |  |  |
| IsBillable | Boolean | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| TimeSheet | Navigation | Нет |  |  |  |
| TimeSheetLine | Navigation | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| ProjectCostCenter | Navigation | Нет |  |  |  |
| BillCode | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| ProjectTariff | Navigation | Нет |  |  |  |
| Activity | Navigation | Нет |  |  |  |
| Currency | Navigation | Нет |  |  |  |
| InvoiceLine | Navigation | Нет |  |  |  |
| TimeOffRequest | Navigation | Нет |  |  |  |
| Issue | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| Role | Navigation | Нет |  |  |  |

---

## 123. TimeOffBalanceEntry — Баланс отсутствий (запись)

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeOffBalanceEntry
- **DisplayName (Ru)**: Баланс отсутствий (запись)
- **DisplayName (En)**: Time-off balance entry
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Date | DateOnly | Нет | Да | Нет |  |  |  |  |
| Amount | Decimal | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| User | User [Entity] | Нет |  |  |  |
| Type | Navigation | Нет |  |  |  |
| Mode | Navigation | Нет |  |  |  |
| TimeOffType | Navigation | Нет |  |  |  |

---

## 124. TimeOffRequest — Заявка на отсутствие

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeOffRequest
- **DisplayName (Ru)**: Заявка на отсутствие
- **DisplayName (En)**: Time-off request
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: {'metaEntityName': 'TimeOffRequestTotal', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'Total', 'kind': 'Total', 'customFieldId': None, 'clrType': 'TimeOffRequestTotal', 'type': 'Navigation', 'annotation': None, 'isRequired': True, 'isReadonly': True, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Показатели'}, {'language': 'En', 'value': 'Indicators'}], 'viewConfiguration': None}
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| StartDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| FinishDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| FinishDayHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| StartDayHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| StartDayInterval | Enum | Нет | Да | Нет |  |  |  |  |
| FinishDayInterval | Enum | Нет | Да | Нет |  |  |  |  |
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Department | Navigation | Нет |  |  |  |
| TimeOffType | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 125. TimeOffRequestTotal — TimeOffRequestTotal

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeOffRequestTotal
- **DisplayName (Ru)**: TimeOffRequestTotal
- **DisplayName (En)**: TimeOffRequestTotal
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| TimeOffDuration | Decimal | Нет | Нет | Нет |  |  |  |  |
| CurrentAssigned | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 126. TimeOffType — Тип отсутствия

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeOffType
- **DisplayName (Ru)**: Тип отсутствия
- **DisplayName (En)**: Time-off type
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Paid | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| AccrualPolicy | Navigation | Нет |  |  |  |
| UsingPolicy | Navigation | Нет |  |  |  |
| Unit | Navigation | Нет |  |  |  |

---

## 127. TimeSheet — Таймшит

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheet
- **DisplayName (Ru)**: Таймшит
- **DisplayName (En)**: Timesheet
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: {'metaEntityName': 'TimeSheetTotal', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'Total', 'kind': 'Total', 'customFieldId': None, 'clrType': 'TimeSheetTotal', 'type': 'Navigation', 'annotation': None, 'isRequired': True, 'isReadonly': True, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Показатели'}, {'language': 'En', 'value': 'Indicators'}], 'viewConfiguration': None}
- **WorkflowTaskProperty**: {'metaEntityName': 'WorkflowTask', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'MyWorkflowTask', 'kind': 'WorkflowTask', 'customFieldId': None, 'clrType': 'WorkflowTask', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Задание воркфлоу'}, {'language': 'En', 'value': 'Workflow task'}], 'viewConfiguration': None}
- **WorkflowInstanceProperty**: {'metaEntityName': 'WorkflowInstance', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'ActiveWorkflowInstance', 'kind': 'WorkflowInstance', 'customFieldId': None, 'clrType': 'WorkflowInstance', 'type': 'Navigation', 'annotation': None, 'isRequired': False, 'isReadonly': False, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Процесс'}, {'language': 'En', 'value': 'Process'}], 'viewConfiguration': None}

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| DateFrom | DateOnly | Нет | Да | Нет |  |  |  |  |
| DateTo | DateOnly | Нет | Да | Нет |  |  |  |  |
| DueDate | DateOnly | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| Department | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |

---

## 128. TimeSheetTotal — TimeSheetTotal

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetTotal
- **DisplayName (Ru)**: TimeSheetTotal
- **DisplayName (En)**: TimeSheetTotal
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| BillableDuration | Decimal | Нет | Нет | Нет |  |  |  |  |
| CurrentAssigned | String | Нет | Нет | Нет |  |  |  |  |
| TotalDuration | Decimal | Нет | Нет | Нет |  |  |  |  |
| NonBillableDuration | Decimal | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 129. TimeSheetLine — Строка таймшита

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetLine
- **DisplayName (Ru)**: Строка таймшита
- **DisplayName (En)**: Timesheet line
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

_Нет примитивных полей_

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Project | Navigation | Нет |  |  |  |
| ProjectTask | Navigation | Нет |  |  |  |
| Activity | Navigation | Нет |  |  |  |
| Role | Navigation | Нет |  |  |  |
| ProjectCostCenter | Navigation | Нет |  |  |  |
| ProjectTariff | Navigation | Нет |  |  |  |
| TimeSheet | Navigation | Нет |  |  |  |
| BillCode | Navigation | Нет |  |  |  |

---

## 130. TimeSheetPeriod — Период таймшита

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetPeriod
- **DisplayName (Ru)**: Период таймшита
- **DisplayName (En)**: Timesheet period
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| EffectiveDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| ExpiryDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| MonthInitialDay | Integer | Нет | Нет | Нет |  |  |  |  |
| MonthHalfDay | Integer | Нет | Нет | Нет |  |  |  |  |
| DayOfWeek | Enum | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| PeriodType | Navigation | Нет |  |  |  |
| PeriodScope | Navigation | Нет |  |  |  |
| Department | Navigation | Нет |  |  |  |

---

## 131. TimeSheetTemplate — TimeSheetTemplate

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetTemplate
- **DisplayName (Ru)**: TimeSheetTemplate
- **DisplayName (En)**: TimeSheetTemplate
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| DueDateLag | Integer | Нет | Да | Нет |  |  |  |  |
| ShowRole | Boolean | Нет | Да | Нет |  |  |  |  |
| ShowActivity | Boolean | Нет | Да | Нет |  |  |  |  |
| ShowClient | Boolean | Нет | Да | Нет |  |  |  |  |
| ShowProjectCostCenter | Boolean | Нет | Да | Нет |  |  |  |  |
| ShowTariff | Boolean | Нет | Да | Нет |  |  |  |  |
| ShowBillCode | Boolean | Нет | Да | Нет |  |  |  |  |
| CreateAutomatically | Boolean | Нет | Да | Нет |  |  |  |  |
| TimeOffAutoApproval | Boolean | Нет | Да | Нет |  |  |  |  |
| ClearEmptyLinesAutomatically | Boolean | Нет | Да | Нет |  |  |  |  |
| EmptyAutoApproval | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 132. TimeSheetTemplateValidationRule — TimeSheetTemplateValidationRule

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetTemplateValidationRule
- **DisplayName (Ru)**: TimeSheetTemplateValidationRule
- **DisplayName (En)**: TimeSheetTemplateValidationRule
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| TimeSheetTemplate | Navigation | Нет |  |  |  |
| ValidationRule | Navigation | Нет |  |  |  |

---

## 133. TimeSheetTemplateCustomField — TimeSheetTemplateCustomField

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetTemplateCustomField
- **DisplayName (Ru)**: TimeSheetTemplateCustomField
- **DisplayName (En)**: TimeSheetTemplateCustomField
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| TimeSheetTemplate | Navigation | Нет |  |  |  |
| CustomField | Navigation | Нет |  |  |  |

---

## 134. TimeSheetTemplateProjectState — TimeSheetTemplateProjectState

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetTemplateProjectState
- **DisplayName (Ru)**: TimeSheetTemplateProjectState
- **DisplayName (En)**: TimeSheetTemplateProjectState
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| TimeSheetTemplate | Navigation | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |

---

## 135. ValidationRuleExceptionsPerformer — ValidationRuleExceptionsPerformer

- **FullName**: Timetta.Domain.Aggregates.Entities.ValidationRuleExceptionsPerformer
- **DisplayName (Ru)**: ValidationRuleExceptionsPerformer
- **DisplayName (En)**: ValidationRuleExceptionsPerformer
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Role | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Template | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| Group | Navigation | Нет |  |  |  |
| PermissionSet | Navigation | Нет |  |  |  |

---

## 136. User — Пользователь

- **FullName**: Timetta.Domain.Aggregates.Entities.User
- **DisplayName (Ru)**: Пользователь
- **DisplayName (En)**: User
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Да
- **Searchable**: Да
- **HasPeriod**: Да
- **TotalProperty**: {'metaEntityName': 'UserTotal', 'keyProperty': 'Id', 'usedInHistoryLog': False, 'name': 'Total', 'kind': 'Total', 'customFieldId': None, 'clrType': 'UserTotal', 'type': 'Navigation', 'annotation': None, 'isRequired': True, 'isReadonly': True, 'isShownInReports': False, 'isOnlyForApi': False, 'filter': 'Group', 'displayNames': [{'language': 'Ru', 'value': 'Показатели'}, {'language': 'En', 'value': 'Indicators'}], 'viewConfiguration': None}
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Email | Email | Нет | Нет | Нет |  |  |  |  |
| FirstWorkDay | DateOnly | Нет | Нет | Нет |  |  |  |  |
| LastWorkDay | DateOnly | Нет | Нет | Нет |  |  |  |  |
| NotificationsEmail | Email | Нет | Нет | Нет |  |  |  |  |
| Phone | Phone | Нет | Нет | Нет |  |  |  |  |
| Position | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Department | Navigation | Нет |  |  |  |
| Level | Navigation | Нет |  |  |  |
| Grade | Navigation | Нет |  |  |  |
| Location | Navigation | Нет |  |  |  |
| AuthProvider | Navigation | Нет |  |  |  |
| CostNormalizationRule | Navigation | Нет |  |  |  |
| Supervisor | User [Entity] | Нет |  |  |  |
| ResourcePool | Navigation | Нет |  |  |  |
| TimeSheetTemplate | Navigation | Нет |  |  |  |
| LegalEntity | Navigation | Нет |  |  |  |
| Competence | Navigation | Нет |  |  |  |
| Role | Navigation | Нет |  |  |  |
| Subcontractor | Navigation | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| EmploymentType | Directory | Нет |  |  |

---

## 137. UserTotal — UserTotal

- **FullName**: Timetta.Domain.Aggregates.Entities.UserTotal
- **DisplayName (Ru)**: UserTotal
- **DisplayName (En)**: UserTotal
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| ActualHours | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursBillable | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursNonBillable | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualCost | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualRevenue | Decimal | Нет | Нет | Нет |  |  |  |  |
| ScheduleHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ScheduleDeviationOverPeriod | Percent | Нет | Нет | Нет |  |  |  |  |
| ActualHoursOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursOverPeriodBillable | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualHoursOverPeriodNonBillable | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualCostOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| ActualRevenueOverPeriod | Decimal | Нет | Нет | Нет |  |  |  |  |
| UtilizationOverPeriod | Percent | Нет | Нет | Нет |  |  |  |  |
| CurrentCostRate | Decimal | Нет | Нет | Нет |  |  |  |  |
| Licensed | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CurrentCostCurrency | Navigation | Нет |  |  |  |

---

## 138. Vacancy — Vacancy

- **FullName**: Timetta.Domain.Aggregates.Entities.Vacancy
- **DisplayName (Ru)**: Vacancy
- **DisplayName (En)**: Vacancy
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

### Справочники (Directory Properties)

| Имя | Тип | Collection | ReferenceType | Описание |
|-----|-----|-----------|---------------|----------|
| EmploymentType | Directory | Нет |  |  |

---

## 139. ValidationRule — ValidationRule

- **FullName**: Timetta.Domain.Aggregates.Entities.ValidationRule
- **DisplayName (Ru)**: ValidationRule
- **DisplayName (En)**: ValidationRule
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| CustomMessage | Text | Нет | Нет | Нет |  |  |  |  |
| ValidationRuleLevel | Enum | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| ValidationRuleType | Navigation | Нет |  |  |  |

---

## 140. VatRate — Ставка НДС

- **FullName**: Timetta.Domain.Aggregates.Entities.VatRate
- **DisplayName (Ru)**: Ставка НДС
- **DisplayName (En)**: VAT rates
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Rate | Decimal | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 141. View — Представление

- **FullName**: Timetta.Domain.Aggregates.Entities.View
- **DisplayName (Ru)**: Представление
- **DisplayName (En)**: View
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| IsDefault | Boolean | Нет | Да | Нет |  |  |  |  |
| EntityType | String | Нет | Нет | Нет |  |  |  |  |
| EmbeddedEntityType | String | Нет | Нет | Нет |  |  |  |  |
| EmbeddedEntityId | String | Нет | Нет | Нет |  |  |  |  |
| BoardType | Enum | Нет | Да | Нет |  |  |  |  |
| InheritPermissionsFromIssueSettings | Boolean | Нет | Да | Нет |  |  |  |  |
| IsSystem | Boolean | Нет | Да | Нет |  |  |  |  |
| Route | String | Нет | Нет | Нет |  |  |  |  |
| ScopeType | Enum | Нет | Да | Нет |  |  |  |  |
| HideIfEmpty | Boolean | Нет | Да | Нет |  |  |  |  |
| HasIndicator | Boolean | Нет | Да | Нет |  |  |  |  |
| BoardIndicatorProperty | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Owner | User [Entity] | Нет |  |  |  |

### Комплексные свойства (Complex Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| DisplayModes | String | Нет |  |
| Navigations | String | Нет |  |

---

## 142. ViewTeamMember — Член команды представления

- **FullName**: Timetta.Domain.Aggregates.Entities.ViewTeamMember
- **DisplayName (Ru)**: Член команды представления
- **DisplayName (En)**: View team member
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Role | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| View | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| PermissionSet | Navigation | Нет |  |  |  |
| Group | Navigation | Нет |  |  |  |

---

## 143. ViewSetting — ViewSetting

- **FullName**: Timetta.Domain.Aggregates.Entities.ViewSetting
- **DisplayName (Ru)**: ViewSetting
- **DisplayName (En)**: ViewSetting
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| DisplayMode | Enum | Нет | Да | Нет |  |  |  |  |
| BoardGrouping | String | Нет | Нет | Нет |  |  |  |  |
| ScopeType | Enum | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| View | Navigation | Нет |  |  |  |

### Комплексные свойства (Complex Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| FilterSettings | String | Нет |  |
| BoardOrderBy | String | Нет |  |
| ListOrderBy | String | Нет |  |
| ListColumns | String | Нет |  |
| Period | String | Нет |  |
| CardProperties | String | Нет |  |
| FilterPresets | String | Нет |  |

---

## 144. BoardColumn — BoardColumn

- **FullName**: Timetta.Domain.Aggregates.Entities.BoardColumn
- **DisplayName (Ru)**: BoardColumn
- **DisplayName (En)**: BoardColumn
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Index | Integer | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| ViewSetting | Navigation | Нет |  |  |  |

---

## 145. BoardCard — BoardCard

- **FullName**: Timetta.Domain.Aggregates.Entities.BoardCard
- **DisplayName (Ru)**: BoardCard
- **DisplayName (En)**: BoardCard
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| StatedColumnRank | String | Нет | Нет | Нет |  |  |  |  |
| CustomColumnRank | String | Нет | Нет | Нет |  |  |  |  |
| ScrumRank | String | Нет | Нет | Нет |  |  |  |  |
| EntityId | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| StatedColumn | Navigation | Нет |  |  |  |
| CustomColumn | Navigation | Нет |  |  |  |
| ViewSetting | Navigation | Нет |  |  |  |

---

## 146. WikiPage — Статья Вики

- **FullName**: Timetta.Domain.Aggregates.Entities.WikiPage
- **DisplayName (Ru)**: Статья Вики
- **DisplayName (En)**: Wiki page
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Да
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Slug | String | Нет | Нет | Нет |  |  |  |  |
| FullSlug | String | Нет | Нет | Нет |  |  |  |  |
| Summary | String | Нет | Нет | Нет |  |  |  |  |
| DraftContent | String | Нет | Нет | Нет |  |  |  |  |
| DraftAuthorId | String | Нет | Нет | Нет |  |  |  |  |
| DraftCreatedAt | DateOnly | Нет | Нет | Нет |  |  |  |  |
| DraftModifiedAt | DateOnly | Нет | Нет | Нет |  |  |  |  |
| PublishedContent | String | Нет | Нет | Нет |  |  |  |  |
| Rank | String | Нет | Нет | Нет |  |  |  |  |
| LockedById | String | Нет | Нет | Нет |  |  |  |  |
| LockedAt | DateOnly | Нет | Нет | Нет |  |  |  |  |
| LockLastActivityAt | DateOnly | Нет | Нет | Нет |  |  |  |  |
| IsOutdated | Boolean | Нет | Да | Нет |  |  |  |  |
| RowVersion | String | Нет | Да | Нет |  |  |  |  |
| PublishedDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| InheritPermissions | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| WikiSpace | Navigation | Нет |  |  |  |
| Parent | Navigation | Нет |  |  |  |
| Author | User [Entity] | Нет |  |  |  |
| DraftAuthor | User [Entity] | Нет |  |  |  |
| LastEditor | User [Entity] | Нет |  |  |  |
| LockedBy | User [Entity] | Нет |  |  |  |

### Коллекции (Collection Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| Granted | Collection | Нет |  |

---

## 147. WikiPageComment — WikiPageComment

- **FullName**: Timetta.Domain.Aggregates.Entities.WikiPageComment
- **DisplayName (Ru)**: WikiPageComment
- **DisplayName (En)**: WikiPageComment
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Text | String | Нет | Нет | Нет |  |  |  |  |
| QuotedText | String | Нет | Нет | Нет |  |  |  |  |
| MentionedUserIds | String | Нет | Да | Нет |  |  |  |  |
| RowVersion | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Thread | Navigation | Нет |  |  |  |
| RealUser | User [Entity] | Нет |  |  |  |

---

## 148. WikiPageCommentThread — WikiPageCommentThread

- **FullName**: Timetta.Domain.Aggregates.Entities.WikiPageCommentThread
- **DisplayName (Ru)**: WikiPageCommentThread
- **DisplayName (En)**: WikiPageCommentThread
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| ResolvedAt | DateOnly | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| WikiPage | Navigation | Нет |  |  |  |
| ResolvedBy | User [Entity] | Нет |  |  |  |

### Коллекции (Collection Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| Comments | Collection | Нет |  |

---

## 149. WikiPageGranted — WikiPageGranted

- **FullName**: Timetta.Domain.Aggregates.Entities.WikiPageGranted
- **DisplayName (Ru)**: WikiPageGranted
- **DisplayName (En)**: WikiPageGranted
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Role | String | Нет | Нет | Нет |  |  |  |  |
| ViewAllowed | Boolean | Нет | Да | Нет |  |  |  |  |
| EditAllowed | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| WikiPage | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| Group | Navigation | Нет |  |  |  |
| PermissionSet | Navigation | Нет |  |  |  |

---

## 150. WikiPageRevision — WikiPageRevision

- **FullName**: Timetta.Domain.Aggregates.Entities.WikiPageRevision
- **DisplayName (Ru)**: WikiPageRevision
- **DisplayName (En)**: WikiPageRevision
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Body | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| WikiPage | Navigation | Нет |  |  |  |

---

## 151. WikiSpace — Область Wiki

- **FullName**: Timetta.Domain.Aggregates.Entities.WikiSpace
- **DisplayName (Ru)**: Область Wiki
- **DisplayName (En)**: Wiki space
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Code | String | Нет | Нет | Нет |  |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |
| Slug | String | Нет | Нет | Нет |  |  |  |  |
| IsSystem | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Project | Navigation | Нет |  |  |  |
| Owner | User [Entity] | Нет |  |  |  |

### Комплексные свойства (Complex Properties)

| Имя | Тип | Collection | Описание |
|-----|-----|-----------|----------|
| Navigations | String | Нет |  |

---

## 152. WikiSpaceGranted — WikiSpaceGranted

- **FullName**: Timetta.Domain.Aggregates.Entities.WikiSpaceGranted
- **DisplayName (Ru)**: WikiSpaceGranted
- **DisplayName (En)**: WikiSpaceGranted
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Role | String | Нет | Нет | Нет |  |  |  |  |
| ViewAllowed | Boolean | Нет | Да | Нет |  |  |  |  |
| EditAllowed | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| WikiSpace | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |
| PermissionSet | Navigation | Нет |  |  |  |
| Group | Navigation | Нет |  |  |  |

---

## 153. WorkflowDeclaration — WorkflowDeclaration

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.Workflow.WorkflowDeclaration
- **DisplayName (Ru)**: WorkflowDeclaration
- **DisplayName (En)**: WorkflowDeclaration
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Description | Text | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| Lifecycle | Navigation | Нет |  |  |  |

---

## 154. WorkflowEntity — Сущность воркфлоу

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.Workflow.WorkflowEntity
- **DisplayName (Ru)**: Сущность воркфлоу
- **DisplayName (En)**: Workflow entity
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Type | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 155. WorkflowInstance — Процесс

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.Workflow.WorkflowInstance
- **DisplayName (Ru)**: Процесс
- **DisplayName (En)**: Process
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Finished | DateOnly | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Entity | WorkflowEntity [Entity] | Нет |  |  |  |
| Initiator | User [Entity] | Нет |  |  |  |
| WorkflowDeclaration | Navigation | Нет |  |  |  |

---

## 156. WorkflowTask — Задание воркфлоу

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.Workflow.WorkflowTask
- **DisplayName (Ru)**: Задание воркфлоу
- **DisplayName (En)**: Workflow task
- **Description**: None
- **Lifecycle**: Да | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| StateEntered | DateOnly | Нет | Да | Нет |  |  |  |  |
| WorkflowActionLabel | String | Нет | Нет | Нет |  |  |  |  |
| ResolutionComment | Text | Нет | Нет | Нет |  |  |  |  |
| Performed | DateTime | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| State | Navigation | Нет |  |  |  |
| Assigned | User [Entity] | Нет |  |  |  |
| Performer | User [Entity] | Нет |  |  |  |
| RealPerformer | User [Entity] | Нет |  |  |  |
| Entity | WorkflowEntity [Entity] | Нет |  |  |  |
| WorkflowInstance | Navigation | Нет |  |  |  |

---

## 157. WorkflowTaskEntity — WorkflowTaskEntity

- **FullName**: Timetta.Domain.Aggregates.Entities.Lifecycle.Workflow.WorkflowTaskEntity
- **DisplayName (Ru)**: WorkflowTaskEntity
- **DisplayName (En)**: WorkflowTaskEntity
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| Type | String | Нет | Нет | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |

---

## 158. UserCostValue — UserCostValue

- **FullName**: Timetta.Domain.Aggregates.Entities.UserCostValue
- **DisplayName (Ru)**: UserCostValue
- **DisplayName (En)**: UserCostValue
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| EffectiveDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| ExpiryDate | DateOnly | Нет | Нет | Нет |  |  |  |  |
| Value | Decimal | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Currency | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 159. UserGroup — Группа пользователей

- **FullName**: Timetta.Domain.Aggregates.Entities.UserGroup
- **DisplayName (Ru)**: Группа пользователей
- **DisplayName (En)**: User group
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Group | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 160. UserPermissionSet — UserPermissionSet

- **FullName**: Timetta.Domain.Aggregates.Entities.UserPermissionSet
- **DisplayName (Ru)**: UserPermissionSet
- **DisplayName (En)**: UserPermissionSet
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| PermissionSet | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 161. UserSchedule — UserSchedule

- **FullName**: Timetta.Domain.Aggregates.Entities.UserSchedule
- **DisplayName (Ru)**: UserSchedule
- **DisplayName (En)**: UserSchedule
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Schedule | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 162. UserRole — UserRole

- **FullName**: Timetta.Domain.Aggregates.Entities.UserRole
- **DisplayName (Ru)**: UserRole
- **DisplayName (En)**: UserRole
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Role | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 163. UserSkill — UserSkill

- **FullName**: Timetta.Domain.Aggregates.Entities.UserSkill
- **DisplayName (Ru)**: UserSkill
- **DisplayName (En)**: UserSkill
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Skill | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 164. UserRoleCompetence — UserRoleCompetence

- **FullName**: Timetta.Domain.Aggregates.Entities.UserRoleCompetence
- **DisplayName (Ru)**: UserRoleCompetence
- **DisplayName (En)**: UserRoleCompetence
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Competence | Navigation | Нет |  |  |  |
| UserRole | Navigation | Нет |  |  |  |

---

## 165. UserActivity — UserActivity

- **FullName**: Timetta.Domain.Aggregates.Entities.UserActivity
- **DisplayName (Ru)**: UserActivity
- **DisplayName (En)**: UserActivity
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| Activity | Navigation | Нет |  |  |  |
| User | User [Entity] | Нет |  |  |  |

---

## 166. UserProduct — UserProduct

- **FullName**: Timetta.Domain.Aggregates.Entities.UserProduct
- **DisplayName (Ru)**: UserProduct
- **DisplayName (En)**: UserProduct
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Product | Enum | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| User | User [Entity] | Нет |  |  |  |

---

## 167. Sprint — Спринт

- **FullName**: Timetta.Domain.Aggregates.Entities.Sprint
- **DisplayName (Ru)**: Спринт
- **DisplayName (En)**: Sprint
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Id | String | Нет | Да | Нет |  |  |  |  |
| Created | DateTime | Нет | Нет | Нет |  |  |  |  |
| Modified | DateTime | Нет | Нет | Нет |  |  |  |  |
| IsActive | Boolean | Нет | Да | Нет |  |  |  |  |
| Name | String | Нет | Да | Нет | 255 |  |  |  |
| StartDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| EndDate | DateOnly | Нет | Да | Нет |  |  |  |  |
| Period | Enum | Нет | Да | Нет |  |  |  |  |
| IsCurrent | Boolean | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

| Имя | Тип (Entity) | Collection | FK поля | Partner | Описание |
|-----|---------------|-----------|---------|---------|----------|
| CreatedBy | User [Entity] | Нет |  |  |  |
| ModifiedBy | User [Entity] | Нет |  |  |  |
| View | Navigation | Нет |  |  |  |

---

## 168. ReportTypeV2 — ReportTypeV2

- **FullName**: Timetta.Domain.Aggregates.Entities.ReportTypeV2
- **DisplayName (Ru)**: ReportTypeV2
- **DisplayName (En)**: ReportTypeV2
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 169. InteractionType — Тип взаимодействия

- **FullName**: Timetta.Domain.Aggregates.Entities.InteractionType
- **DisplayName (Ru)**: Тип взаимодействия
- **DisplayName (En)**: Interaction type
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 170. AccountingEntryMode — AccountingEntryMode

- **FullName**: Timetta.Domain.Aggregates.Entities.AccountingEntryMode
- **DisplayName (Ru)**: AccountingEntryMode
- **DisplayName (En)**: AccountingEntryMode
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 171. FinancialAccountType — FinancialAccountType

- **FullName**: Timetta.Domain.Aggregates.Entities.FinancialAccountType
- **DisplayName (Ru)**: FinancialAccountType
- **DisplayName (En)**: FinancialAccountType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 172. PortfolioContentItemType — Тип элемента портфеля

- **FullName**: Timetta.Domain.Aggregates.Entities.PortfolioContentItemType
- **DisplayName (Ru)**: Тип элемента портфеля
- **DisplayName (En)**: Portfolio content item type
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 173. ProjectBillingType — Тип биллинга проекта

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectBillingType
- **DisplayName (Ru)**: Тип биллинга проекта
- **DisplayName (En)**: Project billing type
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 174. RiskRequestType — RiskRequestType

- **FullName**: Timetta.Domain.Aggregates.Entities.RiskRequestType
- **DisplayName (Ru)**: RiskRequestType
- **DisplayName (En)**: RiskRequestType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 175. ProjectTaskCategory — ProjectTaskCategory

- **FullName**: Timetta.Domain.Aggregates.Entities.ProjectTaskCategory
- **DisplayName (Ru)**: ProjectTaskCategory
- **DisplayName (En)**: ProjectTaskCategory
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 176. ImportState — ImportState

- **FullName**: Timetta.Domain.Aggregates.Entities.ImportState
- **DisplayName (Ru)**: ImportState
- **DisplayName (En)**: ImportState
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 177. RateMatrixType — RateMatrixType

- **FullName**: Timetta.Domain.Aggregates.Entities.RateMatrixType
- **DisplayName (Ru)**: RateMatrixType
- **DisplayName (En)**: RateMatrixType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 178. TimeOffTypeUnit — Единица учета

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeOffTypeUnit
- **DisplayName (Ru)**: Единица учета
- **DisplayName (En)**: Unit
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 179. TimeSheetPeriodScope — TimeSheetPeriodScope

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetPeriodScope
- **DisplayName (Ru)**: TimeSheetPeriodScope
- **DisplayName (En)**: TimeSheetPeriodScope
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 180. TimeSheetPeriodType — TimeSheetPeriodType

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeSheetPeriodType
- **DisplayName (Ru)**: TimeSheetPeriodType
- **DisplayName (En)**: TimeSheetPeriodType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 181. ValidationRuleType — ValidationRuleType

- **FullName**: Timetta.Domain.Aggregates.Entities.ValidationRuleType
- **DisplayName (Ru)**: ValidationRuleType
- **DisplayName (En)**: ValidationRuleType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 182. BillingReportLineType — BillingReportLineType

- **FullName**: Timetta.Domain.Aggregates.Entities.BillingReportLineType
- **DisplayName (Ru)**: BillingReportLineType
- **DisplayName (En)**: BillingReportLineType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 183. FinanceReportLineType — FinanceReportLineType

- **FullName**: Timetta.Domain.Aggregates.Entities.FinanceReportLineType
- **DisplayName (Ru)**: FinanceReportLineType
- **DisplayName (En)**: FinanceReportLineType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 184. InvoiceLineReportLineType — InvoiceLineReportLineType

- **FullName**: Timetta.Domain.Aggregates.Entities.InvoiceLineReportLineType
- **DisplayName (Ru)**: InvoiceLineReportLineType
- **DisplayName (En)**: InvoiceLineReportLineType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 185. TimeOffBalanceEntryMode — TimeOffBalanceEntryMode

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeOffBalanceEntryMode
- **DisplayName (Ru)**: TimeOffBalanceEntryMode
- **DisplayName (En)**: TimeOffBalanceEntryMode
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---

## 186. TimeOffBalanceEntryType — TimeOffBalanceEntryType

- **FullName**: Timetta.Domain.Aggregates.Entities.TimeOffBalanceEntryType
- **DisplayName (Ru)**: TimeOffBalanceEntryType
- **DisplayName (En)**: TimeOffBalanceEntryType
- **Description**: None
- **Lifecycle**: Нет | kindType: None | kindProperty: None
- **Hierarchy**: None
- **Customizable**: Нет
- **Searchable**: Нет
- **HasPeriod**: Нет
- **TotalProperty**: None
- **WorkflowTaskProperty**: None
- **WorkflowInstanceProperty**: None

### Поля (Primitive Properties)

| Имя | Тип | PK | Required | Unique | MaxLength | MinLength | DefaultValue | Описание |
|-----|-----|----|----------|--------|-----------|-----------|--------------|----------|
| Name | String | Нет | Да | Нет |  |  |  |  |
| Code | String | Нет | Да | Нет |  |  |  |  |

### Связи (Navigation Properties)

_Нет навигационных свойств_

---
