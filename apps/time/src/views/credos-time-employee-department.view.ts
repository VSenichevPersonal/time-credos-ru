import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_FTE_PERCENT_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_START_DATE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0011: INDEX-view объекта credosTimeEmployeeDepartment (для существования
// объекта; ядро требует хотя бы одну view). БЕЗ отдельного nav-пункта в сайдбаре —
// управление назначениями FTE будет в карточке сотрудника (relation
// departmentAssignments, Dev1), как у долей отделов в карточке проекта (REQ-0013).
// Колонки = сотрудник, отдел, % FTE, начало действия — полный реестр назначений.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_EMPLOYEE_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Назначения в отделы (FTE)',
  objectUniversalIdentifier:
    CREDOS_TIME_EMPLOYEE_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconUsersGroup',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '985cf32c-98ef-4121-a270-d0291d9c32a9',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_EMPLOYEE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '28fcce18-2eaf-4262-b122-c71d05c8a989',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_DEPARTMENT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '710d6b89-a38d-40b9-a747-12b7f7ace2ed',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_FTE_PERCENT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '4eb3aab5-86a8-4c7d-bf1d-ddebc578daac',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_START_DATE_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
});
