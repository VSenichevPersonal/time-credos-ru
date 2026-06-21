import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PLAN_SLOTS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_PLAN_SLOTS_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PLAN_SLOT_PERIOD_MONTH_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_PLANNED_HOURS_FIELD_ID,
  CREDOS_TIME_PLAN_SLOT_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_PLAN_SLOTS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// WI-47: помесячный слот плана проекта — редактируемая запись «проект [× отдел] ×
// месяц → плановые часы». Закрывает «Планирование вручную по месяцам»
// (PLANNING_RECORDS_CONSISTENCY §5, уровень 1). В режиме project.planMethod=MANUAL
// загрузка проекта на доске/в отчётах = Σ слотов (вместо EVEN-раскида из
// plannedEffort+дат); EVEN остаётся дефолтом и слотов не создаёт.
//
// periodMonth = 'YYYY-MM' (календарный месяц, помесячный ключ). НЕ `month` — во
// избежание путаницы с числом месяца; periodMonth явно про ключ-строку.
// onDelete CASCADE: слот — производная детализация плана проекта, без проекта
// смысла не имеет (защита от сирот-слотов; в отличие от entry/booking, которые —
// самостоятельные оси и потому RESTRICT/SET_NULL).
// department nullable: гранулярность по умолчанию проект×месяц; при детализации по
// отделам (REQ-0013) слот = проект×отдел×месяц. SET_NULL — удаление отдела не сносит
// слот плана (часы остаются на проекте, отдел просто «снимается»).
// Дедуп (project[,department][,employee],periodMonth) обеспечивает upsert
// /s/plan-slots (read-by-key → PATCH | POST): SDK-индексов объекты этого проекта
// не используют. employee — персональное измерение (планирование до сотрудника).
export default defineObject({
  universalIdentifier: CREDOS_TIME_PLAN_SLOT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimePlanSlot',
  namePlural: 'credosTimePlanSlots',
  labelSingular: 'Плановый слот (месяц)',
  labelPlural: 'Плановое распределение (по месяцам)',
  description:
    'Помесячный слот плана проекта (ручной раскид): проект [× отдел] × месяц → плановые часы',
  icon: 'IconCalendarMonth',
  // labelIdentifier = periodMonth (TEXT 'YYYY-MM') — человекочитаемый заголовок.
  labelIdentifierFieldMetadataUniversalIdentifier:
    CREDOS_TIME_PLAN_SLOT_PERIOD_MONTH_FIELD_ID,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_PLAN_SLOT_PERIOD_MONTH_FIELD_ID,
      name: 'periodMonth',
      type: FieldType.TEXT,
      label: 'Месяц (YYYY-MM)',
      icon: 'IconCalendarMonth',
      description: 'Календарный месяц плана в формате YYYY-MM (помесячный ключ).',
    },
    {
      universalIdentifier: CREDOS_TIME_PLAN_SLOT_PLANNED_HOURS_FIELD_ID,
      name: 'plannedHours',
      type: FieldType.NUMBER,
      label: 'Плановые часы (месяц)',
      icon: 'IconClockHour4',
      description: 'Плановые часы проекта на этот месяц (раскид внутри месяца по рабочим дням).',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    // PlanSlot.project -> Project.planSlots (MANY_TO_ONE, CASCADE).
    {
      universalIdentifier: CREDOS_TIME_PLAN_SLOT_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconFolder',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_PLAN_SLOTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
    // PlanSlot.department -> Department.planSlots (MANY_TO_ONE, nullable, SET_NULL).
    {
      universalIdentifier: CREDOS_TIME_PLAN_SLOT_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_PLAN_SLOTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'departmentId',
      },
    },
    // PlanSlot.employee -> Employee.planSlots (MANY_TO_ONE, nullable, SET_NULL).
    // Планирование до СОТРУДНИКА (bottom-up SSOT §3.1): employee задан → персональный
    // слот (высший приоритет в иерархии employee>dept>EVEN, §7.2); пуст → отдельский/
    // проектный остаток (прежнее поведение). SET_NULL — удаление сотрудника не сносит
    // слот плана (часы «снимаются» с человека, остаются нераспределённым остатком
    // отдела/проекта; слот переживает как история, аналогично department SET_NULL).
    {
      universalIdentifier: CREDOS_TIME_PLAN_SLOT_EMPLOYEE_FIELD_ID,
      name: 'employee',
      type: FieldType.RELATION,
      label: 'Сотрудник',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_PLAN_SLOTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'employeeId',
      },
    },
  ],
});
