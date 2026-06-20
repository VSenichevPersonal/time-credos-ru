import { T, loadTone, formatPct } from 'src/front-components/capacity/cap-tokens';
import type { DeptRef, LoadCell, Period } from 'src/front-components/capacity/types';

// Строка отдела в режиме «Общий»: название + ячейки % загрузки по периодам.
// Кликабельна (в режиме детализации раскрывает проекты).

type Props = {
  dept: DeptRef;
  cells: LoadCell[];
  periods: Period[];
  nameWidth: number;
  expandable: boolean;
  expanded: boolean;
  onToggle: () => void;
};

export const DeptRow = ({
  dept,
  cells,
  periods,
  nameWidth,
  expandable,
  expanded,
  onToggle,
}: Props) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
    <button
      onClick={expandable ? onToggle : undefined}
      style={{
        width: nameWidth,
        minWidth: nameWidth,
        textAlign: 'left',
        padding: '0 12px',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        borderRight: `1px solid ${T.border}`,
        background: T.surface,
        cursor: expandable ? 'pointer' : 'default',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        color: T.text,
        position: 'sticky',
        left: 0,
        zIndex: 1,
      }}
    >
      {expandable && (
        <span style={{ color: T.textFaint, fontSize: 10, width: 10 }}>
          {expanded ? '▾' : '▸'}
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {dept.code ?? dept.name}
      </span>
      <span style={{ color: T.textFaint, fontSize: 11, fontWeight: 400 }}>
        {dept.headcount} чел.
      </span>
    </button>

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
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${T.border}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12.5,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatPct(cell.ratio)}
        </div>
      );
    })}
  </div>
);
