import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { TIME_ENTRY_API_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// /s/time-entry — CRUD трудозатрат для front-компонента (песочница без доступа к БД).
// Работает поверх Core REST воркспейса (TWENTY_API_URL + TWENTY_APP_ACCESS_TOKEN
// инжектятся платформой). Сотрудник определяется по workspaceMemberRef; если не
// сопоставлен — берём первого активного (не падаем).

type TimeEntry = {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  status: string;
  projectId: string | null;
  workTypeId: string | null;
  employeeId: string | null;
};

type RefItem = { id: string; name: string; code?: string };

const HOURS_MIN = 0;
const HOURS_MAX = 24;

// Тонкий REST-клиент к Core API воркспейса (на нативном fetch серверного рантайма).
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

const restSend = async <T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json().catch(() => ({}))) as T;
};

const api = {
  get: restGet,
  post: <T>(p: string, b: unknown) => restSend<T>('POST', p, b),
  patch: <T>(p: string, b: unknown) => restSend<T>('PATCH', p, b),
  delete: (p: string) => restSend('DELETE', p),
};

// Чтение query/body независимо от метода (RoutePayload AWS-формат).
const readParams = (event: RoutePayload): Record<string, string> => {
  const q = (event.queryStringParameters ?? {}) as Record<string, string>;
  const b = (event.body ?? {}) as Record<string, unknown>;
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(q)) merged[k] = v;
  for (const [k, v] of Object.entries(b))
    if (v !== null && v !== undefined) merged[k] = String(v);
  return merged;
};

// Сотрудник текущего пользователя (или дефолтный) — id для фильтра/записи.
const resolveEmployeeId = async (
  userWorkspaceMemberRef: string | undefined,
): Promise<string | null> => {
  if (userWorkspaceMemberRef) {
    const byRef = await api.get<{ data: { credosTimeEmployees: RefItem[] } }>(
      '/rest/credosTimeEmployees',
      { filter: `workspaceMemberRef[eq]:${userWorkspaceMemberRef}`, limit: '1' },
    );
    const found = byRef.data?.credosTimeEmployees?.[0];
    if (found) return found.id;
  }
  const fallback = await api.get<{ data: { credosTimeEmployees: RefItem[] } }>(
    '/rest/credosTimeEmployees',
    { filter: 'active[eq]:true', limit: '1' },
  );
  return fallback.data?.credosTimeEmployees?.[0]?.id ?? null;
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  // Один POST-маршрут /s/time-entry; операция выбирается полем `op`.
  const op = params.op ?? 'list';
  const employeeId = await resolveEmployeeId(params.workspaceMemberRef);

  // delete — удаление записи по id.
  if (op === 'delete') {
    if (!params.id) return { ok: false, error: 'id required' };
    await api.delete(`/rest/credosTimeEntries/${params.id}`);
    return { ok: true };
  }

  // upsert — создать или обновить запись.
  if (op === 'upsert') {
    const hours = Number(params.hours);
    if (Number.isNaN(hours) || hours < HOURS_MIN || hours > HOURS_MAX)
      return { ok: false, error: 'hours out of range' };
    if (!employeeId) return { ok: false, error: 'employee not resolved' };

    const data: Record<string, unknown> = {
      date: params.date,
      hours,
      description: params.description ?? null,
      employeeId,
      projectId: params.projectId || null,
      workTypeId: params.workTypeId || null,
    };

    if (params.id) {
      const res = await api.patch<{ data: { updateCredosTimeEntry: TimeEntry } }>(
        `/rest/credosTimeEntries/${params.id}`,
        data,
      );
      return { ok: true, entry: res.data?.updateCredosTimeEntry };
    }
    const res = await api.post<{ data: { createCredosTimeEntry: TimeEntry } }>(
      '/rest/credosTimeEntries',
      data,
    );
    return { ok: true, entry: res.data?.createCredosTimeEntry };
  }

  // GET (по умолчанию) — список записей за неделю + справочники для сетки.
  const from = params.from ?? '1970-01-01T00:00:00.000Z';
  const to = params.to ?? '2999-12-31T23:59:59.999Z';

  const entriesFilter = employeeId
    ? `date[gte]:${from},date[lte]:${to},employeeId[eq]:${employeeId}`
    : `date[gte]:${from},date[lte]:${to}`;

  const [entriesRes, projectsRes, workTypesRes] = await Promise.all([
    api.get<{ data: { credosTimeEntries: TimeEntry[] } }>('/rest/credosTimeEntries', {
      filter: entriesFilter,
      limit: '200',
      orderBy: 'date[AscNullsFirst]',
    }),
    api.get<{ data: { credosTimeProjects: RefItem[] } }>('/rest/credosTimeProjects', {
      filter: 'status[eq]:ACTIVE',
      limit: '200',
      orderBy: 'code[AscNullsFirst]',
    }),
    api.get<{ data: { credosTimeWorkTypes: RefItem[] } }>('/rest/credosTimeWorkTypes', {
      limit: '200',
    }),
  ]);

  return {
    ok: true,
    employeeId,
    entries: entriesRes.data?.credosTimeEntries ?? [],
    projects: (projectsRes.data?.credosTimeProjects ?? []).map((p) => ({
      id: p.id,
      name: p.code ? `${p.code} — ${p.name}` : p.name,
    })),
    workTypes: (workTypesRes.data?.credosTimeWorkTypes ?? []).map((w) => ({
      id: w.id,
      name: w.name,
    })),
  };
};

// Обёртка: ошибки превращаем в ok:false с диагностикой (роут не падает 500).
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
  universalIdentifier: TIME_ENTRY_API_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'time-entry-api',
  description: 'CRUD трудозатрат за неделю для недельной сетки (front-компонент)',
  timeoutSeconds: 10,
  handler,
  httpRouteTriggerSettings: {
    path: '/time-entry',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
