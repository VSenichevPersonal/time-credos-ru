import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { REMINDERS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import {
  computeMissingTimesheets,
  weekBounds,
  type MissingInput,
} from './missing-timesheets';
import type {
  RawAbsence,
  RawCalendarDay,
  RawDepartment,
  RawEmployee,
  RawEntry,
} from './reports-calc';

/**
 * /s/reminders — напоминания заполнить таймшит (F-E).
 *
 * SDK-ОЦЕНКА ДОСТАВКИ: песочница logic-function НЕ даёт нативного канала
 * уведомлений (нет sendEmail/sendNotification; cron-триггер есть, но payload не
 * документирован и канал доставки отсутствует). Поэтому F-E реализован как
 * ДЕТЕКТ-роут: возвращает «кто не заполнил неделю + недобор» для UI-баннера
 * («Мои часы») и дайджеста руководителю. Реальная доставка (push/email/Task) —
 * follow-up, когда появится канал (тогда добавится cronTriggerSettings на
 * reminderDayOfWeek, вызывающий ту же computeMissingTimesheets).
 *
 * ЗАПРОС (POST /s/reminders, isAuthRequired):
 *   { mode: 'missing-timesheets', threshold?: number }
 *   - mode обязателен (на будущее — другие режимы напоминаний).
 *   - threshold (0..1) — допуск недозаполнения (0 = строго любой недобор).
 *
 * ОТВЕТ (mode=missing-timesheets):
 *   { ok: true, enabled: true, reminderDayOfWeek, week: {from,to}, threshold,
 *     total, rows: [{ employeeId, name, deptCode, norm, fact, under }] }
 *   - Если напоминания выключены (settings.reminderEnabled=false):
 *     { ok: true, enabled: false, rows: [], total: 0 } — пустой список by design.
 *   - name (ФИО) — пустой, если settings.revealEmployeeNames=false (CISO-007).
 *
 * ИСТОЧНИКИ (Core REST): credosTimeSettings (singleton: reminderEnabled,
 * reminderDayOfWeek, weekStartsOn, revealEmployeeNames), credosTimeEntries
 * (неделя), credosTimeEmployees (active), credosTimeDepartments,
 * credosTimeWorkdayCalendars (неделя), credosTimeAbsences (неделя).
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

// Пагинация Core REST (max 60/страница) — курсором, как в reports.logic.
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

type RawSettings = {
  reminderEnabled?: boolean | null;
  reminderDayOfWeek?: string | null;
  weekStartsOn?: string | null;
  revealEmployeeNames?: boolean | null;
};

// threshold из params: 0..1, иначе 0 (строго). Не throw — мягкая деградация.
const readThreshold = (raw: string | undefined): number => {
  if (raw == null || raw === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= 1) return 0;
  return n;
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  if (params.mode !== 'missing-timesheets') {
    return { ok: false, error: "unsupported mode (expected 'missing-timesheets')" };
  }

  // Настройки (singleton). Дефолты безопасные: напоминания выкл, ФИО скрыты.
  const settingsList = await restGetAll<RawSettings>('credosTimeSettings', {});
  const settings = settingsList[0] ?? {};
  const enabled = settings.reminderEnabled === true;
  const reminderDayOfWeek = settings.reminderDayOfWeek ?? null;
  const reveal = settings.revealEmployeeNames === true;
  const weekStartsOn = settings.weekStartsOn === 'SUNDAY' ? 'SUNDAY' : 'MONDAY';

  // Уважаем reminderEnabled: выкл → пустой список (детект не считаем).
  if (!enabled) {
    return { ok: true, enabled: false, reminderDayOfWeek, week: null, total: 0, rows: [] };
  }

  const week = weekBounds(new Date(), weekStartsOn);
  const threshold = readThreshold(params.threshold);

  // Данные недели (REST date-filter по дню; absences пересекающие неделю).
  const [entries, employees, departments, calendar, absences] = await Promise.all([
    restGetAll<RawEntry>('credosTimeEntries', {
      filter: `date[gte]:${week.from},date[lte]:${week.to}T23:59:59.999Z`,
    }),
    restGetAll<RawEmployee>('credosTimeEmployees', { filter: 'active[eq]:true' }),
    restGetAll<RawDepartment>('credosTimeDepartments', {}),
    restGetAll<RawCalendarDay>('credosTimeWorkdayCalendars', {
      filter: `date[gte]:${week.from},date[lte]:${week.to}T23:59:59.999Z`,
    }),
    restGetAll<RawAbsence>('credosTimeAbsences', {
      filter: `startDate[lte]:${week.to}T23:59:59.999Z,endDate[gte]:${week.from}`,
    }),
  ]);

  const input: MissingInput = { entries, employees, departments, calendar, absences };
  const result = computeMissingTimesheets(input, week, { fillThreshold: threshold, revealNames: reveal });

  return { ok: true, enabled: true, reminderDayOfWeek, ...result };
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
  universalIdentifier: REMINDERS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'reminders',
  description: 'Напоминания заполнить таймшит: детект недозаполнивших за неделю (F-E)',
  timeoutSeconds: 20,
  handler,
  httpRouteTriggerSettings: {
    path: '/reminders',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
