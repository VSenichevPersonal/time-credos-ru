import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_SETTINGS_APPROVAL_PERIOD_FIELD_ID,
  CREDOS_TIME_SETTINGS_DEFAULT_APPROVAL_REQUIRED_FIELD_ID,
  CREDOS_TIME_SETTINGS_DEFAULT_CAPACITY_FACTOR_FIELD_ID,
  CREDOS_TIME_SETTINGS_NORM_HOURS_PER_DAY_FIELD_ID,
  CREDOS_TIME_SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_SETTINGS_PLANNING_HORIZON_WEEKS_FIELD_ID,
  CREDOS_TIME_SETTINGS_REVEAL_EMPLOYEE_NAMES_FIELD_ID,
  CREDOS_TIME_SETTINGS_TENTATIVE_BOOKING_ENABLED_FIELD_ID,
  CREDOS_TIME_SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0019 — index-view singleton-настроек. Нужен для существования объекта
// (Common Pitfalls: объект без index-view не визуализируется). Основное
// управление параметрами — в UI «Настройки Time Credos» (Dev1). Здесь —
// ключевые колонки для контроля единственной записи.
export default defineView({
  universalIdentifier: CREDOS_TIME_SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Настройки модуля',
  objectUniversalIdentifier: CREDOS_TIME_SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconSettings',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    {
      universalIdentifier: '7bd36767-2c35-49e6-880c-ca2b41e21553',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_SETTINGS_NORM_HOURS_PER_DAY_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '51306d88-8343-4d25-930d-6ab618986646',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_SETTINGS_PLANNING_HORIZON_WEEKS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'a12153e4-8fa9-4fda-b95b-457ee03a5ebb',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_SETTINGS_DEFAULT_CAPACITY_FACTOR_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '6f6f1652-9693-4c53-a91a-fb993e21b640',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_SETTINGS_DEFAULT_APPROVAL_REQUIRED_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'afadb868-abc3-45e4-8c54-cc4e1bd7afa0',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_SETTINGS_APPROVAL_PERIOD_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'cd782e1e-e783-4e38-931c-4eaeee767af6',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_SETTINGS_TENTATIVE_BOOKING_ENABLED_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '3e77ca90-31f0-4f3a-bef7-4ef26cbcd233',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_SETTINGS_REVEAL_EMPLOYEE_NAMES_FIELD_ID,
      position: 6,
      isVisible: true,
      size: 200,
    },
  ],
});
