import { T, loadTone, formatCell, formatPct, avgRatio, SIGMA_W, gapTone, gapPct, gapIcon } from 'src/front-components/capacity/cap-tokens';
import type { CellMetric, LoadCell, Period } from 'src/front-components/capacity/types';

// Сводная строка «Все отделы»: суммарная загрузка компании по периодам.
// Не раскрываема. Полужирная — визуальный якорь над строками отделов.

type Props = {
  cells: LoadCell[];
  periods: Period[];
  nameWidth: number;
  metric: CellMetric;
};

export const SummaryRow = ({ cells, periods, nameWidth, metric }: Props) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.borderStrong}`, background: T.headerBg }}>
    <div
      style={{
        width: nameWidth,
        minWidth: nameWidth,
        padding: '0 12px',
        height: 34,
        display: 'flex',
        alignItems: 'center',
        borderRight: `1px solid ${T.border}`,
        background: T.headerBg,
        position: 'sticky',
        left: 0,
        zIndex: 1,
        fontSize: 12.5,
        fontWeight: 700,
        color: T.text,
      }}
    >
      Все отделы
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
          title={`${Math.round(cell.load)} / ${Math.round(cell.capacity)} ч${isGap ? ` · gap ${Math.round(cell.load - cell.capacity)} ч` : ''}`}
          style={{
            flex: 1,
            minWidth: 56,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            borderRight: `1px solid ${T.border}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12.5,
            fontWeight: 700,
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
          title={`Средняя загрузка компании за горизонт: ${formatPct(avg) || '—'}`}
          style={{
            width: SIGMA_W,
            minWidth: SIGMA_W,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: `1px solid ${T.borderStrong}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12.5,
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
