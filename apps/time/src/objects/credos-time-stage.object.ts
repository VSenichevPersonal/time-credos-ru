import {
  defineObject,
  FieldType,
  NumberDataType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PROJECT_STATUS_DEFAULT,
  PROJECT_STATUS_OPTIONS,
} from 'src/constants/select-options';
import {
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_STAGE_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_STAGES_FIELD_ID,
  CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_STAGE_PROJECT_FIELD_ID,
  CREDOS_TIME_STAGE_TIME_ENTRIES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Этап — подуровень проекта. Трудозатраты можно списывать на этап.
export default defineObject({
  universalIdentifier: CREDOS_TIME_STAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeStage',
  namePlural: 'credosTimeStages',
  labelSingular: 'Этап',
  labelPlural: 'Этапы',
  description: 'Этап проекта',
  icon: 'IconListTree',
  // Заголовок карточки = код этапа (вместо пустого авто-поля name).
  labelIdentifierFieldMetadataUniversalIdentifier:
    '4eda4ffc-d036-4303-80b2-5242bce0a230',
  fields: [
    {
      universalIdentifier: '4eda4ffc-d036-4303-80b2-5242bce0a230',
      name: 'code',
      type: FieldType.TEXT,
      label: 'Код этапа',
      icon: 'IconHash',
    },
    {
      universalIdentifier: 'e977847f-c8f0-4861-a4c1-394439120092',
      name: 'status',
      type: FieldType.SELECT,
      label: 'Статус',
      icon: 'IconProgress',
      defaultValue: PROJECT_STATUS_DEFAULT,
      options: PROJECT_STATUS_OPTIONS,
    },
    {
      universalIdentifier: '32bd628b-5b3c-4e56-a21e-e9b547244927',
      name: 'startDate',
      type: FieldType.DATE_TIME,
      label: 'Дата начала',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: 'a782e482-93c0-436b-8d3c-2b554c1edb32',
      name: 'endDate',
      type: FieldType.DATE_TIME,
      label: 'Дата окончания',
      icon: 'IconCalendar',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: '5d03bd03-64f1-4e50-bda6-3341c9b2fab6',
      name: 'plannedEffort',
      type: FieldType.NUMBER,
      label: 'Плановые часы',
      icon: 'IconClockHour4',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    // Stage.project -> Project.stages (MANY_TO_ONE).
    {
      universalIdentifier: CREDOS_TIME_STAGE_PROJECT_FIELD_ID,
      name: 'project',
      type: FieldType.RELATION,
      label: 'Проект',
      icon: 'IconFolder',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_STAGES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'projectId',
      },
    },
    // Обратная сторона к TimeEntry.stage (ONE_TO_MANY).
    {
      universalIdentifier: CREDOS_TIME_STAGE_TIME_ENTRIES_FIELD_ID,
      name: 'timeEntries',
      type: FieldType.RELATION,
      label: 'Записи трудозатрат',
      icon: 'IconClock',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_STAGE_FIELD_ID,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
