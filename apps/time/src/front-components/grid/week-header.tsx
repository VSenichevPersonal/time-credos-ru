import { T } from 'src/front-components/grid/tokens';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { NormForDay } from 'src/front-components/grid/use-daily-norm';

// Шапка недельной сетки: метки левых колонок + 7 дней (выходные приглушены,
// today подсвечен) + «Итого». Под датой — норма дня из произв. календаря
// (T2 SSOT; нерабочий/праздник → «—», короткий день = его часы).
//
// Левых колонок может быть две (режим «Неделя»: «Проект» | «Вид работ») или
// одна (режим «Проект»: проект фиксирован селектором, остаётся «Вид работ»).
// Шаблон сетки строится из ширин левых колонок, чтобы GridRow/FooterTotals
// и шапка были идеально выровнены. tabular-nums для часов сохранён.

// Ширины левых колонок (px / fr) для двухколоночной раскладки «Неделя».
// Проект — эластичный (код+клиент), вид работ — фиксированные ~176px
// читаемого кегля. 7 дней по 58px + «Итого» 66px не меняются.
export const COL_PROJECT = 'minmax(0, 1.4fr)';
export const COL_WORKTYPE = '176px';
const DAYS_COLS = 'repeat(7, 58px) 66px';

// Двухколоночный шаблон (Неделя): Проект | Вид работ | 7 дней | Итого.
export const GRID_TEMPLATE = `${COL_PROJECT} ${COL_WORKTYPE} ${DAYS_COLS}`;
// Одноколоночный шаблон (Проект): Вид работ | 7 дней | Итого.
export const GRID_TEMPLATE_SINGLE = `minmax(0, 1fr) ${DAYS_COLS}`;

const headLabelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: T.textMuted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  display: 'flex',
  alignItems: 'center',
};

type Props = {
  days: WeekDay[];
  // Метки левых колонок (1 или 2). Их число задаёт шаблон сетки.
  leftLabels: string[];
  normFor: NormForDay;
};

export const WeekHeader = ({ days, leftLabels, normFor }: Props) => {
  const template = leftLabels.length >= 2 ? GRID_TEMPLATE : GRID_TEMPLATE_SINGLE;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: template,
        background: T.headerBg,
        borderTop: `1px solid ${T.borderStrong}`,
        borderBottom: `1px solid ${T.borderStrong}`,
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
    >
      {leftLabels.map((label) => (
        <div
          key={label}
          style={{ ...headLabelStyle, padding: '6px 12px', borderRight: `1px solid ${T.border}` }}
        >
          {label}
        </div>
      ))}
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
          ...headLabelStyle,
          padding: '6px 12px',
          textAlign: 'right',
          justifyContent: 'flex-end',
        }}
      >
        Итого
      </div>
    </div>
  );
};
