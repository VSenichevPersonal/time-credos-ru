import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_MARKETING_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_MARKETING_LOG_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_MARKETING_LOGS_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// MARKETING-LOG: обратная сторона MarketingLog.project — журнал изменений маркетинг-
// полей ЭТОГО проекта (ONE_TO_MANY). Вынесено в src/fields/ (паттерн обратных сторон
// проекта). История правок маркетинга видна в карточке проекта (relation-FIELDS).
export default defineField({
  universalIdentifier: CREDOS_TIME_PROJECT_MARKETING_LOGS_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'marketingLogs',
  label: 'Журнал изменений маркетинга',
  icon: 'IconHistory',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_MARKETING_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_MARKETING_LOG_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
