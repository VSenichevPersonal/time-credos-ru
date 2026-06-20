import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { ENTRY_STATUS, isApprovalRequired } from 'src/constants/approval';
import { APPROVAL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// /s/approval — согласование трудозатрат (фиксирует userWorkspaceId руководителя).
//   submit  — записи периода сотрудника (где требуется согласование) DRAFT → SUBMITTED.
//   approve — выбранные записи SUBMITTED → APPROVED (+ approvedBy/approvedAt).
//   reject  — выбранные записи SUBMITTED → REJECTED (+ approvedBy/approvedAt).
// Логика «нужно ли согласование» = Project.approvalRequired ?? Department.approvalRequired.
// Работает поверх Core REST воркспейса (паттерн time-entry-api: /s/ на dev иногда
// 500 — фронт имеет REST-фоллбэк; здесь фиксация actor возможна только серверно).

type RawEntry = {
  id: string;
  status: string;
  projectId: string | null;
  employeeId: string | null;
};
type RawProject = { id: string; approvalRequired: boolean | null; departmentId: string | null };
type RawDepartment = { id: string; approvalRequired: boolean | null };
type RawEmployee = { id: string; isManager: boolean | null; workspaceMemberRef: string | null };

// Actor-сотрудник, выполняющий approve/reject. Резолвится по workspaceMemberRef,
// который клиент передаёт явно в params (RoutePayload.userWorkspaceId — это
// userWorkspace ID, не workspaceMember; маппинга через REST нет).
type Actor = { employeeId: string; isManager: boolean } | null;

const resolveActor = async (workspaceMemberRef: string | undefined): Promise<Actor> => {
  if (!workspaceMemberRef) return null;
  const res = await restGet<{ data: { credosTimeEmployees: RawEmployee[] } }>(
    '/rest/credosTimeEmployees',
    { filter: `workspaceMemberRef[eq]:${workspaceMemberRef}`, limit: '1' },
  );
  const e = res.data?.credosTimeEmployees?.[0];
  if (!e) return null;
  return { employeeId: e.id, isManager: e.isManager === true };
};

const apiBase = () => (process.env.TWENTY_API_URL ?? '').replace(/\/$/, '');
const authHeaders = () => ({
  Authorization: `Bearer ${process.env.TWENTY_APP_ACCESS_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
});

const restGet = async <T>(path: string, query: Record<string, string>): Promise<T> => {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${apiBase()}${path}?${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
};

const restPatch = async (path: string, body: unknown): Promise<void> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status} ${await res.text()}`);
};

const readParams = (event: RoutePayload): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(event.queryStringParameters ?? {}))
    if (v != null) out[k] = v;
  for (const [k, v] of Object.entries((event.body ?? {}) as Record<string, unknown>))
    if (v != null) out[k] = String(v);
  return out;
};

// Карта projectId → нужно ли согласование (резолв проект+отдел одним проходом).
const buildApprovalMap = async (): Promise<Map<string, boolean>> => {
  const [projRes, deptRes] = await Promise.all([
    restGet<{ data: { credosTimeProjects: RawProject[] } }>('/rest/credosTimeProjects', {
      limit: '500',
    }),
    restGet<{ data: { credosTimeDepartments: RawDepartment[] } }>('/rest/credosTimeDepartments', {
      limit: '50',
    }),
  ]);
  const deptApproval = new Map(
    (deptRes.data?.credosTimeDepartments ?? []).map((d) => [d.id, d.approvalRequired]),
  );
  const map = new Map<string, boolean>();
  for (const p of projRes.data?.credosTimeProjects ?? []) {
    const dept = p.departmentId ? deptApproval.get(p.departmentId) : null;
    map.set(p.id, isApprovalRequired(p.approvalRequired, dept));
  }
  return map;
};

const setStatus = async (
  id: string,
  status: string,
  actor: string | null,
): Promise<void> => {
  const data: Record<string, unknown> = { status };
  if (status === ENTRY_STATUS.APPROVED || status === ENTRY_STATUS.REJECTED) {
    data.approvedBy = actor ?? null;
    data.approvedAt = new Date().toISOString();
  }
  await restPatch(`/rest/credosTimeEntries/${id}`, data);
};

// submit: все DRAFT-записи периода сотрудника (где проект требует согласования) → SUBMITTED.
const runSubmit = async (params: Record<string, string>): Promise<object> => {
  const { from, to, employeeId } = params;
  if (!from || !to || !employeeId) return { ok: false, error: 'from/to/employeeId required' };
  const approvalMap = await buildApprovalMap();
  const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
    '/rest/credosTimeEntries',
    {
      filter: `date[gte]:${from},date[lte]:${to},employeeId[eq]:${employeeId},status[eq]:${ENTRY_STATUS.DRAFT}`,
      limit: '500',
    },
  );
  const targets = (res.data?.credosTimeEntries ?? []).filter(
    (e) => e.projectId && approvalMap.get(e.projectId),
  );
  for (const e of targets) await setStatus(e.id, ENTRY_STATUS.SUBMITTED, null);
  return { ok: true, updated: targets.length };
};

// approve/reject: переданные id (SUBMITTED) → APPROVED/REJECTED, фиксируем actor+дату.
// RBAC (CISO-002): согласовывать может только руководитель (actor.isManager),
// и нельзя согласовывать собственные записи (separation of duties: actor != owner).
const runResolve = async (
  params: Record<string, string>,
  status: string,
  actorId: string | null,
  actor: Actor,
): Promise<object> => {
  const ids = (params.ids ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return { ok: false, error: 'ids required' };

  // Guard роли. Если actor резолвлен — требуем isManager. Если не резолвлен
  // (workspaceMemberRef ещё не сопоставлен — dev), пропускаем с предупреждением.
  if (actor && !actor.isManager) {
    return { ok: false, error: 'forbidden: только руководитель может согласовывать' };
  }
  if (!actor) {
    // eslint-disable-next-line no-console
    console.warn(
      '[approval] actor не сопоставлен (workspaceMemberRef пуст) — RBAC-guard пропущен (DEV)',
    );
  }

  let updated = 0;
  let skippedOwn = 0;
  for (const id of ids) {
    const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
      '/rest/credosTimeEntries',
      { filter: `id[eq]:${id}`, limit: '1' },
    );
    const entry = res.data?.credosTimeEntries?.[0];
    if (entry?.status !== ENTRY_STATUS.SUBMITTED) continue; // только из «На согласовании»
    // Separation of duties: руководитель не согласует собственные трудозатраты.
    if (actor && entry.employeeId === actor.employeeId) {
      skippedOwn += 1;
      continue;
    }
    await setStatus(id, status, actorId);
    updated += 1;
  }
  return { ok: true, updated, skippedOwn };
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  // actorId — для аудита approvedBy (userWorkspaceId фиксирует, кто нажал).
  const actorId = event.userWorkspaceId ?? null;
  // actor — employee актора (роль + id) по явно переданному workspaceMemberRef.
  const actor = await resolveActor(params.workspaceMemberRef);
  const op = params.op ?? '';
  if (op === 'submit') return runSubmit(params);
  if (op === 'approve') return runResolve(params, ENTRY_STATUS.APPROVED, actorId, actor);
  if (op === 'reject') return runResolve(params, ENTRY_STATUS.REJECTED, actorId, actor);
  return { ok: false, error: `unknown op: ${op}` };
};

const handler = async (event: RoutePayload) => {
  try {
    return await run(event);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
};

export default defineLogicFunction({
  universalIdentifier: APPROVAL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'approval',
  description: 'Согласование трудозатрат: submit/approve/reject (фиксирует руководителя)',
  timeoutSeconds: 15,
  handler,
  httpRouteTriggerSettings: {
    path: '/approval',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
