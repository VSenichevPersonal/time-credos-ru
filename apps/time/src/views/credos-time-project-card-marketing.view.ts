import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CAN_PUBLISH_ON_SITE_FIELD_ID,
  CREDOS_TIME_PROJECT_CARD_MARKETING_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_IS_PUBLISHED_FIELD_ID,
  CREDOS_TIME_PROJECT_MK_VF_1,
  CREDOS_TIME_PROJECT_MK_VF_2,
  CREDOS_TIME_PROJECT_MK_VF_3,
  CREDOS_TIME_PROJECT_MK_VF_4,
  CREDOS_TIME_PROJECT_NDA_LEVEL_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_PUBLISHED_URL_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — маркетинг». НЕ index-view сайдбара (нет navigationMenuItem):
// служит набором полей для FIELDS-виджета вкладки «Маркетинг» карточки проекта.
// Поля: уровень NDA, можно публиковать, опубликовано, ссылка на публикацию.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_MARKETING_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — маркетинг',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconSpeakerphone',
  key: ViewKey.INDEX,
  position: 20,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_1,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_NDA_LEVEL_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 320,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_2,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_CAN_PUBLISH_ON_SITE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_3,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_IS_PUBLISHED_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_4,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_PUBLISHED_URL_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 360,
    },
  ],
});
