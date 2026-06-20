import { HourCell } from 'src/front-components/grid/hour-cell';
import { T } from 'src/front-components/grid/tokens';
import { GRID_TEMPLATE } from 'src/front-components/grid/week-header';
import { fmtTotal } from 'src/front-components/grid/format';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { Nav } from 'src/front-components/grid/use-keyboard';

// Строка сетки: метка (проект 600 / вид работ 400 приглушён) + 7 ячеек + итог.
// Ячейки адресуются (rowIndex, dayIndex) для клавиатурной навигации.

type Props = {
  rowIndex: number;
  projectName: string;
  workTypeName: string;
  days: WeekDay[];
  hoursByDay: number[];
  rowTotal: number;
  alt: boolean;
  nav: Nav;
  onCellCommit: (dayIso: string, hours: number) => void;
};

export const GridRow = ({
  rowIndex,
  projectName,
  workTypeName,
  days,
  hoursByDay,
  rowTotal,
  alt,
  nav,
  onCellCommit,
}: Props) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: GRID_TEMPLATE,
      background: alt ? T.rowAlt : T.surface,
      borderBottom: `1px solid ${T.border}`,
    }}
  >
    <div style={{ padding: '5px 12px', borderRight: `1px solid ${T.border}`, minWidth: 0 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: T.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {projectName}
      </div>
      <div
        style={{
          fontSize: 11,
          color: T.textMuted,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {workTypeName}
      </div>
    </div>

    {days.map((day, i) => (
      <HourCell
        key={day.iso}
        value={hoursByDay[i]}
        weekend={day.isWeekend}
        today={day.isToday}
        active={nav.isActive(rowIndex, i)}
        seed={nav.isActive(rowIndex, i) ? nav.editSeed : null}
        onActivate={() => nav.setActive({ row: rowIndex, col: i })}
        onCommit={(h) => onCellCommit(day.iso, h)}
        onKey={(e) => nav.handleKey(e)}
        onSeedConsumed={nav.consumeSeed}
      />
    ))}

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 12px',
        fontSize: 13,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: rowTotal > 0 ? T.text : T.textFaint,
      }}
    >
      {fmtTotal(rowTotal)}
    </div>
  </div>
);
