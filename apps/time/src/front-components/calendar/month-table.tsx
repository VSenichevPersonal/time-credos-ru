import { T } from 'src/front-components/calendar/cal-tokens';
import { sumAgg } from 'src/front-components/calendar/calc-month';
import type { MonthAgg } from 'src/front-components/calendar/types';

// Таблица: месяцы, сгруппированные по кварталам, с подытогами квартала и года.
// График 5/2: рабочие часы из производственного календаря (8ч/день, 7ч короткий).

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const QUARTERS = ['I квартал', 'II квартал', 'III квартал', 'IV квартал'];
const COLS = '1.4fr 90px 90px 104px 96px 110px';

const num = (v: number): string => (v > 0 ? String(v) : '—');

const Cells = ({ a }: { a: Omit<MonthAgg, 'month'> }) => (
  <>
    <span style={cell}>{num(a.calendarDays)}</span>
    <span style={cell}>{num(a.workDays)}</span>
    <span style={cell}>{num(a.offDays)}</span>
    <span style={{ ...cell, color: T.textFaint }}>{a.shortDays > 0 ? a.shortDays : ''}</span>
    <span style={{ ...cell, fontWeight: 700 }}>{a.workHours > 0 ? a.workHours : '—'}</span>
  </>
);

const cell: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: '0 10px',
  fontVariantNumeric: 'tabular-nums',
};

const row = (h: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: COLS,
  alignItems: 'center',
  height: h,
  borderBottom: `1px solid ${T.border}`,
});

export const MonthTable = ({ months }: { months: MonthAgg[] }) => (
  <div style={{ minWidth: 640 }}>
    <div style={{ ...row(34), borderBottom: `1px solid ${T.borderStrong}`, background: T.headerBg, fontSize: 11.5, fontWeight: 600, color: T.textMuted }}>
      <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 12 }}>Месяц</span>
      <span style={cell}>Кал. дней</span>
      <span style={cell}>Раб. дней</span>
      <span style={cell}>Вых.+празд.</span>
      <span style={cell}>Коротких</span>
      <span style={cell}>Раб. часов</span>
    </div>

    {QUARTERS.map((qLabel, q) => {
      const qMonths = months.slice(q * 3, q * 3 + 3);
      const qTotal = sumAgg(qMonths);
      return (
        <div key={qLabel}>
          {qMonths.map((m) => (
            <div key={m.month} style={row(32)}>
              <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 13 }}>
                {MONTHS[m.month]}
              </span>
              <Cells a={m} />
            </div>
          ))}
          <div style={{ ...row(30), background: T.rowAlt, fontWeight: 600, color: T.textMuted, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 12 }}>{qLabel}</span>
            <Cells a={qTotal} />
          </div>
        </div>
      );
    })}

    <div style={{ ...row(38), borderTop: `1px solid ${T.borderStrong}`, background: T.headerBg, fontWeight: 700, fontSize: 13 }}>
      <span style={{ display: 'flex', alignItems: 'center', paddingLeft: 12 }}>За год</span>
      <Cells a={sumAgg(months)} />
    </div>
  </div>
);
