// Русские ярлыки для доменных кодов (SSOT). Все надписи UI берутся отсюда.
// Коды (id) — латиницей; пользователь всегда видит русское.

import {
  type BillingDocType,
  type DepartmentCode,
  type EntryStatus,
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

// Норма часов в неделю на сотрудника (для планирования загрузки)
export const WEEKLY_NORM_HOURS = 40;
