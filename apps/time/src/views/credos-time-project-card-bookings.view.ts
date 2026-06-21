import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_BOOKINGS_FIELD_ID,
  CREDOS_TIME_PROJECT_CARD_BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_VF_8,
  CREDOS_TIME_PROJECT_CARD_VF_9,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0016 follow-up. Card-view «Проект — брони». Набор полей для FIELDS-виджета
// вкладки «Брони» карточки проекта. Виден relation-field bookings (ONE_TO_MANY к
// credosTimeBooking) → ядро рендерит брони ТЕКУЩЕГО проекта инлайн-таблицей
// (сотрудник / тип SOFT-HARD / часы / период из самой брони), отфильтрованной по
// родителю, кликабельной в карточку брони. code (labelIdentifier) в позиции 0.
// Сверка: Timetta — брони видны в карточке проекта.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_BOOKINGS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — брони',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconCalendarPin',
  key: ViewKey.INDEX,
  position: 12,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_8,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_9,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_BOOKINGS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
