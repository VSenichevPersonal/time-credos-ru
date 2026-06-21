import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import {
  ENTRY_STATUS,
  isApprovalRequired,
  RECALL_FROM,
  RECALL_TO,
  REVOKE_FROM,
  REVOKE_TO,
} from 'src/constants/approval';
import { APPROVAL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { isIsoDate, isUuid } from './params-validate';

// /s/approval — согласование трудозатрат (фиксирует userWorkspaceId руководителя).
//   submit  — записи периода сотрудника (где требуется согласование) DRAFT → SUBMITTED.
//   approve — выбранные записи SUBMITTED → APPROVED (+ approvedBy/approvedAt).
//   reject  — выбранные записи SUBMITTED → REJECTED (+ approvedBy/approvedAt).
//   recall  — СОТРУДНИК отзывает СВОЮ отправку: SUBMITTED → DRAFT (пока не решено). A4.3/A4.4.
//   revoke  — РУКОВОДИТЕЛЬ отзывает согласование: APPROVED → SUBMITTED (Timetta Reopen). A4.25/A4.26.
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
  // CISO-006: workspaceMemberRef интерполируется в filter — пропускаем только UUID
  // (невалидный/инъекция → actor не резолвлен, как при отсутствии).
  if (!workspaceMemberRef || !isUuid(workspaceMemberRef)) return null;
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
  comment: string | null = null,
): Promise<void> => {
  const data: Record<string, unknown> = { status };
  if (status === ENTRY_STATUS.APPROVED || status === ENTRY_STATUS.REJECTED) {
    data.approvedBy = actor ?? null;
    data.approvedAt = new Date().toISOString();
  }
  // Откат назад (recall SUBMITTED→DRAFT, revoke APPROVED→SUBMITTED) снимает прежнее
  // решение руководителя — обнуляем аудит-поля, чтобы запись не выглядела согласованной.
  if (status === ENTRY_STATUS.DRAFT || status === ENTRY_STATUS.SUBMITTED) {
    data.approvedBy = null;
    data.approvedAt = null;
  }
  // rejectComment: при REJECT сохраняем причину (сотрудник видит что исправить);
  // при approve/повторном submit/откате очищаем прежнюю причину — запись «ожила».
  data.rejectComment = status === ENTRY_STATUS.REJECTED ? comment ?? null : null;
  await restPatch(`/rest/credosTimeEntries/${id}`, data);
};

// submit: DRAFT И REJECTED записи периода сотрудника (где проект требует согласования)
// → SUBMITTED. REJECTED включён намеренно (W5A.6/W5A.30, Ref=Timetta): исправленный
// отклонённый таймшит переотправляется ТЕМ ЖЕ submit — иначе сотрудник застревал после
// reject (нет перехода REJECTED→SUBMITTED). setStatus при SUBMITTED обнуляет rejectComment
// и аудит-поля — новая попытка согласования начинается «с чистого листа».
const SUBMITTABLE = new Set<string>([ENTRY_STATUS.DRAFT, ENTRY_STATUS.REJECTED]);
const runSubmit = async (params: Record<string, string>): Promise<object> => {
  const { from, to, employeeId } = params;
  if (!from || !to || !employeeId) return { ok: false, error: 'from/to/employeeId required' };
  // CISO-006 вектор A: эти три параметра идут в filter-строку, где запятая —
  // разделитель условий. Инъекция в employeeId (напр. `id,status[neq]:DRAFT`)
  // дала бы submit чужих записей. Валидируем формат.
  if (!isIsoDate(from) || !isIsoDate(to)) return { ok: false, error: 'invalid from/to' };
  if (!isUuid(employeeId)) return { ok: false, error: 'invalid employeeId' };
  const approvalMap = await buildApprovalMap();
  // Статус-условие НЕ в filter ([in]:DRAFT,REJECTED конфликтует с запятой-разделителем
  // условий REST) — фильтруем статус в коде (как projectId-фильтр ниже).
  const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
    '/rest/credosTimeEntries',
    {
      filter: `date[gte]:${from},date[lte]:${to},employeeId[eq]:${employeeId}`,
      limit: '500',
    },
  );
  const targets = (res.data?.credosTimeEntries ?? []).filter(
    (e) => SUBMITTABLE.has(e.status) && e.projectId && approvalMap.get(e.projectId),
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
  // CISO-006: каждый id идёт в `id[eq]:${id}` filter — оставляем только UUID
  // (инъекция-строки отбрасываются до запроса).
  const ids = (params.ids ?? '').split(',').map((s) => s.trim()).filter(isUuid);
  if (ids.length === 0) return { ok: false, error: 'ids required' };
  // Причина отклонения (op=reject). Хранится на каждой записи батча. min-длина —
  // UI-валидация (Dev1); backend сохраняет переданное (decoupled rollout).
  const comment = params.comment ?? null;

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
    await setStatus(id, status, actorId, comment);
    updated += 1;
  }
  return { ok: true, updated, skippedOwn };
};

// recall (A4.3/A4.4): СОТРУДНИК отзывает СВОЮ отправку SUBMITTED → DRAFT,
// пока руководитель не вынес решение (запись ещё SUBMITTED). Право — владелец записи:
// actor.employeeId == entry.employeeId. Чужие/не-SUBMITTED записи пропускаются.
// Руководитель НЕ нужен (это действие сотрудника над собственными трудозатратами).
const runRecall = async (params: Record<string, string>, actor: Actor): Promise<object> => {
  const ids = (params.ids ?? '').split(',').map((s) => s.trim()).filter(isUuid);
  if (ids.length === 0) return { ok: false, error: 'ids required' };

  // dev-bypass: actor не сопоставлен (workspaceMemberRef пуст) — пропускаем ownership-гейт.
  if (!actor) {
    // eslint-disable-next-line no-console
    console.warn('[approval] recall: actor не сопоставлен — ownership-guard пропущен (DEV)');
  }

  let updated = 0;
  let skippedForeign = 0;
  for (const id of ids) {
    const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
      '/rest/credosTimeEntries',
      { filter: `id[eq]:${id}`, limit: '1' },
    );
    const entry = res.data?.credosTimeEntries?.[0];
    if (entry?.status !== RECALL_FROM) continue; // отзыв отправки только из SUBMITTED
    // Сотрудник отзывает ТОЛЬКО свои записи (нельзя дёрнуть чужую отправку).
    if (actor && entry.employeeId !== actor.employeeId) {
      skippedForeign += 1;
      continue;
    }
    await setStatus(id, RECALL_TO, null);
    updated += 1;
  }
  return { ok: true, updated, skippedForeign };
};

// revoke (A4.25/A4.26): РУКОВОДИТЕЛЬ отзывает выданное согласование APPROVED → SUBMITTED
// («Reopen» в Timetta — запись возвращается в очередь согласования). RBAC = как approve:
// требуется actor.isManager; SoD — нельзя отзывать собственные согласованные записи.
const runRevoke = async (
  params: Record<string, string>,
  actorId: string | null,
  actor: Actor,
): Promise<object> => {
  const ids = (params.ids ?? '').split(',').map((s) => s.trim()).filter(isUuid);
  if (ids.length === 0) return { ok: false, error: 'ids required' };

  if (actor && !actor.isManager) {
    return { ok: false, error: 'forbidden: только руководитель может отзывать согласование' };
  }
  if (!actor) {
    // eslint-disable-next-line no-console
    console.warn('[approval] revoke: actor не сопоставлен — RBAC-guard пропущен (DEV)');
  }

  let updated = 0;
  let skippedOwn = 0;
  for (const id of ids) {
    const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
      '/rest/credosTimeEntries',
      { filter: `id[eq]:${id}`, limit: '1' },
    );
    const entry = res.data?.credosTimeEntries?.[0];
    if (entry?.status !== REVOKE_FROM) continue; // отзыв согласования только из APPROVED
    // Separation of duties: руководитель не отзывает собственные записи.
    if (actor && entry.employeeId === actor.employeeId) {
      skippedOwn += 1;
      continue;
    }
    // actorId передаём ради единообразия; setStatus для SUBMITTED обнулит approvedBy/At.
    await setStatus(id, REVOKE_TO, actorId);
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
  if (op === 'recall') return runRecall(params, actor);
  if (op === 'revoke') return runRevoke(params, actorId, actor);
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
  description:
    'Согласование трудозатрат: submit/approve/reject/recall/revoke (фиксирует руководителя)',
  timeoutSeconds: 15,
  handler,
  httpRouteTriggerSettings: {
    path: '/approval',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
