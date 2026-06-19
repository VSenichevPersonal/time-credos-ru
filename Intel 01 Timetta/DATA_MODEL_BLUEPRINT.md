# Timetta — Data Model Blueprint

**Дата:** 2026-06-20 | **Тенант:** Кредо-С | **Источник:** API + $metadata + UI + OIDC
**Назначение:** Воссоздание системы учёта проектов и времени

---

## 1. АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────────┐
│                  app.timetta.com                         │
│              Angular 17+ SPA (5.5 MB main.js)            │
│  Bootstrap 5.3 + 622 CSS custom properties               │
│  Service Worker (ngsw) + i18n (287 KB ru-RU.json)       │
└──────────┬────────────────────────────┬─────────────────┘
           │ OIDC (PKCE)                │ OData V4 REST
           ▼                            ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│  auth.timetta.com    │    │     api.timetta.com          │
│  IdentityServer4     │    │  OData V4 + OAuth 2.0        │
│  RS256, 7 scopes     │    │  198 EntitySets              │
│  8 grant types       │    │  258 EntityTypes             │
└──────────────────────┘    │  861 Functions + 672 Actions │
                             │  PostgreSQL + Linux (РФ)     │
                             └─────────────────────────────┘
```

## 2. ДОМЕНЫ (7 продуктов)

| Продукт | EntitySet'ы |
|---------|-------------|
| **Projects** | Projects, ProjectTasks, ProjectTariffs, ProjectCostCenters, ProjectVersions, Programs, Portfolios, Checkpoints, ProjectRisks, ProjectArtifacts, Contracts, ProjectTeamMembers |
| **TimeTracking** | TimeSheets, TimeSheetLines, TimeAllocations, TimeOffRequests, TimeOffBalances, TimeOffTypes, ExpenseRequests, Activities, Schedules, TimesheetPeriods, ValidationRules, BillCodes |
| **Finance** | Invoices, ActsOfAcceptance, AccountingEntries, AccountingPeriods, FinancialAccounts, RateMatrices, Currencies, VatRates, LegalEntities, Contracts |
| **Resources** | ResourceRequests, BookingEntries, ResourcePools, ResourcePlanEntries, Levels, Grades, Locations, Competences, Skills, Certificates |
| **Tasks** | Issues, IssueLinks, IssueLinkTypes, Sprints, GitLabRepositories, GitLabCommits, GitLabMergeRequests, WorkflowInstances, WorkflowTasks |
| **Clients** | Organizations, Contacts, Deals, Campaigns, Interactions, EmailTemplates, InteractionScenarios, OrganizationRelations |
| **Core** | Users, Departments, Groups, PermissionSets, Roles, Views, Directories, Lifecycles, Workflows, CustomFields, WikiSpaces, Notifications, ScheduledJobs, ApiTokens |

## 3. МОДЕЛЬ ДАННЫХ — КЛЮЧЕВЫЕ СУЩНОСТИ

### 3.1 TimeSheet (Таймшит) — 101 поле, 58 связей
```
TimeSheet
├── id: GUID PK
├── name: String (авто)
├── dateFrom/dateTo: Date
├── dueDate: Date
├── userId → User
├── departmentId → Department
├── legalEntityId → LegalEntity
├── templateId → TimesheetTemplate
├── stateId → State (Draft→Submitted→Approved/Rejected)
├── billableDuration: Decimal
├── nonBillableDuration: Decimal
├── schedule: DateHours[] (план по дням)
├── editAllowed/deleteAllowed: Boolean
├── TimeSheetLines[] (N)
│   ├── orderNumber: Int
│   ├── projectId → Project
│   ├── projectTaskId → ProjectTask
│   ├── projectCostCenterId → ProjectCostCenter
│   ├── projectTariffId → ProjectTariff?
│   ├── activityId → Activity
│   ├── roleId → Role
│   ├── billCodeId → BillCode?
│   └── rowVersion: Int (опт. блокировка)
├── TimeAllocations[] (N)
│   ├── date: Date
│   ├── hours: Decimal
│   ├── description: Text
│   ├── timeSheetLineId → TimeSheetLine
│   ├── issueId → Issue?
│   ├── timeOffRequestId → TimeOffRequest?
│   ├── projectId/ProjectTaskId/... (копируются или переопределяются)
│   ├── isBillable: Boolean
│   ├── stopwatchStarted: DateTime?
│   └── rowVersion: Int
└── TimeOffRequests[]
```

### 3.2 Project (Проект) — 101 поле, 58 связей
```
Project
├── id: GUID PK
├── name: String
├── code: String (CON-24-2026)
├── organizationId → Organization
├── billingTypeId → ProjectBillingType (TM/FP)
├── managerId → User
├── stateId → State (Draft→InProgress→Completed→Archived/Cancelled/Deferred)
├── programId → Program?
├── portfolioId → ProjectPortfolio?
├── startDate/endDate: Date
├── description: Text
├── ProjectTasks[] (иерархия через leadTaskId)
│   ├── name, orderNumber
│   ├── leadTaskId → ProjectTask? (родитель)
│   └── ProjectTaskAssignments[]
├── ProjectCostCenters[] (ЦФО)
├── ProjectTariffs[] (тарифы проекта: роль→ставка)
├── Checkpoints[] (контрольные точки)
├── ProjectRisks[]
├── ProjectArtifacts[] (документы)
├── ProjectVersions[] (baseline/снапшоты)
├── ProjectTeamMembers[] (команда)
└── Contracts[]
```

### 3.3 Organization (Клиент) — 84 поля, 30 связей
```
Organization
├── id: GUID PK
├── name: String
├── code: String (ORG-1, SKS, RGN...)
├── stateId → State (Active/Closed)
├── Contacts[]
├── Deals[]
├── Interactions[]
├── CampaignEntries[]
├── OrganizationLegal[]
├── OrganizationRelations[]
├── OrganizationTariffs[]
├── OrganizationTotals
└── OrganizationBillingInfos[]
```

### 3.4 Deal (Сделка) — 79 полей, 32 связи
```
Deal
├── id: GUID PK
├── name: String
├── organizationId → Organization
├── managerId → User
├── stateId → State (NEW→QUALIFICATION→NEGOTIATION→WON/LOST)
├── amount: Decimal
├── currencyId → Currency
├── expectedCloseDate: Date
├── DealContacts[] (связь с Contacts)
├── DealEntries[] (история)
└── type/source/resolution → Directory
```

### 3.5 Issue (Задача) — 85 полей, 38 связей
```
Issue
├── id: GUID PK
├── code: String (автонумерация)
├── name: String
├── key: String (уникальный ключ)
├── projectId → Project
├── assignedToId → User
├── initiatorId → User
├── stateId → State (OPEN→IN_PROGRESS→READY_TO_TEST→TESTING→CLOSED)
├── type/priority/tags/resolution → Directory
├── sprintId → Sprint
├── IssueLinks[] (связи с другими задачами)
├── IssueFollowers[]
├── IssueCommitLinks[] → GitLabCommit
├── IssueMergeRequestLinks[] → GitLabMergeRequest
└── ProjectIssuePermissions[]
```

### 3.6 User (Сотрудник) — 84 поля, 30 связей
```
User
├── id: GUID PK
├── name: String
├── email: Email (логин)
├── departmentId → Department
├── levelId → Level
├── locationId → Location
├── resourcePoolId → ResourcePool
├── scheduleId → Schedule
├── UserRoles[] (системные роли)
├── UserSkills[] (навыки)
├── UserCostValues[] (ставки сотрудника)
├── UserPermissionSets[] (наборы прав)
├── UserProducts[] (доступные продукты)
├── Certificates[]
└── UserSubstitutes[]
```

### 3.7 Финансовый учёт
```
Invoice (Счёт) — 84 поля, 28 связей
├── code: String, amount: Decimal
├── organizationId → Organization
├── projectId → Project
├── legalEntityId → LegalEntity
├── currencyId → Currency
├── vatRateId → VatRate
├── stateId → State (Draft→Issued→Paid/Void)
└── InvoiceLines[] (N)

ActOfAcceptance (Акт) — 74 поля, 25 связей
├── code: String, amount: Decimal
├── organizationId → Organization
├── projectId → Project
├── stateId → State (Draft→Issued→ApprovedByClient→Recognized/Cancelled)
└── ActOfAcceptanceLines[] (N)

AccountingEntry (Проводка) — 29 полей, 12 связей
├── date: Date, amount: Decimal, hours: Decimal
├── projectId → Project
├── projectTaskId → ProjectTask
├── legalEntityId → LegalEntity
├── accountId → FinancialAccount
├── documentDescription: String
└── mode: AccountingEntryMode (enum)

RateMatrix (Матрица ставок) — 2 типа:
├── Ставки биллинга (Billing Rates)
└── Ставки себестоимости (Cost Rates)
RateMatrixLine: role × level × location × ... = rate (Decimal/час)
```

## 4. СПРАВОЧНИКИ (Reference Data)

### 4.1 Системные справочники (15 Directories + значения)
| Справочник | Значения |
|------------|----------|
| ContactRole | Роли контактов (0 значений на стенде) |
| DealType | Тип сделки (1 значение) |
| CheckpointType | Типы КТ (4 значения) |
| IssueResolution | Резолюции задач: Завершена, Отклонена, Дубликат |
| EmploymentType | Типы трудоустройства: Штатный, Внештатный |
| CheckpointForecast | Прогноз КТ: Зелёный, Жёлтый, Красный |
| IssueTypes | Типы задач: Ошибка, Задача, Улучшение, Эпик |
| OrganizationRelationTypes | Связи организаций (3 значения) |
| CheckpointLevel | Уровни КТ: Проект, Программа |
| TrafficLight | Светофор: 🟢🟡🔴 |
| ProjectStage | Этапы проекта (6 значений) |
| IssuePriority | Приоритеты: Высокий, Средний, Низкий |
| IssueTags | Теги (2 значения) |
| DealSource | Источники сделок (3 значения) |
| DealResolution | Резолюции сделок (3 значения) |

### 4.2 Activities (Виды работ) — 9
Подготовка орг. документов, Программирование, Перемещения, Аудит, Взаимодействие с коллегами, Бизнес-анализ, Консалтинг, Обучение клиентов, Взаимодействие с клиентами

### 4.3 Roles (Проектные роли) — 8
Архитектор (ARCH), Программист (PROGR), Юрист (JUR), Партнер (PARTNER), Исполнитель (DEFAULT), Консультант (CONS), Аудитор (AUDITOR), Руководитель проектов (PM)

### 4.4 TimeOffTypes (Типы отсутствий) — 5
Ежегодный отпуск (П), Отпуск за свой счет (БО), Декретный отпуск (Д), Учебный отпуск (У), Больничный (Б)

### 4.5 FinancialAccounts (Учётные статьи) — 12
Revenue, DirectLabor, SubcontractorLaborCost, TimeOffCost, MTRL, CNTR, TRVL, TRNS, ENTRT, RISK, CorporateTax, CapitalCharge

### 4.6 Departments (Подразделения) — 11
LEGAL, IT, HR, EDUCATION, DEPIT, FIN, ALL, ASSESSMENT, AUDIT, ADM, SALES

### 4.7 Levels (Должностные уровни) — 6
L1 Стажер → L2 Младший специалист → L3 Специалист → L4 Старший специалист → L5 Менеджер → L6 Руководитель

### 4.8 Locations (Локации) — 3
Москва (центральный офис), СПб (рег. офис), Будапешт (представительство)

### 4.9 Skills (Навыки) — 9
Разработка, Бизнес-анализ, Управление проектом, Консультирование CRM, Обучение, Интервьюирование, Бизнес переговоры, SEO/SEM Маркетинг, Местное законодательство

### 4.10 VatRates (НДС) — 9
0%, 5%, 10%, 12%, 16%, 18%, 20%, 22%, Не облагается

### 4.11 Currencies (Валюты) — 6
RUB (базовая), USD, EUR, GBP, CAD, MXN

### 4.12 Schedules (Расписания) — 2
40 часов/нед (по умолчанию), 56 часов/нед

### 4.13 ValidationRules (Правила валидации) — 2
День ±2 часа от расписания, Рабочий день до 24 часов

### 4.14 IssueLinkTypes (Типы связей задач) — 10
Влияние, Тестирование, Причина, Блокировка, Дублирование, Исправление, Последовательность, Связь, Реализация, Зависимость

## 5. ЖИЗНЕННЫЕ ЦИКЛЫ (18 Lifecycles × States)

| Сущность | Состояния |
|----------|-----------|
| **TimeSheet** | Draft → Submitted → Approved / Rejected |
| **Project** | Draft → InProgress → Completed → Archived / Cancelled / Deferred |
| **Issue** | Open → InProgress → ReadyToTesting → Testing → Closed |
| **Deal** | NEW → QUALIFICATION → NEGOTIATION → WON / LOST |
| **ExpenseRequest** | Draft → Submitted → Approved / Rejected |
| **TimeOffRequest** | Draft → Submitted → Approved / Rejected |
| **ResourceRequest** | Draft → Open → Completed / Rejected / Cancelled |
| **Organization** | Active / Closed |
| **Invoice** | Draft → Issued → Paid / Void |
| **ActOfAcceptance** | Draft → Issued → ApprovedByClient → Recognized / Cancelled |
| **Contract** | Draft → Active → Ended |
| **Checkpoint** | Draft → Submitted → Approved |
| **RateMatrix** | Draft → Active → Archived |
| **Certificate** | Draft → Submitted → Approved / Outdated / Cancelled |
| **RiskRequest** | Draft → Submitted → Approved / Rejected |
| **ProjectArtifact** | Draft → Submitted → Approved / Rejected |
| **ProjectVersion** | Draft → ReadyToApprove → Approved / Cancelled / Snapshot |
| **IncomingActOfAcceptance** | Registered → Recognized / Cancelled |

Все состояния имеют: code, name (Ru+En), style (secondary/warning/info/primary/success/danger/light)

## 6. ПРАВА И РОЛИ

### 6.1 PermissionSets (9)
1. Системный администратор — полный доступ
2. Администратор проектов — все проекты
3. Менеджер проектов — свои проекты + задачи
4. Менеджер клиентов — CRM
5. Ресурсный менеджер — загрузка, распределение
6. Финансовый менеджер — финансы
7. Менеджер по кадрам — таймшиты, отсутствия
8. Руководитель — линейное управление
9. Пользователь — базовый доступ (все 20 юзеров)

### 6.2 Системные роли (7)
TeamManager, ClientManager, ResourceManager, User, ProjectManager, Administrator, FinanceManager

### 6.3 Права (309 permissions)
Все операции CRUD для каждой сущности × область видимости (свои/чужие)

## 7. КОНВЕНЦИИ И ФОРМАТЫ

| Параметр | Значение |
|----------|----------|
| **PK тип** | GUID (UUID v4) |
| **Деньги** | Decimal |
| **Часы** | Decimal (2.5 = 2ч30м) |
| **Даты** | ISO 8601, DateOnly для дат без времени |
| **Блокировки** | Оптимистичная (rowVersion: Int) |
| **Нумерация** | Настраиваемые политики (11 политик) |
| **Языки** | Ru + En (displayNames для всех сущностей) |
| **TZ** | Europe/Moscow |
| **Валюта** | RUB (базовая) |
| **Таймшиты** | Недельные (Пн-Вс), срок отправки Вт |
| **Формат времени** | Decimal (опционально HH:MM) |

## 8. ИНТЕГРАЦИИ

### 8.1 OData V4 API
- 198 EntitySets (все сущности CRUD через REST)
- 22 FunctionImport + 22 ActionImport
- $select, $expand, $filter, $orderby, $top, $skip, $apply
- OAuth 2.0 Bearer token
- CORS: не настроен (блокируется браузером, curl работает)
- Rate limiting: ~10 запросов/окно → 403

### 8.2 OIDC (IdentityServer4)
- Issuer: auth.timetta.com
- Client: web_app (public SPA)
- Grant types: authorization_code+PKCE, refresh_token, client_credentials, password, implicit, device_code, shared_grant, persistent_grant
- Scopes: openid, profile, email, all, shared, agent-run, offline_access
- Signing: RS256

### 8.3 AI
- ai-bot.timetta.com (iframe widget) → ai-api.timetta.com
- 4 контекстные схемы, 10 промптов, 1 агент
- Endpoint агента: ai-wbs-agent-service.ai.svc.cluster.local (Kubernetes)
- Поддерживает: mode, text, context, llm, temperature

### 8.4 GitLab
- Сущности: GitLabRepositories, Branches, Commits, MergeRequests
- Связи: IssueCommitLinks, IssueMergeRequestLinks
- На стенде: не настроено

### 8.5 1С
- Страница: /product/1c-integration
- Косвенная интеграция через OData (Import, UpdateViaDadata)

### 8.6 Dadata
- GetInfoByTaxNumber (подсказки по ИНН)

## 9. БЕЗОПАСНОСТЬ

| Проверка | Результат |
|----------|-----------|
| OIDC PKCE S256 | ✅ |
| Token validation | ✅ 401 без токена / с невалидным |
| Tenant isolation | ✅ tenantId серверный, не меняется |
| X-Tenant-Id header | ✅ игнорируется |
| CORS preflight | ❌ не настроен (но curl работает) |
| Rate limiting | ✅ 403 после ~10 быстрых запросов |
| System entities | ✅ 403 на TenantSettings, AuthProviders, UserSettings |
| Password grant | ❌ заблокирован для client web_app |
| Implicit grant | ⚠️ включён (legacy) |
| RS256 rotation | ⚠️ один ключ |

## 10. ДАННЫЕ СТЕНДА

### 10.1 Пользователи (20)
Все @credos.ru: vs, ShahmatovM, AndropovaD, NigmatulinR, OstapenkoS, PrepelkinM, BorcovaI, UrchenkoA, FadeevP, SemenchenkoK, NeumannV, MizulinS, NesterovA, MagomedovR, DemidovI, IgnatievK, NekrasovG, SvainbergM, BogatovV, OstashkovaM

### 10.2 Проекты (9)
CON-24-2026, SUP-02-2026, CON-35-2026, AUD-02-2026, IMP-01-2026, ADM-2026, IMP-03-2026, DEV-01-SOFT, ARCH-PR-2026

### 10.3 Организации (20)
Сибур, Главстрой Корпорация, Регионы-Девелопмент, Адидас РУС, Энергобезопасность ФГУ НТЦ, X5 Retail Group, Лаборатория Касперского, ИТАР-ТАСС, РОЛЬФ, Русское море, ПИК ГК, Мосметрострой + 8 других

### 10.4 Сделки (10)
Запрос на внедрение BI, Проектирование модуля 1С, Стратегический анализ, Разработка ИИ ассистента, Анализ хранилища данных, Техподдержка систем мониторинга, Аудит на следующий год, Обучение менеджеров, Проектирование ЖЦ КутзовGrad, Заявка на обучение

### 10.5 Таймшиты (5+)
Активный: vs@credos.ru 15.06-21.06.2026 (Draft, 40ч)

## 11. ФАЙЛЫ-ИСТОЧНИКИ

| Категория | Файлы | Размер |
|-----------|-------|--------|
| **Метаданные** | `raw-odata-metadata.xml`, `raw-session.json`, `metamodel-full.txt` | 2.3 MB |
| **Справочники** | 41 raw-odata-*.json | 1.2 MB |
| **API-карта** | `schema-summary.txt`, `db-full-entity-model.md` (7282 строки) | 400 KB |
| **Интеграции** | `integration-model.md` (67 разделов) | 50 KB |
| **UI/UX** | `ux-app-styles.css` (380KB), `ux-site-styles.css` (513KB), `ux-i18n-ru.json` (287KB) | 1.2 MB |
| **Скриншоты** | 15 PNG | 12 MB |
| **Модели** | `TARGET_MODEL.md`, `RECON.md` | 40 KB |

**Всего: 87+ файлов, 18+ MB**
