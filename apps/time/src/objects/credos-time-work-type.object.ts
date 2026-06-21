import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { WORK_TYPE_GROUP_OPTIONS } from 'src/constants/select-options';
import {
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_WORK_TYPES_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ENTRY_WORK_TYPE_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_NAME_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_TIME_ENTRIES_FIELD_ID,
} from 'src/constants/universal-identifiers';

// Вид работ — единый справочник с группировкой для аналитики.
// department nullable: пустой = глобальный (кросс-отдельный) вид работ.
export default defineObject({
  universalIdentifier: CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeWorkType',
  namePlural: 'credosTimeWorkTypes',
  labelSingular: 'Вид работ',
  labelPlural: 'Виды работ',
  description: 'Справочник видов работ (тип работ)',
  icon: 'IconListCheck',
  // P1 (FIELDS_COLUMNS_AUDIT §7): собственное наименование вида работ (слаг `title`,
  // НЕ `name` — `name` зарезервировано). labelIdentifier НЕ задаём в этой миграции:
  // нельзя сделать labelIdentifier полем, создаваемым в том же sync (objectMetadata
  // update падает, 94c519b4). Различимость даёт колонка `title` в реестре; назначение
  // labelIdentifier=title — отдельным деплоем ПОСЛЕ создания поля (follow-up).
  fields: [
    // P1: собственное наименование вида работ (Kimai activity.name).
    {
      universalIdentifier: CREDOS_TIME_WORK_TYPE_NAME_FIELD_ID,
      name: 'title',
      type: FieldType.TEXT,
      label: 'Наименование',
      icon: 'IconListCheck',
    },
    {
      universalIdentifier: '78e61c8f-d18c-48c3-9897-5cf3316aebe9',
      name: 'group',
      type: FieldType.SELECT,
      label: 'Группа',
      icon: 'IconCategory',
      options: WORK_TYPE_GROUP_OPTIONS,
    },
    // WorkType.department -> Department.workTypes (MANY_TO_ONE, nullable).
    {
      universalIdentifier: CREDOS_TIME_WORK_TYPE_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_WORK_TYPES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'departmentId',
      },
    },
    // Обратная сторона к TimeEntry.workType (ONE_TO_MANY).
    {
      universalIdentifier: CREDOS_TIME_WORK_TYPE_TIME_ENTRIES_FIELD_ID,
      name: 'timeEntries',
      type: FieldType.RELATION,
      label: 'Записи трудозатрат',
      icon: 'IconClock',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_WORK_TYPE_FIELD_ID,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
