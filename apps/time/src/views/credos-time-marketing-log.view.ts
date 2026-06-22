import { defineView, ViewKey, ViewSortDirection } from 'twenty-sdk/define';

import {
  CREDOS_TIME_MARKETING_LOG_ACTOR_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_CHANGED_AT_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_FIELD_NAME_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_NEW_VALUE_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_MARKETING_LOG_OLD_VALUE_FIELD_ID,
  CREDOS_TIME_MARKETING_LOG_VF_1,
  CREDOS_TIME_MARKETING_LOG_VF_2,
  CREDOS_TIME_MARKETING_LOG_VF_3,
  CREDOS_TIME_MARKETING_LOG_VF_4,
  CREDOS_TIME_MARKETING_LOG_VF_5,
  CREDOS_TIME_MARKETING_LOG_VIEW_SORT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_MARKETING_LOG_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// MARKETING-LOG: index-view per-field журнала изменений маркетинг-полей проекта.
// Колонки = поле, было, стало, кто, когда. Сортировка по времени DESC (свежие сверху).
//
// ТЕХНИЧЕСКИЙ view (как entry-log): nav-item из сайдбара НАМЕРЕННО убран — журнал не для
// повседневной навигации; доступен по прямой ссылке для админ-аудита. Объект ОБЯЗАН
// иметь index-view (SDK-pitfall). Исключён из nav-guard через TECHNICAL_VIEWS
// (schema-guard.test.ts).
export default defineView({
  universalIdentifier: CREDOS_TIME_MARKETING_LOG_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Журнал изменений маркетинга',
  objectUniversalIdentifier: CREDOS_TIME_MARKETING_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconHistory',
  key: ViewKey.INDEX,
  position: 0,
  // Свежие изменения сверху (DESC по времени лога).
  sorts: [
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_VIEW_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_MARKETING_LOG_CHANGED_AT_FIELD_ID,
      direction: ViewSortDirection.DESC,
    },
  ],
  fields: [
    // fieldName = labelIdentifier (заголовок строки) → позиция 0 (иначе INVALID_VIEW_DATA).
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_VF_1,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_MARKETING_LOG_FIELD_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_VF_2,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_MARKETING_LOG_OLD_VALUE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_VF_3,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_MARKETING_LOG_NEW_VALUE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_VF_4,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_MARKETING_LOG_ACTOR_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: CREDOS_TIME_MARKETING_LOG_VF_5,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_MARKETING_LOG_CHANGED_AT_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 180,
    },
  ],
});
