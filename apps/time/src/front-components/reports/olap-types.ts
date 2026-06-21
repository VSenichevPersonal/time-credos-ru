import type { CategoryShare } from 'src/front-components/reports/report-types';

// Контракт параметрического OLAP-среза /s/reports (mode=olap). Бэкенд: computeOlap
// (logic-functions/reports-calc.ts). Фронт шлёт groupBy + filters[] (AND cross-
// filter), получает строки текущего среза + список осей, в которые можно провалиться.

// Оси OLAP (= OlapDimension бэкенда). 'stage' бэк поддерживает, но в UI пока не
// показываем (нет справочника этапов на фронте) — держим в типе для совместимости.
export type OlapDim =
  | 'dept'
  | 'employee'
  | 'project'
  | 'workType'
  | 'category'
  | 'stage'
  | 'workTypeGroup';

export type OlapFilter = { dim: OlapDim; value: string };

// Строка среза: метрики (как ReportRow) + drillable — оси, доступные для
// следующего уровня (бэк уже исключил текущую ось и применённые фильтры).
export type OlapRow = {
  key: string;
  name: string;
  fact: number;
  client: number;
  norm: number | null;
  util: number | null;
  under: number | null;
  byCategory: CategoryShare[];
  drillable: OlapDim[];
};

export type AppliedFilter = { dim: OlapDim; value: string; label: string };

export type OlapResponse = {
  ok: boolean;
  period: { from: string; to: string };
  groupBy: OlapDim;
  appliedFilters: AppliedFilter[];
  totals: Omit<OlapRow, 'drillable'>;
  rows: OlapRow[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  availableDims: OlapDim[];
  error?: string;
};
