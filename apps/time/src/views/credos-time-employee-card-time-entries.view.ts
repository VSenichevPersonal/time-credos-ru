import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_EMPLOYEE_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_CARD_VF_3,
  CREDOS_TIME_EMPLOYEE_CARD_VF_4,
  CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// REQ-0016. Card-view «Сотрудник — трудозатраты». Набор полей для FIELDS-виджета
// вкладки «Трудозатраты» карточки сотрудника. Виден relation-field timeEntries
// (ONE_TO_MANY к credosTimeEntry) → ядро рендерит записи ТЕКУЩЕГО сотрудника
// инлайн-таблицей (дата/часы/проект/этап/статус из самой записи), отфильтрованной
// по родителю, кликабельной в карточку записи (а из неё — в проект/этап).
// «Проекты, где работал» = агрегат записей по проекту → follow-up Dev2 (нет
// прямого relation employee↔project). lastName (labelIdentifier) в позиции 0.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_EMPLOYEE_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Сотрудник — трудозатраты',
  objectUniversalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconClock',
  key: ViewKey.INDEX,
  position: 13,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_CARD_VF_3,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_EMPLOYEE_LAST_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_CARD_VF_4,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
