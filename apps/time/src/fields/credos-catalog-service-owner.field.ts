import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_CATALOG_SERVICE_OWNER_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_OWNED_SERVICES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Service.owner -> credosTimeEmployee.ownedServices (intra-app MANY_TO_ONE).
// Оба объекта в одном app (ADR-0010) → связь резолвится штатно, как любая
// внутренняя relation time. nullable: услуга без ответственного допустима.
export default defineField({
  universalIdentifier: CREDOS_CATALOG_SERVICE_OWNER_FIELD_ID,
  objectUniversalIdentifier: CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'owner',
  label: 'Ответственный',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_EMPLOYEE_OWNED_SERVICES_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'ownerId',
  },
});
