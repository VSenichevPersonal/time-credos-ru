import { useEffect, useState } from 'react';

import { fetchEntries } from 'src/front-components/grid/time-rest';
import type { ApiEntry } from 'src/front-components/grid/types';

// REQ-0014 «Мои периоды»: записи ТЕКУЩЕГО юзера за широкое окно (последние ~26
// недель) для группировки по неделям. Тянем напрямую через /rest (как сетка),
// фильтр employeeId — серверный (time-rest.fetchEntries). Без host-DOM.

type State = {
  loading: boolean;
  error: string | null;
  entries: ApiEntry[];
};

const WINDOW_DAYS = 182; // ~26 недель назад от сегодня

const windowRange = (): { from: string; to: string } => {
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - WINDOW_DAYS);
  from.setUTCHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
};

export const useMyEntries = (employeeId: string | null): State => {
  const [state, setState] = useState<State>({ loading: true, error: null, entries: [] });

  useEffect(() => {
    if (!employeeId) {
      setState({ loading: false, error: null, entries: [] });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    const { from, to } = windowRange();
    fetchEntries(from, to, employeeId)
      .then((entries) => {
        if (alive) setState({ loading: false, error: null, entries });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({
          loading: false,
          error: e instanceof Error ? e.message : 'Ошибка загрузки периодов',
          entries: [],
        });
      });
    return () => {
      alive = false;
    };
  }, [employeeId]);

  return state;
};
