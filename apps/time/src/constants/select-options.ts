// SELECT-опции для объектов credosTime* в формате SDK (value+label+position+color).
// Значения (id) — латиницей из domain-types; ярлыки — русские из labels.ts.

import {
  ABSENCE_TYPE_LABELS,
  BILLING_DOC_TYPE_LABELS,
  DEPARTMENT_LABELS,
  ENTRY_STATUS_LABELS,
  ENTRY_TAG_LABELS,
  WORK_CATEGORY_LABELS,
  WORK_TYPE_GROUP_LABELS,
} from 'src/constants/labels';
import {
  type AbsenceType,
  type BillingDocType,
  type DepartmentCode,
  type EntryStatus,
  type EntryTag,
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

// Теги записи трудозатрат (W3-2, Kimai tags). MULTI_SELECT — несколько меток
// на запись для срезов/группировки в отчётах. Значения UPPER_CASE, ярлыки рус.
const ENTRY_TAG_ORDER: ReadonlyArray<EntryTag> = [
  'OVERTIME',
  'URGENT',
  'REMOTE',
  'ON_SITE',
  'REWORK',
  'RESEARCH',
];
const ENTRY_TAG_COLORS: Record<EntryTag, TagColor> = {
  OVERTIME: 'red',
  URGENT: 'orange',
  REMOTE: 'sky',
  ON_SITE: 'turquoise',
  REWORK: 'yellow',
  RESEARCH: 'purple',
};
export const ENTRY_TAG_OPTIONS: SelectOption[] = buildOptions(
  ENTRY_TAG_ORDER,
  ENTRY_TAG_LABELS,
  ENTRY_TAG_COLORS,
);

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

// --- REQ-0019: SELECT-наборы глобальных настроек (credosTimeSettings) ---
// Значения UPPER_SNAKE (требование SDK), ярлыки русские. Дефолты — отдельные
// консты в формате "'VALUE'" (SDK requires quoted UPPER_CASE для defaultValue).

// Старт недели сетки планирования/таймшита.
export const WEEK_STARTS_ON_OPTIONS: SelectOption[] = [
  { value: 'MONDAY', label: 'Понедельник', position: 0, color: 'blue' },
  { value: 'SUNDAY', label: 'Воскресенье', position: 1, color: 'orange' },
];
export const WEEK_STARTS_ON_DEFAULT = "'MONDAY'";

// Гранулярность согласования (REQ-0007).
export const APPROVAL_PERIOD_OPTIONS: SelectOption[] = [
  { value: 'WEEK', label: 'Неделя', position: 0, color: 'green' },
  { value: 'MONTH', label: 'Месяц', position: 1, color: 'blue' },
];
export const APPROVAL_PERIOD_DEFAULT = "'WEEK'";

// День недели напоминания заполнить таймшит.
export const DAY_OF_WEEK_OPTIONS: SelectOption[] = [
  { value: 'MONDAY', label: 'Понедельник', position: 0, color: 'gray' },
  { value: 'TUESDAY', label: 'Вторник', position: 1, color: 'gray' },
  { value: 'WEDNESDAY', label: 'Среда', position: 2, color: 'gray' },
  { value: 'THURSDAY', label: 'Четверг', position: 3, color: 'gray' },
  { value: 'FRIDAY', label: 'Пятница', position: 4, color: 'green' },
  { value: 'SATURDAY', label: 'Суббота', position: 5, color: 'orange' },
  { value: 'SUNDAY', label: 'Воскресенье', position: 6, color: 'orange' },
];
export const DAY_OF_WEEK_DEFAULT = "'FRIDAY'";

// REQ-0004 Часть C: тип брони ресурса. SOFT = предварительная (пресейл, не
// потребляет ёмкость, в Demand отдельно/пунктиром); HARD = подтверждённая
// (твёрдо потребляет ёмкость). Сверка: Timetta booking soft/hard.
export const BOOKING_TYPE_OPTIONS: SelectOption[] = [
  { value: 'SOFT', label: 'Предварительная (soft)', position: 0, color: 'orange' },
  { value: 'HARD', label: 'Подтверждённая (hard)', position: 1, color: 'green' },
];
export const BOOKING_TYPE_DEFAULT = "'SOFT'";

// WI-47: способ раскида плана проекта. EVEN = равномерно по периоду (раскид
// считается на лету из plannedEffort+дат, слотов нет — текущее поведение, дефолт).
// MANUAL = вручную по месяцам (загрузка = Σ помесячных слотов credosTimePlanSlot).
// Сверка Timetta (правило 8): аналог isAutoPlanning — EVEN≈авто, MANUAL≈ручной метод.
export const PLAN_METHOD_OPTIONS: SelectOption[] = [
  { value: 'EVEN', label: 'Равномерно по сроку', position: 0, color: 'blue' },
  { value: 'MANUAL', label: 'Вручную по месяцам', position: 1, color: 'purple' },
];
export const PLAN_METHOD_DEFAULT = "'EVEN'";

// AUDIT-LOG: тип действия в журнале изменений трудозатрат (credosTimeEntryLog.action).
// CREATE = запись создана; UPDATE = правка часов; DELETE = удаление; STATUS = смена
// статуса согласования (submit/approve/reject/revoke). Значения UPPER_CASE (SDK).
export const ENTRY_LOG_ACTION_OPTIONS: SelectOption[] = [
  { value: 'CREATE', label: 'Создание', position: 0, color: 'green' },
  { value: 'UPDATE', label: 'Правка часов', position: 1, color: 'blue' },
  { value: 'DELETE', label: 'Удаление', position: 2, color: 'red' },
  { value: 'STATUS', label: 'Смена статуса', position: 3, color: 'orange' },
];

// Уровень NDA проекта (маркетинг/публикация). Чем выше — тем строже секретность.
// NONE — НДА нет, можно говорить и о клиенте, и о работах (дефолт, безопасный).
// CLIENT_ONLY — можно называть клиента, нельзя раскрывать характер работ.
// CLIENT_SECRET — нельзя называть клиента. Значения UPPER_CASE (SDK).
export const NDA_LEVEL_OPTIONS: SelectOption[] = [
  {
    value: 'NONE',
    label: 'НДА нет — можно говорить о клиенте и о работах',
    position: 0,
    color: 'green',
  },
  {
    value: 'CLIENT_ONLY',
    label: 'Можно о клиенте — нельзя о работах',
    position: 1,
    color: 'orange',
  },
  {
    value: 'CLIENT_SECRET',
    label: 'Нельзя говорить о клиенте',
    position: 2,
    color: 'red',
  },
];
export const NDA_LEVEL_DEFAULT = "'NONE'";

// Русский ярлык уровня NDA по коду (SSOT — берётся из NDA_LEVEL_OPTIONS).
// Неизвестный/пустой код → пустая строка (безопасно для UI).
export const ndaLevelLabel = (code: string | null | undefined): string => {
  if (!code) return '';
  return NDA_LEVEL_OPTIONS.find((option) => option.value === code)?.label ?? '';
};
