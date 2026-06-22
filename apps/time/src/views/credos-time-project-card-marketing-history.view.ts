import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PROJECT_CARD_MARKETING_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_MARKETING_LOGS_FIELD_ID,
  CREDOS_TIME_PROJECT_MKH_VF_1,
  CREDOS_TIME_PROJECT_MKH_VF_2,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Card-view «Проект — история маркетинга». Набор полей для 2-го FIELDS-виджета
// вкладки «Маркетинг» карточки проекта (под основными полями NDA/публикации).
// Виден relation-field marketingLogs (ONE_TO_MANY) → ядро рендерит его инлайн-
// списком логов изменений ТЕКУЩЕГО проекта (поле/было→стало/кто/когда из самой
// записи лога). По образцу card-view «Проект — трудозатраты» (timeEntries).
// Сортировка changedAt DESC (свежие сверху) наследуется из index-view объекта
// credosTimeMarketingLog (credos-time-marketing-log.view.ts). История read-only
// (поля лога не редактируются — журнал пишется триггером).
// code (labelIdentifier) обязан присутствовать в позиции 0.
export default defineView({
  universalIdentifier:
    CREDOS_TIME_PROJECT_CARD_MARKETING_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Проект — история маркетинга',
  objectUniversalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconHistory',
  key: ViewKey.INDEX,
  position: 21,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MKH_VF_1,
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PROJECT_CODE_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MKH_VF_2,
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_MARKETING_LOGS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 480,
    },
  ],
});
