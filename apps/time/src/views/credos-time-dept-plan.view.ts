import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPT_PLAN_CATEGORY_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_END_DATE_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPT_PLAN_PLANNED_EFFORT_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_START_DATE_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0012: index-view плановых загрузок отдела без проекта.
// Колонки = отдел, категория, плановые часы, период.
export default defineView({
  universalIdentifier: CREDOS_TIME_DEPT_PLAN_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Плановые загрузки (без проекта)',
  objectUniversalIdentifier: CREDOS_TIME_DEPT_PLAN_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconCalendarStats',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '334bbf56-dc68-4bdb-9b0e-eacb3e4a44d7',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPT_PLAN_DEPARTMENT_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '01bf9439-0b66-4c1e-9d8a-a34a1025bf55',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPT_PLAN_CATEGORY_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '6d6f8b2a-1c44-4e9b-9d1e-7a2f0c5b3e84',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPT_PLAN_PLANNED_EFFORT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '7e8a9c3b-2d55-4f0c-8e2f-8b3a1d6c4f95',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPT_PLAN_START_DATE_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '8f9b0d4c-3e66-4a1d-9f30-9c4b2e7d50a6',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPT_PLAN_END_DATE_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
});
