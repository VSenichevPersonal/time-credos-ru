import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { REPORTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import {
  computeReports,
  type RawCalendarDay,
  type RawDepartment,
  type RawEmployee,
  type RawEntry,
  type RawProject,
} from './reports-calc';

/**
 * /s/reports — агрегатная аналитика трудозатрат (утилизация + загрузка/недогруз).
 *
 * КОНТРАКТ ДЛЯ Dev 1 (UI «Отчёты» + UX-2 группировка «по людям»).
 * Полная версия — docs/data-model/REPORTS_CONTRACT.md.
 *
 * ЗАПРОС (POST /s/reports, isAuthRequired):
 *   { from: ISO, to: ISO, groupBy?: 'dept' | 'project' | 'employee' }
 *   - from/to — границы периода (по полю credosTimeEntry.date, inclusive).
 *     Если не заданы — берётся весь диапазон.
 *   - groupBy — какую группировку считать. По умолчанию считаются ВСЕ три
 *     (byDept/byProject/byEmployee), поле лишь подсказка для UI о приоритете.
 *
 * ОТВЕТ:
 *   {
 *     ok: true,
 *     period: { from, to },
 *     totals: { fact, client, norm, util, under },
 *     byDept:     [{ key, name, fact, client, norm, util, under }],
 *     byProject:  [{ key, name, code, category, fact, client, norm: null, util, under: null }],
 *     byEmployee: [{ key, name, dept, fact, client, norm, util, under }],
 *   }
 *
 * МЕТРИКИ (на строку группы):
 *   - fact   — Σ часов всех записей группы за период (факт).
 *   - client — Σ часов записей, чей проект категории CLIENT.
 *   - util   — утилизация = client / fact (0..1, null если fact == 0).
 *   - norm   — нормо-часы периода из credosTimeWorkdayCalendar:
 *              базовая норма = Σ hours рабочих дней периода (dayType WORKDAY|SHORT).
 *              · employee: личная норма = базовая норма × capacityFactor отдела.
 *              · dept:     Σ норм сотрудников отдела (база × headcount × capacityFactor).
 *              · project:  норма не определена (norm = null, under = null).
 *   - under  — недогруз = norm − fact (положит. = недозагрузка, отриц. = перегруз;
 *              null где norm == null).
 *
 * ИСТОЧНИКИ (Core REST воркспейса): credosTimeEntries, credosTimeProjects,
 * credosTimeEmployees, credosTimeDepartments, credosTimeWorkdayCalendars.
 * Категория CLIENT и тип дня WORKDAY/SHORT — UPPER_CASE значения SELECT на сервере.
 */

// Типы Raw* и чистый расчёт — в ./reports-calc (тестируется отдельно).

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

// Core REST отдаёт max 60 записей/страницу (openapi: limit default/max=60) — без
// пагинации reports недосчитает (≈420 записей → 60, календарь 180 дней → 60, норма врёт).
// Идём по курсору starting_after, пока pageInfo.hasNextPage.
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

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  const from = params.from ?? '1970-01-01T00:00:00.000Z';
  const to = params.to ?? '2999-12-31T23:59:59.999Z';

  const [entries, projects, employees, departments, calendar] = await Promise.all([
    restGetAll<RawEntry>('credosTimeEntries', { filter: `date[gte]:${from},date[lte]:${to}` }),
    restGetAll<RawProject>('credosTimeProjects', {}),
    restGetAll<RawEmployee>('credosTimeEmployees', { filter: 'active[eq]:true' }),
    restGetAll<RawDepartment>('credosTimeDepartments', {}),
    restGetAll<RawCalendarDay>('credosTimeWorkdayCalendars', {
      filter: `date[gte]:${from},date[lte]:${to}`,
    }),
  ]);

  const result = computeReports(
    { entries, projects, employees, departments, calendar },
    { from, to },
  );
  return { ...result, groupBy: params.groupBy ?? null };
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
  universalIdentifier: REPORTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'reports',
  description: 'Агрегатная аналитика: утилизация + загрузка/недогруз (dept/project/employee)',
  timeoutSeconds: 20,
  handler,
  httpRouteTriggerSettings: {
    path: '/reports',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
