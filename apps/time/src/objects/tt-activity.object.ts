import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { ACTIVITY_GROUP_OPTIONS } from 'src/constants/select-options';
import {
  TT_ACTIVITY_DEPARTMENT_FIELD_ID,
  TT_ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_ACTIVITY_TIME_ENTRIES_FIELD_ID,
  TT_DEPARTMENT_ACTIVITIES_FIELD_ID,
  TT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  TT_TIME_ENTRY_ACTIVITY_FIELD_ID,
  TT_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Вид работ — единый справочник с группировкой для аналитики.
// department nullable: пустой = глобальный (кросс-отдельный) вид работ.
export default defineObject({
  universalIdentifier: TT_ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'ttActivity',
  namePlural: 'ttActivities',
  labelSingular: 'Вид работ',
  labelPlural: 'Виды работ',
  description: 'Справочник видов работ (тип работ)',
  icon: 'IconListCheck',
  fields: [
    {
      universalIdentifier: '78e61c8f-d18c-48c3-9897-5cf3316aebe9',
      name: 'group',
      type: FieldType.SELECT,
      label: 'Группа',
      icon: 'IconCategory',
      options: ACTIVITY_GROUP_OPTIONS,
    },
    {
      universalIdentifier: '67343191-444f-4599-886f-0ea441e6ebfd',
      name: 'billableByDefault',
      type: FieldType.BOOLEAN,
      label: 'Биллируемый по умолчанию',
      icon: 'IconCoin',
      defaultValue: false,
    },
    // Activity.department -> Department.activities (MANY_TO_ONE, nullable).
    {
      universalIdentifier: TT_ACTIVITY_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        TT_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TT_DEPARTMENT_ACTIVITIES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'departmentId',
      },
    },
    // Обратная сторона к TimeEntry.activity (ONE_TO_MANY).
    {
      universalIdentifier: TT_ACTIVITY_TIME_ENTRIES_FIELD_ID,
      name: 'timeEntries',
      type: FieldType.RELATION,
      label: 'Записи трудозатрат',
      icon: 'IconClock',
      relationTargetObjectMetadataUniversalIdentifier:
        TT_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TT_TIME_ENTRY_ACTIVITY_FIELD_ID,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
