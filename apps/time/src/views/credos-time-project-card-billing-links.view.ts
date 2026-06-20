import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_BILLING_LINKS_FIELD_ID,
  CREDOS_TIME_PROJECT_CARD_BILLING_LINKS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_VF_5,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — связи с 1С». Набор полей для FIELDS-виджета вкладки.
// Виден relation-field billingLinks (ONE_TO_MANY) → инлайн-список документов 1С
// (номер/тип/дата/сумма из самой связи). Задел под финансовый контур.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_BILLING_LINKS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — связи с 1С',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconLink',
  key: ViewKey.INDEX,
  position: 13,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_5,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'a1c0e7d2-3b44-4f8e-9c61-7d2e5f8a1b03',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_BILLING_LINKS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
