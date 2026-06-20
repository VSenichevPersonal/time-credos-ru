import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_SHARES_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0013 13a: обратная сторона ProjectDepartment.project — доли отделов
// этого проекта (ONE_TO_MANY). Capacity-раскид читает Σ долей по отделам.
export default defineField({
  universalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_SHARES_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'departmentShares',
  label: 'Доли отделов',
  icon: 'IconChartPie',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_PROJECT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_PROJECT_DEPARTMENT_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
