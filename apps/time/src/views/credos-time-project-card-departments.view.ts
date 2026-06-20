import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_VF_6,
  CREDOS_TIME_PROJECT_CARD_VF_7,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_SHARES_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — отделы». Набор полей для FIELDS-виджета вкладки «Отделы»
// карточки проекта. Виден relation-field departmentShares (ONE_TO_MANY к
// credosTimeProjectDepartment) → ядро рендерит доли отделов ТЕКУЩЕГО проекта
// инлайн-таблицей (отдел + плановая доля в часах), с нативной правкой.
// code (labelIdentifier) обязан присутствовать в позиции 0.
// REQ-0013 13a: «Доли отделов» перенесены из сайдбара в карточку проекта.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — отделы',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconChartPie',
  key: ViewKey.INDEX,
  position: 12,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_6,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_7,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_DEPARTMENT_SHARES_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
