import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_WORK_TYPE_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_GROUP_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_NAME_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view справочника видов работ. Колонки = наименование, группа, отдел.
export default defineView({
  universalIdentifier: CREDOS_TIME_WORK_TYPE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все виды работ',
  objectUniversalIdentifier: CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconListCheck',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    // P1: наименование = labelIdentifier → позиция 0 (требование ядра).
    {
      universalIdentifier: '44331f06-0ee7-4b2f-b465-80bb330ae01f',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_WORK_TYPE_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: '7c3d7ef4-50ed-4ddb-a95b-338e5241c92a',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_WORK_TYPE_GROUP_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '69fc7f3b-0966-430f-81b8-4cbd18cdd4d5',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_WORK_TYPE_DEPARTMENT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 240,
    },
  ],
});
