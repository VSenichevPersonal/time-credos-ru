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
const patchStatus = async (id: string, status: string): Promise<void> => {
  const data: Record<string, unknown> =
    status === ENTRY_STATUS.APPROVED || status === ENTRY_STATUS.REJECTED
      ? { status, approvedAt: new Date().toISOString() }
      : { status };
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
export const resolveEntries = async (
  ids: string[],
  approve: boolean,
): Promise<void> => {
  const status = approve ? ENTRY_STATUS.APPROVED : ENTRY_STATUS.REJECTED;
  const route = await callRoute({ op: approve ? 'approve' : 'reject', ids: ids.join(',') });
  if (route?.ok) return;
  for (const id of ids) await patchStatus(id, status);
};
