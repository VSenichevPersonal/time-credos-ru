import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_ENTRY_BILLABLE_FIELD_ID,
  CREDOS_TIME_ENTRY_DATE_FIELD_ID,
  CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_ENTRY_HOURS_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
  CREDOS_TIME_ENTRY_STATUS_FIELD_ID,
  CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view записей трудозатрат. Колонки = дата, часы, проект, работник, статус.
export default defineView({
  universalIdentifier: CREDOS_TIME_ENTRY_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все записи',
  objectUniversalIdentifier: CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconClock',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '69c9fe83-7def-4323-a8aa-70e3fd523d15',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_DATE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '212d1458-0b68-4f78-ba68-dd54b191b12b',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_HOURS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '5426904b-a60f-46f9-8825-8f2dffdb9b2d',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'bf735bfc-0151-478f-9b43-23b72096c041',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '2845674c-03b7-4e94-9069-d6dd9294439c',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_STATUS_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '1adff363-b9b6-41c7-ab69-d8ae82d127c9',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_BILLABLE_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 120,
    },
  ],
});
