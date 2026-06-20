// SELECT-опции для объектов credosTime* в формате SDK (value+label+position+color).
// Значения (id) — латиницей из domain-types; ярлыки — русские из labels.ts.

import {
  ABSENCE_TYPE_LABELS,
  BILLING_DOC_TYPE_LABELS,
  DEPARTMENT_LABELS,
  ENTRY_STATUS_LABELS,
  WORK_CATEGORY_LABELS,
  WORK_TYPE_GROUP_LABELS,
} from 'src/constants/labels';
import {
  type AbsenceType,
  type BillingDocType,
  type DepartmentCode,
  type EntryStatus,
  type WorkCategory,
  type WorkTypeGroup,
} from 'src/constants/domain-types';

// Цвета тегов SDK (TagColor) — фиксированные, чтобы пиклисты были читаемыми.
type TagColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'sky'
  | 'turquoise'
  | 'purple'
  | 'pink'
  | 'gray';

type SelectOption = {
  value: string;
  label: string;
  position: number;
  color: TagColor;
};

// SDK требует значения SELECT в UPPER_CASE snake_case. Доменные коды (camelCase/
// PascalCase из domain-types) приводим к UPPER_CASE только на границе опций;
// ярлык остаётся русским, тип-union в коде не меняется.
const toUpperSnake = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

// Универсальный билдер: упорядоченный список кодов + словарь ярлыков + цвета.
const buildOptions = <T extends string>(
  order: ReadonlyArray<T>,
  labels: Record<T, string>,
  colors: Record<T, TagColor>,
): SelectOption[] =>
  order.map((value, position) => ({
    value: toUpperSnake(value),
    label: labels[value],
    position,
    color: colors[value],
  }));

const DEPARTMENT_ORDER: ReadonlyArray<DepartmentCode> = [
  'OV',
  'OIB',
  'OPIB',
  'TC',
  'OPR',
];
const DEPARTMENT_COLORS: Record<DepartmentCode, TagColor> = {
  OV: 'blue',
  OIB: 'green',
  OPIB: 'turquoise',
  TC: 'orange',
  OPR: 'purple',
};
export const DEPARTMENT_CODE_OPTIONS: SelectOption[] = buildOptions(
  DEPARTMENT_ORDER,
  DEPARTMENT_LABELS,
  DEPARTMENT_COLORS,
);

const WORK_CATEGORY_ORDER: ReadonlyArray<WorkCategory> = [
  'Client',
  'Presale',
  'Pilot',
  'Internal',
  'Infrastructure',
  'Training',
];
const WORK_CATEGORY_COLORS: Record<WorkCategory, TagColor> = {
  Client: 'green',
  Presale: 'orange',
  Pilot: 'yellow',
  Internal: 'blue',
  Infrastructure: 'gray',
  Training: 'sky',
};
export const WORK_CATEGORY_OPTIONS: SelectOption[] = buildOptions(
  WORK_CATEGORY_ORDER,
  WORK_CATEGORY_LABELS,
  WORK_CATEGORY_COLORS,
);

// Категория «на клиента» (UPPER_CASE на сервере) — SSOT для утилизации в /s/reports.
// Тип-завязка: переименование WorkCategory сломает компиляцию здесь (а не тихо
// обнулит утилизацию). [ssot-bug]#1.
const CLIENT_WORK_CATEGORY: WorkCategory = 'Client';
export const CLIENT_CATEGORY = toUpperSnake(CLIENT_WORK_CATEGORY); // 'CLIENT'

const WORK_TYPE_GROUP_ORDER: ReadonlyArray<WorkTypeGroup> = [
  'production',
  'projectManagement',
  'presale',
  'meetings',
  'training',
  'internal',
];
const WORK_TYPE_GROUP_COLORS: Record<WorkTypeGroup, TagColor> = {
  production: 'green',
  projectManagement: 'blue',
  presale: 'orange',
  meetings: 'purple',
  training: 'sky',
  internal: 'gray',
};
export const WORK_TYPE_GROUP_OPTIONS: SelectOption[] = buildOptions(
  WORK_TYPE_GROUP_ORDER,
  WORK_TYPE_GROUP_LABELS,
  WORK_TYPE_GROUP_COLORS,
);

const ENTRY_STATUS_ORDER: ReadonlyArray<EntryStatus> = [
  'Draft',
  'Submitted',
  'Approved',
  'Rejected',
];
const ENTRY_STATUS_COLORS: Record<EntryStatus, TagColor> = {
  Draft: 'gray',
  Submitted: 'orange',
  Approved: 'green',
  Rejected: 'red',
};
export const ENTRY_STATUS_OPTIONS: SelectOption[] = buildOptions(
  ENTRY_STATUS_ORDER,
  ENTRY_STATUS_LABELS,
  ENTRY_STATUS_COLORS,
);

const BILLING_DOC_TYPE_ORDER: ReadonlyArray<BillingDocType> = [
  'Order',
  'Payment',
  'Act',
];
const BILLING_DOC_TYPE_COLORS: Record<BillingDocType, TagColor> = {
  Order: 'blue',
  Payment: 'green',
  Act: 'purple',
};
export const BILLING_DOC_TYPE_OPTIONS: SelectOption[] = buildOptions(
  BILLING_DOC_TYPE_ORDER,
  BILLING_DOC_TYPE_LABELS,
  BILLING_DOC_TYPE_COLORS,
);

// Тип отсутствия (F-D). Значения UPPER_CASE, ярлыки русские.
const ABSENCE_TYPE_ORDER: ReadonlyArray<AbsenceType> = [
  'Vacation',
  'Sick',
  'Unpaid',
  'Other',
];
const ABSENCE_TYPE_COLORS: Record<AbsenceType, TagColor> = {
  Vacation: 'blue',
  Sick: 'red',
  Unpaid: 'gray',
  Other: 'orange',
};
export const ABSENCE_TYPE_OPTIONS: SelectOption[] = buildOptions(
  ABSENCE_TYPE_ORDER,
  ABSENCE_TYPE_LABELS,
  ABSENCE_TYPE_COLORS,
);
export const ABSENCE_TYPE_DEFAULT = "'VACATION'";

// Тип дня производственного календаря РФ. Значения UPPER_CASE (требование SDK),
// ярлыки русские. Используется объектом credosTimeWorkdayCalendar.
export const WORKDAY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'WORKDAY', label: 'Рабочий', position: 0, color: 'green' },
  { value: 'WEEKEND', label: 'Выходной', position: 1, color: 'gray' },
  { value: 'HOLIDAY', label: 'Праздник', position: 2, color: 'red' },
  { value: 'SHORT', label: 'Предпраздничный', position: 3, color: 'orange' },
];
export const WORKDAY_TYPE_DEFAULT = "'WORKDAY'";

// Дефолты SELECT — UPPER_CASE значение в одинарных кавычках (требование SDK).
export const PROJECT_STATUS_DEFAULT = "'ACTIVE'";
export const PROJECT_CATEGORY_DEFAULT = "'CLIENT'";
export const ENTRY_STATUS_DEFAULT = "'DRAFT'";

// Статус проекта/этапа — общий простой набор (фаза 1). Значения UPPER_CASE.
export const PROJECT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'PLANNED', label: 'Запланирован', position: 0, color: 'gray' },
  { value: 'ACTIVE', label: 'В работе', position: 1, color: 'green' },
  { value: 'ON_HOLD', label: 'Приостановлен', position: 2, color: 'orange' },
  { value: 'DONE', label: 'Завершён', position: 3, color: 'blue' },
];
