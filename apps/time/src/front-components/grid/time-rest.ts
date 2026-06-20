import { RestApiClient } from 'twenty-client-sdk/rest';

import type { ApiEntry, Ref } from 'src/front-components/grid/types';

// Прямой доступ к Core REST воркспейса из песочницы front-компонента.
// Токен приложения (роль с read/update на credosTime*) инжектится в воркер.
// Серверные /s/-logic-функции на dev-сервере отключены (LOGIC_FUNCTION_TYPE),
// поэтому CRUD идёт напрямую по /rest/* — права те же (роль приложения).

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

export const fetchProjects = async (): Promise<Ref[]> => {
  const resp = await client().get<ListResp<{ id: string; name: string; code?: string }>>(
    '/rest/credosTimeProjects',
    { query: { filter: 'status[eq]:ACTIVE', limit: '200', orderBy: 'code[AscNullsFirst]' } },
  );
  return pickList(resp, 'credosTimeProjects').map((p) => ({
    id: p.id,
    name: p.code ? `${p.code} — ${p.name}` : p.name,
  }));
};

export const fetchWorkTypes = async (): Promise<Ref[]> => {
  const resp = await client().get<ListResp<Ref>>('/rest/credosTimeWorkTypes', {
    query: { limit: '200' },
  });
  return pickList(resp, 'credosTimeWorkTypes').map((w) => ({ id: w.id, name: w.name }));
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
    query: { filter, limit: '200', orderBy: 'date[AscNullsFirst]' },
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
  if (input.id) {
    await c.patch(`/rest/credosTimeEntries/${input.id}`, data);
  } else {
    await c.post('/rest/credosTimeEntries', data);
  }
};

export const deleteEntry = async (id: string): Promise<void> => {
  await client().delete(`/rest/credosTimeEntries/${id}`);
};
