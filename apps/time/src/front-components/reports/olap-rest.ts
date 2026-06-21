import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  OlapDim,
  OlapFilter,
  OlapResponse,
} from 'src/front-components/reports/olap-types';

// Вызов параметрического OLAP-среза /s/reports (mode=olap) из песочницы виджета.
// Бэкенд (computeOlap) считает строки среза groupBy с учётом filters[] (AND cross-
// filter) и отдаёт drillable[] — оси, в которые можно провалиться дальше. Фронт
// ничего не агрегирует: drill = re-query с новым groupBy и накопленными фильтрами.

const client = () => new RestApiClient();

const EMPTY = (
  from: string,
  to: string,
  groupBy: OlapDim,
  error?: string,
): OlapResponse => ({
  ok: false,
  period: { from, to },
  groupBy,
  appliedFilters: [],
  totals: { key: 'total', name: 'Итого', fact: 0, client: 0, norm: null, util: null, under: null, byCategory: [] },
  rows: [],
  pageInfo: { hasNextPage: false, endCursor: null },
  availableDims: [],
  error,
});

export const fetchOlap = async (
  from: string,
  to: string,
  groupBy: OlapDim,
  filters: OlapFilter[],
): Promise<OlapResponse> => {
  try {
    const resp = await client().post<OlapResponse>('/s/reports', {
      from,
      to,
      mode: 'olap',
      groupBy,
      filters,
    });
    if (!resp?.ok) return EMPTY(from, to, groupBy, resp?.error ?? 'Сервис отчётов недоступен');
    // Защита от ответа без rows/drillable (иная форма) — UI делает rows.map.
    return {
      ...resp,
      rows: (resp.rows ?? []).map((r) => ({ ...r, drillable: r.drillable ?? [] })),
      appliedFilters: resp.appliedFilters ?? [],
      availableDims: resp.availableDims ?? [],
    };
  } catch (e) {
    return EMPTY(from, to, groupBy, e instanceof Error ? e.message : 'Ошибка загрузки отчёта');
  }
};
