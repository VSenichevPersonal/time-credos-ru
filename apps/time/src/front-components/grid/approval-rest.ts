import { RestApiClient } from 'twenty-client-sdk/rest';

import { ENTRY_STATUS } from 'src/constants/approval';

// Вызов действий согласования. Основной путь — серверная /s/approval (фиксирует
// userWorkspaceId руководителя). Если /s/ недоступна (500/404 на dev) — фоллбэк
// на прямой Core REST PATCH (actor тогда не фиксируется — пометка ниже).

const client = () => new RestApiClient();

type ApprovalResp = { ok?: boolean; updated?: number; error?: string };

const callRoute = async (body: Record<string, unknown>): Promise<ApprovalResp | null> => {
  try {
    return await client().post<ApprovalResp>('/s/approval', body);
  } catch {
    return null; // /s/ недоступна — уходим в фоллбэк
  }
};

// Прямой фоллбэк-PATCH статуса (без фиксации actor — /s/ недоступна).
// comment: причина отклонения — пишется в rejectComment при REJECT, иначе очищается.
const patchStatus = async (id: string, status: string, comment: string | null = null): Promise<void> => {
  const data: Record<string, unknown> =
    status === ENTRY_STATUS.APPROVED || status === ENTRY_STATUS.REJECTED
      ? { status, approvedAt: new Date().toISOString() }
      : { status };
  if (status === ENTRY_STATUS.APPROVED || status === ENTRY_STATUS.REJECTED) {
    data.rejectComment = status === ENTRY_STATUS.REJECTED ? comment ?? null : null;
  }
  await client().patch(`/rest/credosTimeEntries/${id}`, data);
};

// submit: DRAFT-записи периода (где требуется согласование) → SUBMITTED.
// ids — отфильтрованный фронтом список (только требующие согласования).
export const submitEntries = async (
  from: string,
  to: string,
  employeeId: string,
  ids: string[],
): Promise<void> => {
  const route = await callRoute({ op: 'submit', from, to, employeeId });
  if (route?.ok) return;
  for (const id of ids) await patchStatus(id, ENTRY_STATUS.SUBMITTED);
};

// approve/reject: SUBMITTED-записи → APPROVED/REJECTED (фиксирует actor на сервере).
// comment: причина отклонения (только reject) — прокидывается в /s/ роут и фоллбэк.
export const resolveEntries = async (
  ids: string[],
  approve: boolean,
  comment: string | null = null,
): Promise<void> => {
  const status = approve ? ENTRY_STATUS.APPROVED : ENTRY_STATUS.REJECTED;
  const body: Record<string, unknown> = { op: approve ? 'approve' : 'reject', ids: ids.join(',') };
  if (!approve && comment != null) body.comment = comment;
  const route = await callRoute(body);
  if (route?.ok) return;
  for (const id of ids) await patchStatus(id, status, approve ? null : comment);
};

// recall (WI-10/A4.3): СОТРУДНИК отзывает СВОЮ отправку SUBMITTED → DRAFT (пока
// руководитель не решил). Серверный гард (ownership) — в /s/approval.runRecall.
// Фоллбэк-PATCH без actor — только когда /s/ недоступна (dev).
export const recallEntries = async (ids: string[]): Promise<void> => {
  const route = await callRoute({ op: 'recall', ids: ids.join(',') });
  if (route?.ok) return;
  for (const id of ids) await patchStatus(id, ENTRY_STATUS.DRAFT);
};

// revoke (WI-10/A4.25): РУКОВОДИТЕЛЬ отзывает выданное согласование APPROVED →
// SUBMITTED («Reopen»). Серверный гард (isManager + SoD) — в /s/approval.runRevoke.
// Фоллбэк-PATCH без actor/гарда — только когда /s/ недоступна (dev).
export const revokeEntries = async (ids: string[]): Promise<void> => {
  const route = await callRoute({ op: 'revoke', ids: ids.join(',') });
  if (route?.ok) return;
  for (const id of ids) await patchStatus(id, ENTRY_STATUS.SUBMITTED);
};
