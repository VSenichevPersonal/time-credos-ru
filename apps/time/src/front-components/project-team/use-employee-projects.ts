import { useEffect, useState } from 'react';

import { fetchEmployeeProjects } from 'src/front-components/project-team/team-rest';
import type { EmployeeProject } from 'src/front-components/project-team/types';

type State = {
  loading: boolean;
  error: string | null;
  projects: EmployeeProject[];
  total: number; // суммарно часов сотрудника
};

const EMPTY: State = { loading: false, error: null, projects: [], total: 0 };

// #5-часть2: проекты сотрудника — серверный агрегат /s/project-team (mode=
// employee-projects). Сортировка по часам убыв. (сервер). Песочница-safe (REST).
export const useEmployeeProjects = (employeeId: string | null): State => {
  const [state, setState] = useState<State>({ ...EMPTY, loading: true });

  useEffect(() => {
    if (!employeeId) {
      setState(EMPTY);
      return;
    }
    let alive = true;
    setState({ ...EMPTY, loading: true });
    fetchEmployeeProjects(employeeId)
      .then(({ projects, total }) => {
        if (alive) setState({ loading: false, error: null, projects, total });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({ ...EMPTY, error: e instanceof Error ? e.message : 'Ошибка загрузки' });
      });
    return () => {
      alive = false;
    };
  }, [employeeId]);

  return state;
};
