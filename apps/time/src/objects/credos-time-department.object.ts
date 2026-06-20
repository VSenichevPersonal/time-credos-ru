import {
  defineObject,
  FieldType,
  NumberDataType,
  RelationType,
} from 'twenty-sdk/define';

import { DEPARTMENT_CODE_OPTIONS } from 'src/constants/select-options';
import {
  CREDOS_TIME_DEPARTMENT_EMPLOYEES_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_DEPARTMENT_PROJECTS_FIELD_ID,
  CREDOS_TIME_DEPARTMENT_WORK_TYPES_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
  CREDOS_TIME_WORK_TYPE_DEPARTMENT_FIELD_ID,
  CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Отдел — производственное подразделение (ОВ/ОИБ/ОПИБ/ТЦ/ОПР).
// Владеет обратными (ONE_TO_MANY) сторонами связей с Employee/Project/WorkType.
export default defineObject({
  universalIdentifier: CREDOS_TIME_DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'credosTimeDepartment',
  namePlural: 'credosTimeDepartments',
  labelSingular: 'Отдел',
  labelPlural: 'Отделы',
  description: 'Производственное подразделение Кредо-С',
  icon: 'IconBuilding',
  // labelIdentifier: ядро требует searchable (TEXT). У отдела TEXT-поля нет
  // (code — SELECT), поэтому заголовок карточки остаётся авто-полем name.
  fields: [
    {
      universalIdentifier: '474dd507-0969-4a74-a981-2da5ede39fe0',
      name: 'code',
      type: FieldType.SELECT,
      label: 'Код отдела',
      icon: 'IconHash',
      options: DEPARTMENT_CODE_OPTIONS,
    },
    {
      universalIdentifier: 'b399c04e-af37-48cc-ae3e-b6899776c174',
      name: 'approvalRequired',
      type: FieldType.BOOLEAN,
      label: 'Требуется согласование',
      icon: 'IconChecks',
      defaultValue: false,
    },
    {
      universalIdentifier: 'ec699c59-b373-4f8a-8d22-c3894b69d515',
      name: 'capacityFactor',
      type: FieldType.NUMBER,
      label: 'Коэффициент загрузки',
      icon: 'IconGauge',
      defaultValue: 0.8,
      universalSettings: { dataType: NumberDataType.FLOAT, decimals: 2 },
    },
    {
      universalIdentifier: '4837bf7d-a05d-4b2b-b71c-53f463fe586f',
      name: 'headcount',
      type: FieldType.NUMBER,
      label: 'Численность',
      icon: 'IconUsers',
      isNullable: true,
      defaultValue: null,
      universalSettings: { dataType: NumberDataType.INT },
    },
    // Обратные стороны связей (ONE_TO_MANY).
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_EMPLOYEES_FIELD_ID,
      name: 'employees',
      type: FieldType.RELATION,
      label: 'Сотрудники',
      icon: 'IconUsers',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_EMPLOYEE_DEPARTMENT_FIELD_ID,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_PROJECTS_FIELD_ID,
      name: 'projects',
      type: FieldType.RELATION,
      label: 'Проекты',
      icon: 'IconFolder',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_PROJECT_DEPARTMENT_FIELD_ID,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
    {
      universalIdentifier: CREDOS_TIME_DEPARTMENT_WORK_TYPES_FIELD_ID,
      name: 'workTypes',
      type: FieldType.RELATION,
      label: 'Виды работ',
      icon: 'IconListCheck',
      relationTargetObjectMetadataUniversalIdentifier:
        CREDOS_TIME_WORK_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CREDOS_TIME_WORK_TYPE_DEPARTMENT_FIELD_ID,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
