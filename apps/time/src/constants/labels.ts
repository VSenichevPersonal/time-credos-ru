// Русские ярлыки для доменных кодов (SSOT). Все надписи UI берутся отсюда.
// Коды (id) — латиницей; пользователь всегда видит русское.

import {
  type AbsenceType,
  type BillingDocType,
  type DepartmentCode,
  type EntryStatus,
  type EntryTag,
  type WorkCategory,
  type WorkTypeGroup,
} from 'src/constants/domain-types';

export const DEPARTMENT_LABELS: Record<DepartmentCode, string> = {
  OV: 'Отдел проектирования и внедрения ИС',
  OIB: 'Отдел информационной безопасности',
  OPIB: 'Отдел практической информационной безопасности',
  TC: 'Технический центр',
  OPR: 'Отдел продуктовой разработки',
};

// Кириллица-аббревиатуры отделов (для компактных колонок: доска планирования).
// Полное название — в DEPARTMENT_LABELS (тултип/где есть место).
export const DEPARTMENT_SHORT_LABELS: Record<DepartmentCode, string> = {
  OV: 'ОВ',
  OIB: 'ОИБ',
  OPIB: 'ОПИБ',
  TC: 'ТЦ',
  OPR: 'ОПР',
};

// Русский ярлык отдела по коду (любая строка). Неизвестный код → как есть.
// short=true — кириллица-аббревиатура, иначе полное название.
export const departmentLabel = (
  code: string | null | undefined,
  options?: { short?: boolean },
): string => {
  if (!code) return '';
  const map = options?.short ? DEPARTMENT_SHORT_LABELS : DEPARTMENT_LABELS;
  return map[code as DepartmentCode] ?? code;
};

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
  Client: 'На клиента (эффективные)',
  Presale: 'Пресейл',
  Pilot: 'Пилот',
  Internal: 'Внутренний проект',
  Infrastructure: 'Инфраструктура',
  Training: 'Самообучение',
};

export const WORK_TYPE_GROUP_LABELS: Record<WorkTypeGroup, string> = {
  production: 'Производственная',
  projectManagement: 'Управление проектом',
  presale: 'Пресейл',
  meetings: 'Совещания/процессные',
  training: 'Обучение',
  internal: 'Внутренние/инфраструктура',
};

export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
  Draft: 'Черновик',
  Submitted: 'На согласовании',
  Approved: 'Согласовано',
  Rejected: 'Отклонено',
};

export const BILLING_DOC_TYPE_LABELS: Record<BillingDocType, string> = {
  Order: 'Заказ',
  Payment: 'Оплата',
  Act: 'Акт',
};

// Тип отсутствия (F-D)
export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  Vacation: 'Отпуск',
  Sick: 'Больничный',
  Unpaid: 'Без содержания',
  Other: 'Иное',
};

// Теги записи трудозатрат (W3-2, Kimai tags) — свободные метки для срезов
export const ENTRY_TAG_LABELS: Record<EntryTag, string> = {
  OVERTIME: 'Переработка',
  URGENT: 'Срочно',
  REMOTE: 'Удалённо',
  ON_SITE: 'На площадке',
  REWORK: 'Доработка',
  RESEARCH: 'Исследование',
};

// Норма часов в неделю на сотрудника (для планирования загрузки)
export const WEEKLY_NORM_HOURS = 40;
