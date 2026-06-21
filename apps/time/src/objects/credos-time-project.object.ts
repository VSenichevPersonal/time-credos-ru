import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  PROJECT_CATEGORY_DEFAULT,
  PROJECT_STATUS_DEFAULT,
  PROJECT_STATUS_OPTIONS,
  WORK_CATEGORY_OPTIONS,
} from 'src/constants/select-options';
import {
  CREDOS_TIME_COMPANY_PROJECTS_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PROJECTS_FIELD_ID,
  CREDOS_TIME_PROJECT_BUDGET_REMAINING_FIELD_ID,
  CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
  CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PROJECT_DESCRIPTION_FIELD_ID,
  CREDOS_TIME_PROJECT_EXTERNAL_CODE_FIELD_ID,
  CREDOS_TIME_PROJECT_FACT_HOURS_FIELD_ID,
  CREDOS_TIME_PROJECT_MANAGER_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OWNER_FIELD_ID,
  CREDOS_TIME_WORKSPACE_MEMBER_MANAGED_PROJECTS_FIELD_ID,
  CREDOS_TIME_WORKSPACE_MEMBER_OWNED_PROJECTS_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Проект — развитая сущность со своей идентичностью (code/name), жизненным
// циклом, этапами. Клиент читается из стандартного Company CRM.
// owner/manager — ссылки на стандартный WorkspaceMember (как в CRM).
export default defineObject({
  universalIdentifier: CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeProject',
  namePlural: 'credosTimeProjects',
  labelSingular: 'Проект',
  labelPlural: 'Проекты',
  description: 'Проект учёта трудозатрат',
  icon: 'IconFolder',
  // Заголовок карточки = код проекта (вместо пустого авто-поля name).
  labelIdentifierFieldMetadataUniversalIdentifier:
    '1d862047-d899-450e-a565-95c028f9ce90',
  fields: [
    {
      universalIdentifier: '1d862047-d899-450e-a565-95c028f9ce90',
      name: 'code',
      type: FieldType.TEXT,
      label: 'Код проекта',
      icon: 'IconHash',
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_EXTERNAL_CODE_FIELD_ID,
      name: 'externalCode',
      type: FieldType.TEXT,
      label: 'Код клиента/Директум',
      icon: 'IconExternalLink',
      description: 'Внешний код (Директум/1С) для сверки. Не путать с внутренним кодом проекта.',
      isNullable: true,
      defaultValue: null,
    },
    // P2 (FIELDS_COLUMNS_AUDIT §1): описание проекта (Timetta/Kimai description).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_DESCRIPTION_FIELD_ID,
      name: 'description',
      type: FieldType.TEXT,
      label: 'Описание',
      icon: 'IconFileText',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '9630aaf0-7371-4d07-8754-bc1bc94887a0',
      name: 'category',
      type: FieldType.SELECT,
      label: 'Категория работ',
      icon: 'IconCategory',
      defaultValue: PROJECT_CATEGORY_DEFAULT,
      options: WORK_CATEGORY_OPTIONS,
    },
    {
      universalIdentifier: '8098049a-872d-4c33-8f27-f05d15a53cc1',
      name: 'status',
      type: FieldType.SELECT,
      label: 'Статус',
      icon: 'IconProgress',
      defaultValue: PROJECT_STATUS_DEFAULT,
      options: PROJECT_STATUS_OPTIONS,
    },
    {
      universalIdentifier: '3f9b3e3d-0d24-4b30-953e-5cce9eb66c77',
      name: 'startDate',
      type: FieldType.DATE_TIME,
      label: 'Дата начала',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: 'e8e46a47-b290-4350-972a-66025062005c',
      name: 'endDate',
      type: FieldType.DATE_TIME,
      label: 'Дата окончания',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '4f202b64-a1cb-4e88-a917-06d9931ab489',
      name: 'plannedEffort',
      type: FieldType.NUMBER,
      label: 'Плановые часы',
      icon: 'IconClockHour4',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_FACT_HOURS_FIELD_ID,
      name: 'factHours',
      type: FieldType.NUMBER,
      label: 'Факт (часы)',
      icon: 'IconClock',
      description: 'Σ трудозатрат по проекту. Пересчитывается на ЛЮБОМ изменении записей (database-event триггеры + /s/time-entry) и при установке (backfill).',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_BUDGET_REMAINING_FIELD_ID,
      name: 'budgetRemaining',
      type: FieldType.NUMBER,
      label: 'Остаток/перерасход (часы)',
      icon: 'IconTrendingDown',
      description: 'plannedEffort − factHours. Отрицательное = перерасход. Null если план не задан.',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: 'a4434ce3-f3eb-4bb7-a937-ccae805971a3',
      name: 'approvalRequired',
      type: FieldType.BOOLEAN,
      label: 'Требуется согласование',
      icon: 'IconChecks',
      description: 'Пусто = наследует настройку отдела',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: 'e52a6c2f-0cc4-4601-8aa8-239d01bc8774',
      name: 'serviceRef',
      type: FieldType.TEXT,
      label: 'Типовая услуга (каталог)',
      icon: 'IconBriefcase',
      description: 'Задел под каталог услуг (фаза 2)',
      isNullable: true,
      defaultValue: null,
    },
    // Project.company -> стандартный Company (MANY_TO_ONE, nullable).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_COMPANY_FIELD_ID,
      name: 'company',
      type: FieldType.RELATION,
      label: 'Клиент',
      icon: 'IconBuildingSkyscraper',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_COMPANY_PROJECTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'companyId',
      },
    },
    // Project.department -> Department.projects (MANY_TO_ONE).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_PROJECTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'departmentId',
      },
    },
    // Project.owner -> стандартный WorkspaceMember (MANY_TO_ONE, nullable).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_OWNER_FIELD_ID,
      name: 'owner',
      type: FieldType.RELATION,
      label: 'Владелец',
      icon: 'IconUserCircle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORKSPACE_MEMBER_OWNED_PROJECTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'ownerId',
      },
    },
    // Project.manager -> стандартный WorkspaceMember (MANY_TO_ONE, nullable).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MANAGER_FIELD_ID,
      name: 'manager',
      type: FieldType.RELATION,
      label: 'Руководитель проекта',
      icon: 'IconUserStar',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORKSPACE_MEMBER_MANAGED_PROJECTS_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'managerId',
      },
    },
    // Обратные стороны (ONE_TO_MANY) вынесены в src/fields/ для лимита размера:
    // project-stages, project-time-entries, project-billing-links,
    // project-department-shares (REQ-0013 13a, доли отделов).
  ],
});
