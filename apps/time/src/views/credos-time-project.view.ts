import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CATEGORY_FIELD_ID,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PROJECT_MANAGER_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_PLANNED_EFFORT_FIELD_ID,
  CREDOS_TIME_PROJECT_STATUS_FIELD_ID,
  CREDOS_TIME_PROJECT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view проектов. Колонки = код, категория, статус, клиент, отдел,
// руководитель, плановые часы.
export default defineView({
  universalIdentifier: CREDOS_TIME_PROJECT_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все проекты',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconFolder',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: 'e15e07fb-f7e6-4b84-9878-f730b3581cf1',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '504eae6d-e471-4f60-93fd-a6a3f16719b1',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CATEGORY_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '56ce0475-0f46-4287-a212-6c688010cce6',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_STATUS_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '673ea9b8-74cd-4e0f-8f36-a15e33c9ffb3',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '5a115bd2-f2d2-45b3-9aa0-7ae1fc8d353f',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'cd89cdbc-3161-4eba-bfbb-d8682ee507a9',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_MANAGER_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'e04d79e6-cd68-4f87-b21e-620e581ca0bc',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_PLANNED_EFFORT_FIELD_ID,
      position: 6,
      isVisible: true,
      size: 140,
    },
  ],
});
