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
      universalIdentifier: '696fe49f-d716-4a24-aefd-aeff7b7f8662'.replace(
        /./,
        (c) => c,
      ) as never,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_EMPLOYEE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 220,
    },
  ],
});
