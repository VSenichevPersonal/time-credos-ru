import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PLAN_SLOTS_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// WI-47: обратная сторона PlanSlot.department — помесячные слоты плана, привязанные
// к этому отделу (ONE_TO_MANY). Используется при детализации проект×отдел×месяц.
export default defineField({
  universalIdentifier: CREDOS_TIME_DEPARTMENT_PLAN_SLOTS_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'planSlots',
  label: 'Плановое распределение',
  icon: 'IconCalendarMonth',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_PLAN_SLOT_DEPARTMENT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
