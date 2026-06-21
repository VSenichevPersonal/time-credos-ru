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

// Отзыв (WI-10, решения A4.3/A4.4/A4.25/A4.26). Два сценария «откатить статус назад»:
//   recall  — СОТРУДНИК отзывает СВОЮ отправку, пока руководитель не решил:
//             SUBMITTED → DRAFT (запись снова редактируема). A4.3 (в) + A4.4 (а).
//   revoke  — РУКОВОДИТЕЛЬ отзывает уже выданное согласование (Timetta «Reopen»):
//             APPROVED → SUBMITTED (запись возвращается в очередь согласования).
//             Право manager/admin + SoD (нельзя отзывать свои). A4.25 (а) + A4.26 (а).
// Целевые статусы переиспользуют существующий набор (4 статуса достаточно — A4.20 (а));
// отдельный REVOKED не вводим в этой фазе (формулировка A4.25 = «APPROVED→SUBMITTED/DRAFT»).
// recall очищает rejectComment? Нет — recall идёт только из SUBMITTED (там причины нет).
// revoke очищает approvedBy/approvedAt (согласование снято) — см. approval.logic setStatus.
export const RECALL_FROM = ENTRY_STATUS.SUBMITTED; // recall допустим только отсюда
export const RECALL_TO = ENTRY_STATUS.DRAFT;
export const REVOKE_FROM = ENTRY_STATUS.APPROVED; // revoke допустим только отсюда
export const REVOKE_TO = ENTRY_STATUS.SUBMITTED;

// Нужно ли согласование: флаг проекта переопределяет отдел.
// null/undefined на проекте → наследует отдел. Если отдел не задан → false.
export const isApprovalRequired = (
  projectApprovalRequired: boolean | null | undefined,
  departmentApprovalRequired: boolean | null | undefined,
): boolean => projectApprovalRequired ?? departmentApprovalRequired ?? false;
