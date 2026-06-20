import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  ApiEntry,
  EmployeeRef,
  ProjectRef,
  Ref,
  WorkTypeRef,
} from 'src/front-components/grid/types';

// Прямой доступ к Core REST воркспейса из песочницы front-компонента.
// Токен приложения (роль с read/update на credosTime*) инжектится в воркер.
// Серверные /s/-logic-функции на dev-сервере отключены, поэтому CRUD идёт
// напрямую по /rest/* — права те же (роль приложения).

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
    const parts = [p.code, client, p.name].filter(Boolean);
    return {
      id: p.id,
      code: p.code ?? null,
      rawName: p.name,
      client,
      departmentId: p.departmentId ?? null,
      category: p.category ?? null,
      name: parts.join(' · '),
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

export const fetchDepartments = async (): Promise<Ref[]> => {
  const resp = await client().get<ListResp<Ref>>('/rest/credosTimeDepartments', {
    query: { limit: '50' },
  });
  return pickList(resp, 'credosTimeDepartments').map((d) => ({ id: d.id, name: d.name }));
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
};

export const upsertEntry = async (input: UpsertInput): Promise<void> => {
  const c = client();
  const data = {
    date: `${input.date}T10:00:00.000Z`,
    hours: input.hours,
    employeeId: input.employeeId,
    projectId: input.projectId,
    workTypeId: input.workTypeId,
    description: input.description ?? null,
  };
  if (input.id) await c.patch(`/rest/credosTimeEntries/${input.id}`, data);
  else await c.post('/rest/credosTimeEntries', data);
};

export const deleteEntry = async (id: string): Promise<void> => {
  await client().delete(`/rest/credosTimeEntries/${id}`);
};
