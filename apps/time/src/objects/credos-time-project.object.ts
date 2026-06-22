import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INDUSTRY_OPTIONS,
  NDA_LEVEL_DEFAULT,
  NDA_LEVEL_OPTIONS,
  PLAN_METHOD_DEFAULT,
  PLAN_METHOD_OPTIONS,
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
  CREDOS_TIME_PROJECT_CAN_PUBLISH_ON_SITE_FIELD_ID,
  CREDOS_TIME_PROJECT_CAN_USE_IN_PROPOSALS_FIELD_ID,
  CREDOS_TIME_PROJECT_CAN_USE_LOGO_FIELD_ID,
  CREDOS_TIME_PROJECT_CLIENT_INDUSTRY_FIELD_ID,
  CREDOS_TIME_PROJECT_CLIENT_MARKETING_CONSENT_FIELD_ID,
  CREDOS_TIME_PROJECT_CLIENT_UNSUBSCRIBED_FIELD_ID,
  CREDOS_TIME_PROJECT_IS_PUBLISHED_FIELD_ID,
  CREDOS_TIME_PROJECT_MANAGER_FIELD_ID,
  CREDOS_TIME_PROJECT_MARKETING_ACTUAL_ON_FIELD_ID,
  CREDOS_TIME_PROJECT_NDA_LEVEL_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_OWNER_FIELD_ID,
  CREDOS_TIME_PROJECT_PLAN_METHOD_FIELD_ID,
  CREDOS_TIME_PROJECT_PUBLISHED_URL_FIELD_ID,
  CREDOS_TIME_PROJECT_REFERENCE_READY_FIELD_ID,
  CREDOS_TIME_PROJECT_REVIEW_PUBLISHED_FIELD_ID,
  CREDOS_TIME_PROJECT_REVIEW_URL_FIELD_ID,
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
    // WI-47: способ раскида плана. EVEN (дефолт) — равномерно из plannedEffort+дат
    // на лету; MANUAL — Σ помесячных слотов credosTimePlanSlot. nullable → пусто
    // трактуется как EVEN (миграция существующих проектов без значения).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_PLAN_METHOD_FIELD_ID,
      name: 'planMethod',
      type: FieldType.SELECT,
      label: 'Способ планирования',
      icon: 'IconLayoutDistributeHorizontal',
      description: 'EVEN — равномерно по сроку; MANUAL — вручную по месяцам (Σ слотов).',
      isNullable: true,
      defaultValue: PLAN_METHOD_DEFAULT,
      options: PLAN_METHOD_OPTIONS,
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
    // --- Маркетинг проекта: NDA + публикация на сайте (ADDITIVE) ---
    // Уровень NDA определяет, что можно говорить о проекте в публичных кейсах.
    {
      universalIdentifier: CREDOS_TIME_PROJECT_NDA_LEVEL_FIELD_ID,
      name: 'ndaLevel',
      type: FieldType.SELECT,
      label: 'Уровень NDA',
      icon: 'IconLock',
      description:
        'NONE — НДА нет; CLIENT_ONLY — можно о клиенте, нельзя о работах; CLIENT_SECRET — нельзя о клиенте.',
      isNullable: true,
      defaultValue: NDA_LEVEL_DEFAULT,
      options: NDA_LEVEL_OPTIONS,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CAN_PUBLISH_ON_SITE_FIELD_ID,
      name: 'canPublishOnSite',
      type: FieldType.BOOLEAN,
      label: 'Можно публиковать на сайте',
      icon: 'IconWorldCheck',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_IS_PUBLISHED_FIELD_ID,
      name: 'isPublished',
      type: FieldType.BOOLEAN,
      label: 'Опубликовано на сайте',
      icon: 'IconWorldUpload',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_PUBLISHED_URL_FIELD_ID,
      name: 'publishedUrl',
      type: FieldType.TEXT,
      label: 'Ссылка на публикацию',
      icon: 'IconLink',
      isNullable: true,
      defaultValue: null,
    },
    // Отзыв клиента: опубликован ли на сайте + ссылка (рядом с публикацией).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_REVIEW_PUBLISHED_FIELD_ID,
      name: 'reviewPublished',
      type: FieldType.BOOLEAN,
      label: 'Опубликован отзыв на сайте',
      icon: 'IconMessageStar',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_REVIEW_URL_FIELD_ID,
      name: 'reviewUrl',
      type: FieldType.TEXT,
      label: 'Ссылка на отзыв',
      icon: 'IconLink',
      isNullable: true,
      defaultValue: null,
    },
    // --- Sales-enablement P1 (MARKETING_SALES_B2B §3): разрешения тоньше сайта ---
    // Закрытый канал отдельно от публичного сайта: КП/тендеры/питчи. NDA-vs-разрешение
    // НЕ валидируем (доверие пользователю, MVP).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CAN_USE_IN_PROPOSALS_FIELD_ID,
      name: 'canUseInProposals',
      type: FieldType.BOOLEAN,
      label: 'Можно в КП/тендерах/питчах',
      icon: 'IconFileText',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CAN_USE_LOGO_FIELD_ID,
      name: 'canUseLogo',
      type: FieldType.BOOLEAN,
      label: 'Можно использовать логотип клиента',
      icon: 'IconPhoto',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_REFERENCE_READY_FIELD_ID,
      name: 'referenceReady',
      type: FieldType.BOOLEAN,
      label: 'Готов как референс для продаж',
      icon: 'IconThumbUp',
      defaultValue: false,
    },
    // Отрасль клиента (для ABM-подбора похожего референса под сделку). nullable —
    // отрасль может быть не указана.
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CLIENT_INDUSTRY_FIELD_ID,
      name: 'clientIndustry',
      type: FieldType.SELECT,
      label: 'Отрасль клиента',
      icon: 'IconBuildingFactory',
      isNullable: true,
      defaultValue: null,
      options: INDUSTRY_OPTIONS,
    },
    // --- Группа «рассылка / consent клиента» (ПЛЕЙСХОЛДЕРЫ) ---
    // Относится к клиенту; sync с сайтом (форма согласия) + Unisender API и с
    // карточкой организации — follow-up. Сейчас только поля, интеграции нет.
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CLIENT_MARKETING_CONSENT_FIELD_ID,
      name: 'clientMarketingConsent',
      type: FieldType.BOOLEAN,
      label: 'Согласие клиента на рассылку (с сайта)',
      icon: 'IconMailCheck',
      defaultValue: false,
    },
    {
      universalIdentifier: CREDOS_TIME_PROJECT_CLIENT_UNSUBSCRIBED_FIELD_ID,
      name: 'clientUnsubscribed',
      type: FieldType.BOOLEAN,
      label: 'Клиент отписался от рассылки',
      icon: 'IconMailOff',
      defaultValue: false,
    },
    // Актуальность маркетинг-данных: ручная дата ревью («маркетинг проверен/актуален
    // на»). Заполняется маркетологом при проверке кейса/разрешений; ядровой нативный
    // updatedAt (whole-record) выводится рядом в card-view бесплатно — авто-дату по
    // маркетинг-блоку отдельно НЕ заводим (дублировала бы ядро без выгоды).
    {
      universalIdentifier: CREDOS_TIME_PROJECT_MARKETING_ACTUAL_ON_FIELD_ID,
      name: 'marketingActualOn',
      type: FieldType.DATE_TIME,
      label: 'Маркетинг-данные актуальны на',
      icon: 'IconCalendarCheck',
      description:
        'Ручная дата ревью маркетинг-данных проекта (кейс/разрешения/отзыв проверены).',
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
