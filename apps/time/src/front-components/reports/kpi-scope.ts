import type { ReportRow } from 'src/front-components/reports/report-types';
import type { OlapRow } from 'src/front-components/reports/olap-types';

// KPI-карточки при drill-down должны отражать ТЕКУЩИЙ скоуп (активные фильтры),
// а не глобал. fact/client/util уже scoped в olap totals (computeOlap суммирует
// только записи, прошедшие matchesFilters). Норму бэк в totals не отдаёт
// (norm=null: при факт-режущих фильтрах под-период неоднозначен) — реконструируем
// суммой norm строк среза. Норма есть только когда ось среза несёт её (dept/
// employee без факт-режущих фильтров) → строки имеют norm !== null. Иначе все
// строки norm=null → итог norm=null → карточка покажет «—» (корректно).
export const scopeKpiTotals = (
  totals: Omit<OlapRow, 'drillable'>,
  rows: Pick<OlapRow, 'norm'>[],
): ReportRow => {
  const rowNorms = rows.map((r) => r.norm).filter((n): n is number => n !== null);
  const norm =
    rowNorms.length > 0 ? Number(rowNorms.reduce((s, n) => s + n, 0).toFixed(2)) : null;
  const under = norm === null ? null : Number((norm - totals.fact).toFixed(2));
  return { ...totals, norm, under };
};
