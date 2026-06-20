import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  TT_COMPANY_PROJECTS_FIELD_ID,
  TT_PROJECT_COMPANY_FIELD_ID,
  TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Обратная сторона связи Project.company: добавляем коллекцию ttProjects на
// стандартный объект Company (ONE_TO_MANY). MANY_TO_ONE-сторона — в tt-project.
export default defineField({
  universalIdentifier: TT_COMPANY_PROJECTS_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'ttProjects',
  label: 'Проекты (трудозатраты)',
  icon: 'IconFolder',
  relationTargetObjectMetadataUniversalIdentifier:
    TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TT_PROJECT_COMPANY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
