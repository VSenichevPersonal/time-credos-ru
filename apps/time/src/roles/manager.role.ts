import { defineRole } from 'twenty-sdk/define';

import {
  CREDOS_TIME_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_MANAGER_ROLE_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Роль «Руководитель»: расширенные права на все объекты модуля трудозатрат —
// чтение/правка всех записей, согласование, управление проектами и справочниками.
// Доп. роль к defineApplicationRole (сотрудник) — назначается пользователям вручную.
const CREDOS_TIME_OBJECT_IDS = [
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
];

export default defineRole({
  universalIdentifier: CREDOS_TIME_MANAGER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Руководитель',
  description:
    'Расширенные права на объекты модуля трудозатрат: правка всех записей, согласование, управление проектами',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: false,
  objectPermissions: CREDOS_TIME_OBJECT_IDS.map((objectUniversalIdentifier) => ({
    objectUniversalIdentifier,
    canReadObjectRecords: true,
    canUpdateObjectRecords: true,
    canSoftDeleteObjectRecords: true,
    canDestroyObjectRecords: false,
  })),
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});
