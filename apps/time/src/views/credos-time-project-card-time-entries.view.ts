import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CARD_VF_1,
  CREDOS_TIME_PROJECT_CARD_VF_2,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_TIME_ENTRIES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — трудозатраты». Набор полей для FIELDS-виджета вкладки.
// Виден relation-field timeEntries (ONE_TO_MANY) → ядро рендерит его инлайн-
// списком записей проекта (дата/часы/вид работ/сотрудник/статус из самой записи).
// code (labelIdentifier) обязан присутствовать в позиции 0.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — трудозатраты',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconClock',
  key: ViewKey.INDEX,
  position: 11,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_1,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CARD_VF_2,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_TIME_ENTRIES_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
