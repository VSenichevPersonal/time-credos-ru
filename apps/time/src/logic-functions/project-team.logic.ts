import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { PROJECT_TEAM_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { validDateParam, validUuidParam } from './params-validate';
import {
  computeEmployeeProjects,
  computeProjectTeam,
  type RawTeamDepartment,
} from './project-team';
import { employeeCode, type RawEmployee, type RawEntry, type RawProject } from './reports-calc';

/**
 * /s/project-team — агрегат «Команда проекта» / «Проекты сотрудника» (REQ-0016
 * follow-up). Прямого relation проект↔сотрудник НЕТ — выводим из записей
 * credosTimeEntry. Питает front-component вкладки «Команда» карточки проекта
 * (Dev 1) и «Проекты, где работал» карточки сотрудника.
 *
 * КОНТРАКТ ДЛЯ Dev 1 (POST /s/project-team, isAuthRequired):
 *   mode='team' (по умолчанию):
 *     { mode?: 'team', projectId: UUID, from?: ISO, to?: ISO }
 *     → { ok, mode:'team', projectId, period:{from,to}, total,
 *         members: [{ employeeId, name, deptCode, totalHours, entryCount, lastDate, share }] }
 *     - members отсортированы по totalHours убыв. (затем по name).
 *     - total — Σ часов проекта за период; share = totalHours/total (0..1, null если total=0).
 *   mode='employee-projects':
 *     { mode:'employee-projects', employeeId: UUID, from?: ISO, to?: ISO }
 *     → { ok, mode:'employee-projects', employeeId, period:{from,to}, total,
 *         projects: [{ projectId, name, code, totalHours, entryCount, lastDate, share }] }
 *
 * ПДн (CISO-007, REQ-0019): ФИО (members[].name) раскрывается ТОЛЬКО при
 * credosTimeSettings.revealEmployeeNames=true; иначе — КОД сотрудника
 * (employeeCode), фолбэк employeeId. Имя проекта — не ПДн, не затирается.
 *
 * ИСТОЧНИКИ (Core REST): credosTimeEntries (фильтр по projectId/employeeId +
 * период; курсор-пагинация, не limit), credosTimeEmployees, credosTimeProjects,
 * credosTimeDepartments, credosTimeSettings (revealEmployeeNames).
 *
 * Сверка (правило 8): Timetta — «Команда проекта»/участники. Здесь — фактические
 * участники по списанным часам (не плановое штатное расписание). [[no-billable-concept]].
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

// Курсор-пагинация Core REST (max 60/страница) — как в reports.logic. Без неё
// записи проекта/сотрудника недосчитываются (limit режет на 60).
const restGetAll = async <T>(plural: string, baseQuery: Record<string, string>): Promise<T[]> => {
  const out: T[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 500; i++) {
    const query: Record<string, string> = { ...baseQuery, limit: '60' };
    if (cursor) query.starting_after = cursor;
    const json = await restGet<{
      data?: Record<string, T[]> & { pageInfo?: { hasNextPage?: boolean; endCursor?: string } };
      pageInfo?: { hasNextPage?: boolean; endCursor?: string };
    }>(`/rest/${plural}`, query);
    const data = json.data ?? (json as Record<string, unknown>);
    const recs = ((data as Record<string, T[]>)[plural] ?? []) as T[];
    out.push(...recs);
    const pi = json.pageInfo ?? json.data?.pageInfo;
    if (!pi?.hasNextPage || recs.length === 0 || !pi.endCursor) break;
    cursor = pi.endCursor;
  }
  return out;
};

const readParams = (event: RoutePayload): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(event.queryStringParameters ?? {}))
    if (v != null) out[k] = v;
  for (const [k, v] of Object.entries((event.body ?? {}) as Record<string, unknown>))
    if (v != null) out[k] = String(v);
  return out;
};

// CISO-007/REQ-0019: показ ФИО — из singleton credosTimeSettings. Fallback false.
type RawSettings = { revealEmployeeNames?: boolean | null };
const readRevealEmployeeNames = async (): Promise<boolean> => {
  try {
    const settings = await restGetAll<RawSettings>('credosTimeSettings', {});
    return settings[0]?.revealEmployeeNames === true;
  } catch {
    return false;
  }
};

// REST-фильтр периода по полю date (день включительно). Границы валидированы как ISO.
const dateFilter = (from: string | null, to: string | null): string | null => {
  const parts: string[] = [];
  if (from) parts.push(`date[gte]:${from}`);
  if (to) parts.push(`date[lte]:${to}`);
  return parts.length ? parts.join(',') : null;
};

const runTeam = async (params: Record<string, string>) => {
  const projectId = validUuidParam(params.projectId);
  if (!projectId) return { ok: false, error: 'projectId is required (UUID)' };
  // from/to опц.: пусто → весь период (null границы), невалид → throw (ловит handler).
  const from = params.from ? validDateParam(params.from, '') : null;
  const to = params.to ? validDateParam(params.to, '') : null;

  const entryFilter = [`projectId[eq]:${projectId}`, dateFilter(from, to)]
    .filter(Boolean)
    .join(',');

  const [entries, employees, departments, reveal] = await Promise.all([
    restGetAll<RawEntry>('credosTimeEntries', { filter: entryFilter }),
    restGetAll<RawEmployee>('credosTimeEmployees', {}),
    restGetAll<RawTeamDepartment>('credosTimeDepartments', {}),
    readRevealEmployeeNames(),
  ]);

  const result = computeProjectTeam(
    { entries, employees, departments },
    projectId,
    { from, to },
  );
  // ПДн: при reveal=false ФИО → стабильный КОД сотрудника (не пусто/UUID).
  // КОД детерминирован по id+отделу — различим, не раскрывает личность. deptCode
  // строки уже резолвлен → используем как сегмент кода (карта id-отдела не нужна).
  const deptOfEmp = new Map(employees.map((e) => [e.id, e.departmentId]));
  const deptCodeById = new Map(departments.map((d) => [d.id, d.code ?? null]));
  const members = reveal
    ? result.members
    : result.members.map((m) => ({
        ...m,
        name: employeeCode(
          { id: m.employeeId, departmentId: deptOfEmp.get(m.employeeId) ?? null },
          deptCodeById,
        ),
      }));

  return {
    ok: true,
    mode: 'team',
    projectId,
    period: { from, to },
    revealNames: reveal,
    total: result.total,
    members,
  };
};

const runEmployeeProjects = async (params: Record<string, string>) => {
  const employeeId = validUuidParam(params.employeeId);
  if (!employeeId) return { ok: false, error: 'employeeId is required (UUID)' };
  const from = params.from ? validDateParam(params.from, '') : null;
  const to = params.to ? validDateParam(params.to, '') : null;

  const entryFilter = [`employeeId[eq]:${employeeId}`, dateFilter(from, to)]
    .filter(Boolean)
    .join(',');

  const [entries, projects] = await Promise.all([
    restGetAll<RawEntry>('credosTimeEntries', { filter: entryFilter }),
    restGetAll<RawProject>('credosTimeProjects', {}),
  ]);

  const result = computeEmployeeProjects({ entries, projects }, employeeId, { from, to });
  return {
    ok: true,
    mode: 'employee-projects',
    employeeId,
    period: { from, to },
    total: result.total,
    projects: result.projects,
  };
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  const mode = params.mode ?? 'team';
  if (mode === 'employee-projects') return runEmployeeProjects(params);
  if (mode === 'team') return runTeam(params);
  return { ok: false, error: "unsupported mode (expected 'team' | 'employee-projects')" };
};

// Обёртка: ошибки -> ok:false + диагностика (роут не падает 500).
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
  universalIdentifier: PROJECT_TEAM_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'project-team',
  description: 'Команда проекта / проекты сотрудника: агрегат участников из записей (REQ-0016)',
  timeoutSeconds: 20,
  handler,
  httpRouteTriggerSettings: {
    path: '/project-team',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
