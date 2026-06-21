import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  ProjectsPlanFactResponse,
} from 'src/front-components/reports/report-types';

// Вызов отчёта «Проекты — план/факт/остаток» из песочницы виджета (POST /s/reports,
// как reports-rest/olap-rest). Бэк (computeProjectsPlanFact) считает по каждому
// проекту план (plannedEffort), факт (Σ часов за период), остаток и флаг перерасхода;
// rows уже отсортированы (перерасход → факт убыв.). Часы, без денег.

const client = () => new RestApiClient();

const EMPTY = (
  from: string,
  to: string,
  error?: string,
): ProjectsPlanFactResponse => ({
  ok: false,
  period: { from, to },
  totals: { planned: 0, fact: 0, remaining: 0, overrunCount: 0 },
  count: 0,
  rows: [],
  error,
});

// Опц. фильтры: status (UPPER_CASE SELECT), departmentId. Период [from,to] — ISO.
export type ProjectsPlanFactParams = {
  status?: string | null;
  departmentId?: string | null;
};

export const fetchProjectsPlanFact = async (
  from: string,
  to: string,
  params: ProjectsPlanFactParams = {},
): Promise<ProjectsPlanFactResponse> => {
  try {
    const resp = await client().post<ProjectsPlanFactResponse>('/s/reports', {
      from,
      to,
      groupBy: 'projects-plan-fact',
      ...(params.status ? { status: params.status } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
    });
    if (!resp?.ok) return EMPTY(from, to, resp?.error ?? 'Сервис отчётов недоступен');
    // Защита от ответа без rows (иная форма) — UI делает rows.map.
    return {
      ...resp,
      rows: resp.rows ?? [],
      totals: resp.totals ?? { planned: 0, fact: 0, remaining: 0, overrunCount: 0 },
      count: resp.count ?? (resp.rows ?? []).length,
    };
  } catch (e) {
    return EMPTY(from, to, e instanceof Error ? e.message : 'Ошибка загрузки отчёта');
  }
};
