import { HourCell } from 'src/front-components/grid/hour-cell';
import { T } from 'src/front-components/grid/tokens';
import type { WeekDay } from 'src/front-components/grid/use-week';

// Строка сетки: метка (проект + вид работ) + 7 ячеек дней + итог за строку.

type Props = {
  projectName: string;
  workTypeName: string;
  days: WeekDay[];
  hoursByDay: number[]; // длина 7
  rowTotal: number;
  alt: boolean;
  onCellCommit: (dayIso: string, hours: number) => void;
};

export const GridRow = ({
  projectName,
  workTypeName,
  days,
  hoursByDay,
  rowTotal,
  alt,
  onCellCommit,
}: Props) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) repeat(7, 56px) 64px',
        background: alt ? T.rowAlt : T.surface,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          padding: '5px 12px',
          borderRight: `1px solid ${T.border}`,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
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
          onCommit={(h) => onCellCommit(day.iso, h)}
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
        {rowTotal > 0 ? rowTotal.toFixed(2).replace(/\.?0+$/, '') : '—'}
      </div>
    </div>
  );
};
