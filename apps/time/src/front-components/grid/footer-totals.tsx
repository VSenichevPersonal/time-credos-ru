import { T } from 'src/front-components/grid/tokens';
import type { WeekDay } from 'src/front-components/grid/use-week';
import { WEEKLY_NORM_HOURS } from 'src/constants/labels';

// Подвал: «Итого» по дням, недельная сумма, строка плана (норма часов).

type Props = {
  days: WeekDay[];
  dayTotals: number[]; // длина 7
  weekTotal: number;
};

const fmt = (n: number): string => (n > 0 ? n.toFixed(2).replace(/\.?0+$/, '') : '—');

export const FooterTotals = ({ days, dayTotals, weekTotal }: Props) => {
  const overNorm = weekTotal > WEEKLY_NORM_HOURS;
  const weekColor = overNorm ? T.over : weekTotal === WEEKLY_NORM_HOURS ? T.ok : T.text;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) repeat(7, 56px) 64px',
          background: T.headerBg,
          borderTop: `1px solid ${T.borderStrong}`,
        }}
      >
        <div
          style={{
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: T.text,
            borderRight: `1px solid ${T.border}`,
          }}
        >
          Итого за день
        </div>
        {days.map((day, i) => (
          <div
            key={day.iso}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 8px',
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: dayTotals[i] > 0 ? T.text : T.textFaint,
              background: day.isWeekend ? T.weekendBg : 'transparent',
              borderRight: `1px solid ${T.border}`,
            }}
          >
            {fmt(dayTotals[i])}
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 12px',
            fontSize: 13,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: weekColor,
          }}
        >
          {fmt(weekTotal)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          fontSize: 12,
          color: T.textMuted,
        }}
      >
        <span>План на неделю: {WEEKLY_NORM_HOURS} ч</span>
        <span style={{ color: T.textFaint }}>·</span>
        <span style={{ color: weekColor, fontWeight: 600 }}>
          {weekTotal === 0
            ? 'нет записей'
            : overNorm
              ? `переработка +${(weekTotal - WEEKLY_NORM_HOURS).toFixed(2).replace(/\.?0+$/, '')} ч`
              : weekTotal === WEEKLY_NORM_HOURS
                ? 'норма выполнена'
                : `недобор ${(WEEKLY_NORM_HOURS - weekTotal).toFixed(2).replace(/\.?0+$/, '')} ч`}
        </span>
      </div>
    </div>
  );
};
