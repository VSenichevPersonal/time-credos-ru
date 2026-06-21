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
// rejectComment — причина отклонения (заполняет /s/approval op=reject; сотрудник
// видит что исправить). Очищается при approve/повторном submit. UX-gap (Timetta).
export const CREDOS_TIME_ENTRY_REJECT_COMMENT_FIELD_ID = 'c9d4029f-f588-4bfe-86ca-2252870e8272';
// Уникальный индекс записи трудозатрат (SCOUT-B): защита factHours от дублей.
// UNIQUE(employeeId, projectId, workTypeId, date). БД-уровень — ловит дубли на
// ВСЕХ путях (REST/грид/CSV), кроме строк с NULL в ключе (PG: NULL != NULL) —
// остаток закрывает upsert-гард в /s/time-entry.
export const CREDOS_TIME_ENTRY_UNIQUE_INDEX_UNIVERSAL_IDENTIFIER =
  '5f51e5d2-4994-43c1-a4ce-d86a699d0024';
// IndexField-и уникального индекса (каждый требует собственный universalIdentifier).
export const CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_EMPLOYEE_ID =
  '9e746060-4e9c-4abf-be33-d40905234c6e';
export const CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_PROJECT_ID =
  '836fe60c-0f05-4a37-a55e-4f8bed98354a';
export const CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_WORK_TYPE_ID =
  '3fbc2636-b2ce-4c5e-8f96-1295cea2b278';
export const CREDOS_TIME_ENTRY_UNIQUE_INDEX_FIELD_DATE_ID =
  '67ea8110-ea38-41cf-91b1-554f5671eeda';
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

// --- REQ-0014 (SELF-SERVICE, Dev1): личный раздел «Мои трудозатраты» ---
// Front-component «Мои часы» + «Мои периоды» для ТЕКУЩЕГО юзера
// (useSelfEmployee.employeeId). Данные: /s/reports byEmployee (фильтр self) +
// /rest/credosTimeEntries (группировка по неделям со статусами). nav +
// STANDALONE_PAGE-страница (паттерн «Отчёты»).
export const MY_TIME_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '402a8f9f-1685-4939-88f3-57965f0fe13f';
export const MY_TIME_NAV_UNIVERSAL_IDENTIFIER =
  'b48b58ca-7590-48c2-89a2-f15701bb9cfa';
export const MY_TIME_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  'ec2ef5f4-df92-4d80-bf63-eb3a93376011';
export const MY_TIME_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  'c3e2448a-bf32-4b47-850b-a87102784c70';
export const MY_TIME_PAGE_WIDGET_UNIVERSAL_IDENTIFIER =
  '017bed6e-a0e6-4331-89b6-3ba17c3f0826';

// --- W3-2 (TAGS): теги записей трудозатрат (паттерн Kimai tags) ---
// MULTI_SELECT-поле tags на credosTimeEntry — свободные метки для срезов в
// отчётах. nullable (миграция). Опции: ENTRY_TAG_OPTIONS (select-options).
export const CREDOS_TIME_ENTRY_TAGS_FIELD_ID =
  '39113fed-1f5b-47f4-b357-5835994b9401';

// --- factHours rollup + budgetRemaining (Факт/Остаток в index-view «Все проекты») ---
// factHours = Σ credosTimeEntry.hours за всё время проекта (хранимое, полный ЖЦ:
// database-event триггеры created/updated/deleted + /s/time-entry + backfill).
// budgetRemaining = plannedEffort − factHours.
// Хранимые поля нужны для native index-view «Все проекты» (там только stored fields).
export const CREDOS_TIME_PROJECT_FACT_HOURS_FIELD_ID =
  'a3165791-e8ef-4883-b0c7-4fe88bebbda6';
export const CREDOS_TIME_PROJECT_BUDGET_REMAINING_FIELD_ID =
  '08ee9a38-44e2-4454-b289-5a0cf0c4b49a';

// database-event триггеры пересчёта factHours/budgetRemaining на credosTimeEntry.
// Закрывают пути мутации МИМО /s/time-entry (CSV-импорт, прямой грид, REST) →
// нет дрейфа на любом пути. По одной функции на событие (eventName — единичный).
export const PROJECT_FACT_ROLLUP_CREATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '2c1d6f4a-9b3e-4a87-8d52-1e6f0a7c4b91';
export const PROJECT_FACT_ROLLUP_UPDATED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '3d2e7a5b-0c4f-4b98-9e63-2f70b1d5c0a2';
export const PROJECT_FACT_ROLLUP_DELETED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '4e3f8b6c-1d50-4ca9-8f74-3081c2e6d1b3';

// --- REQ-0013 13a (MULTI-DEPT): проект участвует в нескольких отделах с долями ---
// Join-объект credosTimeProjectDepartment (project × department × plannedEffortShare
// в часах). Заменяет жёсткую связь project.departmentId для capacity-раскида: загрузка
// отдела = Σ долей проектов отдела. departmentId остаётся «основным отделом» + fallback.
// Обратные стороны: Project.departmentShares / Department.projectShares (ONE_TO_MANY).
export const CREDOS_TIME_PROJECT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER =
  '2a587986-7654-4708-92d7-22c6546da879';
export const CREDOS_TIME_PROJECT_DEPARTMENT_PROJECT_FIELD_ID =
  'abd0fe98-5e5b-46a5-ab8f-e179d5b2bc5c';
export const CREDOS_TIME_PROJECT_DEPARTMENT_DEPARTMENT_FIELD_ID =
  '66627a19-be51-4233-a2f2-b7ebcd15fb28';
export const CREDOS_TIME_PROJECT_DEPARTMENT_PLANNED_EFFORT_SHARE_FIELD_ID =
  '41a2d1c0-0ae0-4119-8561-3c68c4c53ab6';
export const CREDOS_TIME_PROJECT_DEPARTMENT_SHARES_FIELD_ID =
  '10f80455-c667-40eb-8514-2f9e16578e70';
export const CREDOS_TIME_DEPARTMENT_PROJECT_SHARES_FIELD_ID =
  '444f0ba8-e55f-48c4-a60d-e1ddcfe08755';
export const CREDOS_TIME_PROJECT_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER =
  '9ff4e0ab-a53c-4977-bae2-7f48bb326c77';
export const CREDOS_TIME_PROJECT_DEPARTMENT_NAV_UNIVERSAL_IDENTIFIER =
  'cac47fc6-5365-4603-8ef9-198a5e2d6034';

// --- REQ-0018: структура отделов (руководитель + иерархия) ---
// head — руководитель отдела (→ Employee, MANY_TO_ONE). Объективный источник
// «кто руковод» (питает isManager/approval-маршрутизацию/RBAC-скоуп). parentDepartment
// — вышестоящий отдел (self-relation, опц. иерархия для скоупинга). Обратные стороны:
// Employee.headedDepartments / Department.childDepartments.
export const CREDOS_TIME_DEPARTMENT_HEAD_FIELD_ID =
  '76aac183-f70e-4ec4-8bd3-0598c879f009';
export const CREDOS_TIME_EMPLOYEE_HEADED_DEPARTMENTS_FIELD_ID =
  'eb23c9d8-c0a2-4b9c-84d8-fe93c72c501e';
export const CREDOS_TIME_DEPARTMENT_PARENT_FIELD_ID =
  '0cb266f3-b7b2-411b-a1f3-8d8bbf8eafec';
export const CREDOS_TIME_DEPARTMENT_CHILDREN_FIELD_ID =
  '62ae19d5-ba13-4c7f-a71e-856e218e088c';

// Вкладка «Отделы» карточки проекта (доли отделов текущего проекта).
// nav-menu-item «Доли отделов» убран из сайдбара — атрибут перенесён в карточку.
// Tab + FIELDS-виджет на Project card-view, где виден relation-field departmentShares
// (ONE_TO_MANY) → ядро рендерит доли текущего проекта инлайн-таблицей (отдел + часы),
// нативная правка plannedEffortShare. % от plannedEffort — follow-up (front-component).
export const CREDOS_TIME_PROJECT_RP_TAB_DEPARTMENTS_UNIVERSAL_IDENTIFIER =
  '3fd9e306-6520-4f6c-ab0d-793cfbb9ccdc';
export const CREDOS_TIME_PROJECT_RP_W_DEPARTMENTS_UNIVERSAL_IDENTIFIER =
  '580a44c5-d5be-4ab0-8364-781868a68618';
// Виджет-реестр всех долей (RECORD_TABLE на INDEX-view объекта ProjectDepartment).
export const CREDOS_TIME_PROJECT_RP_W_DEPARTMENTS_REGISTRY_UNIVERSAL_IDENTIFIER =
  'eaed97e5-5166-45a0-bf1f-55009b0f2c60';
// Project card-view «Проект — отделы» (code + departmentShares relation).
export const CREDOS_TIME_PROJECT_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER =
  'b836a12c-f2c0-40e2-8795-646ef361bd1b';
export const CREDOS_TIME_PROJECT_CARD_VF_6 = '8a21935d-5f83-4946-b292-12e197675727';
export const CREDOS_TIME_PROJECT_CARD_VF_7 = '22ea7722-0edb-4b9b-b1af-4bc844712c53';

// --- REQ-0011 (FTE-HEADCOUNT): сотрудник × отдел(ы) в % FTE с датами ---
// Join-объект credosTimeEmployeeDepartment (employee × department × ftePercent
// × startDate × endDate). Зеркало REQ-0013 «Доли отделов проекта». Численность
// отдела = Σ(ftePercent/100) сотрудников с активной записью в периоде. Fallback:
// нет записей → старый count по employee.departmentId (100%). Управление —
// в карточке сотрудника (Dev1); index-view без отдельного nav-пункта.
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER =
  '562c89a6-6604-4447-ba20-acf1dc9c08eb';
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_EMPLOYEE_FIELD_ID =
  'adf953c7-e16f-4350-aa0c-a26823fb873e';
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_DEPARTMENT_FIELD_ID =
  'e9c4cf7f-ef58-44ae-8e86-997808694721';
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_FTE_PERCENT_FIELD_ID =
  'd3cdcfd7-3d4c-4a68-8d9c-53ddf305f697';
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_START_DATE_FIELD_ID =
  'c8c22fdb-7498-4bc3-8795-3517c0659947';
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_END_DATE_FIELD_ID =
  'a096e868-b5b4-4af2-90bd-5baa43413aa3';
// Обратная сторона на Employee (ONE_TO_MANY): назначения сотрудника на отделы.
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_ASSIGNMENTS_FIELD_ID =
  'c70dc6df-2bac-44cb-90fe-87cd99073b16';
// Обратная сторона на Department (ONE_TO_MANY): FTE-назначения сотрудников отдела.
export const CREDOS_TIME_DEPARTMENT_EMPLOYEE_ASSIGNMENTS_FIELD_ID =
  '696fe49f-d716-4a24-aefd-aeff7b7f8662';
// Index-view (для существования объекта; без отдельного nav-пункта).
export const CREDOS_TIME_EMPLOYEE_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER =
  '7df869ab-bedc-41cc-b35b-cb60193e4cff';

// REQ-0011 follow-up: карточка сотрудника (RECORD_PAGE) со вкладкой «Отделы» —
// назначения сотрудника на отделы в % FTE с датами (relation departmentAssignments,
// зеркало вкладки «Отделы» карточки проекта). Без отдельного nav-пункта.
export const CREDOS_TIME_EMPLOYEE_RECORD_PAGE_UNIVERSAL_IDENTIFIER =
  '6ef7b596-15e6-41ac-a738-0688d3f73419';
export const CREDOS_TIME_EMPLOYEE_RP_TAB_DEPARTMENTS_UNIVERSAL_IDENTIFIER =
  '20c79513-2136-441b-8158-77328646aeda';
export const CREDOS_TIME_EMPLOYEE_RP_W_DEPARTMENTS_UNIVERSAL_IDENTIFIER =
  '0dbfdee3-dc5e-44d7-b4ad-fef564200280';
export const CREDOS_TIME_EMPLOYEE_RP_W_DEPARTMENTS_REGISTRY_UNIVERSAL_IDENTIFIER =
  'e9991473-5f60-4259-bfdf-50dc2a8c759b';
// Card-view «Сотрудник — отделы» (FIELDS-виджет вкладки) + её view-fields.
export const CREDOS_TIME_EMPLOYEE_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER =
  'b21e3b7c-4580-45b6-8a4d-13cd48765a47';
export const CREDOS_TIME_EMPLOYEE_CARD_VF_1 =
  '9e92acc8-6dca-41dd-8a3e-312b7c5183a6';
export const CREDOS_TIME_EMPLOYEE_CARD_VF_2 =
  '425cf91a-05f3-489b-bb7a-f20a442d3f94';
// REQ-0018 follow-up. View-field «Руководит отделами» (headedDepartments,
// ONE_TO_MANY обратная сторона credosTimeDepartment.head) во вкладке «Отделы»
// карточки сотрудника. Read-only список возглавляемых отделов (правка head — в
// карточке отдела, вкладка «Обзор»).
export const CREDOS_TIME_EMPLOYEE_CARD_VF_5 =
  '0cfca133-16ea-43fd-94a8-d3e25958935d';

// Post-install бэкфилл REQ-0013 13a: project.departmentId → доля 100% в join.
// ЕДИНСТВЕННАЯ post-install функция приложения (SDK берёт E[0]) — будущие
// миграции добавляются В ЭТОТ ЖЕ handler, не отдельным файлом.
export const BACKFILL_PROJECT_DEPARTMENTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  '81b054aa-ce6a-4059-aab2-cb0401030b8d';

// F-E — HTTP-роут /s/reminders (mode=missing-timesheets): детект «кто не заполнил
// таймшит за текущую неделю» для UI-баннера/дайджеста. Доставка push/email —
// follow-up (SDK песочницы без нативных уведомлений).
export const REMINDERS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER =
  'c7e4b2a1-6f3d-4a90-bb15-2e8d4c9f7a36';

// --- REQ-0019: глобальный singleton настроек модуля (credosTimeSettings) ---
// Объект + 12 полей + index-view (для существования; правка в UI настроек, Dev1)
// + nav-menu-item. Сид 1 записи дефолтов — в общем post-install handler (миграция 3).
export const CREDOS_TIME_SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER =
  'da1db590-d718-4b6f-867a-f159c4d0dbec';
export const CREDOS_TIME_SETTINGS_NORM_HOURS_PER_DAY_FIELD_ID =
  'a39007e8-b9f9-4d4a-9e17-117dabeabd7d';
export const CREDOS_TIME_SETTINGS_WEEK_STARTS_ON_FIELD_ID =
  '5256a3fa-c819-4119-8158-46411675794b';
export const CREDOS_TIME_SETTINGS_PLANNING_HORIZON_WEEKS_FIELD_ID =
  '14ee283f-6296-4cc7-a6dd-7c08ff906b7c';
export const CREDOS_TIME_SETTINGS_DEFAULT_CAPACITY_FACTOR_FIELD_ID =
  'da596473-7439-49dc-9778-b98d904bfe97';
export const CREDOS_TIME_SETTINGS_DEFAULT_APPROVAL_REQUIRED_FIELD_ID =
  '953fc81c-dd0e-4f50-b010-e8f8e539df2e';
export const CREDOS_TIME_SETTINGS_APPROVAL_PERIOD_FIELD_ID =
  'f922c24b-3e37-4df6-afb8-e7df4773a0ab';
export const CREDOS_TIME_SETTINGS_OVERTIME_WARN_HOURS_FIELD_ID =
  'e1b635f2-c92a-4d16-82d5-feaf5364e4b5';
export const CREDOS_TIME_SETTINGS_FILL_TEMPLATE_HOURS_FIELD_ID =
  '4bd1574f-8e5e-461b-8722-44ebd05b4e61';
export const CREDOS_TIME_SETTINGS_REMINDER_ENABLED_FIELD_ID =
  '0de72740-43d1-4b31-906f-20e9824b4ae3';
export const CREDOS_TIME_SETTINGS_REMINDER_DAY_OF_WEEK_FIELD_ID =
  '16a02ee8-4478-484f-a3b4-1dd4e12587b6';
export const CREDOS_TIME_SETTINGS_REVEAL_EMPLOYEE_NAMES_FIELD_ID =
  '48f00ca8-bb8a-462c-922a-25dc729fb453';
export const CREDOS_TIME_SETTINGS_TENTATIVE_BOOKING_ENABLED_FIELD_ID =
  'e031ab36-23e0-42d4-92fd-4ef9fd0e0633';
export const CREDOS_TIME_SETTINGS_VIEW_UNIVERSAL_IDENTIFIER =
  'bc8bc1a0-e966-4eb9-94ac-ee1eec20fa19';
export const CREDOS_TIME_SETTINGS_OBJ_NAV_UNIVERSAL_IDENTIFIER =
  '061d5b66-df80-4eab-b484-5e020d6959eb';

// --- REQ-0016: связанность карточек (кросс-таблицы во вкладках) ---
// Переиспользуем нативный паттерн relation-FIELDS card-view (как «Отделы» в
// карточке проекта/сотрудника): FIELDS-виджет на card-view, где виден relation-
// field (ONE_TO_MANY) → ядро рендерит дочерние записи ТЕКУЩЕЙ сущности инлайн-
// таблицей, отфильтрованной по родителю, кликабельной в карточку дочерней
// записи (нативно). RECORD_TABLE-реестр (INDEX-view join-объекта) — полный
// список всех связей.

// Карточка отдела (RECORD_PAGE) — новый layout. Вкладки:
//  • «Сотрудники» — FTE-назначения отдела (relation employeeAssignments,
//    зеркало вкладки «Сотрудники» нет → берём join credosTimeEmployeeDepartment).
//  • «Проекты» — доли отдела в проектах (relation projectShares, join
//    credosTimeProjectDepartment).
// labelIdentifier отдела — авто-поле name (TEXT-поля нет); в card-view position 0
// показываем code (SELECT), как в index-view отдела.
export const CREDOS_TIME_DEPARTMENT_RECORD_PAGE_UNIVERSAL_IDENTIFIER =
  '85c05a27-58b9-4d40-9099-57fdbf040e09';
export const CREDOS_TIME_DEPARTMENT_RP_TAB_EMPLOYEES_UNIVERSAL_IDENTIFIER =
  '862313d2-c468-4c95-95eb-fda48047c8ce';
export const CREDOS_TIME_DEPARTMENT_RP_TAB_PROJECTS_UNIVERSAL_IDENTIFIER =
  '26ca6561-2e94-4007-8612-ba68dbda2cda';
export const CREDOS_TIME_DEPARTMENT_RP_W_EMPLOYEES_UNIVERSAL_IDENTIFIER =
  '8a12b336-f526-492f-b7d3-dc63555323ef';
export const CREDOS_TIME_DEPARTMENT_RP_W_EMPLOYEES_REGISTRY_UNIVERSAL_IDENTIFIER =
  'd3b6032c-c615-4744-aabd-c60adf3350c8';
export const CREDOS_TIME_DEPARTMENT_RP_W_PROJECTS_UNIVERSAL_IDENTIFIER =
  '7be1710c-d802-4df6-a630-7afbc6036cdb';
export const CREDOS_TIME_DEPARTMENT_RP_W_PROJECTS_REGISTRY_UNIVERSAL_IDENTIFIER =
  '584d4bca-0c3d-4cd1-be83-290ce525af28';
// Card-views «Отдел — сотрудники» / «Отдел — проекты» + их view-fields.
export const CREDOS_TIME_DEPARTMENT_CARD_EMPLOYEES_VIEW_UNIVERSAL_IDENTIFIER =
  '96d93edf-47c9-4f9b-9c86-2bfec78adeb7';
export const CREDOS_TIME_DEPARTMENT_CARD_PROJECTS_VIEW_UNIVERSAL_IDENTIFIER =
  'b83a9e57-68bd-4900-b3d5-29955aeaeca5';
export const CREDOS_TIME_DEPARTMENT_CARD_VF_1 =
  'f2c5a05a-03af-451f-8de1-ae1babba52ea';
export const CREDOS_TIME_DEPARTMENT_CARD_VF_2 =
  '588bbaf1-9443-48e2-a009-33d893f8d1d8';
export const CREDOS_TIME_DEPARTMENT_CARD_VF_3 =
  '080d5470-6d57-4707-99e5-c5f8d046477f';
export const CREDOS_TIME_DEPARTMENT_CARD_VF_4 =
  'e3ceb357-faff-41db-a58c-e303a33ec126';
// REQ-0018 follow-up. Вкладка «Обзор» карточки отдела: руководитель (head →
// Employee) + вышестоящий отдел (parentDepartment self) — нативные relation-поля
// (выбор+правка из коробки). + card-view «Отдел — обзор» и его view-fields.
export const CREDOS_TIME_DEPARTMENT_RP_TAB_OVERVIEW_UNIVERSAL_IDENTIFIER =
  '12e2b2bc-0493-4cc0-84d4-4012ae17393f';
export const CREDOS_TIME_DEPARTMENT_RP_W_OVERVIEW_UNIVERSAL_IDENTIFIER =
  '9d6e535c-c849-4345-8eab-06b9652d6c0e';
export const CREDOS_TIME_DEPARTMENT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER =
  'e2e5218b-c2cc-4d82-a9f2-f43895555ca0';
export const CREDOS_TIME_DEPARTMENT_CARD_OVF_1 =
  'ae6c6208-36bc-4cb5-a399-535a4c0b7241';
export const CREDOS_TIME_DEPARTMENT_CARD_OVF_2 =
  '7e01b427-c90b-46db-801e-37b4a6dc81d7';
export const CREDOS_TIME_DEPARTMENT_CARD_OVF_3 =
  'b8e663cd-cf4f-4ad0-9fc6-6dae4d8eac2d';

// Карточка сотрудника — вкладка «Трудозатраты» (relation timeEntries,
// ONE_TO_MANY). Записи сотрудника инлайн-таблицей, кликабельно в карточку записи
// (а из неё — в проект/этап). «Проекты, где работал» = агрегат записей по проекту
// → follow-up Dev2 (нет прямого relation employee↔project).
export const CREDOS_TIME_EMPLOYEE_RP_TAB_TIME_ENTRIES_UNIVERSAL_IDENTIFIER =
  'eebdb01d-d3c7-45e0-980a-a4804fd304c4';
export const CREDOS_TIME_EMPLOYEE_RP_W_TIME_ENTRIES_UNIVERSAL_IDENTIFIER =
  '0edf5fd7-7fba-4b4c-b398-f8380602b728';
export const CREDOS_TIME_EMPLOYEE_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER =
  '3835bfd7-cffb-4d9c-ab8b-414aee41dd9c';
export const CREDOS_TIME_EMPLOYEE_CARD_VF_3 =
  'f0a4d1ce-f2fe-462c-ad1a-e200dd02d8d0';
export const CREDOS_TIME_EMPLOYEE_CARD_VF_4 =
  'de2bdc80-0359-4ce0-88cd-fef67784a3a6';
