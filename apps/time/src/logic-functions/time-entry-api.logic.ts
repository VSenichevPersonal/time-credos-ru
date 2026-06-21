import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { TIME_ENTRY_API_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { ENTRY_STATUS } from 'src/constants/approval';
import { isIsoDate, isUuid } from './params-validate';
// SSOT-пересчёт rollup-поля проекта (factHours/budgetRemaining). Один источник
// формулы и поведения — общий с database-event триггерами (project-fact-rollup.logic.ts).
import { recalcProjectFactHours } from './project-fact-rollup';

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

// Резолв сотрудника по workspaceMemberRef.
// ВАЖНО: RoutePayload отдаёт только event.userWorkspaceId (userWorkspace ID,
// НЕ workspaceMember ID) и не содержит email — серверного маппинга
// userWorkspace -> workspaceMember через REST нет. Поэтому клиент обязан
// передавать workspaceMemberRef явно в params. Сопоставление идёт по
// credosTimeEmployee.workspaceMemberRef == переданный ref.
const resolveEmployeeId = async (
  workspaceMemberRef: string | undefined,
): Promise<string | null> => {
  // CISO-006: workspaceMemberRef идёт в filter — запрашиваем только если это UUID
  // (невалидный/инъекция → как несопоставленный, уходит в DEV-fallback ниже).
  if (workspaceMemberRef && isUuid(workspaceMemberRef)) {
    const byRef = await api.get<{ data: { credosTimeEmployees: RefItem[] } }>(
      '/rest/credosTimeEmployees',
      { filter: `workspaceMemberRef[eq]:${workspaceMemberRef}`, limit: '1' },
    );
    const found = byRef.data?.credosTimeEmployees?.[0];
    if (found) return found.id;
  }
  // Fallback (DEV-ONLY): ref не передан или не сопоставлен. Возвращаем первого
  // активного, чтобы dev-сетка не падала. В проде это маскирует
  // несопоставленного пользователя — заполни workspaceMemberRef у сотрудников.
  // TODO(prod): убрать fallback, отдавать null + ошибку «сотрудник не сопоставлен».
  // eslint-disable-next-line no-console
  console.warn(
    '[time-entry-api] workspaceMemberRef не сопоставлен (ref=%s) — DEV fallback на первого активного',
    workspaceMemberRef ?? '(пусто)',
  );
  const fallback = await api.get<{ data: { credosTimeEmployees: RefItem[] } }>(
    '/rest/credosTimeEmployees',
    { filter: 'active[eq]:true', limit: '1' },
  );
  return fallback.data?.credosTimeEmployees?.[0]?.id ?? null;
};

// recalcProjectFactHours вынесен в ./project-fact-rollup (SSOT) и переиспользуется
// database-event триггерами — единая формула и единый сбор записей по курсору.

// SCOUT-B: ключ уникальности записи трудозатрат — (employeeId, projectId,
// workTypeId, date-день). Зеркалит уникальный индекс credos-time-entry-unique.
// БД-индекс ловит дубли на всех путях, но: (1) NULL != NULL → строки с NULL в
// projectId/workTypeId индексом не ловятся; (2) приложенческая upsert-семантика
// (тот же ключ → update, а не 500 от констрейнта). Этот гард закрывает оба.
// date нормализуем по календарному дню (диапазон [день 00:00, день 23:59:59]).
const dayBounds = (iso: string): { from: string; to: string } => {
  const day = iso.slice(0, 10);
  return { from: `${day}T00:00:00.000Z`, to: `${day}T23:59:59.999Z` };
};

const findExistingEntryIdByKey = async (key: {
  employeeId: string;
  projectId: string | null;
  workTypeId: string | null;
  date: string;
}): Promise<string | null> => {
  const { from, to } = dayBounds(key.date);
  // date — DATE_TIME: сравниваем по диапазону дня. project/workType nullable →
  // filter `[is]:NULL`, иначе `[eq]:` (точное совпадение по UUID).
  const parts = [
    `employeeId[eq]:${key.employeeId}`,
    `date[gte]:${from}`,
    `date[lte]:${to}`,
    key.projectId ? `projectId[eq]:${key.projectId}` : 'projectId[is]:NULL',
    key.workTypeId ? `workTypeId[eq]:${key.workTypeId}` : 'workTypeId[is]:NULL',
  ];
  const res = await api.get<{ data: { credosTimeEntries: Array<{ id: string }> } }>(
    '/rest/credosTimeEntries',
    { filter: parts.join(','), limit: '1' },
  );
  return res.data?.credosTimeEntries?.[0]?.id ?? null;
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  // Один POST-маршрут /s/time-entry; операция выбирается полем `op`.
  const op = params.op ?? 'list';
  // CISO-006: синхронный UUID-guard до сетевого resolveEmployeeId — fail fast.
  if (params.id && !isUuid(params.id)) return { ok: false, error: 'invalid id' };
  const employeeId = await resolveEmployeeId(params.workspaceMemberRef);

  // delete — удаление записи по id.
  if (op === 'delete') {
    if (!params.id) return { ok: false, error: 'id required' };
    // CISO-006: id идёт в REST-путь — только UUID (защита от инъекции в path).
    if (!isUuid(params.id)) return { ok: false, error: 'invalid id' };
    // Читаем status + projectId до удаления (CISO-011 guard + rollup пересчёт).
    const preRes = await api.get<{ data: { credosTimeEntries: Array<{ projectId: string | null; status: string }> } }>(
      '/rest/credosTimeEntries',
      { filter: `id[eq]:${params.id}`, limit: '1' },
    );
    const preEntry = preRes.data?.credosTimeEntries?.[0];
    // CISO-011: согласованные записи нельзя удалять — целостность табеля/1С.
    if (preEntry?.status === ENTRY_STATUS.APPROVED) {
      return { ok: false, error: 'cannot_modify_approved' };
    }
    const deletedProjectId = preEntry?.projectId ?? null;
    await api.delete(`/rest/credosTimeEntries/${params.id}`);
    if (deletedProjectId && isUuid(deletedProjectId)) {
      await recalcProjectFactHours(deletedProjectId);
    }
    return { ok: true };
  }

  // upsert — создать или обновить запись.
  if (op === 'upsert') {
    // CISO-006: id в REST-путь PATCH — только UUID. Проверяем ДО резолва сотрудника,
    // чтобы невалидный id сразу падал на 'invalid id', а не на 'employee not resolved'.
    if (params.id && !isUuid(params.id)) return { ok: false, error: 'invalid id' };

    // CISO-011: для существующей записи читаем status+projectId РАНЬШЕ проверок
    // часов/сотрудника. Согласованную запись нельзя менять независимо от резолва
    // актора — иначе 'employee not resolved'/'hours out of range' маскируют guard
    // целостности. Один GET; prevProjectId переиспользуем ниже для rollup-пересчёта.
    let prevProjectId: string | null = null;
    if (params.id) {
      const prevRes = await api.get<{ data: { credosTimeEntries: Array<{ projectId: string | null; status: string }> } }>(
        '/rest/credosTimeEntries',
        { filter: `id[eq]:${params.id}`, limit: '1' },
      );
      const prevEntry = prevRes.data?.credosTimeEntries?.[0];
      if (prevEntry?.status === ENTRY_STATUS.APPROVED) {
        return { ok: false, error: 'cannot_modify_approved' };
      }
      prevProjectId = prevEntry?.projectId ?? null;
    }

    const hours = Number(params.hours);
    if (Number.isNaN(hours) || hours < HOURS_MIN || hours > HOURS_MAX)
      return { ok: false, error: 'hours out of range' };
    if (!employeeId) return { ok: false, error: 'employee not resolved' };

    const newProjectId = params.projectId && isUuid(params.projectId) ? params.projectId : null;
    const newWorkTypeId = params.workTypeId && isUuid(params.workTypeId) ? params.workTypeId : null;
    const data: Record<string, unknown> = {
      date: params.date,
      hours,
      description: params.description ?? null,
      employeeId,
      projectId: newProjectId,
      workTypeId: newWorkTypeId,
    };

    // SCOUT-B upsert-семантика: если id не передан, ищем существующую запись по
    // ключу (employee, project, workType, день) → обновляем её вместо создания
    // (не плодим дубли). Закрывает NULL-щель уникального индекса и даёт чистый
    // upsert для CSV-импорта/повторного ввода вместо 500 от БД-констрейнта.
    let targetId = params.id ?? null;
    if (!targetId && params.date) {
      targetId = await findExistingEntryIdByKey({
        employeeId,
        projectId: newProjectId,
        workTypeId: newWorkTypeId,
        date: params.date,
      });
      // Найденную по ключу запись тоже защищаем (CISO-011) и собираем её проект
      // для пересчёта (смены проекта тут быть не может — ключ совпадает).
      if (targetId) {
        const exRes = await api.get<{ data: { credosTimeEntries: Array<{ projectId: string | null; status: string }> } }>(
          '/rest/credosTimeEntries',
          { filter: `id[eq]:${targetId}`, limit: '1' },
        );
        const ex = exRes.data?.credosTimeEntries?.[0];
        if (ex?.status === ENTRY_STATUS.APPROVED) {
          return { ok: false, error: 'cannot_modify_approved' };
        }
        prevProjectId = ex?.projectId ?? null;
      }
    }

    if (targetId) {
      const res = await api.patch<{ data: { updateCredosTimeEntry: TimeEntry } }>(
        `/rest/credosTimeEntries/${targetId}`,
        data,
      );
      const projectIdsToRecalc = new Set<string>(
        [prevProjectId, newProjectId].filter((id): id is string => !!id && isUuid(id)),
      );
      for (const pid of projectIdsToRecalc) await recalcProjectFactHours(pid);
      return { ok: true, entry: res.data?.updateCredosTimeEntry };
    }
    const res = await api.post<{ data: { createCredosTimeEntry: TimeEntry } }>(
      '/rest/credosTimeEntries',
      data,
    );
    if (newProjectId) await recalcProjectFactHours(newProjectId);
    return { ok: true, entry: res.data?.createCredosTimeEntry };
  }

  // GET (по умолчанию) — список записей за неделю + справочники для сетки.
  // CISO-006: from/to идут в filter-строку — валидируем ISO-date (инъекция → ошибка).
  const from = params.from ?? '1970-01-01T00:00:00.000Z';
  const to = params.to ?? '2999-12-31T23:59:59.999Z';
  if (!isIsoDate(from) || !isIsoDate(to)) return { ok: false, error: 'invalid from/to' };

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
