import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ENTRY_STATUS_DEFAULT,
  ENTRY_STATUS_OPTIONS,
  ENTRY_TAG_OPTIONS,
} from 'src/constants/select-options';
import {
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
  CREDOS_TIME_ENTRY_APPROVED_AT_FIELD_ID,
  CREDOS_TIME_ENTRY_APPROVED_BY_FIELD_ID,
  CREDOS_TIME_ENTRY_DESCRIPTION_FIELD_ID,
  CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
  CREDOS_TIME_ENTRY_REJECT_COMMENT_FIELD_ID,
  CREDOS_TIME_ENTRY_RESOLVED_AT_FIELD_ID,
  CREDOS_TIME_ENTRY_RESOLVED_BY_FIELD_ID,
  CREDOS_TIME_ENTRY_REVOKED_AT_FIELD_ID,
  CREDOS_TIME_ENTRY_REVOKED_BY_FIELD_ID,
  CREDOS_TIME_ENTRY_STAGE_FIELD_ID,
  CREDOS_TIME_ENTRY_TAGS_FIELD_ID,
  CREDOS_TIME_ENTRY_WORK_TYPE_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_TIME_ENTRIES_FIELD_ID,
  CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_TIME_ENTRIES_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_TIME_ENTRIES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Запись трудозатрат — атом учёта (1 строка = дата + часы + проект + работник).
// hours — decimal (0.5/0.75/8). Связи stage/workType опциональны.
export default defineObject({
  universalIdentifier: CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeEntry',
  namePlural: 'credosTimeEntries',
  labelSingular: 'Запись трудозатрат',
  labelPlural: 'Записи трудозатрат',
  description: 'Запись учёта времени',
  icon: 'IconClock',
  // Заголовок карточки = состав работ (вместо пустого авто-поля name).
  labelIdentifierFieldMetadataUniversalIdentifier:
    CREDOS_TIME_ENTRY_DESCRIPTION_FIELD_ID,
  fields: [
    {
      universalIdentifier: '359bdb1d-f6c5-4780-b560-5013858d2ec3',
      name: 'date',
      type: FieldType.DATE_TIME,
      label: 'Дата',
      icon: 'IconCalendar',
      defaultValue: 'now',
    },
    {
      universalIdentifier: '3b8ea288-2594-4d9a-8314-b1d8dee0e0c5',
      name: 'hours',
      type: FieldType.NUMBER,
      label: 'Часы',
      icon: 'IconClockHour4',
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: 'c59758a1-5b6f-4ee0-b0b9-da3f2b7e44d4',
      name: 'description',
      type: FieldType.TEXT,
      label: 'Состав работ',
      icon: 'IconFileText',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '60cc0ef7-38ef-42aa-903a-2e13d178fafc',
      name: 'status',
      type: FieldType.SELECT,
      label: 'Статус',
      icon: 'IconProgress',
      defaultValue: ENTRY_STATUS_DEFAULT,
      options: ENTRY_STATUS_OPTIONS,
    },
    // Теги записи (W3-2, Kimai tags) — свободные метки для срезов/группировки
    // в отчётах. MULTI_SELECT (несколько на запись). nullable (миграция).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_TAGS_FIELD_ID,
      name: 'tags',
      type: FieldType.MULTI_SELECT,
      label: 'Теги',
      icon: 'IconTags',
      isNullable: true,
      defaultValue: null,
      options: ENTRY_TAG_OPTIONS,
    },
    // Кто согласовал/отклонил (userWorkspaceId руководителя). Заполняет /s/approval.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_APPROVED_BY_FIELD_ID,
      name: 'approvedBy',
      type: FieldType.TEXT,
      label: 'Кто согласовал',
      icon: 'IconUserCheck',
      isNullable: true,
      defaultValue: null,
    },
    // Когда согласовали/отклонили.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_APPROVED_AT_FIELD_ID,
      name: 'approvedAt',
      type: FieldType.DATE_TIME,
      label: 'Дата согласования',
      icon: 'IconCalendarCheck',
      isNullable: true,
      defaultValue: null,
    },
    // Причина отклонения (op=reject). Сотрудник видит что исправить. Очищается
    // при approve/повторном submit (запись «ожила»). UX-gap, подтверждён Timetta.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_REJECT_COMMENT_FIELD_ID,
      name: 'rejectComment',
      type: FieldType.TEXT,
      label: 'Причина отклонения',
      icon: 'IconMessageCircleX',
      isNullable: true,
      defaultValue: null,
    },
    // WI-56 аудит-resolver (W5A.11/12/24). approvedBy/At остаются approve-only;
    // resolvedBy/At фиксируют АВТОРА решения и для reject (где approvedBy раньше
    // нёс двойную семантику «отклонивший»). Заполняет /s/approval approve+reject.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_RESOLVED_BY_FIELD_ID,
      name: 'resolvedBy',
      type: FieldType.TEXT,
      label: 'Кто вынес решение',
      icon: 'IconGavel',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: CREDOS_TIME_ENTRY_RESOLVED_AT_FIELD_ID,
      name: 'resolvedAt',
      type: FieldType.DATE_TIME,
      label: 'Дата решения',
      icon: 'IconCalendarStats',
      isNullable: true,
      defaultValue: null,
    },
    // revokedBy/At — кто/когда отозвал согласование (revoke, руководитель) ИЛИ
    // отправку (recall, сотрудник). W5A.24: REVOKED-статус не вводим — признак
    // «отозвано согласование» = approvedAt пуст И revokedBy задан.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_REVOKED_BY_FIELD_ID,
      name: 'revokedBy',
      type: FieldType.TEXT,
      label: 'Кто отозвал',
      icon: 'IconArrowBackUp',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: CREDOS_TIME_ENTRY_REVOKED_AT_FIELD_ID,
      name: 'revokedAt',
      type: FieldType.DATE_TIME,
      label: 'Дата отзыва',
      icon: 'IconCalendarMinus',
      isNullable: true,
      defaultValue: null,
    },
    // TimeEntry.employee -> Employee.timeEntries (MANY_TO_ONE).
    // onDelete: RESTRICT (CISO-011) — нельзя удалить сотрудника с записями
    // (вкл. APPROVED). БД-уровень защиты согласованных часов табеля/1С.
    // Форсирует архивирование сотрудника вместо delete (как в Timetta:
    // ресурс с проводками нельзя удалить, только архив). Было CASCADE —
    // сносило ВСЕ записи в обход guard /s/time-entry. Волна-5C, риск целостности.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
      name: 'employee',
      type: FieldType.RELATION,
      label: 'Работник',
      icon: 'IconUser',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.RESTRICT,
        joinColumnName: 'employeeId',
      },
    },
    // TimeEntry.project -> Project.timeEntries (MANY_TO_ONE).
    // onDelete: RESTRICT (CISO-011) — нельзя удалить проект с записями
    // (вкл. APPROVED). БД-уровень защиты согласованных часов табеля/1С.
    // Форсирует архивирование проекта вместо delete (как в Timetta:
    // проект с проводками нельзя удалить, только архив). Было CASCADE —
    // сносило ВСЕ записи в обход guard /s/time-entry. Волна-5C, риск целостности.
    {
      universalIdentifier: CREDOS_TIME_ENTRY_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconFolder',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.RESTRICT,
        joinColumnName: 'projectId',
      },
    },
    // TimeEntry.stage -> Stage.timeEntries (MANY_TO_ONE, nullable).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_STAGE_FIELD_ID,
      name: 'stage',
      type: FieldType.RELATION,
      label: 'Этап',
      icon: 'IconListTree',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_STAGE_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'stageId',
      },
    },
    // TimeEntry.workType -> WorkType.timeEntries (MANY_TO_ONE, nullable).
    {
      universalIdentifier: CREDOS_TIME_ENTRY_WORK_TYPE_FIELD_ID,
      name: 'workType',
      type: FieldType.RELATION,
      label: 'Вид работ',
      icon: 'IconListCheck',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORK_TYPE_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'workTypeId',
      },
    },
  ],
});
