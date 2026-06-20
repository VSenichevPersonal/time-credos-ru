import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_BILLING_LINK_AMOUNT_FIELD_ID,
  CREDOS_TIME_BILLING_LINK_DATE_FIELD_ID,
  CREDOS_TIME_BILLING_LINK_DOC_TYPE_FIELD_ID,
  CREDOS_TIME_BILLING_LINK_NUMBER_FIELD_ID,
  CREDOS_TIME_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BILLING_LINK_PROJECT_FIELD_ID,
  CREDOS_TIME_BILLING_LINK_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Index-view связей с 1С. Колонки = номер, тип документа, проект, дата, сумма.
export default defineView({
  universalIdentifier: CREDOS_TIME_BILLING_LINK_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все связи с 1С',
  objectUniversalIdentifier: CREDOS_TIME_BILLING_LINK_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconLink',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '6deecaa9-e668-48ed-ba1a-0e6a7d324ecc',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BILLING_LINK_NUMBER_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'ca9612f0-13ae-4496-a7a8-0c63e26ded1b',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BILLING_LINK_DOC_TYPE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'f0f61c9b-b8be-4121-b135-da502dad43a8',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BILLING_LINK_PROJECT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'ea333610-ba3c-40e1-bb32-e2a17b825bba',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BILLING_LINK_DATE_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '7b14ceb8-1635-409e-951e-ac524a0c7810',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_BILLING_LINK_AMOUNT_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 140,
    },
  ],
});
