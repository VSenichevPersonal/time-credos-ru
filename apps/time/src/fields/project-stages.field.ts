import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_PROJECT_STAGES_FIELD_ID,
  TT_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_STAGE_PROJECT_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Обратная сторона Stage.project: коллекция этапов проекта (ONE_TO_MANY).
export default defineField({
  universalIdentifier: TT_PROJECT_STAGES_FIELD_ID,
  objectUniversalIdentifier: TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'stages',
  label: 'Этапы',
  icon: 'IconListTree',
  relationTargetObjectMetadataUniversalIdentifier:
    TT_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TT_STAGE_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
