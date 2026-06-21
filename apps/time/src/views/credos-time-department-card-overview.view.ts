import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_CARD_OVF_1,
  CREDOS_TIME_DEPARTMENT_CARD_OVF_2,
  CREDOS_TIME_DEPARTMENT_CARD_OVF_3,
  CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_HEAD_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PARENT_FIELD_ID,
} from 'src/constants/universal-identifiers';

// REQ-0018 follow-up. Card-view «Отдел — обзор». Набор полей для FIELDS-виджета
// вкладки «Обзор» карточки отдела. Видны нативные relation-поля head
// (→ Employee, «Руководитель») и parentDepartment (self, «Вышестоящий отдел») —
// ядро рендерит их с выбором/правкой из коробки (как relation-field в любой
// карточке Twenty). code (SELECT) даёт контекст (у отдела нет TEXT labelIdentifier).
// Иерархия «Вышестоящий отдел» зеркалит Timetta «Входит в» (research/timetta/docs).
export default defineView({
  universalIdentifier:
    CREDOS_TIME_DEPARTMENT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Отдел — обзор',
  objectUniversalIdentifier: CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconInfoCircle',
  key: ViewKey.INDEX,
  position: 14,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_CARD_OVF_1,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_CARD_OVF_2,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_HEAD_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_CARD_OVF_3,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_DEPARTMENT_PARENT_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 240,
    },
  ],
});
