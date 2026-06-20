import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { ABSENCE_TYPE_DEFAULT, ABSENCE_TYPE_OPTIONS } from 'src/constants/select-options';
import {
  CREDOS_TIME_ABSENCE_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_ABSENCE_END_DATE_FIELD_ID,
  CREDOS_TIME_ABSENCE_NOTE_FIELD_ID,
  CREDOS_TIME_ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_ABSENCE_START_DATE_FIELD_ID,
  CREDOS_TIME_ABSENCE_TYPE_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_ABSENCES_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Отсутствие сотрудника (F-D): отпуск/больничный/без содержания/иное.
// Период [startDate, endDate] вычитается из ёмкости сотрудника при планировании
// (интеграция в /s/reports + capacity-доску — phase 2).
export default defineObject({
  universalIdentifier: CREDOS_TIME_ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeAbsence',
  namePlural: 'credosTimeAbsences',
  labelSingular: 'Отсутствие',
  labelPlural: 'Отсутствия',
  description: 'Отсутствия сотрудников (отпуск/больничный) — влияют на ёмкость',
  icon: 'IconBeach',
  // labelIdentifier: TEXT-поля для заголовка нет (type=SELECT) → авто-поле name.
  fields: [
    {
      universalIdentifier: CREDOS_TIME_ABSENCE_TYPE_FIELD_ID,
      name: 'absenceType',
      type: FieldType.SELECT,
      label: 'Тип',
      icon: 'IconCategory',
      defaultValue: ABSENCE_TYPE_DEFAULT,
      options: ABSENCE_TYPE_OPTIONS,
    },
    {
      universalIdentifier: CREDOS_TIME_ABSENCE_START_DATE_FIELD_ID,
      name: 'startDate',
      type: FieldType.DATE_TIME,
      label: 'Начало',
      icon: 'IconCalendar',
    },
    {
      universalIdentifier: CREDOS_TIME_ABSENCE_END_DATE_FIELD_ID,
      name: 'endDate',
      type: FieldType.DATE_TIME,
      label: 'Окончание',
      icon: 'IconCalendar',
    },
    {
      universalIdentifier: CREDOS_TIME_ABSENCE_NOTE_FIELD_ID,
      name: 'note',
      type: FieldType.TEXT,
      label: 'Примечание',
      icon: 'IconFileText',
      // CISO-008: предупреждение против медицинских ПДн (152-ФЗ ст.10, спецкатегория).
      // Только орг-пометка (номер приказа, «по семейным»), без диагнозов/мед.сведений.
      description:
        'Не указывайте диагнозы и медицинские сведения (152-ФЗ ст.10). Только организационная пометка: номер приказа, основание.',
      isNullable: true,
      defaultValue: null,
    },
    // Absence.employee -> Employee.absences (MANY_TO_ONE).
    {
      universalIdentifier: CREDOS_TIME_ABSENCE_EMPLOYEE_FIELD_ID,
      name: 'employee',
      type: FieldType.RELATION,
      label: 'Работник',
      icon: 'IconUser',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_ABSENCES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.CASCADE,
        joinColumnName: 'employeeId',
      },
    },
  ],
});
