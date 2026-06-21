import { RestApiClient } from 'twenty-client-sdk/rest';

import type { ValidationFinding } from 'src/constants/validation';
import type {
  ApiEntry,
  DepartmentRef,
  EmployeeRef,
  ProjectRef,
  Ref,
  WorkTypeRef,
} from 'src/front-components/grid/types';

// Доступ к данным таймшита из песочницы front-компонента.
//
// ЧТЕНИЕ (fetch*/resolve*) — напрямую по Core REST /rest/* (read-only, прав роли
// приложения достаточно, серверный гард не нужен).
//
// ЗАПИСЬ (upsert/delete) — CISO-012: МАРШРУТИЗИРУЕТСЯ через серверную logic-функцию
// /s/time-entry. Только так путь-независимо срабатывают серверные гарды:
//   · lock-approved (CISO-011: cannot_modify_approved) — нельзя править/удалять
//     согласованную запись;
//   · валидация-лимит (#4: 'hours out of range') — серверная проверка часов/день;
//   · upsert-дедуп по ключу (employee, project, workType, день) — без дублей.
// Сервер = источник истины; клиентский validateEntry остаётся как быстрый pre-check.
// Если /s/ недоступна (404/500 на отдельных стендах) — graceful fallback на прямой
// REST PATCH/POST/DELETE (как в approval-rest.ts; тогда серверные гарды не работают,
// но грид не падает — деградация, не отказ).

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

// Сотрудник: по workspaceMemberRef, иначе первый активный (не падаем).
export const resolveEmployeeId = async (
  workspaceMemberRef: string | null,
): Promise<string | null> => {
  const c = client();
  if (workspaceMemberRef) {
    const byRef = await c.get<ListResp<Ref>>('/rest/credosTimeEmployees', {
      query: { filter: `workspaceMemberRef[eq]:${workspaceMemberRef}`, limit: '1' },
    });
    const found = pickList(byRef, 'credosTimeEmployees')[0];
    if (found) return found.id;
  }
  const any = await c.get<ListResp<Ref>>('/rest/credosTimeEmployees', {
    query: { filter: 'active[eq]:true', limit: '1' },
  });
  return pickList(any, 'credosTimeEmployees')[0]?.id ?? null;
};

type RawCompany = { id: string; name: string };
type RawProject = {
  id: string;
  name: string;
  code?: string | null;
  category?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
  approvalRequired?: boolean | null;
};

export const fetchProjects = async (): Promise<ProjectRef[]> => {
  const c = client();
  const [projResp, compResp] = await Promise.all([
    c.get<ListResp<RawProject>>('/rest/credosTimeProjects', {
      query: { filter: 'status[eq]:ACTIVE', limit: '200', orderBy: 'code[AscNullsFirst]' },
    }),
    c.get<ListResp<RawCompany>>('/rest/companies', { query: { limit: '200' } }),
  ]);
  const companyName = new Map(
    pickList(compResp, 'companies').map((co) => [co.id, co.name]),
  );
  return pickList(projResp, 'credosTimeProjects').map((p) => {
    const client = p.companyId ? companyName.get(p.companyId) ?? null : null;
    // UX-5: поле name после пере-сида уже = «КОД · Клиент · Название».
    // Показываем его как есть, БЕЗ повторного префикса code/client (иначе дубль
    // «ОПИБ-2026-005 · … · ОПИБ-2026-005 · …»). code/client храним для фильтров.
    return {
      id: p.id,
      code: p.code ?? null,
      rawName: p.name,
      client,
      departmentId: p.departmentId ?? null,
      category: p.category ?? null,
      approvalRequired: p.approvalRequired ?? null,
      name: p.name,
    };
  });
};

type RawWorkType = {
  id: string;
  name: string;
  group?: string | null;
  departmentId?: string | null;
};

export const fetchWorkTypes = async (): Promise<WorkTypeRef[]> => {
  const resp = await client().get<ListResp<RawWorkType>>('/rest/credosTimeWorkTypes', {
    query: { limit: '200', orderBy: 'name[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeWorkTypes').map((w) => ({
    id: w.id,
    name: w.name,
    group: w.group ?? null,
    departmentId: w.departmentId ?? null,
  }));
};

type RawDepartment = { id: string; name: string; approvalRequired?: boolean | null };

export const fetchDepartments = async (): Promise<DepartmentRef[]> => {
  const resp = await client().get<ListResp<RawDepartment>>('/rest/credosTimeDepartments', {
    query: { limit: '50' },
  });
  return pickList(resp, 'credosTimeDepartments').map((d) => ({
    id: d.id,
    name: d.name,
    approvalRequired: d.approvalRequired ?? null,
  }));
};

type RawEmployee = { id: string; name: string; departmentId?: string | null };

export const fetchEmployees = async (): Promise<EmployeeRef[]> => {
  const resp = await client().get<ListResp<RawEmployee>>('/rest/credosTimeEmployees', {
    query: { filter: 'active[eq]:true', limit: '200', orderBy: 'name[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeEmployees').map((e) => ({
    id: e.id,
    name: e.name,
    departmentId: e.departmentId ?? null,
  }));
};

export const fetchEntries = async (
  from: string,
  to: string,
  employeeId: string | null,
): Promise<ApiEntry[]> => {
  const filter = employeeId
    ? `date[gte]:${from},date[lte]:${to},employeeId[eq]:${employeeId}`
    : `date[gte]:${from},date[lte]:${to}`;
  const resp = await client().get<ListResp<ApiEntry>>('/rest/credosTimeEntries', {
    query: { filter, limit: '500', orderBy: 'date[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeEntries');
};

export type UpsertInput = {
  id?: string;
  date: string; // YYYY-MM-DD
  hours: number;
  projectId: string;
  workTypeId: string;
  employeeId: string;
  description?: string;
  // CISO-012: ref для серверного резолва сотрудника в /s/time-entry. Null →
  // роут уходит в DEV-fallback (первый активный) — эквивалент прямого пути.
  workspaceMemberRef?: string | null;
};

// Результат мутации: серверный гард мог отклонить операцию (ERROR) или вернуть
// несблокирующие предупреждения (WARNING). ok=false + error → откат UI + тост.
export type MutationResult = {
  ok: boolean;
  // Машинный код серверной ошибки ('cannot_modify_approved' | 'hours out of range' | …).
  error?: string;
  // Структурный блокирующий finding из validateEntry (если ERROR по часам).
  validation?: ValidationFinding;
  // Несблокирующие предупреждения (переработка) — показать плашкой.
  warnings?: ValidationFinding[];
};

// Ответ /s/time-entry (контракт time-entry-api.logic.ts).
type TimeEntryRouteResp = {
  ok?: boolean;
  error?: string;
  validation?: ValidationFinding;
  warnings?: ValidationFinding[];
};

// CISO-012: запись через серверную logic-функцию. true → роут отработал (ok|error
// от сервера в result). null → /s/ недоступна (сеть/404) — вызывающий делает fallback.
const sendViaRoute = async (
  body: Record<string, unknown>,
): Promise<MutationResult | null> => {
  try {
    const resp = await client().post<TimeEntryRouteResp>('/s/time-entry', body);
    return {
      ok: resp?.ok === true,
      error: resp?.error,
      validation: resp?.validation,
      warnings: resp?.warnings,
    };
  } catch {
    return null; // роут недоступен — уходим в прямой REST-фоллбэк
  }
};

export const upsertEntry = async (input: UpsertInput): Promise<MutationResult> => {
  // Дата в формате DATE_TIME (фикс. час 10:00 UTC — день стабилен в любом TZ).
  const date = `${input.date}T10:00:00.000Z`;
  const route = await sendViaRoute({
    op: 'upsert',
    ...(input.id ? { id: input.id } : {}),
    date,
    hours: input.hours,
    projectId: input.projectId,
    workTypeId: input.workTypeId,
    description: input.description ?? null,
    ...(input.workspaceMemberRef ? { workspaceMemberRef: input.workspaceMemberRef } : {}),
  });
  if (route) return route;

  // Fallback: /s/ недоступна — прямой REST (без серверных гардов).
  const c = client();
  const data = {
    date,
    hours: input.hours,
    employeeId: input.employeeId,
    projectId: input.projectId,
    workTypeId: input.workTypeId,
    description: input.description ?? null,
  };
  if (input.id) await c.patch(`/rest/credosTimeEntries/${input.id}`, data);
  else await c.post('/rest/credosTimeEntries', data);
  return { ok: true };
};

export const deleteEntry = async (
  id: string,
  workspaceMemberRef?: string | null,
): Promise<MutationResult> => {
  const route = await sendViaRoute({
    op: 'delete',
    id,
    ...(workspaceMemberRef ? { workspaceMemberRef } : {}),
  });
  if (route) return route;
  // Fallback: /s/ недоступна — прямой REST DELETE (без lock-approved гарда).
  await client().delete(`/rest/credosTimeEntries/${id}`);
  return { ok: true };
};
