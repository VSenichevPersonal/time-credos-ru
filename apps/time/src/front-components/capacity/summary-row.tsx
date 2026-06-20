import { T, loadTone, formatCell } from 'src/front-components/capacity/cap-tokens';
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
      const tone = loadTone(cell.ratio);
      return (
        <div
          key={p.key}
          title={`${Math.round(cell.load)} / ${Math.round(cell.capacity)} ч`}
          style={{
            flex: 1,
            minWidth: 56,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${T.border}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12.5,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            boxShadow: i === 0 ? `inset 2px 0 0 ${T.accentRing}` : undefined,
          }}
        >
          {formatCell(metric, cell)}
        </div>
      );
    })}
  </div>
);
