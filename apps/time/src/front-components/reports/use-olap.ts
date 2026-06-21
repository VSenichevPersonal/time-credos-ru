import { useCallback, useEffect, useState } from 'react';

import { fetchOlap } from 'src/front-components/reports/olap-rest';
import type { OlapDim, OlapFilter, OlapResponse } from 'src/front-components/reports/olap-types';

type State = {
  loading: boolean;
  error: string | null;
  data: OlapResponse | null;
};

// Загрузка OLAP-среза под выбранный период + ось (groupBy) + накопленные фильтры
// drill (cross-filter, AND). Перезапрос при смене любого аргумента. reload() —
// ручной повтор (кнопка «Повторить»). filtersKey стабилизирует массив в deps.
export const useOlap = (
  from: string,
  to: string,
  groupBy: OlapDim,
  filters: OlapFilter[],
  enabled: boolean,
): State & { reload: () => void } => {
  const [state, setState] = useState<State>({ loading: enabled, error: null, data: null });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const filtersKey = filters.map((f) => `${f.dim}=${f.value}`).join('&');

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchOlap(from, to, groupBy, filters)
      .then((data) => {
        if (!alive) return;
        if (!data.ok) {
          setState({ loading: false, error: data.error ?? 'Не удалось загрузить срез', data: null });
          return;
        }
        setState({ loading: false, error: null, data });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({ loading: false, error: e instanceof Error ? e.message : 'Ошибка загрузки', data: null });
      });
    return () => {
      alive = false;
    };
    // filtersKey покрывает содержимое filters; from/to/groupBy/enabled/nonce — остальное.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, groupBy, filtersKey, enabled, nonce]);

  return { ...state, reload };
};
