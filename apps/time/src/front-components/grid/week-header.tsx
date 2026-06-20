import { T } from 'src/front-components/grid/tokens';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { NormForDay } from 'src/front-components/grid/use-daily-norm';

// Шапка недельной сетки: метка колонки + 7 дней (выходные приглушены, today
// подсвечен) + «Итого». Под датой — норма дня из произв. календаря (T2 SSOT;
// нерабочий/праздник → «—», короткий день = его часы).

export const GRID_TEMPLATE = 'minmax(0, 1fr) repeat(7, 58px) 66px';

type Props = { days: WeekDay[]; leftLabel: string; normFor: NormForDay };

export const WeekHeader = ({ days, leftLabel, normFor }: Props) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: GRID_TEMPLATE,
      background: T.headerBg,
      borderTop: `1px solid ${T.borderStrong}`,
      borderBottom: `1px solid ${T.borderStrong}`,
      position: 'sticky',
      top: 0,
      zIndex: 2,
    }}
  >
    <div
      style={{
        padding: '6px 12px',
        fontSize: 11,
        fontWeight: 600,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {leftLabel}
    </div>
    {days.map((day) => (
      <div
        key={day.iso}
        style={{
          padding: '4px 4px 3px',
          textAlign: 'center',
          borderRight: `1px solid ${T.border}`,
          background: day.isToday ? T.todayCol : day.isWeekend ? T.weekendBg : 'transparent',
          boxShadow: day.isToday ? `inset 0 -2px 0 ${T.accent}` : 'none',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: day.isToday ? T.accent : day.isWeekend ? T.textFaint : T.textMuted,
          }}
        >
          {day.dayLabel} {day.dateLabel}
        </div>
        <div style={{ fontSize: 9.5, color: T.textFaint, fontVariantNumeric: 'tabular-nums' }}>
          {((n) => (n > 0 ? `${n} ч` : '—'))(normFor(day.iso, day.isWeekend))}
        </div>
      </div>
    ))}
    <div
      style={{
        padding: '6px 12px',
        textAlign: 'right',
        fontSize: 11,
        fontWeight: 600,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      Итого
    </div>
  </div>
);
