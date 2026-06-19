# Timetta — Интеграционная модель

**Дата:** 2026-06-20
**Версия:** 1.0
**Источник:** Black-box reverse engineering (OData $metadata + Session API + UI)

---

## 1. OData API — все Function/Action

### 1.1. Unbound Action (глобальные, без привязки к сущности)

| Action | Параметры | Назначение |
|--------|-----------|------------|
| `AbortUndoRedo` | — | Отмена операции undo/redo |
| `AiClassifyText` | Input:Edm.String, Instruction:Edm.String, Labels:Collection(Edm.String) | Классификация текста AI |
| `AiGenerateText` | Text:Edm.String, Instruction:Edm.String | Генерация текста AI |
| `ChangePassword` | oldPassword:Edm.String, newPassword:Edm.String | Смена пароля |
| `ClaimYcSubscription` | — | Привязка Yandex Cloud подписки |
| `ClearAllData` | — | Очистка всех данных тенанта |
| `DestroySession` | — | Уничтожение сессии |
| `ExecuteTextCommand` | CommandId:Edm.String, Text:Edm.String | Выполнение текстовой команды (AI) |
| `GetPnlTable` | options:WP.PnlTableOptions | P&L таблица |
| `GetResourceGapSummary` | options:WP.ResourceGapSummaryOptions | Сводка по ресурсным разрывам |
| `GetResourceSummaryEntries` | options:WP.ResourceSummaryEntriesOptions | Записи сводки ресурсов |
| `GetResourceSummaryPage` | options:WP.ResourceSummaryPageOptions | Страница сводки ресурсов |
| `GetSalesFunnel` | from:Edm.Date, to:Edm.Date, type:Edm.Guid, filter:WP.FilterGroup | Воронка продаж |
| `Redo` | — | Повтор действия |
| `ResetTenantCache` | — | Сброс кэша тенанта |
| `Search` | term:Edm.String, top:Edm.Int32, kind:WP.SearchItemKind, entityType:Edm.String | Глобальный поиск |
| `SetSessionProperty` | — | Установка свойства сессии |
| `SetTenantSettingsProperty` | — | Установка настройки тенанта |
| `StartUndoRedo` | — | Начало undo/redo группы |
| `TrackTime` | timeEntries:Collection(WP.TrackTimeEntry), strategyIfEntryExists:WP.TrackTimeStrategy | Быстрый ввод времени |
| `Undo` | — | Отмена действия |
| `UpdateClientProfile` | clientType:Edm.String, clientProfile:Edm.String | Обновление профиля UI |

### 1.2. Unbound Functions

| Function | Return Type | Назначение |
|----------|-------------|------------|
| `GetActiveDomains` | Collection(Edm.String) | Активные домены |
| `GetAllocationData` | Collection(WP.AllocationData) | Данные аллокации (projectId:Edm.Guid) |
| `GetClientProfile` | Edm.String | Профиль клиента (clientType:Edm.String) |
| `GetCountries` | Collection(WP.Country) | Список стран |
| `GetCultures` | Collection(WP.Culture) | Культуры/локали |
| `GetCurrencyForCountry` | Edm.String | Валюта страны (countryCode:Edm.String) |
| `GetEntityTypes` | Collection(WP.EntityTypeDescription) | Реестр всех типов сущностей |
| `GetGeneralPnlStatement` | WP.PnlStatement | Общий P&L отчёт (с фильтрами по типу, периоду) |
| `GetLanguages` | Collection(WP.Culture) | Языки |
| `GetLicenseInfo` | WP.LicenseInfo | Информация о лицензии |
| `GetNavigationItems` | Collection(WP.NavigationItemDto) | Структура навигации |
| `GetPasswordRequirementsText` | Edm.String | Требования к паролю |
| `GetPnlStatement` | WP.PnlStatement | P&L отчёт (аналогично GetGeneralPnlStatement) |
| `GetProjectSummaryEntries` | Collection(WP.ProjectSummaryResourcePlanDto) | Сводка ресурсов проектов |
| `GetProjectSummaryPage` | Collection(WP.ProjectSummaryPageDto) | Страница сводки проектов |
| `GetSession` | WP.ClientSession | Текущая сессия (включая permissions, конфиг) |
| `GetTextCommands` | Collection(WP.AiTextCommandModel) | Текстовые команды AI |
| `GetTimeTrackingOrganizations` | Collection(WP.CodedEntityDto) | Организации для таймшита |
| `GetTimeTrackingProjectTasks` | Collection(WP.ProjectTaskDto) | Задачи для таймшита |
| `GetTimeTrackingProjects` | Collection(WP.ProjectDto) | Проекты для таймшита |
| `GetUsersToSubstitute` | Collection(WP.UserInfo) | Пользователи для замещения |
| `SearchTimeTrackingProjectTasks` | Collection(WP.ProjectTaskSearchRecordDto) | Поиск задач для таймшита |

### 1.3. Bound Actions (по типу сущности)

#### Финансы и бухгалтерия
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `AccrueCapitalCharge` | AccountingPeriod | — |
| `PreAccrueCapitalCharge` | AccountingPeriod | — |
| `CalculateEstimatedRevenue` | Project, ProjectVersion | calculationMethod, accrualFrequency, taskId, accountId, fixedAmount, targetProfitability, isDetailedByStages, dateStart, dateFinish |
| `ClearBillingEstimates` | Project, ProjectVersion | — |
| `ClearExpenseEstimates` | Project, ProjectVersion | — |
| `ClearRevenueEstimates` | Project, ProjectVersion | — |
| `CreateInvoice` | TenantDto | — |
| `Insert` | Collection(Invoice) | organizationId, projectId, code, timeLinesGrouping, expenseLinesGrouping |
| `SetStatus` | Invoice | statusCode, date |
| `UploadLogo` | InvoiceTemplate | logo:Stream |
| `DeleteLogo` | InvoiceTemplate | — |

#### Таймшиты и учёт времени
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `AddComment` | 20+ типов (TimeSheet, Project, Issue и др.) | text, mentionedUserIds |
| `CopyLinesFromPrevious` | TimeSheet | copyHours |
| `CreateLinesFromResourcePlan` | TimeSheet | copyHours |
| `ReAccount` | TimeSheet | — |
| `StartStopwatch` | TimeAllocation | — |
| `StopStopwatch` | TimeAllocation | — |
| `UpdatePeriod` | View | period:DatePeriod |

#### GitLab и задачи
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `SetType` | Issue | typeId:Edm.Guid |
| `SetProject` | Issue, ExpenseRequest | projectId, projectTaskId |
| `Move` | WikiPage, ProjectTask | parentId/startDate, afterPageId/rowVersion |
| `MoveAfter` | BoardCard | columnId, afterCardId |
| `MoveToTop/MoveToBottom` | BoardCard | columnId |
| `UpdateBoardColumnMode` | View | boardColumnMode |
| `UpdateBoardGrouping` | View | boardGrouping |
| `UpdateBoardOrderBy` | View | orderByValue |
| `UpdateCardProperties` | View | cardProperties |
| `UpdateListColumns` | View | listColumns |
| `UpdateListOrderBy` | View | orderByValue |
| `UpdateSprint` | View | sprintId |

#### Ресурсы и бронирования
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `Create` | Collection(BookingEntry) | bookingEntry, planningScale |
| `Update` | BookingEntry | bookingEntry, planningScale |
| `UpdateWithScaling` | BookingEntry | bookingEntry, planningScale |
| `GetDetailEntriesPreview` | Collection(BookingEntry) | bookingEntry, planningScale, isUpdate |
| `Clear` | BookingEntry | — |
| `SwitchToHard` | BookingEntry | — |
| `SwitchToSoft` | BookingEntry | — |
| `Notify` | BookingEntry | comment |
| `GetSchedules` | Collection(BookingEntry) | filter:BookingsFilter |
| `GetBookings` | Collection(BookingEntry) | filter:BookingsFilter |

#### Проекты
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `ApplyProjectModel` | Project | modelId |
| `ChangeBillingType` | Project | billingTypeId |
| `ClearResourcePlan` | Project, ProjectVersion | taskId, teamMemberId |
| `CreateGeneric` | Project, ProjectVersion | generic, primaryTariffId |
| `CreateVersion` | Collection(ProjectVersion) | id, name, sourceVersionId, mainProjectId, mode |
| `Merge` | Collection(ProjectVersion) | type, option, source, target |
| `SetVersionMaster` | ProjectVersion | masterBaseline |
| `UpdateCoManagers` | Program, Project | coManagers |
| `UpdateCoOwners` | ProjectPortfolio | coOwners |
| `UpdateInheritedProjects` | Project | — |
| `UpdateProjectTasks` | Project | projectTasks |
| `UpdateResourcePlan` | Project, ProjectVersion | scale, entries |
| `UpdateTeam` | Project, ProjectVersion | team |
| `Publish` | Project, ProjectVersion, Dashboard, WikiPage и др. | — |

#### CRM
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `ApplyScenario` | Collection(Interaction) | scenarioId, contactId, performerId, organizationId, dealId |
| `GenerateEmailContent` | EmailTemplate | contactId, organizationId, dealId, performerId |
| `GenerateEmailContentWithLlm` | Collection(EmailTemplate) | subject, text, performerId |
| `Process` | EmailTemplate | contactId, organizationId, dealId, performerId |
| `SetState` | Deal, Issue, Project и 18+ типов | stateId, transitionFormValue |

#### AI
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `GenerateAiContext` | 120+ типов сущностей | aiPromptId:Edm.Guid |
| `GenerateContent` | ProjectArtifact | — |
| `GenerateViewAiContext` | View | aiPromptId, entityIds |
| `RebuildAiData` | TenantSetting | — |
| `Run` | Agent | entityId:Edm.Guid |
| `UpdateStatus` | AgentRun | statusId, message |

#### Комментарии и воркфлоу
| Action | Binding Type | Параметры |
|--------|-------------|-----------|
| `DeleteComment` | 20+ типов | commentId |
| `EditComment` | 20+ типов | commentId, mentionedUserIds, text |
| `CreateCommentThread` | WikiPage | Text, QuotedText, MentionedUserIds |
| `StartWorkflow` | 20+ типов сущностей | workflowId |
| `CancelActiveWorkflow` | 15+ типов | — |
| `PerformWorkflowTask` | WorkflowTask | actionId, actionFormValue |
| `UpdateWorkflowSchema` | WorkflowDeclaration | schema |

### 1.4. Bound Functions (с возвращаемым типом)

| Function | Return Type | Назначение |
|----------|-------------|------------|
| `Check` | Collection(WP.TimesheetValidationError) | Валидация таймшита |
| `CheckActionPermission` | Edm.Boolean | Проверка права действия |
| `CheckActiveInvoice` | Edm.Boolean | Проверка активного счёта |
| `Current` | WP.TimeSheet | Текущий таймшит |
| `GetAccountDocuments` | Collection(WP.AccountDocumentDto) | Документы учётной записи |
| `GetActivityItems` | Collection(WP.ActivityItem) | Лента активностей (20+ типов) |
| `GetAdjustmentEntries` | Collection(WP.AccountingEntry) | Корректировочные проводки |
| `GetAllEntitiesInfo` | Collection(WP.OpenTypeDto) | Информация обо всех сущностях представления |
| `GetAllowedActions` | WP.BookingActionsAvailability | Разрешённые действия с бронированием |
| `GetAllowedProjectTasks` | Collection(WP.ProjectTaskDto) | Разрешённые задачи для Issue |
| `GetAllowedProjects` | Collection(WP.NamedEntityDto) | Разрешённые проекты |
| `GetAllowedRoles` | Collection(WP.ActorRoleDto) | Разрешённые роли |
| `GetAllowedTransitionFormProperties` | Collection(Edm.String) | Свойства формы перехода |
| `GetAttachments` | WP.FileMetadata | Вложения (20+ типов) |
| `GetAuthProviders` | Collection(WP.AuthProviderDto) | Провайдеры аутентификации |
| `GetAvailableExpenseLines` | Collection(WP.InvoiceLineInfoDto) | Доступные строки расходов для счёта |
| `GetAvailableIssueSprints` | Collection(WP.Sprint) | Доступные спринты для задачи |
| `GetAvailableParents` | Collection(WP.Issue) | Доступные родительские задачи |
| `GetAvailableProducts` | Collection(WP.LicenseProductInfo) | Доступные продукты |
| `GetAvailableProjects` | Collection(WP.ProjectDto) | Доступные проекты для ресурса |
| `GetBacklogCard` | WP.OpenTypeDto | Карточка бэклога |
| `GetBacklogCards` | Collection(WP.OpenTypeDto) | Карточки бэклога по спринту |
| `GetBillingContact` | WP.BillingContactDto | Контакт для биллинга |
| `GetBillingInfo` | WP.OrganizationBillingInfo | Биллинговая информация |
| `GetBoardCard` | WP.OpenTypeDto | Карточка доски |
| `GetBoardColumnsIndicators` | Collection(WP.OpenTypeDto) | Индикаторы колонок |
| `GetBoardGroups` | Collection(WP.OpenTypeDto) | Группы доски |
| `GetBookingSummary` | Collection(WP.BookingDetailDto) | Сводка бронирования |
| `GetBurndown` | WP.BurndownChartDto | Burndown-чарт |
| `GetByEntity` | WP.MetaEntitySettings | Настройки метамодели по сущности |
| `GetCapitalChargeRateValues` | Collection(WP.CapitalChargeRate) | Значения ставок капитальных затрат |
| `GetCommentThreads` | Collection(WP.WikiPageCommentThread) | Ветки комментариев Wiki |
| `GetCurrentUserSettings` | WP.UserSetting | Текущие настройки пользователя |
| `GetDataset` | Edm.String | Дашборд-датасет |
| `GetDefaultSettings` | WP.ViewSetting | Настройки по умолчанию для представления |
| `GetDetails` | Collection(WP.DateHours) | Детали бронирования |
| `GetDevelopmentInfo` | WP.IssueDevelopmentDto | Информация о разработке (GitLab) |
| `GetEditAllowed` | Edm.Boolean | Проверка права редактирования (120+ типов) |
| `GetEmailSettings` | WP.UserEmailSettings | Настройки email |
| `GetEntityIdByKey` | Edm.Guid | ID сущности по строковому ключу |
| `GetEntityTasks` | Collection(WP.WorkflowTask) | Задачи воркфлоу для сущности (15+ типов) |
| `GetEntityTypeLifecycleInfo` | WP.LifecycleEntityTypeInfo | Информация о жизненном цикле |
| `GetEntityViewId` | — | ID представления для сущности |
| `GetEpicPanel` | Collection(WP.EpicPanelItemDto) | Панель эпиков |
| `GetExchangeRate` | Edm.Decimal | Курс валюты на дату |
| `GetExperienceOverview` | Collection(WP.UserExperienceOverviewDto) | Обзор опыта сотрудника |
| `GetExpiryOfLicensingPeriod` | Edm.Date | Дата истечения лицензии |
| `GetFile` | Edm.Stream | Загрузка файла |
| `GetFilesMetadata` | Collection(WP.FileMetadata) | Метаданные файлов |
| `GetFteSchedule` | Collection(WP.DateHours) | FTE-расписание |
| `GetGenericCalculatedInfo` | WP.GenericCalculatedInfoDto | Расчётная информация Generic |
| `GetGroupedRequirementEntries` | Collection(WP.DateHours) | Сгруппированные требования |
| `GetGroupedResourcePlanEntries` | Collection(WP.DateHours) | Сгруппированные R P записи |
| `GetHierarchySummary` | WP.IssueHierarchySummaryDto | Иерархия задачи |
| `GetHistoryFeed` | — | Лента истории (120+ типов) |
| `GetHoursByActivities` | Collection(String→Decimal) | Часы по видам работ |
| `GetHoursByClients` | Collection(String→Decimal) | Часы по клиентам |
| `GetHoursByProjects` | Collection(String→Decimal) | Часы по проектам |
| `GetIdForPeriod` | Edm.Guid | ID таймшита за период |
| `GetInfo` | WP.NamedEntityDto | Информация (120+ типов) |
| `GetInfoByTaxNumber` | WP.OrganizationInfoByTaxNumberResult | Организация по ИНН (Дадата) |
| `GetInteractionsWithFiles` | Collection(WP.ExtendedInteraction) | Взаимодействия с файлами |
| `GetIssueTypes` | WP.DirectoryEntry | Типы задач проекта |
| `GetKpi` | WP.KpiDto | KPI проекта/программы/организации |
| `GetLeaveSchedulePage` | Collection(WP.LeaveSchedule) | График отпусков |
| `GetLifecycleInfo` | WP.LifecycleInfo | Информация о ЖЦ (15+ типов) |
| `GetLifecycleRoles` | Edm.String / Collection(WP.ActorRoleDto) | Роли ЖЦ |
| `GetListRows` | Collection(WP.OpenTypeDto) | Строки списка |
| `GetListTotal` | WP.OpenTypeDto | Итого по списку |
| `GetListView` | WP.UiListView | Представление списка |
| `GetLogo` | Edm.Stream | Логотип шаблона счёта |
| `GetNames` | Collection(Edm.String) | Имена (автокомплит) |
| `GetNewReport` | WP.ReportV2 | Новый отчёт |
| `GetNextTimeSheetId` | Edm.Guid | Следующий таймшит |
| `GetOrganizationGraph` | WP.OrganizationGraphDto | Граф организации |
| `GetOverview` | WP.TenantOverviewDto | Обзор тенанта |
| `GetPivotData` | Edm.String | Данные сводной таблицы |
| `GetPreviousTimeSheetId` | Edm.Guid | Предыдущий таймшит |
| `GetProjectExpensesCalendarBillingSection` | WP.ProjectExpensesCalendarSectionDto | Секция биллинга календаря |
| `GetProjectExpensesCalendarExpensesSection` | WP.ProjectExpensesCalendarSectionDto | Секция расходов календаря |
| `GetProjectExpensesCalendarPaymentSection` | WP.ProjectExpensesCalendarSectionDto | Секция платежей календаря |
| `GetProjectTasksInfo` | Collection(WP.ProjectTaskDto) | Задачи проекта по пользователю |
| `GetProjectsInfo` | Collection(WP.ProjectDto) | Проекты пользователя |
| `GetRbcCalendarBillingSection` | WP.ProjectRbcCalendarSectionDto | RBC секция биллинга |
| `GetRbcCalendarCollectionSection` | WP.ProjectRbcCalendarSectionDto | RBC секция сборов |
| `GetRbcCalendarRevenueSection` | WP.ProjectRbcCalendarSectionDto | RBC секция выручки |
| `GetReferencingRows` | Collection(WP.ReferencingRowInfo) | Ссылающиеся строки (120+ типов) |
| `GetRequirementEntries` | Collection(WP.DateHours) | Записи требований |
| `GetResourcePlan` | WP.ResourcePlan | Ресурсный план |
| `GetResourceRequestCount` | Edm.Int32 | Количество запросов ресурса |
| `GetResourceRequestTemplate` | WP.ResourceRequestTemplateDto | Шаблон запроса ресурса |
| `GetResourceRequirementsPlan` | WP.ResourceRequirementsPlan | План потребностей в ресурсах |
| `GetResourcesPage` | Collection(WP.ResourceInfo) | Страница ресурсов |
| `GetRiskInfo` | WP.RiskInfoDto | Информация о риске |
| `GetSchedule` | Collection(WP.DateHours) / WP.Schedule | Расписание |
| `GetSettings` | WP.ViewSetting | Настройки представления |
| `GetSharedTokenInfo` | WP.SharedToken | Информация о shared token |
| `GetStateHistory` | Collection(WP.StateHistoryLog) | История состояний |
| `GetStates` | Collection(WP.State) | Состояния для типа сущности |
| `GetSurroundingDatePeriods` | Collection(WP.DatePeriod) | Периоды вокруг таймшита |
| `GetTaskPlanTree` | Collection(WP.PlanItemDto) | Дерево плана задач |
| `GetTasks` | Collection(WP.ProjectTask) | Задачи проекта/версии |
| `GetTimeOffBalance` | Collection(WP.TimeOffBalanceProfileLine) / Decimal | Баланс отсутствий |
| `GetTimeOffDuration` | Edm.Decimal | Длительность отсутствия |
| `GetTimesheetsToInclude` | Collection(WP.TimeSheet) | Таймшиты для включения в акт |
| `GetTransitionFormDescription` | WP.TransitionFormDescription | Описание формы перехода (20+ типов) |
| `GetTrends` | Collection(WP.KpiTrendsValue) | Тренды KPI |
| `GetUserCostCenters` | Collection(WP.NamedEntityDto) | Центры затрат пользователя |
| `GetUserRoles` | Collection(WP.UserRoleDto) | Роли пользователя |
| `GetUserSchedule` | Collection(WP.DateHours) | Расписание пользователя |
| `GetUserSettings` | Edm.String | Настройки отчёта |
| `GetUserTariffs` | Collection(WP.NamedEntityWithPrimaryFlagDto) | Тарифы пользователя |
| `GetUtilization` | Collection(String→Decimal) | Утилизация |
| `GetWorkResourcePlan` | Collection(WP.ResourcePlanEntry) | Рабочий ресурсный план |
| `GetWorkflowActionFormDescription` | WP.TransitionFormDescription | Описание формы действия воркфлоу |
| `GetWorkflowSchema` | WP.WorkflowSchema | Схема воркфлоу |
| `IsUserLocked` | Edm.Boolean | Заблокирован ли пользователь |
| `RiskAccrueAvailable` | Edm.Boolean | Доступно ли начисление риска |
| `SuggestSlug` | Edm.String | Предложение slug для Wiki |

### 1.5. ActionImport (глобальные действия для прямого вызова через OData)

| ActionImport | Соответствующее Action |
|-------------|----------------------|
| `AiClassifyText` | WP.AiClassifyText |
| `AiGenerateText` | WP.AiGenerateText |
| `Search` | WP.Search |
| `TrackTime` | WP.TrackTime |
| `ResetTenantCache` | WP.ResetTenantCache |
| `GetPnlTable` | WP.GetPnlTable |
| `GetResourceGapSummary` | WP.GetResourceGapSummary |
| `GetResourceSummaryEntries` | WP.GetResourceSummaryEntries |
| `GetResourceSummaryPage` | WP.GetResourceSummaryPage |
| `GetSalesFunnel` | WP.GetSalesFunnel |

### 1.6. EntitySets (ключевые OData endpoint'ы)

Система использует около 200 EntitySet'ов. Основные:

**Клиенты и продажи:** Organizations, Contacts, Deals, DealContacts, Campaigns, CampaignEntries, Interactions, InteractionScenarios

**Проекты:** Projects (с $expand для метаданных), Programs, ProjectPortfolios, ProjectTasks, ProjectTeamMembers, ProjectRisk, ProjectCheckpoints, ProjectArtifacts, ProjectVersions

**Финансы:** FinancialAccounts, AccountingPeriods, AccountingEntries, Invoices, InvoiceTemplates, Contracts, ActsOfAcceptance, IncomingActsOfAcceptance, LegalEntities, RateMatrices, VatRates, Currencies, CurrencyExchangeRates, CostNormalizationRules, SubcontractorPaymentEstimates

**Ресурсы:** Users, Resources, Roles, Skills, Competences, Grades, Levels, Locations, ResourcePools, BookingEntries, ResourceRequests, Vacancies

**Таймшиты:** TimeSheets, TimeSheetLines, TimeAllocations, TimeOffRequests, TimeOffTypes, TimeOffBalanceEntries, Schedules, ScheduleExceptions, Activities, BillCodes, TimesheetTemplates, ValidationRules

**Задачи:** Issues, Sprints, IssueLinks, IssueLinkTypes, BoardColumns, BoardCards

**CRM:** Organizations (с подтипами), Contacts, Deals, Interactions, EmailTemplates

**AI:** Agents, AgentRuns, AiContextSchemas, AiPrompts

**Интеграции:** GitLabRepositories, GitLabRepositoryBranches, GitLabCommits, GitLabMergeRequests, IssueMergeRequestLinks, IssueCommitLinks

**Администрирование:** Users, Groups, Departments, PermissionSets, Lifecycles, States, WorkflowDeclarations, WorkflowInstances, WorkflowTasks, Views, WikiSpaces, WikiPages, Dashboards, Reports, CalculatedFields, CustomFields, Directories, DirectoryEntries, NumberingPolicies, ApiTokens

---

## 2. OAuth 2.0 / OIDC

### 2.1. Провайдер

- **Issuer:** `https://auth.timetta.com`
- **Протокол:** OpenID Connect (IdentityServer4)
- **Signing:** RS256
- **JWK Key ID:** `D9C8EBC9AE85DE0E9FAD95FC01CFD77CC70775AARS256`
- **Client ID:** `web_app` (SPA public client)

### 2.2. Grant Types

| Grant Type | Назначение | Статус |
|-----------|-----------|--------|
| `authorization_code` + PKCE (S256) | Основной для SPA | Рекомендуемый |
| `client_credentials` | Сервер-сервер (machine-to-machine) | Активен |
| `refresh_token` | Обновление access token | Активен |
| `implicit` | Legacy (не рекомендуется для SPA) | Включён |
| `password` | Resource owner password (legacy) | Включён |
| `device_code` | Device flow (терминалы, TV) | Активен |
| `shared_grant` | Shared/делегированный доступ | Активен |
| `persistent_grant` | Долгоживущая сессия («Оставаться в системе 30 дней») | Активен |

### 2.3. Token Endpoint

`https://auth.timetta.com/connect/token`

### 2.4. Scopes

| Scope | Назначение |
|-------|-----------|
| `openid` | OpenID Connect (обязательный) |
| `profile` | Профиль пользователя |
| `email` | Email пользователя |
| `all` | Полный доступ к API |
| `shared` | Доступ к shared/delegated ресурсам |
| `agent-run` | Запуск AI-агентов |
| `offline_access` | Refresh tokens |

### 2.5. Flow аутентификации

1. Пользователь вводит email
2. Система проверяет существование аккаунта
3. Пользователь вводит пароль
4. Форма содержит `RequestVerificationToken` (анти-CSRF)
5. Выполняется OIDC authorization code flow с PKCE S256
6. Access token хранится в localStorage/памяти браузера
7. Silent refresh через iframe (используется `refresh_token`)
8. Bearer token передаётся в заголовке: `Authorization: Bearer {token}`

---

## 3. AI Integration

### 3.1. Архитектура AI

```
ai-bot.timetta.com → ai-api.timetta.com (версия 240)
        ↓
api.timetta.com (OData API Gateway)
```

- **AI чат-бот:** ai-bot.timetta.com
- **AI API сервер:** ai-api.timetta.com, версия 240
- **Версия агента (Agents):** внутренняя (agent-run через ai-wbs-agent-service.ai.svc.cluster.local)

### 3.2. AiContextSchema (Схема контекста)

Каждая схема привязана к entityType и определяет шаблон контекста для отправки в AI.

| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | Уникальный идентификатор |
| entityType | String | Тип сущности (Deal, Project, Issue) |
| name | String | Название схемы |
| textTemplate | String | Шаблон контекста (Handlebars-подобный синтаксис) |
| isActive | Boolean | Активна ли схема |

**Доступные схемы (3 шт.):**

1. **«Основные сведения о сделке»** (entityType: Deal) — содержит Name, Key, Type, State, Organization, Manager, Amount, Probability, Resolution
2. **«Расширенный статус»** (entityType: Project) — полная информация: показатели (часы, себестоимость, выручка, прибыль, рентабельность), контрольные точки, риски
3. **«Основные сведения о задаче»** (entityType: Issue) — Name, Key, Type, State, Priority, Project, Assigned, DueDate, StoryPoints
4. **«Основные сведения о проекте»** (entityType: Project) — базовая информация: Name, Key, State, Manager, Client, Dates, BillingType

**Формат шаблона:**
```
{{ Name }}
{{ Key }}
{{ Project.Name }}
{{ Total.ActualHours | math.format "N2" }}
{{ date.now | date.to_string '%d.%m.%Y' }}
{{ if ProjectCheckpoints && ProjectCheckpoints.Count > 0 }}
{{ for Checkpoint in ProjectCheckpoints }}
...
{{ end }}
{{ else }}
...
{{ end }}
```

### 3.3. AiPrompt (Промпты)

| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | Уникальный идентификатор |
| entityType | String | Тип сущности (Deal, Project, Issue) |
| name | String | Название промпта |
| text | String | Текст запроса к AI |
| systemInstruction | String | Системная инструкция |
| aiContextSchemaId | GUID | Ссылка на схему контекста |
| showInList | Boolean | Показывать в списке |
| showInCard | Boolean | Показывать в карточке |
| isActive | Boolean | Активен ли |

**Доступные промпты (9 шт.):**

| Название | EntityType | Назначение |
|----------|-----------|------------|
| Задачи: риски и блокеры | Issue | Группировка задач: блокеры, риски, требуют уточнения, можно выполнять |
| Проекты: статус-отчет | Project | Статус-отчёт по проектам для руководителя |
| Задачи: план действий | Issue | Практичный план работы: приоритеты, зависимости |
| Проекты: паспорт проекта | Project | Краткий паспорт по каждому проекту |
| Задачи: таблица с описанием | Issue | Markdown-таблица задач с краткой сводкой |
| Сделки: таблица по воронке | Deal | Markdown-таблица сделок с суммой и вероятностью |
| Проекты: здоровье проекта | Project | Оценка здоровья (Зелёный/Жёлтый/Красный) |
| Сделки: следующий контакт | Deal | Рекомендации по следующему контакту |
| Сделки: риски закрытия | Deal | Анализ рисков закрытия сделок |
| Расширенный отчёт | Project | Детальный управленческий отчёт (RAG-статус, показатели, риски, контрольные точки) |

### 3.4. Agent (Агенты)

**Системный агент (1 шт.):**

| Поле | Значение |
|------|----------|
| id | 6f3c8a1b-2d4e-5f67-89ab-cdef01234567 |
| name | Агент планирования |
| isSystem | true |
| runEndpoint | http://ai-wbs-agent-service.ai.svc.cluster.local/WBSAgent/Run |
| cancelEndpoint | http://ai-wbs-agent-service.ai.svc.cluster.local/WBSAgent/Cancel |
| runPropertyDefinitions | [] |

### 3.5. Формат запросов к AI

**Текстовая классификация (AiClassifyText):**
```
POST /odata/AiClassifyText
Body: { Input: "...", Instruction: "...", Labels: ["label1", "label2", ...] }
```

**Генерация текста (AiGenerateText):**
```
POST /odata/AiGenerateText
Body: { Text: "...", Instruction: "..." }
```

**Генерация контекста (GenerateAiContext):**
```
POST /odata/Projects(id)/GenerateAiContext
Body: { aiPromptId: "guid" }
```

### 3.6. AI Text Commands

Глобальные команды, доступные через `GetTextCommands()`:

- ExecuteTextCommand(CommandId, Text) — выполнение текстовой команды

---

## 4. GitLab Integration

### 4.1. Сущности GitLab в OData

| EntitySet | Описание |
|-----------|----------|
| GitLabRepositories | Репозитории |
| GitLabRepositoryBranches | Ветки репозиториев |
| GitLabCommits | Коммиты |
| GitLabMergeRequests | Merge Requests |
| IssueMergeRequestLinks | Связь задачи → MR |
| IssueCommitLinks | Связь задачи → коммит |

### 4.2. Связывание репозиториев

На тестовом стенде репозитории не настроены (raw-odata-GitLabRepositories.json: `value: []`).

**Модель GitLabRepository из OData $metadata** (структура из схемы):

| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | PK |
| name | String | Название |
| url | String | URL репозитория |
| gitlabProjectId | Int64 | ID проекта в GitLab |
| isActive | Boolean | Активен |

**GitLabRepositoryBranch:**
| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | PK |
| repositoryId | GUID | Репозиторий |
| name | String | Имя ветки |
| isDefault | Boolean | Основная ветка |

**GitLabCommit:**
| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | PK |
| repositoryId | GUID | Репозиторий |
| branchId | GUID | Ветка |
| sha | String | Хеш коммита |
| message | String | Сообщение |
| authorName | String | Автор |
| committedAt | DateTimeOffset | Дата |
| url | String | URL коммита |

**GitLabMergeRequest:**
| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | PK |
| repositoryId | GUID | Репозиторий |
| sourceBranchId | GUID | Ветка-источник |
| targetBranchId | GUID | Целевая ветка |
| title | String | Заголовок |
| state | String | Состояние (opened/merged/closed) |
| url | String | URL MR |

### 4.3. Связь задач с GitLab

- **IssueMergeRequestLink**: связь Issue → MergeRequest
- **IssueCommitLink**: связь Issue → Commit

Связи задач (IssueLinkTypes) включают 10 типов, которые могут использоваться в контексте GitLab:
- Influence (Влияние), Testing (Тестирование), Cause (Причина), Blocking (Блокировка), Duplicate (Дублирование), Fix (Исправление), Sequence (Последовательность), Related (Связь), Implementation (Реализация), Dependency (Зависимость)

### 4.4. Функции для GitLab-данных

- `GetDevelopmentInfo(Issue)` → `WP.IssueDevelopmentDto` — информация о разработке для задачи
- `GetInfo(GitLabRepository/GitLabCommit/GitLabMergeRequest)` — базовая информация
- `GetEditAllowed(GitLabRepositories и др.)` — проверка прав
- `GetHistoryFeed(GitLabRepositoryBranch/GitLabCommit/GitLabMergeRequest)` — лента истории

---

## 5. 1C Integration

### 5.1. Прямых данных о 1C-интеграции не обнаружено

Анализ материалов не выявил:
- Специализированных endpoint'ов для 1C
- Сущностей, относящихся к 1C
- Упоминаний 1C в OData $metadata
- 1C-specific настроек в конфигурации

### 5.2. Косвенные признаки

1. **Timetta Finance** позиционируется как альтернатива 1С (см. RECON.md: «Заменяет SAP, 1C, Tempo Budgets»)
2. Наличие финансовых сущностей, пригодных для импорта/экспорта:
   - LegalEntities (Юридические лица)
   - FinancialAccounts (Учётные статьи)
   - AccountingPeriods (Учётные периоды)
   - AccountingEntries (Проводки)
   - ActOfAcceptance (Акты)
   - IncomingActOfAcceptance (Входящие акты)
   - Contracts (Договоры)
   - Invoices (Счета)
   - VatRates (Ставки НДС)
   - RateMatrices (Матрицы ставок)
3. Есть функционал импорта через HTTP (`POST /odata/Import` с attachment:Stream)
4. `UpdateViaDadata(OrganizationLegal)` — интеграция с сервисом Дадата (ФНС РФ)
5. Мультивалютность: `multiCurrency: True`, `baseCurrencyCode: RUB`

### 5.3. Возможные сценарии 1C-интеграции

- Импорт справочников (контрагенты, договоры, номенклатура, ставки НДС)
- Экспорт актов выполненных работ и счетов в 1C
- Двусторонняя синхронизация юридических лиц и контрагентов
- Обмен данными через CSV/XLSX-импорты (SharedToken для внешних систем)

### 5.4. Endpoint'ы для обмена данными

| Функция | Назначение | Подходит для 1C |
|---------|-----------|-----------------|
| `Import` | Импорт данных (attachment: Stream) | Да |
| `ImportFromProject` | Импорт из файла в проект | Да |
| `UpdateViaDadata` | Валидация юрлиц через Дадату | Да (контрагенты) |
| `GetInfoByTaxNumber` | Поиск по ИНН | Да |
| `GetAccountDocuments` | Документы учётной записи | Да |
| `LoginLogEntry` | Логирование действий (аудит) | Возможно |

---

## 6. Reporting API

### 6.1. OData endpoint'ы для отчётности

| Endpoint | Описание |
|----------|----------|
| `Reports` | Отчёты (конструктор) |
| `Dashboards` | Дашборды с виджетами |
| `CalculatedFields` | Вычисляемые поля |
| `ReportV2` | Отчёты нового типа |

### 6.2. Дашборды (Dashboards)

На тестовом стенде определены 2 дашборда:

**Дашборд «Обзор команды»:**
- Утилизация команды по неделям (Line chart)
- Виды работ (Pie chart)
- Несогласованные таймшиты (StackedColumns)
- Утилизация (спидометр)

**Дашборд «Обзор Аудит Сибура»:**
- Часы за период (DoubleValue)
- Длительность проекта (DoubleValue)
- Факт рентабельность (спидометр)
- Прогноз рентабельности (спидометр)
- Выручка за период (DoubleValue)
- Себестоимость за период (DoubleValue)
- Топ-10 задач по часам (StackedColumns)
- Динамика часов по неделям (Line)
- Себестоимость (Pie)
- Затраты проекта (StackedColumns)

**Типы виджетов:** Line, Pie, StackedColumns, Speedometer, DoubleValue, ProgressBars

### 6.3. Отчёты (Reports)

На тестовом стенде определены отчёты, доступные источники данных (sourceName):

| Источник | Описание | Назначение |
|----------|----------|------------|
| `Projects` | Проекты | Рентабельность, список, часы |
| `ActualData` | Фактические данные | Часы, утилизация |
| `Users` | Пользователи | Показатели сотрудников |
| `ResourcePlan` | Ресурсный план | Плановые/фактические часы |
| `ProjectTasks` | Задачи проекта | Часы по задачам |
| `TimeOffRequests` | Заявки на отсутствия | Отпуска, больничные |
| `Finance` | Финансы | Фактические суммы по счетам |

### 6.4. Функции отчётности

| Function | Возврат | Описание |
|----------|---------|----------|
| `GetDataset(Dashboard, datasetId, forceRefresh, viewPeriod)` | Edm.String (JSON) | Данные датасета для дашборда |
| `GetPivotData(ReportV2)` | Edm.String (JSON) | Сводная таблица отчёта |
| `GetPnlStatement(groupType, pnlType, ...)` | WP.PnlStatement | P&L отчёт |
| `GetGeneralPnlStatement(...)` | WP.PnlStatement | Общий P&L |
| `GetNewReport` | WP.ReportV2 | Создать новый отчёт |
| `GetKpi(Project/Program/Organization, request)` | WP.KpiDto | KPI показатели |
| `GetTrends(Organization/Project/Program/Portfolio, request)` | Collection(WP.KpiTrendsValue) | Тренды |
| `UpdateNewReport` | — | Сохранить настройки отчёта |
| `UpdateUserSettings(ReportV2)` | — | Сохранить пользовательские настройки |
| `Publish(Dashboard)` | — | Опубликовать дашборд |

### 6.5. BI-совместимость

- OData V4 — любой BI-инструмент, поддерживающий OData, может подключаться напрямую
- JSON-формат ответов
- Поддержка `$select`, `$expand`, `$filter`, `$apply`, `$top`, `$skip`, `$orderby`
- Ограничение `$top` = 50 для уведомлений, для списков — через пагинацию
- Для кастомной аналитики — `GetPnlStatement` и `GetGeneralPnlStatement` со сложной фильтрацией

---

## 7. Webhooks / Notifications

### 7.1. Endpoint'ы уведомлений

| Endpoint | Описание |
|----------|----------|
| `GET /odata/Notifications?$top=50&$orderby=created desc` | Последние 50 уведомлений |
| `GET /odata/Notifications?$apply=filter(read eq false)/aggregate(id with countdistinct as count)` | Счётчик непрочитанных |

**Ограничение:** `$top` не более 50 для Notifications.

### 7.2. Типы уведомлений

Модель данных Notifications не была получена (запрос с $top=100 вернул ошибку лимита). Структура (из OData $metadata):

| Поле | Тип | Описание |
|------|-----|----------|
| id | GUID | PK |
| type | String | Тип уведомления |
| text | String | Текст |
| read | Boolean | Прочитано |
| created | DateTimeOffset | Дата создания |
| entityId | Guid | ID сущности |
| entityType | String | Тип сущности |

### 7.3. Действия с уведомлениями

| Action | Описание |
|--------|----------|
| `MarkAsRead(Notification)` | Отметить одно как прочитанное |
| `MarkAllAsRead(Collection(Notification))` | Отметить все как прочитанные |

### 7.4. Звуки уведомлений

В UI используются 11 звуковых файлов (mp3):
- bright-notification, soft-chime, delicate-ping, gentle-bell, quick-alert
- short-bleep, mellow-tone, crisp, airy, sparkle, icq-ooh

### 7.5. Custom Hooks (вебхуки)

В конфигурации: `customHooksAllowed: true`

Сущность `CustomHookLog` в OData (с логами вызовов).

**Функции для хуков:**
- `GetHistoryFeed(CustomHookLog)` — лента истории вызовов
- `GetEditAllowed(CustomHookLog)` — проверка прав

---

## 8. Permissions и RBAC модель

### 8.1. Роли (7 системных)

| Роль | Код |
|------|-----|
| Администратор | Administrator |
| Менеджер проектов | ProjectManager |
| Менеджер ресурсов | ResourceManager |
| Менеджер клиентов | ClientManager |
| Финансовый менеджер | FinanceManager |
| Руководитель команды | TeamManager |
| Пользователь | User |

### 8.2. Scopes доступа

| Scope | Описание |
|-------|----------|
| All | Все записи |
| My | Только свои |
| MySubordinates | Свои и подчинённых |
| MyProjects | Проекты, где я участник |
| MyPrograms | Программы, где я участник |
| MyClients | Клиенты, где я участник |
| MyPools / MyResourcePools | Ресурсные пулы |

### 8.3. Permissions (309 записей)

Группировка по типам сущностей (120+ granularName):

**Управление таймшитами:** TimeSheet, TimeSheetLine, TimeSheetLinePm, TimeSheetPeriod, TimeSheetTemplate, TimeAllocation

**Финансы:** FinancialAccount, AccountingEntry, AccountingPeriod, Invoice, InvoiceTemplate, BillingInfo, Contract, ActOfAcceptance, IncomingActOfAcceptance, VatRate, CostNormalizationRule, ProjectBillingEstimate, ProjectExpenseEstimate, ProjectRevenueEstimate, ProjectFinancial, ProjectCostCenter

**Проекты:** Project, ProjectInfo, ProjectTeam, ProjectTeamCost, ProjectCoManager, ProjectTask, ProjectRisk, ProjectRiskType, ProjectModel, ProjectVersion, ProjectVersionMerge, ProjectArtifact, ProjectArtifactType, Program, ProgramCoManager, ProjectPortfolio

**Ресурсы:** ResourcePool, ResourceRequest, ResourceRequestResult, ResourcePlanEntry, Booking, BookingSwitchToHard, BookingSwitchToSoft, ResourceCurrentRate

**Пользователи:** User, UserGroup, UserRole, UserPermissionSet, UserSkill, UserActivity, UserProduct, UserSubstitute, UserSchedule, UserCostValue, UserSetting, UserTotal, UserFinancial

**Задачи:** Issue, IssueLinkType, WorkflowTask

**AI:** AiContextSchema, AiPrompt, Agent, AgentRun

**GitLab:** GitLabRepository

---

## 9. Метаданные интеграционных сущностей

### 9.1. Suщности с lifecycle (поддерживают воркфлоу)

Эти сущности могут быть интегрированы через BPM/Workflow:

- ActOfAcceptance (Акт), IncomingActOfAcceptance (Входящий акт)
- Certificate (Сертификат)
- Checkpoint (Контрольная точка)
- Contract (Договор)
- Deal (Сделка)
- ExpenseRequest (Заявка на затраты)
- Invoice (Счёт)
- Issue (Задача)
- Organization (Организация)
- Project (Проект), ProjectVersion (Версия проекта)
- RateMatrix (Матрица ставок)
- ResourceRequest (Запрос ресурсов)
- RiskRequest (Запрос риска)
- TimeOffRequest (Заявка на отсутствие)
- TimeSheet (Таймшит)
- WorkflowTask (Задание воркфлоу)

### 9.2. Suщности с поддержкой custom fields

Ключевые сущности, поддерживающие кастомизацию (customizable: true):
- ActOfAcceptance, Campaign, CampaignEntry, Certificate, Checkpoint, Competence, Contact
- Contract, Deal, DealContact, Department, ExpenseRequest, ExpenseRequestLine
- FinancialAccount, Organization, OrganizationTotal, OrganizationTariff, Program
- Project, ProjectArtifact, ProjectCostCenter, ProjectRisk, ProjectTask, ProjectTeamMember
- ProjectVersion, Role, Schedule, TimeAllocation, TimeSheetLine, User

### 9.3. Поисковые сущности (isSearchable: true)

- Contact (Контакт), Deal (Сделка), Issue (Задача)
- Organization (Организация), Project (Проект), Program (Программа)
- ProjectArtifact (Документ проекта), ProjectPortfolio (Портфель проекта)
- User (Пользователь), WikiPage (Статья Wiki)

---

## 10. Импорт и экспорт данных

### 10.1. Механизмы импорта

| Метод | Описание |
|-------|----------|
| `POST /odata/Import` | Импорт с attachment:Stream (бинарный файл) |
| `POST /odata/Projects(id)/ImportFromProject` | Импорт в проект из файла |
| `POST /odata/Organizations(id)/UpdateViaDadata` | Импорт/валидация юрлиц через Дадата (ФНС) |

### 10.2. Файловые операции

| Метод | Описание |
|-------|----------|
| `UploadFile(FileMetadata, entityType, entityId, attachment, maxWidthHeight)` | Загрузка файла к сущности |
| `GetFile(FileMetadata, fileKey)` → Edm.Stream | Скачивание файла |
| `GetFilesMetadata(FileMetadata, entityId)` | Метаданные файлов сущности |
| `DeleteFile(FileMetadata, fileKey)` | Удаление файла |

### 10.3. API-токены для внешних систем

| Сущность | Операции |
|----------|----------|
| ApiToken | Создание (Issue), отзыв (Revoke), управление |

### 10.4. Shared Tokens

- SharedToken — механизм для внешнего доступа к данным
- GetSharedTokenInfo — получение информации о shared token

---

## 11. Заключение: интеграционные возможности

### 11.1. Готовые интеграции

1. **OAuth 2.0 / OIDC** — стандартный протокол аутентификации
2. **OData V4 REST API** — полноценный CRUD + функции/действия
3. **GitLab** — модель данных для коммитов, MR, веток, связей с задачами
4. **AI** — встроенные AI-агенты, контекстные схемы, промпты
5. **Dadata** — валидация юрлиц через ФНС
6. **Импорт/Экспорт** — файловый импорт, API-токены, shared tokens

### 11.2. Потенциальные интеграции (через открытый API)

1. **1C/Bitrix/ERP** — через Import (attachment: Stream), OData CRUD, Webhooks
2. **BI-системы** — через OData V4 endpoint (любой OData-клиент)
3. **Внешние календари** — через UserSchedule/TimeOffRequest API
4. **CRM-системы** — через Organizations/Contacts/Deals/Interactions API
5. **HR-системы** — через Users/Certificates/Skills API
6. **BPM-системы** — через Workflow API (StartWorkflow, PerformWorkflowTask)
7. **Платёжные системы** — через Invoice/AccountingEntry API

### 11.3. Ограничения

- Нет встроенной поддержки webhook-подписок (push)
- Custom hooks доступны, но без прямых endpoint'ов в OData
- GitLab интеграция не активна на тестовом стенде
- Нет прямых 1C-специфичных endpoint'ов
- Ограничение `$top` для Notifications (макс 50)
- Read-only доступ к GitLab-сущностям (GitLabCommit, GitLabMergeRequest, GitLabRepositoryBranch — viewOnly)
