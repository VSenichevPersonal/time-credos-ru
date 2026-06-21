import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BOOKING_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_BOOKINGS_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0004 Часть C: обратная сторона Booking.project — брони ресурсов под проект
// (ONE_TO_MANY). Зарезервированная команда проекта = Σ броней (soft+hard).
export default defineField({
  universalIdentifier: CREDOS_TIME_PROJECT_BOOKINGS_FIELD_ID,
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'bookings',
  label: 'Брони ресурсов',
  icon: 'IconCalendarPin',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_BOOKING_PROJECT_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
