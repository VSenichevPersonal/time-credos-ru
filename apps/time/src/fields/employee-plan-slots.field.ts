import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_PLAN_SLOTS_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Планирование до СОТРУДНИКА: обратная сторона PlanSlot.employee — персональные
// помесячные слоты плана этого сотрудника (ONE_TO_MANY). employeeLoad(emp,period) =
// Σ персональных слотов + доля нераспределённого остатка отдела по FTE (calc-load
// SSOT §7.2). Паттерн отдельного defineField — как department-plan-slots.field.ts.
export default defineField({
  universalIdentifier: CREDOS_TIME_EMPLOYEE_PLAN_SLOTS_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'planSlots',
  label: 'Плановое распределение',
  icon: 'IconCalendarMonth',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_PLAN_SLOT_EMPLOYEE_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
