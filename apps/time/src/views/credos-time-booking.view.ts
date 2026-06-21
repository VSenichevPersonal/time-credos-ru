import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_BOOKING_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_BOOKING_END_DATE_FIELD_ID,
  CREDOS_TIME_BOOKING_HOURS_FIELD_ID,
  CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BOOKING_PROJECT_FIELD_ID,
  CREDOS_TIME_BOOKING_START_DATE_FIELD_ID,
  CREDOS_TIME_BOOKING_TYPE_FIELD_ID,
  CREDOS_TIME_BOOKING_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0004 Часть C: INDEX-view броней ресурсов (реестр). Колонки: сотрудник,
// проект, тип (soft/hard), часы, период. Источник для доски Demand (Dev1).
export default defineView({
  universalIdentifier: CREDOS_TIME_BOOKING_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Брони ресурсов',
  objectUniversalIdentifier: CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconCalendarPin',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: 'f0ef0ad9-f064-4fb7-8979-440ca97c61cf',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BOOKING_EMPLOYEE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'a3b1c9d4-7e52-4f08-9c1a-6b2d8e34f701',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BOOKING_PROJECT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'b7e2f3a8-1d64-4c90-8a52-3f9c6e0b1d28',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BOOKING_TYPE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'c8f3a4b9-2e75-4da1-9b63-4a0d7f1c2e39',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BOOKING_HOURS_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'd9a4b5c0-3f86-4eb2-8c74-5b1e8a2d3f40',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BOOKING_START_DATE_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'e0b5c6d1-4a97-4fc3-9d85-6c2f9b3e4051',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BOOKING_END_DATE_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 150,
    },
  ],
});
