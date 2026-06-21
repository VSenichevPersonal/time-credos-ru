import { T } from 'src/front-components/reports/report-tokens';
import { Center } from 'src/front-components/grid/center';
import { BreakdownTable } from 'src/front-components/reports/breakdown-table';
import { Breadcrumbs } from 'src/front-components/shared/breadcrumbs';
import { ErrorState } from 'src/front-components/shared/error-state';
import { FilterPills } from 'src/front-components/reports/filter-pills';
import { dimLabel, valueLabel } from 'src/front-components/reports/drill-axis';
import { categoryMeta } from 'src/front-components/shared/category-meta';
import type { DrillLevel } from 'src/front-components/shared/use-drill';
import type { GroupBy, ReportRow } from 'src/front-components/reports/report-types';
import type { OlapDim, OlapResponse, OlapRow } from 'src/front-components/reports/olap-types';

// Дочерний срез drill (полный OLAP): крошки + cross-filter-пилюли + таблица среза
// childAxis. Строки несут drillable — провал идёт дальше (project→employee→…).
// Корневой срез остаётся в дашборде (3-срезовый KPI-ответ); сюда — только drill.

// childAxis → GroupBy для формы таблицы (project/employee имеют спец-вид; прочие
// оси рендерятся как «отдел» — общий вид с баром факт/норма).
const axisToGroupBy = (axis: OlapDim): GroupBy =>
  axis === 'project' ? 'project' : axis === 'employee' ? 'employee' : 'dept';

type Props = {
  rootAxis: OlapDim;
  childAxis: OlapDim;
  stack: DrillLevel[];
  loading: boolean;
  error: string | null;
  data: OlapResponse | null;
  onReload: () => void;
  onDrillRow: (row: ReportRow) => void;
  rowDrillable: (row: ReportRow) => boolean;
  onRoot: () => void;
  onLevel: (index: number) => void;
};

export const DrillView = ({
  rootAxis,
  childAxis,
  stack,
  loading,
  error,
  data,
  onReload,
  onDrillRow,
  rowDrillable,
  onRoot,
  onLevel,
}: Props) => {
  // Категория приходит UPPER_CASE-кодом — подменяем name на русский ярлык для показа
  // (ключ-фильтр value не трогаем). Остальные оси бэк прислал читаемо.
  const rows: ReportRow[] =
    data && childAxis === 'category'
      ? data.rows.map((r: OlapRow) => ({ ...r, name: categoryMeta(r.name).label }))
      : (data?.rows ?? []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '0 14px 8px' }}>
        <Breadcrumbs rootLabel={`Все: ${dimLabel(rootAxis).toLowerCase()}`} stack={stack} onRoot={onRoot} onLevel={onLevel} />
        <FilterPills
          filters={stack.map((l) => ({
            filter: { dim: l.dim as OlapDim, value: l.value },
            label: l.valueLabel ?? valueLabel(l.dim as OlapDim, l.value, l.label),
          }))}
          onRemove={(i) => onLevel(i)}
        />
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          margin: '0 14px 14px',
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          overflow: 'hidden',
          background: T.surface,
        }}
      >
        {error ? (
          <ErrorState title="Не удалось загрузить детализацию" detail={error} onRetry={onReload} />
        ) : loading || !data ? (
          <Center>Загрузка детализации…</Center>
        ) : (
          <BreakdownTable
            groupBy={axisToGroupBy(childAxis)}
            axisLabel={dimLabel(childAxis)}
            rows={rows}
            onDrill={onDrillRow}
            drillable={rowDrillable}
          />
        )}
      </div>
    </div>
  );
};
