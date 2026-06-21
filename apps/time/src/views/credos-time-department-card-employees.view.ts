import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_CARD_EMPLOYEES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_CARD_VF_1,
  CREDOS_TIME_DEPARTMENT_CARD_VF_2,
  CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_EMPLOYEE_ASSIGNMENTS_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0016. Card-view «Отдел — сотрудники». Набор полей для FIELDS-виджета вкладки
// «Сотрудники» карточки отдела. Виден relation-field employeeAssignments
// (ONE_TO_MANY к credosTimeEmployeeDepartment) → ядро рендерит FTE-назначения
// ТЕКУЩЕГО отдела инлайн-таблицей (сотрудник + % FTE + начало/окончание),
// отфильтрованной по родителю автоматически, кликабельной в карточку назначения
// (а из неё — в карточку сотрудника). Паттер зеркалит «Отделы» карточки сотрудника.
// position 0 — code (контекст), у отдела нет TEXT labelIdentifier (см. index-view).
export default defineView({
  universalIdentifier:
    CREDOS_TIME_DEPARTMENT_CARD_EMPLOYEES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Отдел — сотрудники',
  objectUniversalIdentifier: CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconUsersGroup',
  key: ViewKey.INDEX,
  position: 13,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_CARD_VF_1,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_CARD_VF_2,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_EMPLOYEE_ASSIGNMENTS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
