# Timetta — Целевая модель для воспроизведения

**Дата:** 2026-06-20
**Тенант:** Кредо-С (trial), tenantId: `0e48e292-81b9-49a1-8015-5885045a8971`
**Источник:** Black-box reverse engineering (API + UI + OData $metadata)

---

## Оглавление
1. [Ядро: TimeSheet → TimeAllocation](#1-ядро-timesheet--timeallocation)
2. [Проектный учёт](#2-проектный-учёт)
3. [Ресурсная модель](#3-ресурсная-модель)
4. [Финансовая модель](#4-финансовая-модель)
5. [Жизненные циклы (State Machines)](#5-жизненные-циклы-state-machines)
6. [Справочники (Reference Data)](#6-справочники-reference-data)
7. [Модель прав и ролей](#7-модель-прав-и-ролей)
8. [Интеграции](#8-интеграции)
9. [AI-подсистема](#9-ai-подсистема)
10. [Форматы и конвенции](#10-форматы-и-конвенции)
11. [Файлы-доказательства](#11-файлы-доказательства)

---

## 1. Ядро: TimeSheet → TimeAllocation

### Схема
```
TimeSheet (1) ──→ (N) TimeSheetLine ──→ (N) TimeAllocation
     │                    │                      │
     │                    ├── Project            ├── Project  
     │                    ├── ProjectTask        ├── ProjectTask
     │                    ├── ProjectCostCenter  ├── ProjectCostCenter
     │                    ├── ProjectTariff      ├── ProjectTariff
     │                    ├── Activity           ├── Activity
     │                    ├── Role               ├── Role
     │                    └── BillCode           ├── BillCode
     │                                           ├── Issue (опционально)
     ├── Template                                ├── TimeOffRequest (опционально)
     ├── User                                    ├── isBillable: Boolean
     ├── LegalEntity                             ├── stopwatchStarted: DateTime?
     ├── State (Draft→Submitted→Approved)        └── description: Text
     ├── Department
     ├── TimeOffRequests[]
     └── Schedule (weekly hours plan)
```

### TimeSheet (Таймшит)
| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | PK |
| name | String | Авто: `{user} {dateFrom}-{dateTo}` |
| dateFrom | Date | Начало периода |
| dateTo | Date | Конец периода |
| dueDate | Date | Крайний срок отправки |
| userId | GUID → User | Владелец |
| departmentId | GUID → Department | Подразделение |
| legalEntityId | GUID → LegalEntity | Юрлицо |
| templateId | GUID → TimesheetTemplate | Шаблон |
| stateId | GUID → LifeCycleState | Статус (Draft/Submitted/Approved/Rejected) |
| billableDuration | Decimal | Оплачиваемые часы |
| nonBillableDuration | Decimal | Неоплачиваемые часы |
| schedule | DateHours[] | План по дням (напр. 8ч × 5 дней) |
| editAllowed | Boolean | Можно редактировать? |
| deleteAllowed | Boolean | Можно удалить? |

### TimeSheetLine (Строка таймшита)
Группирует трудозатраты по связке **Клиент→Проект→Работа→Тариф**.

| Поле | Тип |
|------|------|
| id | GUID |
| orderNumber | Int |
| projectId | GUID → Project |
| projectTaskId | GUID → ProjectTask |
| projectCostCenterId | GUID → ProjectCostCenter |
| projectTariffId | GUID? → ProjectTariff |
| activityId | GUID → Activity |
| roleId | GUID → Role |
| billCodeId | GUID? → BillCode |
| rowVersion | Int (оптимистичная блокировка) |

### TimeAllocation (Распределение часов)
Одна запись = часы за конкретный день.

| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | PK |
| date | Date | Дата |
| hours | Decimal | Часы (decimal, не HH:MM) |
| description | Text | Комментарий |
| timeSheetLineId | GUID → TimeSheetLine | Строка |
| timeOffRequestId | GUID? → TimeOffRequest | Если это отсутствие |
| issueId | GUID? → Issue | Связанная задача |
| projectId | GUID → Project | Проект |
| projectTaskId | GUID → ProjectTask | Работа |
| projectCostCenterId | GUID? → ProjectCostCenter | ЦФО |
| projectTariffId | GUID? → ProjectTariff | Тариф |
| activityId | GUID → Activity | Вид работ |
| roleId | GUID → Role | Роль |
| billCodeId | GUID? → BillCode | Код оплаты |
| isBillable | Boolean | Оплачиваемое? |
| stopwatchStarted | DateTime? | Секундомер запущен |
| rowVersion | Int | Оптимистичная блокировка |

### Ключевое правило целостности
**TimeSheetLine.ProjectId определяет организацию (клиента)** через Project.OrganizationId.
TimeAllocation наследует проект от строки, но может переопределить (issue может быть из другого проекта).

---

## 2. Проектный учёт

### Иерархия
```
Organization (Клиент)
  └── Project (Проект)
        ├── BillingType: TM (Time&Materials) / FP (FixedPrice)
        ├── Manager: User
        ├── State: Draft→InProgress→Completed→Archived
        ├── Program (Программа) — группировка проектов
        ├── Portfolio (Портфель) — группировка программ
        │
        ├── ProjectTask (Работа/задача проекта)
        │     ├── leadTaskId — иерархия задач
        │     └── используется в TimeSheetLine/TimeAllocation
        │
        ├── ProjectCostCenter (Центр затрат/ЦФО)
        │     └── используется в TimeSheetLine
        │
        ├── ProjectTariff (Тариф проекта)
        │     └── связывает работу с ролью и ставкой
        │
        ├── Checkpoint (Контрольная точка)
        │     ├── State: Draft→Submitted→Approved
        │     ├── Date, Type, Level, Forecast
        │     └── Родительские/дочерние связи
        │
        ├── Risk (Риск)
        ├── ProjectArtifact (Документ)
        ├── Contract (Договор)
        └── ProjectVersion (Версия/ Baseline)
```

### Project (Проект)
| Поле | Тип |
|------|------|
| id | GUID |
| name | String |
| code | String (авто по NumberingPolicy: CON-24-2026) |
| organizationId | GUID → Organization |
| billingTypeId | GUID → ProjectBillingType |
| managerId | GUID → User |
| stateId | GUID → LifeCycleState |
| programId | GUID? → Program |
| portfolioId | GUID? → Portfolio |
| startDate | Date |
| endDate | Date |
| description | Text |

### ProjectTask (Работа)
| Поле | Тип |
|------|------|
| id | GUID |
| name | String |
| projectId | GUID → Project |
| leadTaskId | GUID? → ProjectTask (родитель) |
| orderNumber | Int |

### Checkpoint (Контрольная точка)
| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | |
| crossId | String | Сквозной ID для связи родитель-потомок |
| name | String | |
| type | Directory: CheckpointType | |
| level | Directory: CheckpointLevel | |
| forecast | Directory: CheckpointForecast | |
| date | Date | Плановая дата |
| factDate | Date? | Фактическая дата |
| projectId | GUID → Project | |
| parentCheckpointId | GUID? → Checkpoint | |
| stateId | GUID → LifeCycleState | |

---

## 3. Ресурсная модель

### Структура
```
User (Сотрудник)
  ├── department: Department
  ├── roles: UserRole[]
  ├── level: Level (L1-L6)
  ├── grade: Grade
  ├── location: Location
  ├── competences: Competence[]
  ├── skills: Skill[]
  ├── resourcePool: ResourcePool
  └── schedule: Schedule (часы в неделю)

ResourceRequest (Запрос ресурсов)
  ├── State: Draft→Open→Completed/Cancelled/Rejected
  ├── role, level, location
  ├── projectId, projectTaskId
  ├── dates, hours
  └── assignedUserId?

BookingEntry (Бронирование)
  ├── userId → User
  ├── projectId → Project
  ├── projectTaskId → ProjectTask
  ├── dateFrom, dateTo
  ├── hours, description
  └── isActive
```

### Level (Должностной уровень)
6 уровней: L1 Стажер, L2 Младший специалист, L3 Специалист, L4 Старший специалист, L5 Менеджер, L6 Руководитель

### Role (Роль на проекте)
8 ролей: Архитектор (ARCH), Программист (PROGR), Юрист (JUR), Партнер (PARTNER), Исполнитель (DEFAULT), Консультант (CONS), Аудитор (AUDITOR), Руководитель проектов (PM)

### Skill (Навык)
9 навыков: Разработка, Бизнес-анализ, Управление проектом, Консультирование CRM, Обучение, Интервьюирование, Бизнес переговоры, SEO/SEM Маркетинг, Местное законодательство

### Schedule (Расписание)
2 шаблона: 40 часов в неделю (по умолчанию), 56 часов в неделю
Хранит weeklyHours: массив дней с часами

---

## 4. Финансовая модель

### RateMatrix (Матрица ставок)
Два типа:
1. **Ставки биллинга** (Billing Rates) — сколько клиент платит
2. **Ставки себестоимости** (Cost Rates) — сколько сотрудник стоит

Жизненный цикл: Draft → Active → Archived

Матрица — это таблица: Роль × Уровень × Локация × ... = Ставка (за час)

### FinancialAccount (Учётная статья/код)
12 статей:
- **Доходы:** Revenue (Выручка)
- **Прямые затраты:** DirectLabor (Себестоимость труда), SubcontractorLaborCost (Себестоимость труда субподрядчика), TimeOffCost (Себестоимость отсутствий)
- **Расходы:** MTRL (Материалы), CNTR (Субподрядчики), TRVL (Командировочные), TRNS (Транспорт), ENTRT (Представительские), RISK (Риски)
- **Налоги/капитал:** CorporateTax, CapitalCharge

### Invoice (Счёт)
| Поле | Тип |
|------|------|
| id | GUID |
| code | String (автонумерация) |
| amount | Decimal |
| vatRateId | GUID → VatRate |
| currencyId | GUID → Currency |
| legalEntityId | GUID → LegalEntity |
| organizationId | GUID → Organization |
| projectId | GUID → Project |
| stateId | GUID → LifeCycleState (Draft→Issued→Paid/Void) |

### ActOfAcceptance (Акт)
| Поле | Тип |
|------|------|
| id | GUID |
| code | String |
| amount | Decimal |
| date, dateOfAcceptance | Date |
| projectId | GUID → Project |
| organizationId | GUID → Organization |
| stateId | GUID → LifeCycleState (Draft→Issued→ApprovedByClient→Recognized/Cancelled) |

Строки акта (ActOfAcceptanceLine): Account → ProjectTask, Amount, ExchangeRate

### AccountingEntry (Проводка)
Связывает всё вместе: Date, Amount, Hours, Project, ProjectTask, LegalEntity, FinancialAccount, DocumentDescription

### Валюта
6 валют: RUB (базовая), USD, EUR, GBP, CAD, MXN

### Ставки НДС
9 ставок: 0%, 5%, 10%, 12%, 16%, 18%, 20%, 22%, Не облагается

---

## 5. Жизненные циклы (State Machines)

### Общий паттерн
Все LC имеют структуру: State(code, name, style, isInitial, isFinal)
Styles: secondary (серый), warning (жёлтый), info (синий), primary (фиолетовый), success (зелёный), danger (красный), light (светлый)

### TimeSheet
```
Draft (Черновик) → Submitted (На согласовании) → Approved (Согласовано)
                       ↓
                    Rejected (Отклонено) → Draft
```

### Project
```
Draft → InProgress (В работе) → Completed (Завершен)
  ↓         ↓                       ↓
Deferred  Cancelled             Archived
(Отложен) (Отменен)           (Архивирован)
```

### Deal (Сделка/воронка продаж)
```
NEW (Новая) → QUALIFICATION (Квалификация) → NEGOTIATION (Переговоры) → WON (Выиграно)
                                              ↓
                                           LOST (Проиграно)
```

### Issue (Задача)
```
OPEN (Открыта) → IN_PROGRESS (В работе) → READY_TO_TESTING (Готово к тестированию) → TESTING (Тестируется) → CLOSED (Закрыта)
```

### ExpenseRequest / TimeOffRequest
```
Draft → Submitted → Approved
          ↓
       Rejected → Draft
```

### ResourceRequest
```
Draft → Open → Completed
          ↓         ↓
       Rejected  Cancelled
```

### ActOfAcceptance
```
Draft → Issued → ApprovedByClient → Recognized
                     ↓
                  Cancelled
```

### Invoice
```
Draft → Issued → Paid
          ↓
        Void (Аннулирован)
```

### Contract
```
Draft → Active → Ended
```

### Checkpoint
```
Draft → Submitted → Approved
```

---

## 6. Справочники (Reference Data)

### Activities (Виды работ) — 9
Подготовка орг. документов, Программирование, Перемещения, Аудит, Взаимодействие с коллегами, Бизнес-анализ, Консалтинг, Обучение клиентов, Взаимодействие с клиентами

### TimeOffTypes (Типы отсутствий) — 5
| Код | Название |
|-----|----------|
| П | Ежегодный отпуск |
| БО | Отпуск за свой счет |
| Д | Декретный отпуск |
| У | Учебный отпуск |
| Б | Больничный |

### ValidationRules (Правила валидации таймшитов) — 2
1. День +/- 2 часа от расписания
2. Рабочий день до 24 часов

### IssueLinkTypes (Типы связей задач) — 10
Влияние, Тестирование, Причина, Блокировка, Дублирование, Исправление, Последовательность, Связь, Реализация, Зависимость

### Directories (Настраиваемые справочники) — 15
| Код | Назначение |
|-----|------------|
| ContactRole | Роли контактов |
| DealType | Тип сделки |
| CheckpointType | Типы контрольной точки |
| IssueResolution | Резолюции задач |
| EmploymentType | Типы трудоустройства |
| CheckpointForecast | Прогноз КТ |
| IssueTypes | Типы задач |
| OrganizationRelationTypes | Типы связей организаций |
| CheckpointLevel | Уровни КТ |
| TrafficLight | Светофор |
| ProjectStage | Этапы проекта |
| IssuePriority | Приоритеты задач |
| IssueTags | Теги задач |
| DealSource | Источники сделок |
| DealResolution | Резолюции сделок |

### Departments (Подразделения) — 11
Юридических услуг (LEGAL), ИТ (IT), Персонала (HR), Бизнес-образования (EDUCATION), ИТ услуг (DEPIT), Финансовый (FIN), Кредо-С (ALL), Оценочных услуг (ASSESSMENT), Корпоративного аудита (AUDIT), Администрация (ADM), Коммерческий (SALES)

### Locations (Локации) — 3
Москва (центральный офис), СПб (рег. офис), Будапешт (представительство)

### NumberingPolicies — 11 сущностей с автонумерацией
Проект, Задача, Проводка, Контрольная точка, Счёт, Баланс отсутствий, Акт, Договор, Сделка, Входящий акт, Организация

### Reports (Отчёты) — 18 шаблонов
- Список проектов в работе
- Задачи проектов
- Часы проектов по месяцам
- Часы сотрудников по месяцам
- Показатели сотрудников за месяц
- Ресурсный план
- Рентабельность проектов
- Утилизация сотрудников по месяцам
- Список заявок на отсутствия

### Dashboards — 2
Обзор команды, Обзор Аудит Сибура

---

## 7. Модель прав и ролей

### PermissionSets (Наборы прав) — 9
| Набор | Описание |
|-------|----------|
| Системный администратор | Настройка и обслуживание |
| Администратор проектов | Все проекты |
| Менеджер проектов | Управление проектами и задачами |
| Менеджер клиентов | — |
| Ресурсный менеджер | Загрузка, распределение |
| Финансовый менеджер | — |
| Менеджер по кадрам | Таймшиты, отсутствия |
| Руководитель | Линейный руководитель |
| Пользователь | Базовый доступ |

### System Roles (назначаются пользователю)
7 ролей: TeamManager, ClientManager, ResourceManager, User, ProjectManager, Administrator, FinanceManager

### EntitiesAccess (202 типа сущностей)
Каждая сущность имеет: editAllowed, viewAllowed, deleteAllowed

### Permissions (309 разрешений)
Детальные права на каждую операцию с каждой сущностью.

---

## 8. Интеграции

### GitLab
- **Настройка:** Settings → Задачи → GitLab репозитории
- **Функционал:** привязка репозитория, связь задач с MR/Issues
- **На стенде:** не настроено (0 репозиториев)

### 1С
- **Страница:** `/product/1c-integration`
- **API:** OData V4 для обмена данными (юрлица, счета, акты, проводки)

### OData API
- **Протокол:** OData V4 REST
- **Аутентификация:** OAuth 2.0 (login/password → access_token + refresh_token)
- **Форматы:** JSON, $select, $expand, $filter, $orderby, $top, $skip, $apply
- **$metadata:** 1MB XML со схемой всех 186 сущностей
- **Endpoint:** `https://api.timetta.com/odata/{Entity}`

### Reporting API
- Для BI-систем (Power BI, Tableau и т.д.)
- OData-совместимый

### AI Bot API
- `ai-bot.timetta.com` — iframe-виджет
- `ai-api.timetta.com` — AI API
- `api.timetta.com` — основной API
- Настройки: контекстные схемы, промпты, агенты
- Поддерживает: mode, text, context, llm, temperature

---

## 9. AI-подсистема

### Архитектура
```
AiContextSchema (Модель контекста)
  └── определяет, какие данные сущности доступны AI

AiPrompt (Запрос к ИИ)
  ├── привязан к AiContextSchema
  ├── содержит system prompt + user prompt template
  └── привязан к типу сущности (Проект, Задача, Сделка)

Agent (Агент)
  ├── использует промпты + контекстные схемы
  ├── может запускаться по расписанию
  └── AgentRun — запись о выполнении
```

### AiPrompts (10 шт.)
- Проекты: статус-отчет, паспорт проекта, здоровье проекта
- Задачи: риски и блокеры, план действий, таблица с описанием
- Сделки: таблица по воронке, следующий контакт, риски закрытия
- Расширенный отчёт

### AiContextSchemas (4 шт.)
- Основные сведения о проекте
- Основные сведения о задаче
- Основные сведения о сделке
- Расширенный статус

### Агенты (1 шт.)
- **Агент планирования** (Planning Agent)

---

## 10. Форматы и конвенции

### Идентификаторы
- Все первичные ключи: GUID (UUID v4)
- Пользователи: email как логин (vs@credos.ru)
- Проекты: `{PREFIX}-{NN}-{YYYY}` (CON-24-2026, SUP-02-2026, IMP-01-2026, DEV-01-SOFT, ARCH-PR-2026, AUD-02-2026, ADM-2026)
- Организации: `{PREFIX}` (ORG-1, SKS, RGN, KASP, ENRB, MRZ)

### Время
- Часы: Decimal (не HH:MM). 2.5 = 2 часа 30 минут
- Таймшиты: недельные периоды (Пн-Вс), срок отправки: Вт следующей недели
- Часовой пояс: Europe/Moscow
- TimeInputType: Decimal (альтернатива: HH:MM)
- useStopwatch: True (встроенный секундомер)

### Деньги
- Базовая валюта: RUB
- Ставки: за час работы
- Все суммы: Decimal
- Поддерживается мультивалютность

### Даты
- Формат: ISO 8601 (2026-06-20T21:30:58.501852Z)
- DateOnly для дат без времени

### Статусы (LifeCycle States)
Префиксы кодов: Draft/Open/New — начальные, InProgress/Submitted/Issued/Active — активные, Approved/Completed/WON/Recognized/Closed/Paid — конечные позитивные, Rejected/Cancelled/LOST/Void/Archived — конечные негативные/закрывающие

### Оптимистичная блокировка
- rowVersion (int) на изменяемых сущностях (TimeSheetLine, TimeAllocation)

---

## 11. Файлы-доказательства

### Сырые дампы API (>50 JSON-файлов)
| Группа | Файлы |
|--------|-------|
| **Ядро** | `raw-timesheet-full.json` (25KB, полный таймшит со всеми $expand) |
| **Сессия** | `raw-session.json` (1.2MB, конфигурация тенанта) |
| **Метаданные** | `raw-odata-metadata.xml` (1MB, полная OData-схема) |
| **Справочники** | `raw-odata-Activities.json` ... `raw-odata-VatRates.json` |
| **Метамодель** | `metamodel-full.txt` (186 сущностей с полями) |
| **Жизненные циклы** | `raw-odata-LifeCycles-expand.json` (133KB, 18 LC с состояниями) |
| **Скриншоты** | 15 PNG: landing, pricing, app (timesheet, projects, clients, settings × 6) |

### Полный список файлов (87 шт., 16MB)
См. `RECON.md` Section 12 + все `raw-odata-*.json` в папке.

---

## Резюме: как воспроизвести

### Минимальный набор сущностей для учёта времени:
1. **Organization** (клиент)
2. **Project** (с BillingType TM/FP, Manager, State)
3. **ProjectTask** (иерархическая, leadTaskId)
4. **Activity** (вид работ)
5. **Role** (роль исполнителя)
6. **Schedule** (40ч/нед с планом по дням)
7. **TimesheetPeriod** (недельный, область: вся система)
8. **TimesheetTemplate** (какие колонки показывать)
9. **TimeSheet** (dateFrom, dateTo, userId, stateId, schedule)
10. **TimeSheetLine** (projectId, projectTaskId, activityId, roleId)
11. **TimeAllocation** (date, hours, description, isBillable)

### Для финансового учёта добавить:
12. **LegalEntity** (юрлицо)
13. **RateMatrix** + **RateMatrixEntry** (ставки биллинга и себестоимости)
14. **FinancialAccount** (учётные статьи)
15. **Currency** + **VatRate**
16. **AccountingEntry** (проводки)

### Для управления ресурсами:
17. **User** + **Department** + **Level** + **Location**
18. **ResourcePool** + **BookingEntry**
19. **ResourceRequest** (запросы на подбор)

### Ключевые архитектурные решения Timetta:
- **GUID для всех PK** (не serial int)
- **Decimal для часов и денег** (не INT/float)
- **LifeCycle + State как отдельные сущности** (не enum в таблице)
- **TimeSheet → TimeSheetLine → TimeAllocation** (три уровня)
- **ProjectTask как иерархический справочник внутри проекта**
- **rowVersion для оптимистичной блокировки**
- **OData V4 как единый API-протокол**
- **Angular SPA + OIDC (IdentityServer4)**
