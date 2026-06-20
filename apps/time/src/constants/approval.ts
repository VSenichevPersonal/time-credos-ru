// Согласование трудозатрат (отключаемое). SSOT логики «нужно ли согласование»
// и UPPER_CASE-кодов статуса (значения SELECT в БД хранятся в UPPER_CASE).

// Коды статуса записи в БД (SELECT-значения, UPPER_CASE — см. select-options.ts).
export const ENTRY_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type EntryStatusCode = (typeof ENTRY_STATUS)[keyof typeof ENTRY_STATUS];

// Нужно ли согласование: флаг проекта переопределяет отдел.
// null/undefined на проекте → наследует отдел. Если отдел не задан → false.
export const isApprovalRequired = (
  projectApprovalRequired: boolean | null | undefined,
  departmentApprovalRequired: boolean | null | undefined,
): boolean => projectApprovalRequired ?? departmentApprovalRequired ?? false;
