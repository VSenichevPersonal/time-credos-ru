import { useEffect, useState } from 'react';

import { fetchReports } from 'src/front-components/reports/reports-rest';
import type {
  GroupBy,
  ReportsResponse,
} from 'src/front-components/reports/report-types';

type State = {
  loading: boolean;
  error: string | null;
  data: ReportsResponse | null;
};

// Загрузка /s/reports под выбранный период+срез. Перезапрос при смене аргументов.
export const useReports = (from: string, to: string, groupBy: GroupBy): State => {
  const [state, setState] = useState<State>({ loading: true, error: null, data: null });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchReports(from, to, groupBy)
      .then((data) => {
        if (!alive) return;
        if (!data.ok) {
          setState({ loading: false, error: data.error ?? 'Не удалось загрузить отчёт', data: null });
          return;
        }
        setState({ loading: false, error: null, data });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({
          loading: false,
          error: e instanceof Error ? e.message : 'Ошибка загрузки',
          data: null,
        });
      });
    return () => {
      alive = false;
    };
  }, [from, to, groupBy]);

  return state;
};
