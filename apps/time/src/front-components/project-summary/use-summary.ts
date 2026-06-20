import { useEffect, useState } from 'react';

import { fetchProjectSummary } from 'src/front-components/project-summary/summary-rest';
import type { ProjectSummary } from 'src/front-components/project-summary/types';

type State = { loading: boolean; error: string | null; data: ProjectSummary | null };

export const useSummary = (projectId: string | null): State => {
  const [state, setState] = useState<State>({ loading: true, error: null, data: null });

  useEffect(() => {
    if (!projectId) {
      setState({ loading: false, error: null, data: null });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchProjectSummary(projectId)
      .then((data) => {
        if (alive) setState({ loading: false, error: null, data });
      })
      .catch((e: unknown) => {
        if (alive) {
          setState({ loading: false, error: e instanceof Error ? e.message : 'Ошибка загрузки', data: null });
        }
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  return state;
};
