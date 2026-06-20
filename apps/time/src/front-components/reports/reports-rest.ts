import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  GroupBy,
  ReportsResponse,
} from 'src/front-components/reports/report-types';

// Вызов агрегатной аналитики /s/reports из песочницы виджета (POST, как /s/approval).
// Сервер считает все три среза (byDept/byProject/byEmployee); groupBy — подсказка.

const client = () => new RestApiClient();

const EMPTY = (
  from: string,
  to: string,
  error?: string,
): ReportsResponse => ({
  ok: false,
  period: { from, to },
  groupBy: null,
  totals: { key: 'total', name: '', fact: 0, client: 0, norm: null, util: null, under: null },
  byDept: [],
  byProject: [],
  byEmployee: [],
  error,
});

// Период [from, to] — ISO-границы (inclusive). groupBy — приоритетный срез.
export const fetchReports = async (
  from: string,
  to: string,
  groupBy: GroupBy,
): Promise<ReportsResponse> => {
  try {
    const resp = await client().post<ReportsResponse>('/s/reports', {
      from,
      to,
      groupBy,
    });
    if (!resp?.ok) return EMPTY(from, to, resp?.error ?? 'Сервис отчётов недоступен');
    return resp;
  } catch (e) {
    return EMPTY(from, to, e instanceof Error ? e.message : 'Ошибка загрузки отчёта');
  }
};
