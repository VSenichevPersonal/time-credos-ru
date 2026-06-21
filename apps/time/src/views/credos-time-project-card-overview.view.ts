import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CATEGORY_FIELD_ID,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PROJECT_DESCRIPTION_FIELD_ID,
  CREDOS_TIME_PROJECT_END_DATE_FIELD_ID,
  CREDOS_TIME_PROJECT_EXTERNAL_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_MANAGER_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_PLANNED_EFFORT_FIELD_ID,
  CREDOS_TIME_PROJECT_START_DATE_FIELD_ID,
  CREDOS_TIME_PROJECT_STATUS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — обзор». НЕ index-view сайдбара (нет navigationMenuItem):
// служит набором полей для FIELDS-виджета вкладки «Обзор» карточки проекта.
// Поля: код, код клиента/Директум, клиент, отдел, руководитель, категория,
// статус, даты, плановые часы. Заголовок карточки = labelIdentifier (code).
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_OVERVIEW_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — обзор',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconFolder',
  key: ViewKey.INDEX,
  position: 10,
  fields: [
    // code = labelIdentifier → позиция 0 (требование ядра).
    {
      universalIdentifier: 'dd1b6e29-2a9d-4114-b95f-5969910ea6bb',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'f9db17a6-c47c-47ba-b584-f4a56c0d936e',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_EXTERNAL_CODE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '95f9f5a3-1c8d-49b3-b40e-39d950922f72',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: 'de52016a-45d5-465a-8717-493e17a769eb',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '09d1ee26-7f3e-456c-ac05-33d83ceb4108',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_MANAGER_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '430c3fc4-8050-4ace-b354-8be3e87a71c5',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CATEGORY_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'c53713b6-ac28-46ff-a507-ce9188fa9f7c',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_STATUS_FIELD_ID,
      position: 6,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '338ac92e-9466-43f1-acbf-efb8b8248785',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_START_DATE_FIELD_ID,
      position: 7,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '3b8e06a3-f752-41e5-8098-d927e0c8069f',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_END_DATE_FIELD_ID,
      position: 8,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'd3df5ec3-10a4-4cbd-81d4-ca950e55978e',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_PLANNED_EFFORT_FIELD_ID,
      position: 9,
      isVisible: true,
      size: 140,
    },
    // P2: описание проекта в карточке «Обзор».
    {
      universalIdentifier: '1aa3b36f-45a8-49fe-b4e0-c4f2cc874450',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_DESCRIPTION_FIELD_ID,
      position: 10,
      isVisible: true,
      size: 360,
    },
  ],
});
