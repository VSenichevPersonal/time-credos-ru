import { defineView, ViewKey } from 'twenty-sdk/define';

import {
  CREDOS_TIME_PLAN_SLOT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PLAN_SLOT_PERIOD_MONTH_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_PLANNED_HOURS_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_PROJECT_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// WI-47: index-view помесячных слотов плана. Колонки = проект, месяц, плановые
// часы, отдел. Объект ОБЯЗАН иметь index-view (иначе SDK-pitfall).
export default defineView({
  universalIdentifier: CREDOS_TIME_PLAN_SLOT_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Плановое распределение (по месяцам)',
  objectUniversalIdentifier: CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconCalendarMonth',
  key: ViewKey.INDEX,
  position: 0,
  fields: [
    // labelIdentifier-поле (periodMonth) ДОЛЖНО быть на позиции 0 (lowest) — иначе
    // INVALID_VIEW_DATA. Колонки далее: проект, плановые часы, отдел.
    {
      universalIdentifier: '1d13f512-1636-4f56-b7fe-29024060eea5',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PLAN_SLOT_PERIOD_MONTH_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '8c7b5f7f-94f1-45de-bd7a-41f3df875db9',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PLAN_SLOT_PROJECT_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: 'f4130ed4-0484-467d-8b73-6630602d7332',
      fieldMetadataUniversalIdentifier:
        CREDOS_TIME_PLAN_SLOT_PLANNED_HOURS_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'b7b827b9-faa1-4eff-a401-7a33f59e4688',
      fieldMetadataUniversalIdentifier: CREDOS_TIME_PLAN_SLOT_DEPARTMENT_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 200,
    },
  ],
});
