import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PLAN_SLOT_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_PLAN_SLOTS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// WI-47: обратная сторона PlanSlot.project — помесячные слоты плана этого проекта
// (ONE_TO_MANY). В режиме MANUAL загрузка проекта = Σ этих слотов по месяцам.
export default defineField({
  universalIdentifier: CREDOS_TIME_PROJECT_PLAN_SLOTS_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'planSlots',
  label: 'Плановое распределение',
  icon: 'IconCalendarMonth',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_PLAN_SLOT_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
