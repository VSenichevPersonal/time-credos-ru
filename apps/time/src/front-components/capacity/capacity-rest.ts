import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  CalendarDay,
  CapProject,
  DeptRef,
  EmployeeRef,
  ProjectPatch,
} from 'src/front-components/capacity/types';

export type { ProjectPatch };

// Доступ к Core REST воркспейса из песочницы. Те же права, что у роли приложения.
// Читаем отделы (ёмкость), проекты (загрузка) и производственный календарь.

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

type RawDept = {
  id: string;
  name: string;
  code?: string | null;
  headcount?: number | null;
  capacityFactor?: number | null;
};

export const fetchDepartments = async (): Promise<DeptRef[]> => {
  const resp = await client().get<ListResp<RawDept>>('/rest/credosTimeDepartments', {
    query: { limit: '50', orderBy: 'name[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeDepartments').map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code ?? null,
    headcount: d.headcount ?? 0,
    capacityFactor: d.capacityFactor ?? 0.8,
  }));
};

type RawProject = {
  id: string;
  name: string;
  code?: string | null;
  departmentId?: string | null;
  plannedEffort?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
};

// Берём проекты, релевантные планированию (не завершённые/отменённые).
export const fetchProjects = async (): Promise<CapProject[]> => {
  const resp = await client().get<ListResp<RawProject>>('/rest/credosTimeProjects', {
    query: { limit: '300', orderBy: 'code[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeProjects').map((p) => ({
    id: p.id,
    code: p.code ?? null,
    name: p.name,
    departmentId: p.departmentId ?? null,
    plannedEffort: p.plannedEffort ?? null,
    startDate: p.startDate ?? null,
    endDate: p.endDate ?? null,
  }));
};

type RawEmployee = {
  id: string;
  name: string;
  departmentId?: string | null;
  active?: boolean | null;
};

// Активные сотрудники — для среза «по людям» доски планирования.
export const fetchEmployees = async (): Promise<EmployeeRef[]> => {
  const resp = await client().get<ListResp<RawEmployee>>('/rest/credosTimeEmployees', {
    query: {
      filter: 'active[eq]:true',
      limit: '300',
      orderBy: 'name[AscNullsFirst]',
    },
  });
  return pickList(resp, 'credosTimeEmployees').map((e) => ({
    id: e.id,
    name: e.name,
    departmentId: e.departmentId ?? null,
  }));
};

type RawSelf = { id: string; isManager?: boolean | null };

// Текущий сотрудник руководитель? Резолв по workspaceMemberRef (как в timesheet);
// на dev маппинг ref ещё не сопоставлен — fallback на первого активного, чтобы
// режим планирования был проверяем. Не падаем при пустом результате.
export const resolveSelfIsManager = async (
  workspaceMemberRef: string | null,
): Promise<boolean> => {
  const c = client();
  if (workspaceMemberRef) {
    const byRef = await c.get<ListResp<RawSelf>>('/rest/credosTimeEmployees', {
      query: { filter: `workspaceMemberRef[eq]:${workspaceMemberRef}`, limit: '1' },
    });
    const found = pickList(byRef, 'credosTimeEmployees')[0];
    if (found) return found.isManager === true;
  }
  const any = await c.get<ListResp<RawSelf>>('/rest/credosTimeEmployees', {
    query: { filter: 'active[eq]:true', limit: '1', orderBy: 'isManager[DescNullsLast]' },
  });
  return pickList(any, 'credosTimeEmployees')[0]?.isManager === true;
};

// Правка плана проекта руководителем. plannedEffort — FLOAT (часы), endDate/startDate
// — DATE_TIME (нужен ISO с временем). undefined-поля не трогаем.
const toIso = (date: string | null): string | null =>
  date ? `${date}T10:00:00.000Z` : null;

export const patchProject = async (id: string, patch: ProjectPatch): Promise<void> => {
  const data: Record<string, unknown> = {};
  if ('plannedEffort' in patch) data.plannedEffort = patch.plannedEffort;
  if ('startDate' in patch) data.startDate = toIso(patch.startDate ?? null);
  if ('endDate' in patch) data.endDate = toIso(patch.endDate ?? null);
  await client().patch(`/rest/credosTimeProjects/${id}`, data);
};

type RawDay = { date: string; hours?: number | null };

// Дни производственного календаря в диапазоне горизонта.
export const fetchCalendar = async (
  from: string,
  to: string,
): Promise<CalendarDay[]> => {
  const resp = await client().get<ListResp<RawDay>>(
    '/rest/credosTimeWorkdayCalendars',
    {
      query: {
        filter: `date[gte]:${from},date[lte]:${to}`,
        limit: '400',
        orderBy: 'date[AscNullsFirst]',
      },
    },
  );
  return pickList(resp, 'credosTimeWorkdayCalendars').map((d) => ({
    date: String(d.date).slice(0, 10),
    hours: d.hours ?? 0,
  }));
};
