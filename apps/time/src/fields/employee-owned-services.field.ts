import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_CATALOG_SERVICE_OWNER_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_OWNED_SERVICES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Обратная сторона Service.owner: коллекция услуг, за которые сотрудник отвечает
// (ONE_TO_MANY на credosTimeEmployee). Оба объекта в одном app (ADR-0010).
// MANY_TO_ONE-сторона — в credos-catalog-service-owner.field.ts.
export default defineField({
  universalIdentifier: CREDOS_TIME_EMPLOYEE_OWNED_SERVICES_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'ownedServices',
  label: 'Услуги (ответственный)',
  icon: 'IconBriefcase',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_CATALOG_SERVICE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_CATALOG_SERVICE_OWNER_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
