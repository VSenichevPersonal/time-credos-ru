import { RestApiClient } from 'twenty-client-sdk/rest';

import type { TimeseriesResponse } from 'src/front-components/reports/trend-types';

// Вызов /s/reports mode=timeseries из песочницы виджета (POST, как fetchReports).
// Сервер раскладывает факт/норму по месяцам периода; ничего не пересчитываем.

const client = () => new RestApiClient();

const EMPTY = (from: string, to: string, error?: string): TimeseriesResponse => ({
  ok: false,
  period: { from, to },
  departmentId: null,
  months: [],
  error,
});

// Период [from, to] — ISO-границы (год целиком для тренда). departmentId — опц.
// фильтр отдела (id отдела = byDept[].key), null/'' → весь воркспейс.
export const fetchTimeseries = async (
  from: string,
  to: string,
  departmentId: string | null,
): Promise<TimeseriesResponse> => {
  try {
    const resp = await client().post<TimeseriesResponse>('/s/reports', {
      from,
      to,
      mode: 'timeseries',
      ...(departmentId ? { departmentId } : {}),
    });
    if (!resp?.ok) return EMPTY(from, to, resp?.error ?? 'Сервис тренда недоступен');
    // Защита от ответа без months (напр. иная форма) — UI делает months.map.
    return { ...resp, months: resp.months ?? [] };
  } catch (e) {
    return EMPTY(from, to, e instanceof Error ? e.message : 'Ошибка загрузки тренда');
  }
};
