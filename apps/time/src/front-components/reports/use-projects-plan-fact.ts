import { useCallback, useEffect, useState } from 'react';

import {
  fetchProjectsPlanFact,
  type ProjectsPlanFactParams,
} from 'src/front-components/reports/projects-plan-fact-rest';
import type { ProjectsPlanFactResponse } from 'src/front-components/reports/report-types';

type State = {
  loading: boolean;
  error: string | null;
  data: ProjectsPlanFactResponse | null;
};

// Загрузка отчёта «Проекты — план/факт/остаток» под период + опц. фильтр статуса.
// Перезапрос при смене аргументов. reload() — ручной повтор (кнопка «Повторить»).
export const useProjectsPlanFact = (
  from: string,
  to: string,
  status: string | null,
): State & { reload: () => void } => {
  const [state, setState] = useState<State>({ loading: true, error: null, data: null });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    const params: ProjectsPlanFactParams = { status: status ?? null };
    fetchProjectsPlanFact(from, to, params)
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
  }, [from, to, status, nonce]);

  return { ...state, reload };
};
