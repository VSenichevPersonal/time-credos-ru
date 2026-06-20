import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_WORKDAY_CALENDAR_DATE_FIELD_ID,
  CREDOS_TIME_WORKDAY_CALENDAR_DAY_TYPE_FIELD_ID,
  CREDOS_TIME_WORKDAY_CALENDAR_HOURS_FIELD_ID,
  CREDOS_TIME_WORKDAY_CALENDAR_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORKDAY_CALENDAR_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORKDAY_CALENDAR_YEAR_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Index-view производственного календаря. Колонки: дата, тип дня, часы, год.
export default defineView({
  universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Производственный календарь',
  objectUniversalIdentifier:
    CREDOS_TIME_WORKDAY_CALENDAR_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconCalendarStats',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: 'e991ef5d-e089-4f3b-8e93-ec2aec04020d',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORKDAY_CALENDAR_DATE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '163f500c-afec-4ddc-9632-512e0829346b',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORKDAY_CALENDAR_DAY_TYPE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '12f1a052-d700-4fd5-b115-4de073edba26',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORKDAY_CALENDAR_HOURS_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'a2a449c3-f852-4823-880b-733325148fe2',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORKDAY_CALENDAR_YEAR_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 100,
    },
  ],
});
