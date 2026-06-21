import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_EMPLOYEE_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_CARD_VF_1,
  CREDOS_TIME_EMPLOYEE_CARD_VF_2,
  CREDOS_TIME_EMPLOYEE_CARD_VF_5,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_ASSIGNMENTS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_HEADED_DEPARTMENTS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Card-view «Сотрудник — отделы». Набор полей для FIELDS-виджета вкладки «Отделы»
// карточки сотрудника. Виден relation-field departmentAssignments (ONE_TO_MANY к
// credosTimeEmployeeDepartment) → ядро рендерит назначения ТЕКУЩЕГО сотрудника
// инлайн-таблицей (отдел + % FTE + начало/окончание), отфильтрованной по родителю
// автоматически, с нативной правкой (механизм Twenty, CARDS_VIEWS_AUDIT §6).
// lastName (labelIdentifier) обязан присутствовать в позиции 0.
// REQ-0011 follow-up: зеркало вкладки «Отделы» карточки проекта (REQ-0013 13a).
export default defineView({
  universalIdentifier:
    CREDOS_TIME_EMPLOYEE_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Сотрудник — отделы',
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconUsersGroup',
  key: ViewKey.INDEX,
  position: 12,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_CARD_VF_1,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_CARD_VF_2,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_ASSIGNMENTS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
    // REQ-0018 follow-up: «Руководит отделами» (headedDepartments) — обратная
    // сторона credosTimeDepartment.head. Список возглавляемых отделов инлайн.
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_CARD_VF_5,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_HEADED_DEPARTMENTS_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 360,
    },
  ],
});
