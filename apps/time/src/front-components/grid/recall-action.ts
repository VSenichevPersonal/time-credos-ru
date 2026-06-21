import { ENTRY_STATUS } from 'src/constants/approval';

// WI-10 отзыв согласования ИЗ СЕТКИ. Чистая логика «что можно отозвать в строке»:
// определяет действие по статусам записей строки и роли (UI-гейт; серверный гард —
// /s/approval runRecall/runRevoke, CISO-005).
//
// Семантика (MVP, сверка Timetta «Reopen» + recall):
//   APPROVED-записи → revoke (APPROVED→SUBMITTED). Только руководитель (isManager).
//   SUBMITTED-записи → recall (SUBMITTED→DRAFT). Владелец отзывает свою отправку.
// Приоритет revoke: согласованная ячейка (🔒) — главный тупик заказчика. Если в
// строке есть и APPROVED, и SUBMITTED — действие выбирается по конкретной ячейке
// (forCell) либо по «сильному» статусу строки (forRow → revoke, если есть locked).

export type RecallMode = 'recall' | 'revoke';

export type RecallPlan = {
  mode: RecallMode;
  ids: string[]; // записи, которые отзываем
  // Нет прав на действие (UI-подсказка вместо тупика). null = действие доступно.
  deniedReason: string | null;
};

type RowAudit = {
  entryIdByDay: ReadonlyArray<string | null>;
  statusByDay: ReadonlyArray<string | null>;
};

const idsByStatus = (row: RowAudit, status: string): string[] => {
  const out: string[] = [];
  for (let i = 0; i < row.statusByDay.length; i++) {
    const id = row.entryIdByDay[i];
    if (id && row.statusByDay[i] === status) out.push(id);
  }
  return out;
};

// Действие отзыва для ОДНОЙ ячейки (клик по 🔒/SUBMITTED-ячейке).
// APPROVED → revoke (нужен руководитель); SUBMITTED → recall (владелец).
// Прочие статусы / пустая ячейка → null (отзывать нечего).
export const recallPlanForCell = (
  entryId: string | null,
  status: string | null,
  isManager: boolean,
): RecallPlan | null => {
  if (!entryId) return null;
  if (status === ENTRY_STATUS.APPROVED) {
    return {
      mode: 'revoke',
      ids: [entryId],
      deniedReason: isManager
        ? null
        : 'Отозвать согласование может только руководитель. Обратитесь к руководителю.',
    };
  }
  if (status === ENTRY_STATUS.SUBMITTED) {
    return { mode: 'recall', ids: [entryId], deniedReason: null };
  }
  return null;
};

// Действие отзыва для ВСЕЙ строки (пункт меню ⋯). Приоритет — revoke согласованных
// (главный тупик); если согласованных нет, но есть отправленные — recall.
export const recallPlanForRow = (row: RowAudit, isManager: boolean): RecallPlan | null => {
  const approved = idsByStatus(row, ENTRY_STATUS.APPROVED);
  if (approved.length > 0) {
    return {
      mode: 'revoke',
      ids: approved,
      deniedReason: isManager
        ? null
        : 'Отозвать согласование может только руководитель. Обратитесь к руководителю.',
    };
  }
  const submitted = idsByStatus(row, ENTRY_STATUS.SUBMITTED);
  if (submitted.length > 0) {
    return { mode: 'recall', ids: submitted, deniedReason: null };
  }
  return null;
};
