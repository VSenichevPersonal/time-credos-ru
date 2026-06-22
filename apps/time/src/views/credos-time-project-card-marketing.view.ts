import {
  defineView,
  generateDefaultFieldUniversalIdentifier,
  ViewKey,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CAN_PUBLISH_ON_SITE_FIELD_ID,
  CREDOS_TIME_PROJECT_CAN_USE_IN_PROPOSALS_FIELD_ID,
  CREDOS_TIME_PROJECT_CAN_USE_LOGO_FIELD_ID,
  CREDOS_TIME_PROJECT_CARD_MARKETING_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CLIENT_INDUSTRY_FIELD_ID,
  CREDOS_TIME_PROJECT_CLIENT_MARKETING_CONSENT_FIELD_ID,
  CREDOS_TIME_PROJECT_CLIENT_UNSUBSCRIBED_FIELD_ID,
  CREDOS_TIME_PROJECT_IS_PUBLISHED_FIELD_ID,
  CREDOS_TIME_PROJECT_MK_VF_1,
  CREDOS_TIME_PROJECT_MK_VF_2,
  CREDOS_TIME_PROJECT_MK_VF_3,
  CREDOS_TIME_PROJECT_MK_VF_4,
  CREDOS_TIME_PROJECT_MK_VF_5,
  CREDOS_TIME_PROJECT_MK_VF_6,
  CREDOS_TIME_PROJECT_MK_VF_7,
  CREDOS_TIME_PROJECT_MK_VF_8,
  CREDOS_TIME_PROJECT_MK_VF_9,
  CREDOS_TIME_PROJECT_MK_VF_10,
  CREDOS_TIME_PROJECT_MK_VF_11,
  CREDOS_TIME_PROJECT_MK_VF_12,
  CREDOS_TIME_PROJECT_MK_VF_13,
  CREDOS_TIME_PROJECT_MK_VF_14,
  CREDOS_TIME_PROJECT_MK_VF_15,
  CREDOS_TIME_PROJECT_MARKETING_ACTUAL_ON_FIELD_ID,
  CREDOS_TIME_PROJECT_NDA_LEVEL_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_PUBLISHED_URL_FIELD_ID,
  CREDOS_TIME_PROJECT_REFERENCE_READY_FIELD_ID,
  CREDOS_TIME_PROJECT_REVIEW_PUBLISHED_FIELD_ID,
  CREDOS_TIME_PROJECT_REVIEW_URL_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — маркетинг». НЕ index-view сайдбара (нет navigationMenuItem):
// служит набором полей для FIELDS-виджета вкладки «Маркетинг» карточки проекта.
// Поля: уровень NDA, можно публиковать, опубликовано, ссылка на публикацию,
// опубликован отзыв, ссылка на отзыв, + sales-enablement (P1): можно в КП/тендерах,
// можно логотип, готов как референс, отрасль клиента, + рассылка/consent клиента
// (плейсхолдеры): согласие на рассылку, отписка.
// Нативное whole-record updatedAt ядра адресуется детерминированным UUID (объект+имя)
// БЕЗ объявления в objects/ — даёт «когда проект последний раз менялся» бесплатно.
const nativeFieldId = (fieldName: string): string =>
  generateDefaultFieldUniversalIdentifier({
    objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
    fieldName,
  });

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
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_5,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_REVIEW_PUBLISHED_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_6,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_REVIEW_URL_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 360,
    },
    // Группа «разрешения / sales-enablement» (P1, MARKETING_SALES_B2B §3).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_7,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_CAN_USE_IN_PROPOSALS_FIELD_ID,
      position: 6,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_8,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CAN_USE_LOGO_FIELD_ID,
      position: 7,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_9,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_REFERENCE_READY_FIELD_ID,
      position: 8,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_10,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_CLIENT_INDUSTRY_FIELD_ID,
      position: 9,
      isVisible: true,
      size: 220,
    },
    // Группа «рассылка / consent клиента» (плейсхолдеры): sync с сайтом +
    // Unisender и карточкой организации — follow-up.
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_11,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_CLIENT_MARKETING_CONSENT_FIELD_ID,
      position: 10,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_12,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_CLIENT_UNSUBSCRIBED_FIELD_ID,
      position: 11,
      isVisible: true,
      size: 240,
    },
    // Актуальность маркетинг-данных: ручная дата ревью + нативные whole-record
    // updatedAt/updatedBy ядра (бесплатно, без объявления полей) — «когда менялся»
    // и «кто менял». Per-field детализация «какое поле кто/когда» — в credosTimeMarketingLog
    // (см. marketingLogs relation в карточке проекта).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_13,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_MARKETING_ACTUAL_ON_FIELD_ID,
      position: 12,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_14,
      fieldMetadataUniversalIdentifier: nativeFieldId('updatedAt'),
      position: 13,
      isVisible: true,
      size: 200,
    },
    // Нативный updatedBy ядра — «кто последним менял запись» (whole-record), бесплатно.
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MK_VF_15,
      fieldMetadataUniversalIdentifier: nativeFieldId('updatedBy'),
      position: 14,
      isVisible: true,
      size: 220,
    },
  ],
});
