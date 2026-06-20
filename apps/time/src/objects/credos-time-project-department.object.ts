import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PROJECT_SHARES_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_PLANNED_EFFORT_SHARE_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_PROJECT_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_SHARES_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// REQ-0013 13a: доля участия отдела в проекте. Join-объект project × department
// × plannedEffortShare (часы доли отдела). Заменяет жёсткую связь project.
// departmentId для capacity-раскида: загрузка отдела = Σ долей его проектов.
// Часы (не %) — раскид по периоду уже работает с часами (plannedHoursInPeriod),
// и проект без plannedEffort всё равно может иметь доли (% не от чего считать).
// labelIdentifier: оба ключевых поля — RELATION (нет TEXT-поля), как у Department
// заголовок карточки остаётся авто-полем name; идентификация — через колонки view.
export default defineObject({
  universalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeProjectDepartment',
  namePlural: 'credosTimeProjectDepartments',
  labelSingular: 'Доля отдела в проекте',
  labelPlural: 'Доли отделов в проектах',
  description:
    'Участие отдела в проекте с плановой долей в часах (мульти-отдел, REQ-0013)',
  icon: 'IconChartPie',
  fields: [
    {
      universalIdentifier:
        CREDOS_TIME_PROJECT_DEPARTMENT_PLANNED_EFFORT_SHARE_FIELD_ID,
      name: 'plannedEffortShare',
      type: FieldType.NUMBER,
      label: 'Плановая доля (часы)',
      icon: 'IconClockShare',
      description:
        'Плановые часы отдела в проекте. Σ долей ≈ plannedEffort проекта (валидация мягкая, не блок).',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    // ProjectDepartment.project -> Project.departmentShares (MANY_TO_ONE, CASCADE).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconFolder',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_DEPARTMENT_SHARES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
    // ProjectDepartment.department -> Department.projectShares (MANY_TO_ONE, CASCADE).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_PROJECT_SHARES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'departmentId',
      },
    },
  ],
});
