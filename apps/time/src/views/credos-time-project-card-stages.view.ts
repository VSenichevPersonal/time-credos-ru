import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CARD_STAGES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_VF_3,
  CREDOS_TIME_PROJECT_CARD_VF_4,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_STAGES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — этапы». Набор полей для FIELDS-виджета вкладки «Этапы».
// Виден relation-field stages (ONE_TO_MANY) → инлайн-список этапов проекта.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_STAGES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — этапы',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconListTree',
  key: ViewKey.INDEX,
  position: 12,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_3,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_4,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_STAGES_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
