import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_APPROVAL_REQUIRED_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_HEAD_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_HEADCOUNT_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PARENT_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view отделов. Колонки = код, согласование, численность.
export default defineView({
  universalIdentifier: CREDOS_TIME_DEPARTMENT_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все отделы',
  objectUniversalIdentifier: CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconBuilding',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: 'da6c14d6-e996-48d2-981e-456217bb8f7b',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: '4f24769e-a93f-48bf-889b-d25ba1c17164',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_APPROVAL_REQUIRED_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '1c80baf3-c5da-4680-90fb-7eb43323713f',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_HEADCOUNT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 140,
    },
    // REQ-0018: руководитель + вышестоящий отдел.
    {
      universalIdentifier: '448334ab-2780-4a20-8da1-2d81b3093527',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_HEAD_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '732d8d96-a011-4255-99ab-06a884e0f98a',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_PARENT_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 200,
    },
  ],
});
