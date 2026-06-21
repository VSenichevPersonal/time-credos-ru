import { defineObject, FieldType, NumberDataType } from 'twenty-sdk/define';

import {
  APPROVAL_PERIOD_DEFAULT,
  APPROVAL_PERIOD_OPTIONS,
  DAY_OF_WEEK_DEFAULT,
  DAY_OF_WEEK_OPTIONS,
  WEEK_STARTS_ON_DEFAULT,
  WEEK_STARTS_ON_OPTIONS,
} from 'src/constants/select-options';
import {
  CREDOS_TIME_SETTINGS_APPROVAL_PERIOD_FIELD_ID,
  CREDOS_TIME_SETTINGS_DEFAULT_APPROVAL_REQUIRED_FIELD_ID,
  CREDOS_TIME_SETTINGS_DEFAULT_CAPACITY_FACTOR_FIELD_ID,
  CREDOS_TIME_SETTINGS_FILL_TEMPLATE_HOURS_FIELD_ID,
  CREDOS_TIME_SETTINGS_NORM_HOURS_PER_DAY_FIELD_ID,
  CREDOS_TIME_SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_SETTINGS_OVERTIME_WARN_HOURS_FIELD_ID,
  CREDOS_TIME_SETTINGS_PLANNING_HORIZON_WEEKS_FIELD_ID,
  CREDOS_TIME_SETTINGS_REMINDER_DAY_OF_WEEK_FIELD_ID,
  CREDOS_TIME_SETTINGS_REMINDER_ENABLED_FIELD_ID,
  CREDOS_TIME_SETTINGS_REVEAL_EMPLOYEE_NAMES_FIELD_ID,
  CREDOS_TIME_SETTINGS_TENTATIVE_BOOKING_ENABLED_FIELD_ID,
  CREDOS_TIME_SETTINGS_WEEK_STARTS_ON_FIELD_ID,
} from 'src/constants/universal-identifiers';

// REQ-0019 — глобальные настройки модуля Time Credos (singleton: 1 запись на
// workspace). Плоский список параметров — сверка с Timetta system-settings
// (норма/расписание, периоды таймшитов, шаблоны, напоминания). Не плодить по
// объекту на параметр. Сид дефолтной записи — в post-install (миграция 3),
// идемпотентно. Управление значениями — в UI «Настройки Time Credos» (Dev1);
// index-view ниже нужен лишь для существования объекта (Common Pitfalls).
//
// Потребители (чтение через Core REST credosTimeSettings):
//   · reports.logic — revealEmployeeNames (CISO-007, замена хардкод-флага).
//   · follow-up (Dev1/Dev2): normHoursPerDay (fallback нормы, ADR-0007),
//     planningHorizonWeeks (доска), defaultCapacityFactor/defaultApprovalRequired
//     (дефолты новых отделов), overtimeWarnHours/fillTemplateHours (ввод),
//     reminder*, tentativeBookingEnabled (REQ-0009), weekStartsOn, approvalPeriod.
export default defineObject({
  universalIdentifier: CREDOS_TIME_SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
  // REST-плюрал = credosTimeSettings (его читают reports.logic и сид). Сингуляр
  // обязан отличаться от плюрала (ядро запрещает совпадение) → credosTimeSetting.
  nameSingular: 'credosTimeSetting',
  namePlural: 'credosTimeSettings',
  labelSingular: 'Настройки модуля',
  labelPlural: 'Настройки модуля',
  description: 'Глобальные настройки модуля Time Credos (singleton, 1 запись)',
  icon: 'IconSettings',
  // labelIdentifier: ядро требует searchable (TEXT). TEXT-полей нет (singleton без
  // имени), поэтому заголовок карточки остаётся авто-полем name.
  fields: [
    // --- Ввод / норма ---
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_NORM_HOURS_PER_DAY_FIELD_ID,
      name: 'normHoursPerDay',
      type: FieldType.NUMBER,
      label: 'Норма часов в день',
      icon: 'IconClockHour8',
      defaultValue: 8,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 1 },
    },
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_FILL_TEMPLATE_HOURS_FIELD_ID,
      name: 'fillTemplateHours',
      type: FieldType.NUMBER,
      label: 'Часы шаблона заполнения',
      icon: 'IconTemplate',
      defaultValue: 8,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 1 },
    },
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_OVERTIME_WARN_HOURS_FIELD_ID,
      name: 'overtimeWarnHours',
      type: FieldType.NUMBER,
      label: 'Порог предупреждения о переработке (ч/день)',
      icon: 'IconAlertTriangle',
      defaultValue: 12,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 1 },
    },
    // --- Планирование ---
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_WEEK_STARTS_ON_FIELD_ID,
      name: 'weekStartsOn',
      type: FieldType.SELECT,
      label: 'Начало недели',
      icon: 'IconCalendarWeek',
      defaultValue: WEEK_STARTS_ON_DEFAULT,
      options: WEEK_STARTS_ON_OPTIONS,
    },
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_PLANNING_HORIZON_WEEKS_FIELD_ID,
      name: 'planningHorizonWeeks',
      type: FieldType.NUMBER,
      label: 'Горизонт планирования (недель)',
      icon: 'IconCalendarStats',
      defaultValue: 16,
      universalSettings: { dataType: NumberDataType.INT },
    },
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_DEFAULT_CAPACITY_FACTOR_FIELD_ID,
      name: 'defaultCapacityFactor',
      type: FieldType.NUMBER,
      label: 'Коэффициент ёмкости по умолчанию',
      icon: 'IconGauge',
      defaultValue: 0.8,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_TENTATIVE_BOOKING_ENABLED_FIELD_ID,
      name: 'tentativeBookingEnabled',
      type: FieldType.BOOLEAN,
      label: 'Пресейл-бронь в планировании',
      icon: 'IconCalendarPlus',
      defaultValue: true,
    },
    // --- Согласование ---
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_DEFAULT_APPROVAL_REQUIRED_FIELD_ID,
      name: 'defaultApprovalRequired',
      type: FieldType.BOOLEAN,
      label: 'Согласование по умолчанию',
      icon: 'IconChecks',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_APPROVAL_PERIOD_FIELD_ID,
      name: 'approvalPeriod',
      type: FieldType.SELECT,
      label: 'Период согласования',
      icon: 'IconCalendarTime',
      defaultValue: APPROVAL_PERIOD_DEFAULT,
      options: APPROVAL_PERIOD_OPTIONS,
    },
    // --- Напоминания ---
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_REMINDER_ENABLED_FIELD_ID,
      name: 'reminderEnabled',
      type: FieldType.BOOLEAN,
      label: 'Напоминания заполнить таймшит',
      icon: 'IconBell',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_REMINDER_DAY_OF_WEEK_FIELD_ID,
      name: 'reminderDayOfWeek',
      type: FieldType.SELECT,
      label: 'День напоминания',
      icon: 'IconBellRinging',
      defaultValue: DAY_OF_WEEK_DEFAULT,
      options: DAY_OF_WEEK_OPTIONS,
    },
    // --- Безопасность ---
    {
      universalIdentifier: CREDOS_TIME_SETTINGS_REVEAL_EMPLOYEE_NAMES_FIELD_ID,
      name: 'revealEmployeeNames',
      type: FieldType.BOOLEAN,
      // CISO-007 (152-ФЗ): показ ФИО в отчётах. Дефолт false до доверенной
      // server-identity (CISO-005). Админ-тоггл (RBAC-волна).
      label: 'Показывать ФИО в отчётах',
      icon: 'IconEyeOff',
      defaultValue: false,
    },
  ],
});
