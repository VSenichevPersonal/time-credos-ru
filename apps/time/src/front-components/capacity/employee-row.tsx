import { T, loadTone, formatCell, formatPct, avgRatio, SIGMA_W, gapTone, gapPct, gapIcon } from 'src/front-components/capacity/cap-tokens';
import { departmentLabel } from 'src/constants/labels';
import type {
  CellMetric,
  EmployeeRef,
  LoadCell,
  Period,
} from 'src/front-components/capacity/types';

// Строка сотрудника (срез «по людям»): имя + код отдела + ячейки личной ёмкости.
// Без раскрытия — лист дерева. Личная ёмкость из произв. календаря × коэф отдела.

type Props = {
  employee: EmployeeRef;
  deptCode: string | null;
  cells: LoadCell[];
  periods: Period[];
  nameWidth: number;
  metric: CellMetric;
};

export const EmployeeRow = ({
  employee,
  deptCode,
  cells,
  periods,
  nameWidth,
  metric,
}: Props) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
    <div
      style={{
        width: nameWidth,
        minWidth: nameWidth,
        padding: '0 12px',
        height: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 1,
        borderRight: `1px solid ${T.border}`,
        background: T.surface,
        position: 'sticky',
        left: 0,
        zIndex: 1,
      }}
    >
      <span
        title={employee.name}
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {employee.name}
      </span>
      <span style={{ fontSize: 10.5, color: T.textFaint, whiteSpace: 'nowrap' }}>
        {deptCode ? departmentLabel(deptCode, { short: true }) : 'без отдела'}
      </span>
    </div>

    {periods.map((p, i) => {
      const cell = cells[i];
      const isGap = metric === 'gap';
      const gp = isGap ? gapPct(cell) : null;
      const tone = isGap ? gapTone(gp) : loadTone(cell.ratio);
      const icon = isGap ? gapIcon(gp) : '';
      return (
        <div
          key={p.key}
          title={`Загрузка ${Math.round(cell.load)} / ${Math.round(cell.capacity)} ч${cell.ratio !== null ? ` (${Math.round(cell.ratio * 100)}%)` : ''} · свободно ${Math.round(cell.free)} ч${isGap ? ` · gap ${Math.round(cell.load - cell.capacity)} ч` : ''}`}
          style={{
            flex: 1,
            minWidth: 56,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            borderRight: `1px solid ${T.border}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12.5,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            boxShadow: i === 0 ? `inset 2px 0 0 ${T.accentRing}` : undefined,
          }}
        >
          {icon && <span aria-hidden style={{ fontSize: 9 }}>{icon}</span>}
          {formatCell(metric, cell)}
        </div>
      );
    })}
    {(() => {
      const avg = avgRatio(cells);
      const tone = loadTone(avg);
      return (
        <div
          title={`Средняя загрузка за горизонт: ${formatPct(avg) || '—'}`}
          style={{
            width: SIGMA_W,
            minWidth: SIGMA_W,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: `1px solid ${T.borderStrong}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatPct(avg)}
        </div>
      );
    })()}
  </div>
);
