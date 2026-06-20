import { RestApiClient } from 'twenty-client-sdk/rest';

import type { ProjectSummary } from 'src/front-components/project-summary/types';

// Сводка проекта: проект (план/категория/статус/даты) + агрегат записей (факт/
// команда/последняя) + число этапов. Всё по projectId из record-контекста.

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
type OneResp<T> = { data?: Record<string, T> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

type RawProject = {
  code?: string | null;
  name?: string | null;
  category?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  plannedEffort?: number | null;
};
type RawEntry = { hours?: number | null; date?: string | null; employeeId?: string | null };
type RawStage = { id: string };

export const fetchProjectSummary = async (projectId: string): Promise<ProjectSummary> => {
  const c = client();
  const [projResp, entriesResp, stagesResp] = await Promise.all([
    c.get<OneResp<RawProject>>(`/rest/credosTimeProjects/${projectId}`),
    c.get<ListResp<RawEntry>>('/rest/credosTimeEntries', {
      query: { filter: `projectId[eq]:${projectId}`, limit: '500', orderBy: 'date[DescNullsLast]' },
    }),
    c.get<ListResp<RawStage>>('/rest/credosTimeStages', {
      query: { filter: `projectId[eq]:${projectId}`, limit: '200' },
    }),
  ]);

  const p = projResp.data?.credosTimeProject ?? {};
  const entries = pickList(entriesResp, 'credosTimeEntries');

  let fact = 0;
  let lastDate: string | null = null;
  const team = new Set<string>();
  for (const e of entries) {
    fact += e.hours ?? 0;
    if (e.employeeId) team.add(e.employeeId);
    const d = e.date ? e.date.slice(0, 10) : null;
    if (d && (!lastDate || d > lastDate)) lastDate = d;
  }

  return {
    code: p.code ?? null,
    name: p.name ?? '',
    category: p.category ?? null,
    status: p.status ?? null,
    startDate: p.startDate ? p.startDate.slice(0, 10) : null,
    endDate: p.endDate ? p.endDate.slice(0, 10) : null,
    plannedEffort: p.plannedEffort ?? null,
    fact,
    team: team.size,
    entries: entries.length,
    stages: pickList(stagesResp, 'credosTimeStages').length,
    lastDate,
  };
};
