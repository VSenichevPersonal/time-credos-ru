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
// CISO-005 server-truth актор вынесен в общий SSOT-модуль (shared/resolve-actor),
// переиспользуется time-entry-api/plan-slots. Поведение approval идентично прежнему.
import { type Actor, resolveActor } from './shared/resolve-actor';
// AUDIT-LOG (SSOT shared/write-entry-log): подключаем STATUS-строку журнала при
// смене статуса (approve/reject/recall/revoke). Лог НИКОГДА не роняет операцию
// (try/catch внутри writeEntryLog). Подключение follow-up audit-log агента: STATUS
// раньше не писался (approval.logic — не его зона), теперь источник статуса — здесь.
import { writeEntryLog } from './shared/write-entry-log';

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

// Действие, вызвавшее смену статуса. Определяет, какие аудит-поля писать (WI-56).
//   submit  — DRAFT/REJECTED → SUBMITTED (новая попытка, аудит «с чистого листа»).
//   approve — SUBMITTED → APPROVED (approvedBy/At + resolvedBy/At).
//   reject  — SUBMITTED → REJECTED (resolvedBy/At + rejectComment; approvedBy НЕ пишем).
//   revoke  — APPROVED → SUBMITTED (revokedBy/At; снять approve+resolve-аудит).
//   recall  — SUBMITTED → DRAFT (revokedBy/At = сотрудник отозвал отправку; снять resolve).
type ApprovalAction = 'submit' | 'approve' | 'reject' | 'revoke' | 'recall';

// WI-56 (W5A.11/12/24): семантика аудит-полей разведена.
//   approvedBy/At — ТОЛЬКО approve (кто согласовал; на REJECTED больше не пишем).
//   resolvedBy/At — кто вынес решение (approve ИЛИ reject) — resolver-аудит.
//   revokedBy/At  — кто отозвал согласование (revoke) или отправку (recall).
// На откате назад прежний аудит обнуляется, чтобы запись не выглядела решённой;
// REVOKED-статус не вводим — «отозвано» = approvedAt пуст И revokedBy задан.
const setStatus = async (
  id: string,
  status: string,
  action: ApprovalAction,
  actor: string | null,
  comment: string | null = null,
): Promise<void> => {
  const now = new Date().toISOString();
  const data: Record<string, unknown> = { status };

  if (action === 'approve') {
    data.approvedBy = actor ?? null;
    data.approvedAt = now;
    data.resolvedBy = actor ?? null;
    data.resolvedAt = now;
    data.revokedBy = null;
    data.revokedAt = null;
    data.rejectComment = null;
  } else if (action === 'reject') {
    // approvedBy НЕ трогаем как «согласовавшего» — это отклонение. resolver = actor.
    data.approvedBy = null;
    data.approvedAt = null;
    data.resolvedBy = actor ?? null;
    data.resolvedAt = now;
    data.revokedBy = null;
    data.revokedAt = null;
    data.rejectComment = comment ?? null;
  } else if (action === 'revoke' || action === 'recall') {
    // Откат назад: снимаем решение, фиксируем кто/когда отозвал.
    data.approvedBy = null;
    data.approvedAt = null;
    data.resolvedBy = null;
    data.resolvedAt = null;
    data.revokedBy = actor ?? null;
    data.revokedAt = now;
    data.rejectComment = null;
  } else {
    // submit: новая попытка согласования «с чистого листа» — весь аудит обнуляем.
    data.approvedBy = null;
    data.approvedAt = null;
    data.resolvedBy = null;
    data.resolvedAt = null;
    data.revokedBy = null;
    data.revokedAt = null;
    data.rejectComment = null;
  }
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
  // WI-55 collect-errors: батч не падает на середине — собираем per-item ошибки.
  let updated = 0;
  const failed: { id: string; error: string }[] = [];
  for (const e of targets) {
    try {
      await setStatus(e.id, ENTRY_STATUS.SUBMITTED, 'submit', null);
      updated += 1;
    } catch (err) {
      failed.push({ id: e.id, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { ok: true, updated, failed };
};

// WI-55 (W5A.7/29) оптимистичный CAS + collect-errors на одном id.
// SDK не даёт транзакций/condition-update → делаем read-then-write с проверкой
// ОЖИДАЕМОГО статуса непосредственно перед PATCH (optimistic-lock):
//   - статус уже сменился (не expectedFrom) → skip как «уже обработано» (идемпотентно,
//     повторное approve = no-op — эталон Timetta single-resolver), запись НЕ затираем;
//   - запись принадлежит актору и нарушает SoD → skipOwn (вызывающий считает отдельно);
//   - PATCH упал → НЕ бросаем на середине батча, собираем в failed и идём дальше.
// SoD по OWNER (approver != employeeId=owner) корректна; руководитель МОЖЕТ согласовать
// внесённое за подчинённого (иначе ломается «довнести за отсутствующего + согласовать»).
// Возврат: 'done' | 'skipped' (CAS-устарел/нет записи) | 'skippedOwn' | 'failed'.
type CasOutcome = 'done' | 'skipped' | 'skippedOwn' | 'failed';
const casApply = async (
  id: string,
  expectedFrom: string,
  action: ApprovalAction,
  targetStatus: string,
  actor: Actor,
  actorId: string | null,
  comment: string | null,
  ownConflict: 'sameEmployeeForbidden' | 'foreignEmployeeForbidden' | 'none',
  failed: { id: string; error: string }[],
): Promise<CasOutcome> => {
  try {
    const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
      '/rest/credosTimeEntries',
      { filter: `id[eq]:${id}`, limit: '1' },
    );
    const entry = res.data?.credosTimeEntries?.[0];
    // CAS: запись пропала ИЛИ статус уже не ожидаемый → пропускаем (гонка/идемпотентность).
    if (!entry || entry.status !== expectedFrom) return 'skipped';
    // Ownership-гейт. approve/revoke: руководитель не действует над СВОЕЙ (SoD).
    // recall: сотрудник действует только над СВОЕЙ (чужая запрещена).
    if (actor && ownConflict === 'sameEmployeeForbidden' && entry.employeeId === actor.employeeId) {
      return 'skippedOwn';
    }
    if (actor && ownConflict === 'foreignEmployeeForbidden' && entry.employeeId !== actor.employeeId) {
      return 'skippedOwn';
    }
    await setStatus(id, targetStatus, action, actorId, comment);
    // AUDIT-LOG STATUS: фиксируем переход expectedFrom→targetStatus + actor (server-truth).
    // Только для смены статуса approval-операциями (submit логируется в своём домене).
    // Побочно — writeEntryLog глотает ошибки, сбой лога НЕ валит операцию.
    await writeEntryLog(actor, {
      entryId: id,
      action: 'STATUS',
      oldStatus: expectedFrom,
      newStatus: targetStatus,
    });
    return 'done';
  } catch (err) {
    failed.push({ id, error: err instanceof Error ? err.message : String(err) });
    return 'failed';
  }
};

const parseIds = (raw: string | undefined): string[] =>
  (raw ?? '').split(',').map((s) => s.trim()).filter(isUuid);

// WI-57 (W5A.5) reject-defense: backend не доверяет клиенту, что в reject передан
// ПОЛНЫЙ submit сотрудника (Timetta: reject таймшита целиком, не выборочно).
// Defense активна, когда клиент передал период (from/to) — только тогда сервер
// знает «полный submit». Для каждого затронутого сотрудника тянем его SUBMITTED-
// записи периода и сверяем: все ли вошли в ids. Не вошли → неполная выборка.
// Возврат: список employeeId с неполной выборкой (пусто = выборка полная/проверка
// неприменима). Ошибки сети не валят reject — defense best-effort (вернёт пусто).
const findIncompleteRejectEmployees = async (
  ids: string[],
  from: string,
  to: string,
): Promise<string[]> => {
  if (!isIsoDate(from) || !isIsoDate(to)) return [];
  const idSet = new Set(ids);
  // employeeId затронутых записей (из переданных ids).
  const employees = new Set<string>();
  try {
    for (const id of ids) {
      const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
        '/rest/credosTimeEntries',
        { filter: `id[eq]:${id}`, limit: '1' },
      );
      const e = res.data?.credosTimeEntries?.[0];
      if (e?.status === ENTRY_STATUS.SUBMITTED && e.employeeId) employees.add(e.employeeId);
    }
    const incomplete: string[] = [];
    for (const empId of employees) {
      const res = await restGet<{ data: { credosTimeEntries: RawEntry[] } }>(
        '/rest/credosTimeEntries',
        {
          filter: `date[gte]:${from},date[lte]:${to},employeeId[eq]:${empId}`,
          limit: '500',
        },
      );
      const submitted = (res.data?.credosTimeEntries ?? []).filter(
        (e) => e.status === ENTRY_STATUS.SUBMITTED,
      );
      // Хотя бы одна SUBMITTED-запись сотрудника в периоде НЕ попала в reject-выборку.
      if (submitted.some((e) => !idSet.has(e.id))) incomplete.push(empId);
    }
    return incomplete;
  } catch {
    // Сетевой сбой defense → не блокируем reject (best-effort, CAS ниже всё равно
    // проверит статусы поштучно). Логируем для аудита.
    // eslint-disable-next-line no-console
    console.warn('[approval] reject-defense: проверка полноты пропущена (ошибка чтения)');
    return [];
  }
};

// approve/reject: переданные id (SUBMITTED) → APPROVED/REJECTED, фиксируем actor+дату.
// RBAC (CISO-002): согласовывать может только руководитель (actor.isManager),
// и нельзя согласовывать собственные записи (separation of duties: actor != owner).
// WI-55: CAS-skip устаревших + collect-errors (батч не падает на середине).
const runResolve = async (
  params: Record<string, string>,
  status: string,
  actorId: string | null,
  actor: Actor,
): Promise<object> => {
  // CISO-006: каждый id идёт в `id[eq]:${id}` filter — оставляем только UUID
  // (инъекция-строки отбрасываются до запроса).
  const ids = parseIds(params.ids);
  if (ids.length === 0) return { ok: false, error: 'ids required' };
  // Причина отклонения (op=reject). Хранится на каждой записи батча. min-длина —
  // UI-валидация (Dev1); backend сохраняет переданное (decoupled rollout).
  const comment = status === ENTRY_STATUS.REJECTED ? params.comment ?? null : null;
  const action: ApprovalAction = status === ENTRY_STATUS.REJECTED ? 'reject' : 'approve';

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

  // WI-57 reject-defense: при reject c периодом сверяем полноту выборки сотрудника.
  // Неполная выборка (часть SUBMITTED-записей не вошла) → отказ, клиенту не доверяем.
  if (action === 'reject' && params.from && params.to) {
    const incomplete = await findIncompleteRejectEmployees(ids, params.from, params.to);
    if (incomplete.length > 0) {
      return {
        ok: false,
        error: 'reject должен отклонять весь submit сотрудника (неполная выборка)',
        incompleteEmployees: incomplete,
      };
    }
  }

  let updated = 0;
  let skippedOwn = 0;
  let skipped = 0;
  const failed: { id: string; error: string }[] = [];
  for (const id of ids) {
    const r = await casApply(
      id, ENTRY_STATUS.SUBMITTED, action, status,
      actor, actorId, comment, 'sameEmployeeForbidden', failed,
    );
    if (r === 'done') updated += 1;
    else if (r === 'skippedOwn') skippedOwn += 1;
    else if (r === 'skipped') skipped += 1;
  }
  return { ok: true, updated, skippedOwn, skipped, failed };
};

// recall (A4.3/A4.4): СОТРУДНИК отзывает СВОЮ отправку SUBMITTED → DRAFT,
// пока руководитель не вынес решение (запись ещё SUBMITTED). Право — владелец записи:
// actor.employeeId == entry.employeeId. Чужие/не-SUBMITTED записи пропускаются.
// Руководитель НЕ нужен (это действие сотрудника над собственными трудозатратами).
const runRecall = async (
  params: Record<string, string>,
  actorId: string | null,
  actor: Actor,
): Promise<object> => {
  const ids = parseIds(params.ids);
  if (ids.length === 0) return { ok: false, error: 'ids required' };

  // dev-bypass: actor не сопоставлен (workspaceMemberRef пуст) — пропускаем ownership-гейт.
  if (!actor) {
    // eslint-disable-next-line no-console
    console.warn('[approval] recall: actor не сопоставлен — ownership-guard пропущен (DEV)');
  }

  // WI-55 CAS + collect-errors. recall = действие сотрудника над СВОЕЙ отправкой:
  // revokedBy фиксирует, кто отозвал (WI-56). Чужая запись → skippedForeign.
  let updated = 0;
  let skippedForeign = 0;
  let skipped = 0;
  const failed: { id: string; error: string }[] = [];
  for (const id of ids) {
    const r = await casApply(
      id, RECALL_FROM, 'recall', RECALL_TO,
      actor, actorId, null, 'foreignEmployeeForbidden', failed,
    );
    if (r === 'done') updated += 1;
    else if (r === 'skippedOwn') skippedForeign += 1;
    else if (r === 'skipped') skipped += 1;
  }
  return { ok: true, updated, skippedForeign, skipped, failed };
};

// revoke (A4.25/A4.26): РУКОВОДИТЕЛЬ отзывает выданное согласование APPROVED → SUBMITTED
// («Reopen» в Timetta — запись возвращается в очередь согласования). RBAC = как approve:
// требуется actor.isManager; SoD — нельзя отзывать собственные согласованные записи.
const runRevoke = async (
  params: Record<string, string>,
  actorId: string | null,
  actor: Actor,
): Promise<object> => {
  const ids = parseIds(params.ids);
  if (ids.length === 0) return { ok: false, error: 'ids required' };

  if (actor && !actor.isManager) {
    return { ok: false, error: 'forbidden: только руководитель может отзывать согласование' };
  }
  if (!actor) {
    // eslint-disable-next-line no-console
    console.warn('[approval] revoke: actor не сопоставлен — RBAC-guard пропущен (DEV)');
  }

  // WI-55 CAS + collect-errors. revoke = руководитель отзывает согласование:
  // revokedBy фиксирует, кто отозвал (WI-56). SoD: не отзывать СВОЮ запись.
  let updated = 0;
  let skippedOwn = 0;
  let skipped = 0;
  const failed: { id: string; error: string }[] = [];
  for (const id of ids) {
    const r = await casApply(
      id, REVOKE_FROM, 'revoke', REVOKE_TO,
      actor, actorId, null, 'sameEmployeeForbidden', failed,
    );
    if (r === 'done') updated += 1;
    else if (r === 'skippedOwn') skippedOwn += 1;
    else if (r === 'skipped') skipped += 1;
  }
  return { ok: true, updated, skippedOwn, skipped, failed };
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  // actorId — для аудита approvedBy (userWorkspaceId фиксирует, кто нажал).
  const actorId = event.userWorkspaceId ?? null;
  // actor — employee актора (роль + id). CISO-005: server-truth по event.userWorkspaceId
  // (с TOFU-привязкой); деградация на client workspaceMemberRef только при пустом
  // userWorkspaceId (dev/legacy).
  const actor = await resolveActor(event, params.workspaceMemberRef);
  const op = params.op ?? '';
  if (op === 'submit') return runSubmit(params);
  if (op === 'approve') return runResolve(params, ENTRY_STATUS.APPROVED, actorId, actor);
  if (op === 'reject') return runResolve(params, ENTRY_STATUS.REJECTED, actorId, actor);
  if (op === 'recall') return runRecall(params, actorId, actor);
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
