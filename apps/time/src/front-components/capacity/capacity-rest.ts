import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  Absence,
  CalendarDay,
  CapProject,
  DeptPlan,
  DeptRef,
  EmployeeRef,
  ProjectDeptShare,
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
  capacityFactor?: number | null;
};

// headcount (численность) — НЕ ручное поле credosTimeDepartment.headcount, а
// ВЫЧИСЛЯЕМОЕ значение: число активных сотрудников отдела (count credosTimeEmployee
// where department=X, active=true). Поэтому fetchDepartments параллельно считает
// активных сотрудников и подставляет их количество в headcount каждого отдела.
// REQ-0011 (FTE-взвешивание) — отдельная задача, тут простой count.
export const fetchDepartments = async (): Promise<DeptRef[]> => {
  const c = client();
  const [deptResp, headcountByDept] = await Promise.all([
    c.get<ListResp<RawDept>>('/rest/credosTimeDepartments', {
      query: { limit: '50', orderBy: 'name[AscNullsFirst]' },
    }),
    activeHeadcountByDept(c),
  ]);
  return pickList(deptResp, 'credosTimeDepartments').map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code ?? null,
    headcount: headcountByDept.get(d.id) ?? 0,
    capacityFactor: d.capacityFactor ?? 0.8,
  }));
};

type RawActiveEmp = { id: string; departmentId?: string | null };

// Вычисляемый headcount: число активных сотрудников по отделам (с пагинацией Core
// REST: max 60 записей/страницу, иначе крупные отделы недосчитаются).
const activeHeadcountByDept = async (
  c: RestApiClient,
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  let cursor: string | null = null;
  for (let i = 0; i < 500; i++) {
    const query: Record<string, string> = { filter: 'active[eq]:true', limit: '60' };
    if (cursor) query.starting_after = cursor;
    const resp = await c.get<
      ListResp<RawActiveEmp> & {
        data: { pageInfo?: { hasNextPage?: boolean; endCursor?: string } };
        pageInfo?: { hasNextPage?: boolean; endCursor?: string };
      }
    >('/rest/credosTimeEmployees', { query });
    const recs = pickList(resp, 'credosTimeEmployees');
    for (const e of recs) {
      if (e.departmentId) counts.set(e.departmentId, (counts.get(e.departmentId) ?? 0) + 1);
    }
    const pi = resp.pageInfo ?? resp.data?.pageInfo;
    if (!pi?.hasNextPage || recs.length === 0 || !pi.endCursor) break;
    cursor = pi.endCursor;
  }
  return counts;
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

type RawProjectDeptShare = {
  projectId?: string | null;
  departmentId?: string | null;
  plannedEffortShare?: number | null;
};

// REQ-0013 13b: доли участия отделов в проектах (project × department × часы).
// Раскид загрузки на доске идёт по этим долям (с fallback на целый plannedEffort
// проекта, если у проекта НЕТ ни одной доли). Берём за весь горизонт — даты у
// доли нет, период раскида определяет проект; фильтра по дате тут не нужно.
export const fetchProjectDeptShares = async (): Promise<ProjectDeptShare[]> => {
  const resp = await client().get<ListResp<RawProjectDeptShare>>(
    '/rest/credosTimeProjectDepartments',
    { query: { limit: '300', orderBy: 'createdAt[AscNullsFirst]' } },
  );
  return pickList(resp, 'credosTimeProjectDepartments').map((s) => ({
    projectId: s.projectId ?? null,
    departmentId: s.departmentId ?? null,
    plannedEffortShare: s.plannedEffortShare ?? null,
  }));
};

type RawDeptPlan = {
  id: string;
  label?: string | null;
  departmentId?: string | null;
  category?: string | null;
  plannedEffort?: number | null;
  startDate?: string | null;
  endDate?: string | null;
};

// REQ-0012: плановые загрузки отдела БЕЗ проекта (резерв/пресейл-бронь/прочее).
// Суммируются к загрузке отдела на доске наравне с проектами.
export const fetchDeptPlans = async (): Promise<DeptPlan[]> => {
  const resp = await client().get<ListResp<RawDeptPlan>>(
    '/rest/credosTimeDeptPlans',
    { query: { limit: '300', orderBy: 'startDate[AscNullsFirst]' } },
  );
  return pickList(resp, 'credosTimeDeptPlans').map((d) => ({
    id: d.id,
    label: d.label ?? '',
    departmentId: d.departmentId ?? null,
    category: d.category ?? null,
    plannedEffort: d.plannedEffort ?? null,
    startDate: d.startDate ?? null,
    endDate: d.endDate ?? null,
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

// @deprecated A2: резолв роли перенесён в shared/use-self-employee.ts (useUserId →
// workspaceMember → employee.isManager, реальный текущий юзер). useCapacity больше
// не вызывает эту функцию. Оставлена с тестами как справочная; fallback
// «существует хоть один менеджер» давал ложный true всем — не использовать.
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
    query: { filter: 'isManager[eq]:true', limit: '1' },
  });
  return pickList(any, 'credosTimeEmployees').length > 0;
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

// REQ-0012: правка плановой загрузки отдела без проекта (credosTimeDeptPlan).
// Поля те же, что у проекта (plannedEffort/start/end) — переиспользуем ProjectPatch.
export const patchDeptPlan = async (id: string, patch: ProjectPatch): Promise<void> => {
  const data: Record<string, unknown> = {};
  if ('plannedEffort' in patch) data.plannedEffort = patch.plannedEffort;
  if ('startDate' in patch) data.startDate = toIso(patch.startDate ?? null);
  if ('endDate' in patch) data.endDate = toIso(patch.endDate ?? null);
  await client().patch(`/rest/credosTimeDeptPlans/${id}`, data);
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

type RawAbsence = {
  employeeId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

// W3-1: отсутствия (отпуск/больничный/...) сотрудников, пересекающие горизонт
// доски [from, to]. Пересечение: endDate >= from И startDate <= to (DATE_TIME →
// сравнение строкой ISO работает по дню). Уменьшают ёмкость на доске (calc-load).
export const fetchAbsences = async (
  from: string,
  to: string,
): Promise<Absence[]> => {
  const resp = await client().get<ListResp<RawAbsence>>('/rest/credosTimeAbsences', {
    query: {
      filter: `endDate[gte]:${from},startDate[lte]:${to}`,
      limit: '400',
      orderBy: 'startDate[AscNullsFirst]',
    },
  });
  return pickList(resp, 'credosTimeAbsences').map((a) => ({
    employeeId: a.employeeId ?? null,
    startDate: a.startDate ?? null,
    endDate: a.endDate ?? null,
  }));
};
