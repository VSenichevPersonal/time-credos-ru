import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { WORK_CATEGORY_OPTIONS } from 'src/constants/select-options';
import {
  CREDOS_TIME_DEPARTMENT_DEPT_PLANS_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPT_PLAN_CATEGORY_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_END_DATE_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_LABEL_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPT_PLAN_PLANNED_EFFORT_FIELD_ID,
  CREDOS_TIME_DEPT_PLAN_START_DATE_FIELD_ID,
} from 'src/constants/universal-identifiers';

// REQ-0012: плановая загрузка отдела БЕЗ привязки к проекту — «резерв»,
// «пресейл-бронь», «прочее». Раскидывается равномерно по периоду [startDate,
// endDate] и суммируется к загрузке отдела на доске планирования (capacity).
// labelIdentifier = label (TEXT), чтобы заголовок карточки был человекочитаемым.
export default defineObject({
  universalIdentifier: CREDOS_TIME_DEPT_PLAN_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeDeptPlan',
  namePlural: 'credosTimeDeptPlans',
  labelSingular: 'Плановая загрузка (без проекта)',
  labelPlural: 'Плановые загрузки (без проекта)',
  description:
    'Плановая загрузка отдела без привязки к проекту (резерв/пресейл-бронь/прочее)',
  icon: 'IconCalendarStats',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CREDOS_TIME_DEPT_PLAN_LABEL_FIELD_ID,
  fields: [
    {
      universalIdentifier: CREDOS_TIME_DEPT_PLAN_LABEL_FIELD_ID,
      name: 'label',
      type: FieldType.TEXT,
      label: 'Название',
      icon: 'IconTag',
      description: 'Назначение брони: «Резерв», «Пресейл-бронь», «Прочее».',
    },
    {
      universalIdentifier: CREDOS_TIME_DEPT_PLAN_CATEGORY_FIELD_ID,
      name: 'category',
      type: FieldType.SELECT,
      label: 'Категория работ',
      icon: 'IconCategory',
      isNullable: true,
      defaultValue: null,
      options: WORK_CATEGORY_OPTIONS,
    },
    {
      universalIdentifier: CREDOS_TIME_DEPT_PLAN_PLANNED_EFFORT_FIELD_ID,
      name: 'plannedEffort',
      type: FieldType.NUMBER,
      label: 'Плановые часы',
      icon: 'IconClockHour4',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: CREDOS_TIME_DEPT_PLAN_START_DATE_FIELD_ID,
      name: 'startDate',
      type: FieldType.DATE_TIME,
      label: 'Дата начала',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: CREDOS_TIME_DEPT_PLAN_END_DATE_FIELD_ID,
      name: 'endDate',
      type: FieldType.DATE_TIME,
      label: 'Дата окончания',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    // DeptPlan.department -> Department.deptPlans (MANY_TO_ONE).
    {
      universalIdentifier: CREDOS_TIME_DEPT_PLAN_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_DEPT_PLANS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'departmentId',
      },
    },
  ],
});
