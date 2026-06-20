import { T } from 'src/front-components/grid/tokens';
import type { WeekDay } from 'src/front-components/grid/use-week';
import { WEEKLY_NORM_HOURS } from 'src/constants/labels';
import { GRID_TEMPLATE } from 'src/front-components/grid/week-header';
import {
  DAILY_NORM_HOURS,
  fmtTotal,
  loadColor,
  loadHint,
  loadLevel,
} from 'src/front-components/grid/format';

// Подвал: «Итого за день» (незаполненные будни подсвечены) + недельный итог
// vs норма (одна строка-индикатор, цвет: недобор/норма/переработка).

type Props = { days: WeekDay[]; dayTotals: number[]; weekTotal: number };

export const FooterTotals = ({ days, dayTotals, weekTotal }: Props) => {
  const weekColor = loadColor(loadLevel(weekTotal, WEEKLY_NORM_HOURS));

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID_TEMPLATE,
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
        {days.map((day, i) => {
          // Незаполненный будний день (ниже нормы) — мягкая подсветка «дыры».
          const gap = !day.isWeekend && dayTotals[i] < DAILY_NORM_HOURS;
          return (
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
                color: gap && dayTotals[i] > 0 ? T.warn : dayTotals[i] > 0 ? T.text : T.textFaint,
                background: gap
                  ? T.overSoft
                  : day.isToday
                    ? T.todayCol
                    : day.isWeekend
                      ? T.weekendBg
                      : 'transparent',
                borderRight: `1px solid ${T.border}`,
              }}
            >
              {fmtTotal(dayTotals[i])}
            </div>
          );
        })}
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
          {fmtTotal(weekTotal)}
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
          {loadHint(weekTotal, WEEKLY_NORM_HOURS)}
        </span>
      </div>
    </div>
  );
};
