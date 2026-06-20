import { defineObject, FieldType, NumberDataType } from 'twenty-sdk/define';

import {
  WORKDAY_TYPE_DEFAULT,
  WORKDAY_TYPE_OPTIONS,
} from 'src/constants/select-options';
import {
  CREDOS_TIME_WORKDAY_CALENDAR_DATE_FIELD_ID,
  CREDOS_TIME_WORKDAY_CALENDAR_DAY_TYPE_FIELD_ID,
  CREDOS_TIME_WORKDAY_CALENDAR_HOURS_FIELD_ID,
  CREDOS_TIME_WORKDAY_CALENDAR_NOTE_FIELD_ID,
  CREDOS_TIME_WORKDAY_CALENDAR_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORKDAY_CALENDAR_YEAR_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Производственный календарь РФ — отдельный слой-справочник (один день = одна
// запись). Используют ОБА модуля: таймшит (дневная норма) и capacity (ёмкость
// недели = сумма рабочих часов × headcount × коэффициент). Не зашит в формулы.
// Идемпотентность сида — по полю date.
export default defineObject({
  universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeWorkdayCalendar',
  namePlural: 'credosTimeWorkdayCalendars',
  labelSingular: 'День календаря',
  labelPlural: 'Произв. календарь',
  description: 'Производственный календарь РФ (рабочие/выходные/праздники)',
  icon: 'IconCalendarStats',
  // labelIdentifier: ядро требует searchable (TEXT). У календаря дата — DATE_TIME
  // (несовместимо), поэтому заголовок карточки остаётся авто-полем name.
  fields: [
    {
      universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_DATE_FIELD_ID,
      name: 'date',
      type: FieldType.DATE_TIME,
      label: 'Дата',
      icon: 'IconCalendar',
    },
    {
      universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_YEAR_FIELD_ID,
      name: 'year',
      type: FieldType.NUMBER,
      label: 'Год',
      icon: 'IconCalendarEvent',
      universalSettings: { dataType: NumberDataType.INT },
    },
    {
      universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_DAY_TYPE_FIELD_ID,
      name: 'dayType',
      type: FieldType.SELECT,
      label: 'Тип дня',
      icon: 'IconCalendarDue',
      defaultValue: WORKDAY_TYPE_DEFAULT,
      options: WORKDAY_TYPE_OPTIONS,
    },
    {
      universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_HOURS_FIELD_ID,
      name: 'hours',
      type: FieldType.NUMBER,
      label: 'Часов в дне',
      icon: 'IconClockHour8',
      defaultValue: 8,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 1 },
    },
    {
      universalIdentifier: CREDOS_TIME_WORKDAY_CALENDAR_NOTE_FIELD_ID,
      name: 'note',
      type: FieldType.TEXT,
      label: 'Примечание',
      icon: 'IconNote',
      isNullable: true,
      defaultValue: null,
    },
  ],
});
