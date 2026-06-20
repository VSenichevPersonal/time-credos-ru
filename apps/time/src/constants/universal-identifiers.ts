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
