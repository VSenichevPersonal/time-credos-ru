import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_EMPLOYEE_BOOKINGS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_CARD_BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_CARD_VF_6,
  CREDOS_TIME_EMPLOYEE_CARD_VF_7,
  CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0016 follow-up. Card-view «Сотрудник — брони». Набор полей для FIELDS-
// виджета вкладки «Брони» карточки сотрудника. Виден relation-field bookings
// (ONE_TO_MANY к credosTimeBooking) → ядро рендерит брони ТЕКУЩЕГО сотрудника
// инлайн-таблицей (проект / тип SOFT-HARD / часы / период из самой брони),
// отфильтрованной по родителю, кликабельной в карточку брони. Показывает, на
// каких проектах сотрудник зарезервирован. lastName (labelIdentifier) в позиции 0.
// Сверка: Timetta — брони видны в карточке ресурса.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_EMPLOYEE_CARD_BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Сотрудник — брони',
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconCalendarPin',
  key: ViewKey.INDEX,
  position: 14,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_CARD_VF_6,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_CARD_VF_7,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_BOOKINGS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
