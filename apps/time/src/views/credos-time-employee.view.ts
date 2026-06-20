import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_EMPLOYEE_ACTIVE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_FIRST_NAME_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_JOB_TITLE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view работников. Колонки = ФИО, должность, отдел, активность.
export default defineView({
  universalIdentifier: CREDOS_TIME_EMPLOYEE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все работники',
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconUser',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '1f4268c6-8aff-4042-b490-d5dff4aa54cb',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'a5d3c8aa-56b5-442c-9133-ae0946ff65b8',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_FIRST_NAME_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd19ce75a-7faa-459f-a6ef-9d8f06b22116',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_JOB_TITLE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '43dc3f28-f880-4721-904d-88310c31b9b5',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_DEPARTMENT_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '17ba5463-ed18-40a2-b469-db4df0841add',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_ACTIVE_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 120,
    },
  ],
});
