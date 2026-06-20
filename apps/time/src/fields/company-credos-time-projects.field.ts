import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_COMPANY_PROJECTS_FIELD_ID,
  CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Обратная сторона связи Project.company: добавляем коллекцию credosTimeProjects
// на стандартный Company (ONE_TO_MANY). MANY_TO_ONE-сторона — в credos-time-project.
export default defineField({
  universalIdentifier: CREDOS_TIME_COMPANY_PROJECTS_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'credosTimeProjects',
  label: 'Проекты (трудозатраты)',
  icon: 'IconFolder',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
