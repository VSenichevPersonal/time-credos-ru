import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OWNER_FIELD_ID,
  CREDOS_TIME_WORKSPACE_MEMBER_OWNED_PROJECTS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Обратная сторона Project.owner: проекты во владении сотрудника (ONE_TO_MANY)
// на стандартном WorkspaceMember. MANY_TO_ONE-сторона — в credos-time-project.
export default defineField({
  universalIdentifier: CREDOS_TIME_WORKSPACE_MEMBER_OWNED_PROJECTS_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'credosTimeOwnedProjects',
  label: 'Проекты во владении (трудозатраты)',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_PROJECT_OWNER_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
