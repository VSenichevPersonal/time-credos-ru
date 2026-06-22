import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_ENTRY_LOG_ENTRY_FIELD_ID,
  CREDOS_TIME_ENTRY_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_LOGS_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// AUDIT-LOG: обратная сторона EntryLog.entry — журнал изменений ЭТОЙ записи
// трудозатрат (ONE_TO_MANY). Вынесено в src/fields/ (паттерн обратных сторон
// проекта). MVP-показ истории — в карточке записи (relation-FIELDS), отдельный
// экран «Журнал» не делаем ([[keep-it-simple]]).
export default defineField({
  universalIdentifier: CREDOS_TIME_ENTRY_LOGS_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'logs',
  label: 'Журнал изменений',
  icon: 'IconHistory',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_ENTRY_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_ENTRY_LOG_ENTRY_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
