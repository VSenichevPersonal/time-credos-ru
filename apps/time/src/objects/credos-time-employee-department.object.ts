import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_EMPLOYEE_ASSIGNMENTS_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_ASSIGNMENTS_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_END_DATE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_FTE_PERCENT_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_START_DATE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0011: назначение сотрудника на отдел в % FTE с датами действия. Join-объект
// employee × department × ftePercent × startDate × endDate. Зеркало REQ-0013
// «Доли отделов проекта» (credosTimeProjectDepartment): сотрудник может работать
// в нескольких отделах одновременно с долями (напр. 50/50). Численность отдела
// (headcount для ёмкости) = Σ(ftePercent/100) сотрудников с активной записью в
// периоде. Fallback (нет записей): старый count по employee.departmentId (100%).
// Сверка с Timetta: частичная занятость (FTE) и срок действия назначения.
// labelIdentifier: оба ключевых поля — RELATION (нет TEXT-поля), заголовок
// карточки остаётся авто-полем name; идентификация — через колонки view.
export default defineObject({
  universalIdentifier:
    CREDOS_TIME_EMPLOYEE_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeEmployeeDepartment',
  namePlural: 'credosTimeEmployeeDepartments',
  labelSingular: 'Назначение в отдел (FTE)',
  labelPlural: 'Назначения в отделы (FTE)',
  description:
    'Участие сотрудника в отделе с долей ставки (% FTE) и сроком действия (REQ-0011)',
  icon: 'IconUsersGroup',
  fields: [
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_DEPARTMENT_FTE_PERCENT_FIELD_ID,
      name: 'ftePercent',
      type: FieldType.NUMBER,
      label: 'Доля ставки (% FTE)',
      icon: 'IconPercentage',
      description:
        'Процент занятости сотрудника в отделе (0..100). Σ долей сотрудника по отделам ≈ 100.',
      isNullable: true,
      defaultValue: 100,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_DEPARTMENT_START_DATE_FIELD_ID,
      name: 'startDate',
      type: FieldType.DATE_TIME,
      label: 'Начало',
      icon: 'IconCalendarPlus',
      description: 'Дата начала действия назначения (пусто = действует с начала).',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_DEPARTMENT_END_DATE_FIELD_ID,
      name: 'endDate',
      type: FieldType.DATE_TIME,
      label: 'Окончание',
      icon: 'IconCalendarMinus',
      description: 'Дата окончания назначения (пусто = бессрочно/действует сейчас).',
      isNullable: true,
      defaultValue: null,
    },
    // EmployeeDepartment.employee -> Employee.departmentAssignments (MANY_TO_ONE, CASCADE).
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_DEPARTMENT_EMPLOYEE_FIELD_ID,
      name: 'employee',
      type: FieldType.RELATION,
      label: 'Сотрудник',
      icon: 'IconUser',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_ASSIGNMENTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'employeeId',
      },
    },
    // EmployeeDepartment.department -> Department.employeeAssignments (MANY_TO_ONE, CASCADE).
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_DEPARTMENT_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_EMPLOYEE_ASSIGNMENTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'departmentId',
      },
    },
  ],
});
