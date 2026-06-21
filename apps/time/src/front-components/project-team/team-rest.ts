import { RestApiClient } from 'twenty-client-sdk/rest';

import type { EmployeeProject, TeamMember } from 'src/front-components/project-team/types';

// Доступ из песочницы виджета. ОСНОВНОЙ путь — серверный агрегат /s/project-team
// (PII-redaction по revealEmployeeNames + курсор-пагинация на сервере). Прямой
// REST (fetchProjectEntries/fetchEmployees) оставлен для тестов/fallback.

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

// Серверный агрегат «Команда проекта» (REQ-0016). Контракт Dev2: POST /s/project-team
// {mode:'team', projectId} → {ok, total, members:[{employeeId, name, deptCode,
// totalHours, entryCount, lastDate, share}]}. ФИО при reveal, иначе КОД (CISO-007).
type RawTeamMember = {
  employeeId: string;
  name: string;
  deptCode?: string | null;
  totalHours: number;
  entryCount: number;
  lastDate: string | null;
  share: number | null;
};
type TeamResp = { ok?: boolean; total?: number; members?: RawTeamMember[]; error?: string };

export type ProjectTeamResult = { members: TeamMember[]; total: number };

export const fetchProjectTeam = async (projectId: string): Promise<ProjectTeamResult> => {
  const resp = await client().post<TeamResp>('/s/project-team', {
    mode: 'team',
    projectId,
  });
  if (!resp?.ok) throw new Error(resp?.error ?? 'Сервис команды недоступен');
  const members: TeamMember[] = (resp.members ?? []).map((m) => ({
    employeeId: m.employeeId,
    name: m.name || '—',
    hours: m.totalHours,
    entries: m.entryCount,
    lastDate: m.lastDate,
    share: m.share ?? 0,
  }));
  return { members, total: resp.total ?? 0 };
};

// #5-часть2: проекты сотрудника. POST /s/project-team {mode:'employee-projects',
// employeeId} → {ok, total, projects:[{projectId,name,code,totalHours,entryCount,
// lastDate,share}]}. Имя проекта — не ПДн. Сортировка по часам убыв. (сервер).
type RawEmpProject = {
  projectId: string;
  name: string;
  code?: string | null;
  totalHours: number;
  entryCount: number;
  lastDate: string | null;
  share: number | null;
};
type EmpProjectsResp = { ok?: boolean; total?: number; projects?: RawEmpProject[]; error?: string };

export type EmployeeProjectsResult = { projects: EmployeeProject[]; total: number };

export const fetchEmployeeProjects = async (employeeId: string): Promise<EmployeeProjectsResult> => {
  const resp = await client().post<EmpProjectsResp>('/s/project-team', {
    mode: 'employee-projects',
    employeeId,
  });
  if (!resp?.ok) throw new Error(resp?.error ?? 'Сервис проектов сотрудника недоступен');
  const projects: EmployeeProject[] = (resp.projects ?? []).map((p) => ({
    projectId: p.projectId,
    name: p.name || '—',
    code: p.code ?? null,
    hours: p.totalHours,
    entries: p.entryCount,
    lastDate: p.lastDate,
    share: p.share ?? 0,
  }));
  return { projects, total: resp.total ?? 0 };
};

export type RawEntry = {
  hours?: number | null;
  date?: string | null;
  employeeId?: string | null;
};

// Все записи трудозатрат проекта (для агрегата по сотрудникам).
export const fetchProjectEntries = async (projectId: string): Promise<RawEntry[]> => {
  const resp = await client().get<ListResp<RawEntry>>('/rest/credosTimeEntries', {
    query: {
      filter: `projectId[eq]:${projectId}`,
      limit: '500',
      orderBy: 'date[DescNullsLast]',
    },
  });
  return pickList(resp, 'credosTimeEntries');
};

export type RawEmployee = { id: string; name: string };

export const fetchEmployees = async (): Promise<RawEmployee[]> => {
  const resp = await client().get<ListResp<RawEmployee>>('/rest/credosTimeEmployees', {
    query: { limit: '300', orderBy: 'name[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeEmployees');
};
