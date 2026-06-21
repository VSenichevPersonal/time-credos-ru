import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_BOOKING_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_BOOKINGS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0004 Часть C: обратная сторона Booking.employee — брони ресурса сотрудника
// (ONE_TO_MANY). Загрузка человека резервами = Σ его HARD-броней в периоде.
export default defineField({
  universalIdentifier: CREDOS_TIME_EMPLOYEE_BOOKINGS_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'bookings',
  label: 'Брони ресурса',
  icon: 'IconCalendarPin',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_BOOKING_EMPLOYEE_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
