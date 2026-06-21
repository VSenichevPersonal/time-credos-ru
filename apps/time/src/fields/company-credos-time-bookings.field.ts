import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_BOOKING_COMPANY_FIELD_ID,
  CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_COMPANY_BOOKINGS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Обратная сторона связи Booking.company: коллекция броней ресурсов на стандартном
// Company (ONE_TO_MANY). MANY_TO_ONE-сторона — в credos-time-booking.object.
// Заказчик: пресейл-брони под клиента (проект ещё не создан) видны в карточке
// компании. Зеркало company-credos-time-projects.field. ADDITIVE.
export default defineField({
  universalIdentifier: CREDOS_TIME_COMPANY_BOOKINGS_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'credosTimeBookings',
  label: 'Брони ресурсов (пресейл)',
  icon: 'IconCalendarPin',
  relationTargetObjectMetadataUniversalIdentifier:
    CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CREDOS_TIME_BOOKING_COMPANY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
