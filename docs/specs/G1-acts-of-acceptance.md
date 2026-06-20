# G1 — Акты выполненных работ (Acts of Acceptance)

**Дата:** 2026-06-21
**Проверено:** $metadata (74 поля, 23 связи) + документация (lifecycle)

---

## Модель данных

### ActOfAcceptance (Акт) — 74 поля
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| id | Guid | да | PK |
| code | String | да | Номер акта (автонумерация) |
| name | String | да | Наименование |
| number | String | да | Номер |
| date | Date | нет | Дата акта |
| dateOfAcceptance | Date | да | Дата приёмки |
| amount | Decimal | нет | Сумма (валюта проекта) |
| amountBC | Decimal | нет | Сумма в базовой валюте |
| description | String | да | Описание |
| projectId | Guid | да | → Project |
| stateId | Guid | да | → LifecycleState |
| createdById | Guid | да | → User |
| modifiedById | Guid | да | → User |
| isActive | Boolean | нет | Активен |
| rowVersion | Int64 | нет | Оптимистичная блокировка |

**Кастомные поля:** 15×stringValue, 5×decimalValue, 5×integerValue, 5×booleanValue, 15×lookupValue, 5×userValue, 5×dateValue, 1×directorySetValue

**Связи:** lines → ActOfAcceptanceLine[], createdBy → User, modifiedBy → User, + 15 lookupValue → DirectoryEntry, + 5 userValue → User

### ActOfAcceptanceLine (Строка акта) — 11 полей
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| id | Guid | нет | PK |
| actOfAcceptanceId | Guid | да | → ActOfAcceptance |
| accountId | Guid | нет | → FinancialAccount (статья) |
| projectTaskId | Guid | да | → ProjectTask (работа) |
| amount | Decimal | нет | Сумма |
| amountBC | Decimal | нет | В базовой валюте |
| exchangeRate | Decimal | нет | Курс валюты |
| description | String | да | Описание |

---

## Жизненный цикл

### Состояния
```
Черновик → На согласовании → Согласовано → Признан
   ↓            ↓                ↓
   └────────────┴─── Отменён ←───┘
```

| Состояние | Тип |
|-----------|-----|
| Черновик | Редактируемое |
| На согласовании | Промежуточное |
| Согласовано | Конечное |
| Признан | Системное (создана проводка) |
| Отменён | Конечное |

### Переходы
| Переход | Инициатор |
|---------|-----------|
| Черновик → На согласовании | Пользователь с правом |
| На согласовании → Согласовано | Последний согласующий |
| На согласовании → Черновик | Автор/админ (отмена) |
| Согласовано → Признан | Пользователь с правом «Признать» |
| Признан → Отменён | Админ |
| Согласовано → Отменён | Админ/автор |

### Роли переходов: Все, Автор, Менеджер проекта, Руководитель автора, Менеджер клиента, Менеджер программы, Со-менеджеры

---

## Связь с таймшитами

- Акт агрегирует данные из **нескольких** согласованных таймшитов (не 1:1)
- Включаются только таймшиты в состоянии «Согласовано»
- Период акта = диапазон дат включённых таймшитов
- Валюта акта наследуется от проекта
- Акт возможен только для проектов с типом «Фиксированная цена» или «Время и затраты»

### Поля, копируемые/агрегируемые из таймшитов
| Поле акта | Источник |
|-----------|----------|
| Период | TimeSheet.period |
| Работы | TimeSheetLine.projectTask |
| Часы | TimeAllocation.hours (сумма) |
| Ресурсы | TimeSheet.user |
| Роли | TimeAllocation.role |
| Дата | TimeAllocation.date |

---

## API (из Postman-коллекции)

```
POST   /odata/ActsOfAcceptance          — создать акт
GET    /odata/ActsOfAcceptance(id)       — получить
PUT    /odata/ActsOfAcceptance(id)       — обновить
PATCH  /odata/ActsOfAcceptance(id)       — частичное обновление
DELETE /odata/ActsOfAcceptance(id)       — удалить (только Черновик)
GET    /odata/ActsOfAcceptance           — запрос списка
POST   /odata/ActsOfAcceptance(id)/SetState — смена состояния
POST   /odata/ActsOfAcceptance(id)/SetState (с доп. свойствами)
GET    /odata/Comments                   — комментарии
POST   /odata/Comments                   — добавить комментарий
```

---

## Act → Invoice (процесс)

- **НЕ автоматический.** Только ручное создание.
- Триггеры: меню Финансы → Счета, вкладка Выручка проекта, карточка Акта → «Создать счёт»
- Акт — источник данных для Счёта (агрегирует согласованные часы)
- После признания Акта → менеджер создаёт Счёт на его основе

## FinancialAccount (План счетов)

- 68 полей (60 кастомных), 23 связи
- Ключевые: code, name, description, typeId → FinancialAccountType, isSystem, includedInBalance
- **Иерархический** (parent reference → дерево)
- Типы: Выручка, Себестоимость, Затраты, Прочее
- Статьи **не хранят баланс** — это аналитика для проводок
- Баланс вычисляется динамически из AccountingEntry
- Валюта на статью (мультивалютность)
- isActive для софт-удаления

## ResourcePool (из $metadata)

- 12 полей: managerId, leadResourcePoolId (self-ref → иерархия!), isDefault
- leadResourcePoolId позволяет строить дерево пулов
- 5 связей: manager → User, leadResourcePool → self, coManagers, createdBy, modifiedBy

## BookingEntry (из $metadata)

- 19 полей: from/to (dates), type (BookingType enum: soft/hard), bookedHours, requiredHours, requiredSchedulePercent, planningMethod
- resourceId, projectId, resourceRequestId
- detailEntries → BookingDetailEntry[]
- changeEntries → ResourceRequestChangeEntry[]
