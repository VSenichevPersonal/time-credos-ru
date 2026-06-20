import { useEffect, useState } from 'react';

import { fetchReports } from 'src/front-components/reports/reports-rest';
import type { ProjectRow } from 'src/front-components/reports/report-types';

type State = {
  loading: boolean;
  error: string | null;
  row: ProjectRow | null; // строка byProject текущего проекта
};

const EMPTY: State = { loading: false, error: null, row: null };

// Бюджет проекта: план (plannedEffort) vs факт (Σ часов) из /s/reports byProject.
// Период — весь (без границ): для бюджета важна накопленная выработка проекта.
export const useProjectBudget = (projectId: string | null): State => {
  const [state, setState] = useState<State>({ ...EMPTY, loading: true });

  useEffect(() => {
    if (!projectId) {
      setState(EMPTY);
      return;
    }
    let alive = true;
    setState({ ...EMPTY, loading: true });
    // groupBy 'project' — приоритет среза; границы не задаём (весь период).
    fetchReports('1970-01-01T00:00:00.000Z', '2999-12-31T23:59:59.999Z', 'project')
      .then((data) => {
        if (!alive) return;
        if (!data.ok) {
          setState({ ...EMPTY, error: data.error ?? 'Не удалось загрузить бюджет' });
          return;
        }
        const row = data.byProject.find((p) => p.key === projectId) ?? null;
        setState({ loading: false, error: null, row });
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
