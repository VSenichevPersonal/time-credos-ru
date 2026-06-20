import { useCallback, useEffect, useState } from 'react';

import { fetchTimeseries } from 'src/front-components/reports/trend-rest';
import type { TimeseriesResponse } from 'src/front-components/reports/trend-types';

type State = {
  loading: boolean;
  error: string | null;
  data: TimeseriesResponse | null;
};

// Загрузка /s/reports mode=timeseries под год+отдел. Перезапрос при смене аргументов.
// reload() — ручной повтор (кнопка «Повторить» при ошибке): bump nonce → useEffect.
export const useTrend = (
  from: string,
  to: string,
  departmentId: string | null,
): State & { reload: () => void } => {
  const [state, setState] = useState<State>({ loading: true, error: null, data: null });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchTimeseries(from, to, departmentId)
      .then((data) => {
        if (!alive) return;
        if (!data.ok) {
          setState({ loading: false, error: data.error ?? 'Не удалось загрузить тренд', data: null });
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
  }, [from, to, departmentId, nonce]);

  return { ...state, reload };
};
