import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_CARD_PROJECTS_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_CARD_VF_3,
  CREDOS_TIME_DEPARTMENT_CARD_VF_4,
  CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PROJECT_SHARES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// REQ-0016. Card-view «Отдел — проекты». Набор полей для FIELDS-виджета вкладки
// «Проекты» карточки отдела. Виден relation-field projectShares (ONE_TO_MANY к
// credosTimeProjectDepartment) → ядро рендерит доли участия ТЕКУЩЕГО отдела в
// проектах инлайн-таблицей (проект + плановая доля в часах), отфильтрованной по
// родителю, кликабельной в карточку доли (а из неё — в карточку проекта).
// Зеркало вкладки «Отделы» карточки проекта (departmentShares).
// position 0 — code (контекст), у отдела нет TEXT labelIdentifier.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_DEPARTMENT_CARD_PROJECTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Отдел — проекты',
  objectUniversalIdentifier: CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconChartPie',
  key: ViewKey.INDEX,
  position: 14,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_CARD_VF_3,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_CARD_VF_4,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_PROJECT_SHARES_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
