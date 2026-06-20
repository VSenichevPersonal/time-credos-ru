import { T } from 'src/front-components/grid/tokens';
import type { WeekDay } from 'src/front-components/grid/use-week';

// Шапка таблицы: заголовок колонки + 7 дней недели + «Итого».

const NavButton = ({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label={dir === 'prev' ? 'Предыдущая неделя' : 'Следующая неделя'}
    style={{
      width: 26,
      height: 26,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${T.borderStrong}`,
      borderRadius: 6,
      background: T.surface,
      cursor: 'pointer',
      color: T.textMuted,
      fontSize: 14,
      lineHeight: 1,
    }}
  >
    {dir === 'prev' ? '‹' : '›'}
  </button>
);

type Props = {
  title: string;
  days: WeekDay[];
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
};

export const WeekHeader = ({ title, days, onPrev, onNext, onReset }: Props) => (
  <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Трудозатраты</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        <NavButton dir="prev" onClick={onPrev} />
        <button
          onClick={onReset}
          style={{
            fontSize: 12,
            color: T.textMuted,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            minWidth: 150,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {title}
        </button>
        <NavButton dir="next" onClick={onNext} />
      </div>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) repeat(7, 56px) 64px',
        background: T.headerBg,
        borderTop: `1px solid ${T.borderStrong}`,
        borderBottom: `1px solid ${T.borderStrong}`,
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
        }}
      >
        Проект / вид работ
      </div>
      {days.map((day) => (
        <div
          key={day.iso}
          style={{
            padding: '5px 4px',
            textAlign: 'center',
            borderRight: `1px solid ${T.border}`,
            background: day.isWeekend ? T.weekendBg : 'transparent',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: day.isWeekend ? T.textFaint : T.textMuted,
            }}
          >
            {day.dayLabel}
          </div>
          <div style={{ fontSize: 11, color: T.textFaint }}>{day.dateLabel}</div>
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
        }}
      >
        Итого
      </div>
    </div>
  </div>
);
