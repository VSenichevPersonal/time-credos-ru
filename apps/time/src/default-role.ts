import { defineApplicationRole } from 'twenty-sdk/define';

import {
  APP_DISPLAY_NAME,
  CREDOS_TIME_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORKDAY_CALENDAR_OBJECT_UNIVERSAL_IDENTIFIER,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Объекты модуля, которыми оперируют logic-functions под токеном приложения.
// /s/time-entry op:delete делает REST DELETE (soft-delete) по credosTimeEntries.
const CREDOS_TIME_OBJECT_IDS = [
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORKDAY_CALENDAR_OBJECT_UNIVERSAL_IDENTIFIER,
];

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: `${APP_DISPLAY_NAME} default function role`,
  description: `${APP_DISPLAY_NAME} default function role`,
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  // [bug]#1: REST DELETE /rest/credosTimeEntries (soft-delete) падал 400
  // PERMISSION_DENIED — токену приложения не хватало soft-delete. Включаем
  // на уровне роли + дублируем явно per-object ниже (надёжный re-sync
  // манифеста при install/deploy, least-privilege на объекты модуля).
  canSoftDeleteAllObjectRecords: true,
  // destroy (hard-delete) остаётся запрещён: удаление через app — только
  // soft-delete (восстановимо, не ломает аудит/связи). CISO-002 separation
  // касается approve, не delete (least-privilege соблюдён).
  canDestroyAllObjectRecords: false,
  objectPermissions: CREDOS_TIME_OBJECT_IDS.map(
    (objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: true,
      canDestroyObjectRecords: false,
    }),
  ),
});
