import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_PROJECT_TIME_ENTRIES_FIELD_ID,
  TT_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_TIME_ENTRY_PROJECT_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Обратная сторона TimeEntry.project: записи трудозатрат проекта (ONE_TO_MANY).
export default defineField({
  universalIdentifier: TT_PROJECT_TIME_ENTRIES_FIELD_ID,
  objectUniversalIdentifier: TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'timeEntries',
  label: 'Записи трудозатрат',
  icon: 'IconClock',
  relationTargetObjectMetadataUniversalIdentifier:
    TT_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TT_TIME_ENTRY_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
