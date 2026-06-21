import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  BOOKING_TYPE_DEFAULT,
  BOOKING_TYPE_OPTIONS,
} from 'src/constants/select-options';
import {
  CREDOS_TIME_BOOKING_COMPANY_FIELD_ID,
  CREDOS_TIME_BOOKING_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_BOOKING_END_DATE_FIELD_ID,
  CREDOS_TIME_BOOKING_HOURS_FIELD_ID,
  CREDOS_TIME_BOOKING_LABEL_FIELD_ID,
  CREDOS_TIME_BOOKING_NOTE_FIELD_ID,
  CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_BOOKING_PROJECT_FIELD_ID,
  CREDOS_TIME_BOOKING_START_DATE_FIELD_ID,
  CREDOS_TIME_BOOKING_TYPE_FIELD_ID,
  CREDOS_TIME_COMPANY_BOOKINGS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_BOOKINGS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_BOOKINGS_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0004 Часть C (gap-аудит v3 #2): БРОНЬ ёмкости ресурса — резервирование
// сотрудника под проект на период (плашка). Самостоятельная сущность ядра
// планирования Timetta + пресейла.
//
// ИНВАРИАНТ (Timetta «оценка ≠ резерв», booking-concept): бронь — это РЕЗЕРВ
// ёмкости, НАМЕРЕННО НЕ связанный ни с план-оценкой (credosTimePlanAllocation —
// прогноз трудозатрат менеджера), ни с фактом (credosTimeEntry — списанные часы).
// Не смешивать. У брони своя ось данных: employee × project × период × ёмкость.
//
// ТИП (BOOKING_TYPE_OPTIONS):
//   SOFT — предварительная (пресейл/РП). Потребность в ресурсе, НЕ согласована
//          ресурс-менеджером, НЕ потребляет ёмкость; в Demand показывается
//          отдельно/пунктиром (полупрозрачная плашка у Timetta).
//   HARD — подтверждённая. Закрепляет ресурс, ТВЁРДО потребляет ёмкость.
// Овербукинг НЕ блокируется (как в Timetta) — показывается как конфликт (Dev1).
//
// labelIdentifier = label (TEXT) — человекочитаемый заголовок карточки
// (зеркало credosTimeDeptPlan). Часы (hours) — простая ёмкость на период
// (равномерно по рабочим дням, как dept-plan). FTE%/детальный режим — follow-up.
// Ограничение [[no-billable-concept]]: bill-rate НЕ вводим.
export default defineObject({
  universalIdentifier: CREDOS_TIME_BOOKING_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeBooking',
  namePlural: 'credosTimeBookings',
  labelSingular: 'Бронь ресурса',
  labelPlural: 'Брони ресурсов',
  description:
    'Резервирование ёмкости сотрудника под проект на период (soft/hard). Резерв, отдельно от плана-оценки и факта (REQ-0004)',
  icon: 'IconCalendarPin',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CREDOS_TIME_BOOKING_LABEL_FIELD_ID,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_BOOKING_LABEL_FIELD_ID,
      name: 'label',
      type: FieldType.TEXT,
      label: 'Название',
      icon: 'IconTag',
      description:
        'Человекочитаемый заголовок брони (напр. «Иванов → Альфа, июль»).',
    },
    {
      universalIdentifier: CREDOS_TIME_BOOKING_TYPE_FIELD_ID,
      name: 'bookingType',
      type: FieldType.SELECT,
      label: 'Тип брони',
      icon: 'IconLayersSubtract',
      description:
        'SOFT — предварительная (пресейл, не потребляет ёмкость); HARD — подтверждённая (потребляет ёмкость).',
      isNullable: false,
      defaultValue: BOOKING_TYPE_DEFAULT,
      options: BOOKING_TYPE_OPTIONS,
    },
    {
      universalIdentifier: CREDOS_TIME_BOOKING_HOURS_FIELD_ID,
      name: 'hours',
      type: FieldType.NUMBER,
      label: 'Забронировано часов',
      icon: 'IconClockHour4',
      description:
        'Забронированная ёмкость на весь период (раскидывается равномерно по рабочим дням).',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: CREDOS_TIME_BOOKING_START_DATE_FIELD_ID,
      name: 'startDate',
      type: FieldType.DATE_TIME,
      label: 'Дата начала',
      icon: 'IconCalendarPlus',
      description: 'Начало периода брони.',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: CREDOS_TIME_BOOKING_END_DATE_FIELD_ID,
      name: 'endDate',
      type: FieldType.DATE_TIME,
      label: 'Дата окончания',
      icon: 'IconCalendarMinus',
      description: 'Окончание периода брони.',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: CREDOS_TIME_BOOKING_NOTE_FIELD_ID,
      name: 'note',
      type: FieldType.TEXT,
      label: 'Комментарий',
      icon: 'IconNote',
      description: 'Опциональная заметка (причина брони, условие пресейла).',
      isNullable: true,
      defaultValue: null,
    },
    // Booking.employee -> Employee.bookings (MANY_TO_ONE, CASCADE).
    {
      universalIdentifier: CREDOS_TIME_BOOKING_EMPLOYEE_FIELD_ID,
      name: 'employee',
      type: FieldType.RELATION,
      label: 'Сотрудник',
      icon: 'IconUser',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_BOOKINGS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'employeeId',
      },
    },
    // Booking.project -> Project.bookings (MANY_TO_ONE, nullable).
    // Заказчик: бронь под проект ИЛИ под компанию. project nullable — при пресейле
    // проекта ещё нет, бронь привязана к company. onDelete SET_NULL: удаление
    // проекта не должно сносить бронь (резерв ресурса остаётся).
    {
      universalIdentifier: CREDOS_TIME_BOOKING_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconBriefcase',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_BOOKINGS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
    // Booking.company -> стандартный Company (MANY_TO_ONE, nullable). ADDITIVE.
    // Пресейл: клиент известен, проект ещё не создан → бронь под компанию.
    // onDelete SET_NULL (как Project.company): удаление компании оставляет бронь.
    {
      universalIdentifier: CREDOS_TIME_BOOKING_COMPANY_FIELD_ID,
      name: 'company',
      type: FieldType.RELATION,
      label: 'Клиент',
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_COMPANY_BOOKINGS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'companyId',
      },
    },
  ],
});
