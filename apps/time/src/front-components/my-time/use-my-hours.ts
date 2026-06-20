import { useEffect, useState } from 'react';

import { fetchEntries, fetchProjects } from 'src/front-components/grid/time-rest';
import type { ApiEntry, ProjectRef } from 'src/front-components/grid/types';

// REQ-0014 «Мои часы»: записи юзера за выбранный период + имена проектов для
// разбивки «по проектам». Норма/недогруз/утилизацию даёт /s/reports byEmployee
// (см. my-hours.tsx) — здесь только проектный состав факта. Без host-DOM.

export type ProjectHours = {
  projectId: string;
  name: string;
  hours: number; // Σ часов по проекту (2 знака)
};

type State = {
  loading: boolean;
  error: string | null;
  byProject: ProjectHours[];
  total: number;
};

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export const buildProjectHours = (
  entries: ReadonlyArray<ApiEntry>,
  projects: ReadonlyArray<ProjectRef>,
): ProjectHours[] => {
  const nameById = new Map(projects.map((p) => [p.id, p.name]));
  const byId = new Map<string, number>();
  for (const e of entries) {
    if (!e.projectId) continue;
    byId.set(e.projectId, (byId.get(e.projectId) ?? 0) + (typeof e.hours === 'number' ? e.hours : 0));
  }
  return [...byId.entries()]
    .map(([projectId, hours]) => ({
      projectId,
      name: nameById.get(projectId) ?? 'Проект без названия',
      hours: round2(hours),
    }))
    .sort((a, b) => b.hours - a.hours);
};

export const useMyHours = (
  employeeId: string | null,
  from: string,
  to: string,
): State => {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    byProject: [],
    total: 0,
  });

  useEffect(() => {
    if (!employeeId) {
      setState({ loading: false, error: null, byProject: [], total: 0 });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([fetchEntries(from, to, employeeId), fetchProjects()])
      .then(([entries, projects]) => {
        if (!alive) return;
        const byProject = buildProjectHours(entries, projects);
        const total = round2(byProject.reduce((s, p) => s + p.hours, 0));
        setState({ loading: false, error: null, byProject, total });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({
          loading: false,
          error: e instanceof Error ? e.message : 'Ошибка загрузки часов',
          byProject: [],
          total: 0,
        });
      });
    return () => {
      alive = false;
    };
  }, [employeeId, from, to]);

  return state;
};
