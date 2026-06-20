import { useState } from 'react';

import { T, FONT } from 'src/front-components/calendar/cal-tokens';
import { Center } from 'src/front-components/grid/center';
import { MonthTable } from 'src/front-components/calendar/month-table';
import { useCalendar } from 'src/front-components/calendar/use-calendar';

// Производственный календарь РФ помесячно (график 5/2): рабочие дни/часы по
// месяцам и кварталам, как в consultant.ru. Детализация по дням — в объекте-
// справочнике (отдельный раздел/вью).

const navBtn: React.CSSProperties = {
  height: 28,
  width: 28,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  background: T.surface,
  color: T.textMuted,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 14,
};

export const CalendarMonthly = () => {
  const [year, setYear] = useState(() => new Date().getUTCFullYear());
  const { loading, error, months, hasData } = useCalendar(year);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: T.bg,
        fontFamily: FONT,
        color: T.text,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderBottom: `1px solid ${T.border}`,
          background: T.panelBg,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>Производственный календарь</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button aria-label="Предыдущий год" style={navBtn} onClick={() => setYear((y) => y - 1)}>
            ‹
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 44, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {year}
          </span>
          <button aria-label="Следующий год" style={navBtn} onClick={() => setYear((y) => y + 1)}>
            ›
          </button>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: T.textFaint }}>
          График 5/2 · часы из производственного календаря РФ
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 2px' }}>
        {error ? (
          <Center>Не удалось загрузить календарь: {error}</Center>
        ) : loading ? (
          <Center>Загрузка календаря…</Center>
        ) : !hasData ? (
          <Center>Нет данных календаря за {year} год</Center>
        ) : (
          <MonthTable months={months} />
        )}
      </div>
    </div>
  );
};
