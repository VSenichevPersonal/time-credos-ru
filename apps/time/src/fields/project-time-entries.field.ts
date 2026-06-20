import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_TIME_ENTRIES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Обратная сторона TimeEntry.project: записи трудозатрат проекта (ONE_TO_MANY).
export default defineField({
  universalIdentifier: CREDOS_TIME_PROJECT_TIME_ENTRIES_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'timeEntries',
  label: 'Записи трудозатрат',
  icon: 'IconClock',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
