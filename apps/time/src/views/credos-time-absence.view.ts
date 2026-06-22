import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_ABSENCE_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_ABSENCE_END_DATE_FIELD_ID,
  CREDOS_TIME_ABSENCE_NOTE_FIELD_ID,
  CREDOS_TIME_ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ABSENCE_START_DATE_FIELD_ID,
  CREDOS_TIME_ABSENCE_TYPE_FIELD_ID,
  CREDOS_TIME_ABSENCE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view отсутствий. Колонки = тип, работник, период, примечание.
export default defineView({
  universalIdentifier: CREDOS_TIME_ABSENCE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все отсутствия',
  objectUniversalIdentifier: CREDOS_TIME_ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconBeach',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '5a1f2c8e-9b3d-4e07-8a1c-2f6b0d4e9a71',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ABSENCE_TYPE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '6b2e3d9f-0c4e-4f18-9b2d-3a7c1e5f0b82',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ABSENCE_EMPLOYEE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '7c3f4e0a-1d5f-4029-ac3e-4b8d2f60ac93',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ABSENCE_START_DATE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '8d405f1b-2e60-4130-bd4f-5c9e3071bda4',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ABSENCE_END_DATE_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '9e516a2c-3f71-4241-ae50-6d0f4182ceb5',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ABSENCE_NOTE_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 260,
    },
  ],
});
