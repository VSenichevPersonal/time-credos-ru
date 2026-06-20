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
} from 'src/constants/select-options';
import {
  TT_ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_ACTIVITY_TIME_ENTRIES_FIELD_ID,
  TT_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
  TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_PROJECT_TIME_ENTRIES_FIELD_ID,
  TT_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_STAGE_TIME_ENTRIES_FIELD_ID,
  TT_TIME_ENTRY_ACTIVITY_FIELD_ID,
  TT_TIME_ENTRY_EMPLOYEE_FIELD_ID,
  TT_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_TIME_ENTRY_PROJECT_FIELD_ID,
  TT_TIME_ENTRY_STAGE_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Запись трудозатрат — атом учёта (1 строка = дата + часы + проект + работник).
// hours — decimal (0.5/0.75/8). Связи stage/activity опциональны.
export default defineObject({
  universalIdentifier: TT_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'ttTimeEntry',
  namePlural: 'ttTimeEntries',
  labelSingular: 'Запись трудозатрат',
  labelPlural: 'Записи трудозатрат',
  description: 'Запись учёта времени',
  icon: 'IconClock',
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
      universalIdentifier: '257e813a-60be-4bb2-ae41-660cfbdc5f73',
      name: 'billable',
      type: FieldType.BOOLEAN,
      label: 'Биллируемая',
      icon: 'IconCoin',
      defaultValue: false,
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
    // TimeEntry.employee -> Employee.timeEntries (MANY_TO_ONE).
    {
      universalIdentifier: TT_TIME_ENTRY_EMPLOYEE_FIELD_ID,
      name: 'employee',
      type: FieldType.RELATION,
      label: 'Работник',
      icon: 'IconUser',
      relationTargetObjectMetadataUniversalIdentifier:
        TT_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TT_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'employeeId',
      },
    },
    // TimeEntry.project -> Project.timeEntries (MANY_TO_ONE).
    {
      universalIdentifier: TT_TIME_ENTRY_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconFolder',
      relationTargetObjectMetadataUniversalIdentifier:
        TT_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TT_PROJECT_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
    // TimeEntry.stage -> Stage.timeEntries (MANY_TO_ONE, nullable).
    {
      universalIdentifier: TT_TIME_ENTRY_STAGE_FIELD_ID,
      name: 'stage',
      type: FieldType.RELATION,
      label: 'Этап',
      icon: 'IconListTree',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        TT_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TT_STAGE_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'stageId',
      },
    },
    // TimeEntry.activity -> Activity.timeEntries (MANY_TO_ONE, nullable).
    {
      universalIdentifier: TT_TIME_ENTRY_ACTIVITY_FIELD_ID,
      name: 'activity',
      type: FieldType.RELATION,
      label: 'Вид работ',
      icon: 'IconListCheck',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        TT_ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TT_ACTIVITY_TIME_ENTRIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'activityId',
      },
    },
  ],
});
