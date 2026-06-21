import { useEffect, useState } from 'react';

import { fetchProjectTeam } from 'src/front-components/project-team/team-rest';
import type { TeamMember } from 'src/front-components/project-team/types';

type State = {
  loading: boolean;
  error: string | null;
  members: TeamMember[];
  total: number; // суммарно часов по проекту
};

const EMPTY: State = { loading: false, error: null, members: [], total: 0 };

// Команда проекта (#5): серверный агрегат /s/project-team — кто работал + часы/доля,
// сортировка по часам убыв., ФИО/КОД по reveal (CISO-007), пагинация на сервере.
// Заменил клиентскую агрегацию (limit:500 + ручной свод) — безопаснее, без обрезки.
export const useProjectTeam = (projectId: string | null): State => {
  const [state, setState] = useState<State>({ ...EMPTY, loading: true });

  useEffect(() => {
    if (!projectId) {
      setState(EMPTY);
      return;
    }
    let alive = true;
    setState({ ...EMPTY, loading: true });
    fetchProjectTeam(projectId)
      .then(({ members, total }) => {
        if (!alive) return;
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
