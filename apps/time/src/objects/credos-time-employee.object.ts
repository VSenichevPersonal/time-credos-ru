import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CREDOS_TIME_DEPARTMENT_EMPLOYEES_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
  CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
  CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Работник — профиль учёта (отдел + ёмкость), которого нет у WorkspaceMember.
// Идентичность пользователя — стандартный WorkspaceMember (workspaceMemberRef).
export default defineObject({
  universalIdentifier: CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeEmployee',
  namePlural: 'credosTimeEmployees',
  labelSingular: 'Работник',
  labelPlural: 'Работники',
  description: 'Профиль учёта трудозатрат (отдел, ёмкость) поверх WorkspaceMember',
  icon: 'IconUser',
  fields: [
    {
      universalIdentifier: 'a52484bf-afd2-4a01-ace3-7042a762dbfe',
      name: 'firstName',
      type: FieldType.TEXT,
      label: 'Имя',
      icon: 'IconUser',
    },
    {
      universalIdentifier: 'ca5f2e4e-bf80-4bd4-b049-219b7c464429',
      name: 'lastName',
      type: FieldType.TEXT,
      label: 'Фамилия',
      icon: 'IconUser',
    },
    {
      universalIdentifier: '40b1efc4-971d-4281-9ab2-b1cc2c796589',
      name: 'middleName',
      type: FieldType.TEXT,
      label: 'Отчество',
      icon: 'IconUser',
    },
    {
      universalIdentifier: '4b0370d4-43e3-4cac-972d-8efe1abd5b36',
      name: 'email',
      type: FieldType.TEXT,
      label: 'Email',
      icon: 'IconMail',
    },
    {
      universalIdentifier: 'bcfaaf12-5e9a-4eb1-b5d5-4ac6eb2a340b',
      name: 'jobTitle',
      type: FieldType.TEXT,
      label: 'Должность',
      icon: 'IconBriefcase',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: 'c2dca599-9ba4-4a03-aca4-75dd1008b079',
      name: 'active',
      type: FieldType.BOOLEAN,
      label: 'Активен',
      icon: 'IconUserCheck',
      defaultValue: true,
    },
    {
      universalIdentifier: '5bbec5e9-c127-48f1-b6c3-730c0185bf2f',
      name: 'workspaceMemberRef',
      type: FieldType.TEXT,
      label: 'ID пользователя workspace',
      icon: 'IconId',
      description: 'Идентификатор workspaceMember CRM',
      isNullable: true,
      defaultValue: null,
    },
    // Employee.department -> Department.employees (MANY_TO_ONE).
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_DEPARTMENT_FIELD_ID,
      name: 'department',
      type: FieldType.RELATION,
      label: 'Отдел',
      icon: 'IconBuilding',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_DEPARTMENT_EMPLOYEES_FIELD_ID,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'departmentId',
      },
    },
    // Обратная сторона к TimeEntry.employee (ONE_TO_MANY) — для отдела/аналитики.
    {
      universalIdentifier: CREDOS_TIME_EMPLOYEE_TIME_ENTRIES_FIELD_ID,
      name: 'timeEntries',
      type: FieldType.RELATION,
      label: 'Записи трудозатрат',
      icon: 'IconClock',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_ENTRY_EMPLOYEE_FIELD_ID,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
