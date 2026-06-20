import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_STAGE_CODE_FIELD_ID,
  CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_PLANNED_EFFORT_FIELD_ID,
  CREDOS_TIME_STAGE_PROJECT_FIELD_ID,
  CREDOS_TIME_STAGE_STATUS_FIELD_ID,
  CREDOS_TIME_STAGE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view этапов. Колонки = код этапа, проект, статус, плановые часы.
export default defineView({
  universalIdentifier: CREDOS_TIME_STAGE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все этапы',
  objectUniversalIdentifier: CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconListTree',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '1d419ebb-ec8d-40bf-99a9-6f514413cca2',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_STAGE_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'abdb8a20-dfbb-42a7-9b6a-a8ca17e287a8',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_STAGE_PROJECT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '2b3a1bb3-4246-4bfc-ba13-dd73f77a21e6',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_STAGE_STATUS_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '2a122a0c-e862-4764-ae31-24f64d8fa501',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_STAGE_PLANNED_EFFORT_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 140,
    },
  ],
});
