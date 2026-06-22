import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { PLAN_SLOTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { validUuidParam } from './params-validate';
// CISO-005 server-truth актор (фундамент on-behalf/lockdown/аудита plan-write).
// Резолвится на входе для БУДУЩИХ фаз; upsert/read пока работают как раньше.
import { type Actor, resolveActor } from './shared/resolve-actor';

/**
 * /s/plan-slots — помесячные слоты плана проекта (WI-47, «Планирование вручную по
 * месяцам»). Хранилище: credosTimePlanSlot (проект [× отдел] × месяц → плановые
 * часы). В режиме project.planMethod=MANUAL загрузка проекта на доске = Σ слотов.
 *
 * КОНТРАКТ ДЛЯ Dev 1 (POST /s/plan-slots, isAuthRequired):
 *
 *   mode='read' (по умолчанию):
 *     ЗАПРОС:  { mode?: 'read', projectId: UUID }
 *     ОТВЕТ:   { ok: true, mode: 'read', projectId,
 *                slots: [{ id, projectId, departmentId, employeeId,
 *                          periodMonth, plannedHours }] }
 *              - отсортированы по periodMonth возр., затем departmentId, затем employeeId.
 *
 *   mode='upsert' — дедуп по ключу (projectId, departmentId|null, employeeId|null,
 *                   periodMonth):
 *     ЗАПРОС:  { mode: 'upsert', projectId: UUID,
 *                slots: [{ periodMonth: 'YYYY-MM', plannedHours: number,
 *                          departmentId?: UUID|null, employeeId?: UUID|null }] }
 *              - body.slots можно передать JSON-строкой (queryString-режим) или
 *                массивом (JSON body). plannedHours пустой/0 → слот УДАЛЯЕТСЯ
 *                (или не создаётся). Существующий по ключу → PATCH; иначе → POST.
 *              - Планирование до СОТРУДНИКА (bottom-up SSOT §3.1): employeeId задан →
 *                персональный слот; пуст → отдельский/проектный (прежнее). Слот с
 *                employeeId БЕЗ departmentId допустим (персональный без отдела).
 *     ОТВЕТ:   { ok: true, mode: 'upsert', projectId,
 *                created, updated, deleted,           // счётчики
 *                slots: [...]                          // итоговый набор (как read) }
 *
 * Σ-СВЕРКА (для Dev1): сумма slots[].plannedHours против project.plannedEffort —
 * валидация МЯГКАЯ, делается на фронте (calc-load.slotsVsPlannedEffort). Бэк не
 * блокирует рассинхрон.
 *
 * periodMonth — строго 'YYYY-MM' (regex). Невалидные слоты пропускаются.
 * onDelete объекта — CASCADE (слот без проекта смысла не имеет).
 */

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

const restPost = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
};

const restPatch = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
};

const restDelete = async (path: string): Promise<void> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${path} -> ${res.status} ${await res.text()}`);
};

type RawSlot = {
  id: string;
  projectId: string | null;
  departmentId: string | null;
  employeeId: string | null;
  periodMonth: string | null;
  plannedHours: number | null;
};

// Курсор-пагинация Core REST (как project-team.logic). Слотов проекта обычно
// немного (≤ горизонт месяцев), но пагинацию держим на случай отделов.
const restGetAllSlots = async (projectId: string): Promise<RawSlot[]> => {
  const out: RawSlot[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 200; i++) {
    const query: Record<string, string> = {
      filter: `projectId[eq]:${projectId}`,
      limit: '60',
    };
    if (cursor) query.starting_after = cursor;
    const json = await restGet<{
      data?: Record<string, RawSlot[]> & {
        pageInfo?: { hasNextPage?: boolean; endCursor?: string };
      };
      pageInfo?: { hasNextPage?: boolean; endCursor?: string };
    }>('/rest/credosTimePlanSlots', query);
    const data = json.data ?? (json as Record<string, unknown>);
    const recs = ((data as Record<string, RawSlot[]>).credosTimePlanSlots ?? []) as RawSlot[];
    out.push(...recs);
    const pi = json.pageInfo ?? json.data?.pageInfo;
    if (!pi?.hasNextPage || recs.length === 0 || !pi.endCursor) break;
    cursor = pi.endCursor;
  }
  return out;
};

const sortSlots = (slots: RawSlot[]): RawSlot[] =>
  [...slots].sort(
    (a, b) =>
      (a.periodMonth ?? '').localeCompare(b.periodMonth ?? '') ||
      (a.departmentId ?? '').localeCompare(b.departmentId ?? '') ||
      (a.employeeId ?? '').localeCompare(b.employeeId ?? ''),
  );

const toView = (s: RawSlot) => ({
  id: s.id,
  projectId: s.projectId,
  departmentId: s.departmentId,
  employeeId: s.employeeId,
  periodMonth: s.periodMonth,
  plannedHours: s.plannedHours,
});

// Дедуп-ключ слота: проект подразумевается, ключ = month|dept|employee.
// Планирование до сотрудника: персональный слот (employeeId) отличается от
// отдельского (тот же month+dept без employee) → разные ключи, не схлопываются.
const slotKey = (
  periodMonth: string,
  departmentId: string | null,
  employeeId: string | null,
): string => `${periodMonth}|${departmentId ?? ''}|${employeeId ?? ''}`;

const MONTH_RE = /^\d{4}-\d{2}$/;

const readParams = (event: RoutePayload): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(event.queryStringParameters ?? {}))
    if (v != null) out[k] = v;
  for (const [k, v] of Object.entries((event.body ?? {}) as Record<string, unknown>))
    if (v != null) out[k] = v;
  return out;
};

export type InputSlot = {
  periodMonth: string;
  plannedHours: number;
  departmentId: string | null;
  employeeId: string | null;
};

// B3-гард мусорных слотов: входной слот ПРИНИМАЕТСЯ только если periodMonth строго
// 'YYYY-MM' (MONTH_RE) И plannedHours — конечное число (не null/undefined/NaN/Inf).
// Источник мусора был нативный object-view (создавал слоты с пустым periodMonth /
// null plannedHours), серверный гард защищает на любом пути. Слот с явным 0/<0
// часов — ВАЛИДНЫЙ вход (семантика «удалить по ключу»), его не отбрасываем здесь.
// Невалидный по любому критерию слот пропускается молча (не блокирует остальные).
// departmentId/employeeId → UUID|null. Дубли по ключу (month|dept|employee)
// схлопываются (последний выигрывает).
const isValidPlannedHours = (v: unknown): boolean => {
  if (v === null || v === undefined || v === '') return false;
  const n = Number(v);
  return Number.isFinite(n);
};

export const parseInputSlots = (raw: unknown): InputSlot[] => {
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const byKey = new Map<string, InputSlot>();
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    // periodMonth строго 'YYYY-MM' — пустой/мусорный месяц отбрасывается (B3).
    const periodMonth = String(o.periodMonth ?? '');
    if (!MONTH_RE.test(periodMonth)) continue;
    // plannedHours обязателен и конечен — null/пусто/NaN/Inf отбрасываются (B3).
    if (!isValidPlannedHours(o.plannedHours)) continue;
    const departmentId = o.departmentId ? validUuidParam(String(o.departmentId)) : null;
    const employeeId = o.employeeId ? validUuidParam(String(o.employeeId)) : null;
    byKey.set(slotKey(periodMonth, departmentId, employeeId), {
      periodMonth,
      plannedHours: Number(o.plannedHours),
      departmentId,
      employeeId,
    });
  }
  return [...byKey.values()];
};

const runRead = async (projectId: string) => {
  const slots = await restGetAllSlots(projectId);
  return {
    ok: true as const,
    mode: 'read' as const,
    projectId,
    slots: sortSlots(slots).map(toView),
  };
};

const runUpsert = async (projectId: string, inputs: InputSlot[]) => {
  const existing = await restGetAllSlots(projectId);
  const byKey = new Map<string, RawSlot>();
  for (const s of existing) {
    if (!s.periodMonth) continue;
    byKey.set(slotKey(s.periodMonth, s.departmentId, s.employeeId), s);
  }

  let created = 0;
  let updated = 0;
  let deleted = 0;

  for (const inp of inputs) {
    const key = slotKey(inp.periodMonth, inp.departmentId, inp.employeeId);
    const cur = byKey.get(key);
    // Пустой/0 → удалить существующий (или ничего не создавать).
    if (!inp.plannedHours || inp.plannedHours <= 0) {
      if (cur) {
        await restDelete(`/rest/credosTimePlanSlots/${cur.id}`);
        deleted += 1;
        byKey.delete(key);
      }
      continue;
    }
    if (cur) {
      await restPatch(`/rest/credosTimePlanSlots/${cur.id}`, {
        plannedHours: inp.plannedHours,
      });
      updated += 1;
    } else {
      await restPost('/rest/credosTimePlanSlots', {
        projectId,
        departmentId: inp.departmentId,
        employeeId: inp.employeeId,
        periodMonth: inp.periodMonth,
        plannedHours: inp.plannedHours,
      });
      created += 1;
    }
  }

  const final = await restGetAllSlots(projectId);
  return {
    ok: true as const,
    mode: 'upsert' as const,
    projectId,
    created,
    updated,
    deleted,
    slots: sortSlots(final).map(toView),
  };
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  const projectId = validUuidParam(params.projectId != null ? String(params.projectId) : undefined);
  if (!projectId) return { ok: false, error: 'projectId is required (UUID)' };

  // CISO-005 ФУНДАМЕНТ: серверный actor резолвится на входе для будущих фаз (audit
  // plan-write + on-behalf canWriteFor + lockdown). СЕЙЧАС НЕ enforcement: upsert/read
  // по projectId работают как раньше. При недоступной server-identity resolveActor
  // вернёт null без лишних запросов → деградация, текущее поведение сохраняется.
  const wmRef = params.workspaceMemberRef != null ? String(params.workspaceMemberRef) : undefined;
  const actor: Actor = await resolveActor(event, wmRef);
  if (actor && actor.trusted) {
    // На фазе on-behalf здесь будет canWriteFor(actor, проект/отдел/сотрудник). Пока — лог.
    // eslint-disable-next-line no-console
    console.warn('[plan-slots] server-actor=%s (trusted) — фундамент для аудита/on-behalf', actor.employeeId);
  }

  const mode = params.mode != null ? String(params.mode) : 'read';
  if (mode === 'read') return runRead(projectId);
  if (mode === 'upsert') return runUpsert(projectId, parseInputSlots(params.slots));
  return { ok: false, error: "unsupported mode (expected 'read' | 'upsert')" };
};

const handler = async (event: RoutePayload) => {
  try {
    return await run(event);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      apiBase: apiBase(),
      hasToken: Boolean(process.env.TWENTY_APP_ACCESS_TOKEN),
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: PLAN_SLOTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'plan-slots',
  description:
    'Помесячные слоты плана проекта (WI-47): read by projectId + upsert (дедуп по project×dept×employee×month)',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: '/plan-slots',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
