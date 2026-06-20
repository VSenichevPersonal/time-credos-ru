export const APP_DISPLAY_NAME = 'Трудозатраты';
export const APP_DESCRIPTION = 'Учёт трудозатрат Кредо-С';
export const APPLICATION_UNIVERSAL_IDENTIFIER = '9c5fbbb6-0063-4eb5-afc5-529817d5c61d';
export const DEFAULT_ROLE_UNIVERSAL_IDENTIFIER = '2a5e22b7-eb59-468a-89c3-d4932bc1e366';
export const MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '2c9e425e-47d5-4d8a-a5be-65ecbc05c1a0';
export const MAIN_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER = '3ba2ca98-de77-46ff-b9ee-713c25cdd7da';
export const MAIN_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER = '1cd0ebee-5eb6-45f4-8e58-6750a045c7b8';
export const MAIN_PAGE_WIDGET_UNIVERSAL_IDENTIFIER = '4b05f038-6178-482c-b968-f3c2dbd35147';
export const MAIN_PAGE_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER =
  '560bab27-9193-4897-a160-e473667d5f79';

// --- Wave 2 (DATA): объекты модели трудозатрат (credosTime*) ---
// UUID-значения стабильны (не меняются при рефакторе нейминга ADR-0004).
export const CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER =
  '123e258d-6fbb-4a15-a57f-fe4f3d34dbfb';
export const CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER =
  'c6375671-3a0a-4935-98db-16d10f14ca79';
export const CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER =
  '4169f5a8-96ae-466e-99f6-b6e871d95c42';
export const CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER =
  'efa948a8-7b70-4e7d-9ce2-556d752f5151';
export const CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER =
  '94c519b4-e11b-48d7-b6d4-cc90c792bb71';
export const CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER =
  'e4d7eda0-9347-4cea-808a-fae0d4912b3c';
export const CREDOS_TIME_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER =
  'f4703188-e9f6-401a-924c-cda553690739';

// --- Поля-связи (RELATION): пары MANY_TO_ONE + обратная ONE_TO_MANY ---
// Employee.department -> Department.employees
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_FIELD_ID =
  '5eae507f-ace3-4e75-8023-b14705c09359';
export const CREDOS_TIME_DEPARTMENT_EMPLOYEES_FIELD_ID =
  'f09e31d9-95e7-4be3-b86a-dfb8a0c4af69';

// Project.department -> Department.projects
export const CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID =
  'dd16b466-4fce-4f67-9fee-b39fdf5fcf2c';
export const CREDOS_TIME_DEPARTMENT_PROJECTS_FIELD_ID =
  '49735dc7-6896-4d43-8bf0-70aff8c9a9ec';

// Project.company -> Company.credosTimeProjects (стандартный объект Company)
export const CREDOS_TIME_PROJECT_COMPANY_FIELD_ID =
  '17c6a489-c78b-4860-8079-5bca62161fdf';
export const CREDOS_TIME_COMPANY_PROJECTS_FIELD_ID =
  'f62625ed-b169-472c-bacc-e4d39c038710';

// Project.manager -> WorkspaceMember.credosTimeManagedProjects (стандартный объект)
export const CREDOS_TIME_PROJECT_MANAGER_FIELD_ID =
  'ac143d36-6250-4fc6-8ff4-2baabcf6a5e2';
export const CREDOS_TIME_WORKSPACE_MEMBER_MANAGED_PROJECTS_FIELD_ID =
  '7b3d9c0a-2e51-4f88-9a6c-1d4e5f6a7b80';

// Project.owner -> WorkspaceMember.credosTimeOwnedProjects (стандартный объект)
export const CREDOS_TIME_PROJECT_OWNER_FIELD_ID =
  '8c4e0d1b-3f62-4099-ab7d-2e5f6a7b8c91';
export const CREDOS_TIME_WORKSPACE_MEMBER_OWNED_PROJECTS_FIELD_ID =
  '9d5f1e2c-4073-41aa-bc8e-3f6a7b8c9d02';

// WorkType.department -> Department.workTypes (nullable = глобальный вид работ)
export const CREDOS_TIME_WORK_TYPE_DEPARTMENT_FIELD_ID =
  '67b70de9-452e-4b33-8cf7-4821b1464ecf';
export const CREDOS_TIME_DEPARTMENT_WORK_TYPES_FIELD_ID =
  '5861ada7-3679-4990-913b-e2f2a9e09485';

// Stage.project -> Project.stages
export const CREDOS_TIME_STAGE_PROJECT_FIELD_ID =
  '04fe2e4a-7222-407b-9410-cb22e5019200';
export const CREDOS_TIME_PROJECT_STAGES_FIELD_ID =
  '94ed88c6-d9b6-41d5-a03f-cbd08dd552eb';

// TimeEntry.employee -> Employee.timeEntries
export const CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID =
  '3eee1699-981c-437e-8a83-7f0e3df9e6e1';
export const CREDOS_TIME_EMPLOYEE_TIME_ENTRIES_FIELD_ID =
  '8a1ebf0c-bb22-4ea8-b195-13639dd12486';

// TimeEntry.project -> Project.timeEntries
export const CREDOS_TIME_ENTRY_PROJECT_FIELD_ID =
  'ca746a2e-8c89-4aef-aec8-ecf205b8d436';
export const CREDOS_TIME_PROJECT_TIME_ENTRIES_FIELD_ID =
  '7707007b-7ddb-4b1d-a3c9-68b6fe9fd405';

// TimeEntry.stage -> Stage.timeEntries (nullable)
export const CREDOS_TIME_ENTRY_STAGE_FIELD_ID =
  '1bfb564a-f7a7-4b51-a50e-06dd3b856109';
export const CREDOS_TIME_STAGE_TIME_ENTRIES_FIELD_ID =
  '31df8f68-9f61-4249-9bc5-399324ceeb13';

// TimeEntry.workType -> WorkType.timeEntries (nullable)
export const CREDOS_TIME_ENTRY_WORK_TYPE_FIELD_ID =
  '0a151761-88b8-4d08-8be4-54c29037d2f0';
export const CREDOS_TIME_WORK_TYPE_TIME_ENTRIES_FIELD_ID =
  'f6c6a339-cb96-4204-9bd4-9c39cd624c1d';

// BillingLink.project -> Project.billingLinks
export const CREDOS_TIME_BILLING_LINK_PROJECT_FIELD_ID =
  '2d44aaaa-08e4-46a7-9ed0-c1cb2cc29a9d';
export const CREDOS_TIME_PROJECT_BILLING_LINKS_FIELD_ID =
  '5c29b53d-a8c2-4c43-9469-f55a76bc7f87';

// --- Поля-скаляры объектов (для колонок view). Дублируют inline-UUID в objects/.
// Project
export const CREDOS_TIME_PROJECT_CODE_FIELD_ID = '1d862047-d899-450e-a565-95c028f9ce90';
export const CREDOS_TIME_PROJECT_CATEGORY_FIELD_ID = '9630aaf0-7371-4d07-8754-bc1bc94887a0';
export const CREDOS_TIME_PROJECT_STATUS_FIELD_ID = '8098049a-872d-4c33-8f27-f05d15a53cc1';
export const CREDOS_TIME_PROJECT_PLANNED_EFFORT_FIELD_ID = '4f202b64-a1cb-4e88-a917-06d9931ab489';
export const CREDOS_TIME_PROJECT_EXTERNAL_CODE_FIELD_ID = 'c1f0b3a2-7e4d-4a91-9b6c-2d8e5f1a3c47';
// Entry
export const CREDOS_TIME_ENTRY_DATE_FIELD_ID = '359bdb1d-f6c5-4780-b560-5013858d2ec3';
export const CREDOS_TIME_ENTRY_HOURS_FIELD_ID = '3b8ea288-2594-4d9a-8314-b1d8dee0e0c5';
export const CREDOS_TIME_ENTRY_DESCRIPTION_FIELD_ID = 'c59758a1-5b6f-4ee0-b0b9-da3f2b7e44d4';
export const CREDOS_TIME_ENTRY_STATUS_FIELD_ID = '60cc0ef7-38ef-42aa-903a-2e13d178fafc';
// approvedBy/approvedAt — фиксация кто/когда согласовал (заполняет /s/approval).
export const CREDOS_TIME_ENTRY_APPROVED_BY_FIELD_ID = '034bfbad-fed9-4f0e-9917-d497bb9ceace';
export const CREDOS_TIME_ENTRY_APPROVED_AT_FIELD_ID = '1cb81c6a-41bd-4f69-8eca-e6c1efe8cd7e';
// WorkType
export const CREDOS_TIME_WORK_TYPE_GROUP_FIELD_ID = '78e61c8f-d18c-48c3-9897-5cf3316aebe9';
// Employee
export const CREDOS_TIME_EMPLOYEE_FIRST_NAME_FIELD_ID = 'a52484bf-afd2-4a01-ace3-7042a762dbfe';
export const CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID = 'ca5f2e4e-bf80-4bd4-b049-219b7c464429';
export const CREDOS_TIME_EMPLOYEE_JOB_TITLE_FIELD_ID = 'bcfaaf12-5e9a-4eb1-b5d5-4ac6eb2a340b';
export const CREDOS_TIME_EMPLOYEE_ACTIVE_FIELD_ID = 'c2dca599-9ba4-4a03-aca4-75dd1008b079';
// isManager — признак руководителя (для UI-gate approve/reject + резолва в logic).
export const CREDOS_TIME_EMPLOYEE_IS_MANAGER_FIELD_ID = '2f8a6d31-4c7e-4b59-9a0d-7e1f3c2b5a48';
// Department
export const CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID = '474dd507-0969-4a74-a981-2da5ede39fe0';
export const CREDOS_TIME_DEPARTMENT_APPROVAL_REQUIRED_FIELD_ID = 'b399c04e-af37-48cc-ae3e-b6899776c174';
export const CREDOS_TIME_DEPARTMENT_HEADCOUNT_FIELD_ID = '4837bf7d-a05d-4b2b-b71c-53f463fe586f';

// --- Wave 3 (NAV): views, navigation, доп. роль ---
// Index-views по видимым объектам.
export const CREDOS_TIME_PROJECT_VIEW_UNIVERSAL_IDENTIFIER = '5a5098fb-301a-479e-8735-347316276b7e';
export const CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER = 'e72dca28-ea0d-456d-9ccd-12d0ff8950dc';
export const CREDOS_TIME_WORK_TYPE_VIEW_UNIVERSAL_IDENTIFIER = '983c0a78-7b5d-4434-a034-1447efa63ea0';
export const CREDOS_TIME_EMPLOYEE_VIEW_UNIVERSAL_IDENTIFIER = '872b14e9-fb6f-4432-89cd-3a6f31e5d02e';
export const CREDOS_TIME_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER = '32b7139e-62d8-4d82-9081-44aae55df1aa';

// Папка-раздел сайдбара «Трудозатраты» + VIEW-пункты.
export const CREDOS_TIME_FOLDER_NAV_UNIVERSAL_IDENTIFIER = 'bae6423b-6e21-4c4d-85c9-3d8536f2d622';
export const CREDOS_TIME_PROJECT_NAV_UNIVERSAL_IDENTIFIER = '840e3e4f-d51a-4ef0-9209-d5fe7b4c9d36';
export const CREDOS_TIME_ENTRY_NAV_UNIVERSAL_IDENTIFIER = '73384582-0e91-42c4-b4e8-e02fe202243a';
export const CREDOS_TIME_WORK_TYPE_NAV_UNIVERSAL_IDENTIFIER = '5538fce4-106f-49fe-b86f-81833e40a2f7';
export const CREDOS_TIME_EMPLOYEE_NAV_UNIVERSAL_IDENTIFIER = 'b3ab42c9-ae43-4fa0-83f2-c239eb874dd4';
export const CREDOS_TIME_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER = '487b1d25-cba4-4c8d-9732-ccb3d8ba1e8f';

// Роль «Руководитель» (defineRole — доп. к defineApplicationRole).
export const CREDOS_TIME_MANAGER_ROLE_UNIVERSAL_IDENTIFIER = '68211cf6-bc05-422a-b6e4-619d5edc5e51';

// --- Аудит карточка↔вид: недостающие field-id скаляров (для колонок views) ---
// Stage
export const CREDOS_TIME_STAGE_CODE_FIELD_ID = '4eda4ffc-d036-4303-80b2-5242bce0a230';
export const CREDOS_TIME_STAGE_STATUS_FIELD_ID = 'e977847f-c8f0-4861-a4c1-394439120092';
export const CREDOS_TIME_STAGE_PLANNED_EFFORT_FIELD_ID = '5d03bd03-64f1-4e50-bda6-3341c9b2fab6';
// BillingLink
export const CREDOS_TIME_BILLING_LINK_DOC_TYPE_FIELD_ID = '18e4cb45-e0da-449f-93bf-6a17d2f2990e';
export const CREDOS_TIME_BILLING_LINK_NUMBER_FIELD_ID = '13016dc3-ea4b-4bb5-a16c-6ad570f65590';
export const CREDOS_TIME_BILLING_LINK_DATE_FIELD_ID = 'e64d1709-b946-4b7d-9ebb-9dc35336efc6';
export const CREDOS_TIME_BILLING_LINK_AMOUNT_FIELD_ID = '39033db2-262f-4093-bb4e-f8e11d62e10f';

// --- Аудит карточка↔вид: views/nav для Stage и BillingLink + RECORD_PAGE записи ---
export const CREDOS_TIME_STAGE_VIEW_UNIVERSAL_IDENTIFIER =
  '86f2e59f-156e-4b6f-ad13-e145cbdaedd6';
export const CREDOS_TIME_STAGE_NAV_UNIVERSAL_IDENTIFIER =
  'f58acaec-4f07-4af5-91fb-8141de1096cd';
export const CREDOS_TIME_BILLING_LINK_VIEW_UNIVERSAL_IDENTIFIER =
  '4e209a10-a49e-4738-b946-2851facdb687';
export const CREDOS_TIME_BILLING_LINK_NAV_UNIVERSAL_IDENTIFIER =
  'c4e0a767-96b0-477a-a47d-2a370c792174';

// RECORD_PAGE карточки записи трудозатрат (FIELDS-виджет, привязанный к view).
export const CREDOS_TIME_ENTRY_RECORD_PAGE_UNIVERSAL_IDENTIFIER =
  '1700b11e-d20b-4876-acd8-95a8ab097b31';
export const CREDOS_TIME_ENTRY_RECORD_PAGE_TAB_UNIVERSAL_IDENTIFIER =
  '4691705a-0eef-435a-8aa7-f58a93ab4ddd';
export const CREDOS_TIME_ENTRY_RECORD_PAGE_FIELDS_WIDGET_UNIVERSAL_IDENTIFIER =
  '407ae943-4596-448c-8e64-7582f6f79444';

// --- Wave 5 (GRID): недельная сетка трудозатрат ---
// Front-компонент сетки (заменяет заглушку main-page как виджет «Трудозатраты»).
export const WEEKLY_GRID_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  'e948a1b9-d06c-4f4b-9bfd-599455585b37';
// Logic-функция /s/time-entry (CRUD трудозатрат для песочницы).
export const TIME_ENTRY_API_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '7f6f5390-cac7-486e-b164-a2f459d07fee';

// --- Wave 5 (APPROVAL): согласование трудозатрат (отключаемое) ---
// Logic-функция /s/approval (submit/approve/reject, фиксирует userWorkspaceId).
export const APPROVAL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '00a4d3f7-a783-4bb8-a71c-4142d9c0aabc';
// View «Согласование» (записи со status=SUBMITTED) + nav-пункт в папке Трудозатраты.
export const CREDOS_TIME_APPROVAL_VIEW_UNIVERSAL_IDENTIFIER =
  '6ad54e03-9826-4ce2-8929-5c107ce1ca02';
export const CREDOS_TIME_APPROVAL_NAV_UNIVERSAL_IDENTIFIER =
  '5da29a3c-b90a-4ff2-b2c1-7463317c50b4';

// --- Wave 6 (CALENDAR): производственный календарь РФ как отдельный слой ---
// Объект credosTimeWorkdayCalendar + поля + view + nav.
export const CREDOS_TIME_WORKDAY_CALENDAR_OBJECT_UNIVERSAL_IDENTIFIER =
  '206d979f-0c3a-4d76-82ea-e543afb3f146';
export const CREDOS_TIME_WORKDAY_CALENDAR_DATE_FIELD_ID =
  '4a0a073a-e00c-4382-9b50-93264c593b8f';
export const CREDOS_TIME_WORKDAY_CALENDAR_YEAR_FIELD_ID =
  'ed4a5c40-4a56-4b7c-9beb-ad17554c7e09';
export const CREDOS_TIME_WORKDAY_CALENDAR_DAY_TYPE_FIELD_ID =
  'ff00305b-7a6c-4918-af28-40dbd683220f';
export const CREDOS_TIME_WORKDAY_CALENDAR_HOURS_FIELD_ID =
  '65703841-22b2-43a4-b1b0-a947002c9470';
export const CREDOS_TIME_WORKDAY_CALENDAR_NOTE_FIELD_ID =
  'cc7eb085-202c-4989-bdb5-3173c2465fdb';
export const CREDOS_TIME_WORKDAY_CALENDAR_VIEW_UNIVERSAL_IDENTIFIER =
  '33286f0d-b90b-4901-996f-91547dc082a4';
export const CREDOS_TIME_WORKDAY_CALENDAR_NAV_UNIVERSAL_IDENTIFIER =
  '5fd15351-7b5e-4173-82c8-4b4da82511d5';

// --- Wave 7 (CAPACITY): доска планирования загрузки (front-компонент) ---
export const CAPACITY_BOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  'ac6fb962-c0be-4063-af73-984ba87d7b3a';
export const CAPACITY_NAV_UNIVERSAL_IDENTIFIER =
  '818f6f57-e586-4f89-ae88-fb4bf632b637';
export const CAPACITY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  'c7656105-cff5-4b35-9012-c5d244114cb6';
export const CAPACITY_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  '74fec04c-7f71-4fbc-90fa-57c21fbbf890';
export const CAPACITY_PAGE_WIDGET_UNIVERSAL_IDENTIFIER =
  '5686436d-2411-4baf-b259-0dcfdb1ff8c9';

// --- Wave 8 (PROJECT CARD): развитая карточка проекта со вкладками ---
// Скаляры проекта, ещё не вынесенные в константы (start/end date — для card-view).
export const CREDOS_TIME_PROJECT_START_DATE_FIELD_ID =
  '3f9b3e3d-0d24-4b30-953e-5cce9eb66c77';
export const CREDOS_TIME_PROJECT_END_DATE_FIELD_ID =
  'e8e46a47-b290-4350-972a-66025062005c';

// Карточные FIELDS-view проекта (UNLISTED-по-смыслу: без navigationMenuItem не
// попадают в сайдбар; нужны как «набор полей» для FIELDS-виджетов вкладок).
export const CREDOS_TIME_PROJECT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER =
  '7d88d159-102a-4ef5-897b-e13e952aa046';
export const CREDOS_TIME_PROJECT_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER =
  '80cece12-aa42-4f32-ade7-6574deb7f779';
export const CREDOS_TIME_PROJECT_CARD_STAGES_VIEW_UNIVERSAL_IDENTIFIER =
  '4bdfcd9c-96c2-4b5b-801b-e73ea7536a89';
export const CREDOS_TIME_PROJECT_CARD_BILLING_LINKS_VIEW_UNIVERSAL_IDENTIFIER =
  '97ce0abd-ed3e-484e-ba5d-5217cc425624';

// RECORD_PAGE карточки проекта + табы + виджеты.
export const CREDOS_TIME_PROJECT_RECORD_PAGE_UNIVERSAL_IDENTIFIER =
  '695a4d50-6a2d-48a1-ab77-3bc488a73193';
// Табы.
export const CREDOS_TIME_PROJECT_RP_TAB_OVERVIEW_UNIVERSAL_IDENTIFIER =
  '2612a094-74e3-4588-979b-378960207869';
export const CREDOS_TIME_PROJECT_RP_TAB_TIME_ENTRIES_UNIVERSAL_IDENTIFIER =
  '09436b95-62f0-42bb-92bd-8eed63b0b90e';
export const CREDOS_TIME_PROJECT_RP_TAB_STAGES_UNIVERSAL_IDENTIFIER =
  'f34942cd-fc8d-4df4-9b65-ef28cea08b87';
export const CREDOS_TIME_PROJECT_RP_TAB_BILLING_UNIVERSAL_IDENTIFIER =
  '20f9a78e-fd80-41f6-92e1-0c67a6371648';
export const CREDOS_TIME_PROJECT_RP_TAB_BUDGET_UNIVERSAL_IDENTIFIER =
  '9e6c278e-b402-47b8-a27b-e59e02bc21c4';
export const CREDOS_TIME_PROJECT_RP_TAB_TEAM_UNIVERSAL_IDENTIFIER =
  '71e5c363-7dc7-470a-998f-e33cabf88241';
export const CREDOS_TIME_PROJECT_RP_TAB_DOCS_UNIVERSAL_IDENTIFIER =
  'd53b719e-65ff-482c-9c14-0dd5de2305df';
// Виджеты.
export const CREDOS_TIME_PROJECT_RP_W_OVERVIEW_UNIVERSAL_IDENTIFIER =
  'b68d8700-fe21-42b8-a6ca-63f75d056f8a';
export const CREDOS_TIME_PROJECT_RP_W_TIME_ENTRIES_UNIVERSAL_IDENTIFIER =
  '1591e699-2e66-49af-9d23-2ade28f75144';
export const CREDOS_TIME_PROJECT_RP_W_STAGES_UNIVERSAL_IDENTIFIER =
  'dbafd322-b18b-4094-b7c7-a852b6acf30d';
export const CREDOS_TIME_PROJECT_RP_W_BILLING_UNIVERSAL_IDENTIFIER =
  '9710c992-3e65-481e-a0a5-bcf8e0072c2c';
export const CREDOS_TIME_PROJECT_RP_W_BUDGET_UNIVERSAL_IDENTIFIER =
  '3fb67a21-a8b8-4ca6-bc11-231154e01865';
export const CREDOS_TIME_PROJECT_RP_W_TEAM_UNIVERSAL_IDENTIFIER =
  '36ea47c9-bdd0-4627-a13b-20a35300bee0';
export const CREDOS_TIME_PROJECT_RP_W_DOCS_UNIVERSAL_IDENTIFIER =
  'c44c8f2a-62ff-4a77-916a-7113a97c4700';
// Front-component вкладки «Команда» (агрегат участников из записей проекта).
export const CREDOS_TIME_PROJECT_TEAM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '7c3e9b14-2a6d-4f81-b5e0-9d4a1c8f2e63';
// Доп. viewField-UUID для card-view (колонки).
export const CREDOS_TIME_PROJECT_CARD_VF_1 = '2d3d5289-4d74-4f1b-b007-02d33f9d4d2f';
export const CREDOS_TIME_PROJECT_CARD_VF_2 = '98efe4a1-4425-4715-afb2-70118f2224db';
export const CREDOS_TIME_PROJECT_CARD_VF_3 = '27b0f7e2-d2bd-47fa-a2ca-05f0bb50cd60';
export const CREDOS_TIME_PROJECT_CARD_VF_4 = '7fc790c3-f9a9-43dc-b5fe-e426f4ca666d';
export const CREDOS_TIME_PROJECT_CARD_VF_5 = '94bccf56-ad28-48ca-bd23-cf0b1058a258';

// --- Wave 2 (REPORTS): агрегатная аналитика /s/reports ---
// Logic-функция /s/reports (утилизация + загрузка/недогруз, группировки
// dept/project/employee). Контракт для Dev 1 — docs/data-model/REPORTS_CONTRACT.md.
export const REPORTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '5536742c-7217-41c3-a2a6-8d0788f9bd88';

// --- Wave 2 (REPORTS UI, Dev 1): дашборд «Отчёты» (front + nav + page-layout) ---
// Front-component дашборда (KPI утилизации + таблица среза, данные /s/reports).
export const REPORTS_DASHBOARD_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  'df4eeaa5-c93e-4f72-b078-8e22e8588441';
export const REPORTS_NAV_UNIVERSAL_IDENTIFIER =
  '9fa480ba-c8f3-4cb0-b293-78d27baae6bf';
export const REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  'cd8d9f98-05e3-4b6a-8034-2f634749d839';
export const REPORTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  'd949bca4-2f10-4d1f-82c8-2f7b8adc44bd';
export const REPORTS_PAGE_WIDGET_UNIVERSAL_IDENTIFIER =
  '4e31f950-d85f-480d-bd32-acf20e53407b';

// Front-component вкладки «Бюджет» карточки проекта (план vs факт из /s/reports byProject).
export const CREDOS_TIME_PROJECT_BUDGET_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '3e9489b0-49a8-49ca-bf13-f0c0a0558cce';

// --- Wave 3 (F-D): Отсутствия (отпуск/больничный) — влияют на ёмкость capacity ---
export const CREDOS_TIME_ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER =
  'c5df028c-cd7e-490b-8276-b0d2d39237ea';
export const CREDOS_TIME_ABSENCE_TYPE_FIELD_ID = 'd8b77525-292d-481a-9fd8-d2f0ca1f40b8';
export const CREDOS_TIME_ABSENCE_EMPLOYEE_FIELD_ID = '8b62f9ad-4b76-4b86-8086-ecc1db12cbee';
export const CREDOS_TIME_ABSENCE_START_DATE_FIELD_ID = 'c7df6fc3-26a9-4e31-ab39-f4cd6c0ccc26';
export const CREDOS_TIME_ABSENCE_END_DATE_FIELD_ID = '3fda69c2-67b7-4269-a974-1859f0a1aecd';
export const CREDOS_TIME_ABSENCE_NOTE_FIELD_ID = 'e07f00d9-70de-496a-96ac-b56f27c79484';
export const CREDOS_TIME_ABSENCE_VIEW_UNIVERSAL_IDENTIFIER =
  '38e7dc8e-7410-412c-8c8b-3f37eee92748';
export const CREDOS_TIME_ABSENCE_NAV_UNIVERSAL_IDENTIFIER =
  'ba7945fb-3712-458e-a3c4-63e63988f778';
// Обратная сторона Absence.employee на Employee (ONE_TO_MANY).
export const CREDOS_TIME_EMPLOYEE_ABSENCES_FIELD_ID = 'f2e7b344-8634-4f5e-bccf-c3779af0694d';

// --- S1 (SETTINGS): подраздел Settings «Настройки Time Credos» (front-компонент, Dev1) ---
export const CREDOS_TIME_SETTINGS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  'f1a2b3c4-5d6e-4f70-8a91-b2c3d4e5f6a7';

// --- S2 (SETTINGS NAV, Dev1): пункт «Настройки» в сайдбаре «Трудозатраты» ---
// settingsCustomTab на 2.14 не рендерится сервером, поэтому тот же settings
// front-component выносим отдельной STANDALONE_PAGE-страницей (паттерн «Отчёты»).
export const CREDOS_TIME_SETTINGS_NAV_UNIVERSAL_IDENTIFIER =
  '1ea58d56-2e27-40b7-b3eb-4e6104a99fab';
export const CREDOS_TIME_SETTINGS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  '87a2dfd2-e4b7-4f36-8d1b-224c8d2f086b';
export const CREDOS_TIME_SETTINGS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  'd006e254-3cff-4c0a-8ad3-9c14fbe69c41';
export const CREDOS_TIME_SETTINGS_PAGE_WIDGET_UNIVERSAL_IDENTIFIER =
  '3ba5bd61-6d6e-4b9d-87a5-db57614acf65';

// --- CAL-D1 (CALENDAR): помесячный производственный календарь (front + страница, Dev1) ---
export const CALENDAR_MONTHLY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '0b1c2d3e-4f50-4617-8829-9a0b1c2d3e4f';
export const CALENDAR_MONTHLY_NAV_UNIVERSAL_IDENTIFIER =
  '1c2d3e4f-5061-4728-9930-ab1c2d3e4f50';
export const CALENDAR_MONTHLY_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  '2d3e4f50-6172-4839-8a41-bc2d3e4f5061';
export const CALENDAR_MONTHLY_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  '3e4f5061-7283-494a-9b52-cd3e4f506172';
export const CALENDAR_MONTHLY_PAGE_WIDGET_UNIVERSAL_IDENTIFIER =
  '4f506172-8394-4a5b-8c63-de4f50617283';

// --- SUMMARY: вкладка «Сводка» (1-я) карточки проекта — дашборд-саммари (Dev1) ---
export const CREDOS_TIME_PROJECT_SUMMARY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d';
export const CREDOS_TIME_PROJECT_RP_TAB_SUMMARY_UNIVERSAL_IDENTIFIER =
  '6b7c8d9e-0f1a-4b2c-9d3e-4f5a6b7c8d9e';
export const CREDOS_TIME_PROJECT_RP_W_SUMMARY_UNIVERSAL_IDENTIFIER =
  '7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e0f';

// --- REQ-0012 (DEPT-PLAN): плановая загрузка отдела БЕЗ проекта (резерв/пресейл-бронь) ---
// Объект credosTimeDeptPlan + поля + view + nav + обратная связь на Department.
export const CREDOS_TIME_DEPT_PLAN_OBJECT_UNIVERSAL_IDENTIFIER =
  '6e90db7b-ad77-4e50-84e5-d96bd309aa85';
// Скаляры объекта.
export const CREDOS_TIME_DEPT_PLAN_LABEL_FIELD_ID =
  'f4a35256-8f31-4ad5-9723-d3b1f29ebd09';
export const CREDOS_TIME_DEPT_PLAN_PLANNED_EFFORT_FIELD_ID =
  '9ac36cd9-47cc-463d-b250-ebf704ab89fd';
export const CREDOS_TIME_DEPT_PLAN_START_DATE_FIELD_ID =
  '04ff7a4b-60f3-40e5-97aa-efe361e33af7';
export const CREDOS_TIME_DEPT_PLAN_END_DATE_FIELD_ID =
  '25eeba36-6215-4293-b939-e1f4511554de';
export const CREDOS_TIME_DEPT_PLAN_CATEGORY_FIELD_ID =
  '284baef1-bd19-421d-b9d9-de840917d625';
// DeptPlan.department -> Department.deptPlans (MANY_TO_ONE + обратная ONE_TO_MANY).
export const CREDOS_TIME_DEPT_PLAN_DEPARTMENT_FIELD_ID =
  '29c236e7-2dbf-4955-8baf-291b67426803';
export const CREDOS_TIME_DEPARTMENT_DEPT_PLANS_FIELD_ID =
  '324ab6da-106a-4060-aa2b-4d7302076df2';
// Index-view + nav.
export const CREDOS_TIME_DEPT_PLAN_VIEW_UNIVERSAL_IDENTIFIER =
  '3b9e2ebc-92de-40b3-8a84-a19a894f77a4';
export const CREDOS_TIME_DEPT_PLAN_NAV_UNIVERSAL_IDENTIFIER =
  '5f7a2f23-eb17-43f8-a9d8-bcac6d1c214b';
