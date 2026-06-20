import { useEffect, useState } from 'react';

import { fetchEmployees, fetchProjectEntries } from 'src/front-components/project-team/team-rest';
import type { TeamMember } from 'src/front-components/project-team/types';

type State = {
  loading: boolean;
  error: string | null;
  members: TeamMember[];
  total: number; // суммарно часов по проекту
};

const EMPTY: State = { loading: false, error: null, members: [], total: 0 };

// Команда проекта: записи трудозатрат → агрегат по сотруднику (часы, записи,
// последняя дата, доля). Сортировка по часам убыв.
export const useProjectTeam = (projectId: string | null): State => {
  const [state, setState] = useState<State>({ ...EMPTY, loading: true });

  useEffect(() => {
    if (!projectId) {
      setState(EMPTY);
      return;
    }
    let alive = true;
    setState({ ...EMPTY, loading: true });
    Promise.all([fetchProjectEntries(projectId), fetchEmployees()])
      .then(([entries, employees]) => {
        if (!alive) return;
        const nameById = new Map(employees.map((e) => [e.id, e.name]));
        const agg = new Map<string, { hours: number; entries: number; lastDate: string | null }>();
        for (const e of entries) {
          const id = e.employeeId;
          if (!id) continue;
          const cur = agg.get(id) ?? { hours: 0, entries: 0, lastDate: null };
          cur.hours += e.hours ?? 0;
          cur.entries += 1;
          const d = e.date ? e.date.slice(0, 10) : null;
          if (d && (!cur.lastDate || d > cur.lastDate)) cur.lastDate = d;
          agg.set(id, cur);
        }
        const total = [...agg.values()].reduce((s, a) => s + a.hours, 0);
        const members: TeamMember[] = [...agg.entries()]
          .map(([employeeId, a]) => ({
            employeeId,
            name: nameById.get(employeeId) ?? '—',
            hours: a.hours,
            entries: a.entries,
            lastDate: a.lastDate,
            share: total > 0 ? a.hours / total : 0,
          }))
          .sort((x, y) => y.hours - x.hours);
        setState({ loading: false, error: null, members, total });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({ ...EMPTY, error: e instanceof Error ? e.message : 'Ошибка загрузки' });
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  return state;
};
