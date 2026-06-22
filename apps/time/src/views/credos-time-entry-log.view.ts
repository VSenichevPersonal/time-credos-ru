import { defineView, ViewKey, ViewSortDirection } from 'twenty-sdk/define';

import {
  CREDOS_TIME_ENTRY_LOG_ACTION_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_ACTOR_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_ENTRY_DATE_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_LOGGED_AT_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_NEW_HOURS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_NEW_STATUS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_LOG_OLD_HOURS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_OLD_STATUS_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// AUDIT-LOG: index-view журнала изменений трудозатрат. Колонки = действие, когда,
// кто, дата записи, часы до/после, статус до/после. Сортировка по времени DESC
// (свежие действия сверху).
//
// ТЕХНИЧЕСКИЙ view (как plan-slot): nav-item из сайдбара НАМЕРЕННО убран — журнал не
// для повседневной навигации; доступен по прямой ссылке для админ-аудита. Объект
// ОБЯЗАН иметь index-view (SDK-pitfall). Исключён из nav-guard через TECHNICAL_VIEWS
// (schema-guard.test.ts).
export default defineView({
  universalIdentifier: CREDOS_TIME_ENTRY_LOG_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Журнал изменений трудозатрат',
  objectUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconHistory',
  key: ViewKey.INDEX,
  position: 0,
  // Свежие действия сверху (DESC по времени лога).
  sorts: [
    {
      universalIdentifier: '11784a4f-5a8f-4d1e-826c-e728036fa1c6',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_LOGGED_AT_FIELD_ID,
      direction: ViewSortDirection.DESC,
    },
  ],
  fields: [
    // actor = labelIdentifier (заголовок строки) → должен быть на позиции 0 (lowest)
    // — иначе INVALID_VIEW_DATA.
    {
      universalIdentifier: '600401bf-447d-4165-9e09-dd62080d7100',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_ACTOR_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '0451e6a8-a885-400e-83b3-8bf13de87d40',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_ACTION_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '9368490b-16f9-41ca-8f6e-db0e2e75d218',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_LOGGED_AT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '6c6cd436-92cc-4cfa-94fc-02fa6e907f91',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_ENTRY_DATE_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '723346ba-8150-4147-bd37-81142e3916d4',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_OLD_HOURS_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '4f055efe-c53b-47ad-bf76-5166ee6416ba',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_NEW_HOURS_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: 'fb483299-c5c8-4b65-b26d-6cafae4bd1a8',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_OLD_STATUS_FIELD_ID,
      position: 6,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'f51de900-2fee-4718-b02b-8ec9e13fb463',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_ENTRY_LOG_NEW_STATUS_FIELD_ID,
      position: 7,
      isVisible: true,
      size: 140,
    },
  ],
});
