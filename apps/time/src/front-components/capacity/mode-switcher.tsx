import { T } from 'src/front-components/capacity/cap-tokens';

// Сегмент-контрол. Используется для режима (Общий/Детализация) и для
// гранулярности (Недели/Месяцы). Активный сегмент — лёгкая заливка.

type Segment<V extends string> = { value: V; label: string };

type Props<V extends string> = {
  ariaLabel: string;
  value: V;
  segments: Segment<V>[];
  onChange: (value: V) => void;
};

export const Segmented = <V extends string>({
  ariaLabel,
  value,
  segments,
  onChange,
}: Props<V>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    style={{
      display: 'inline-flex',
      padding: 2,
      gap: 2,
      background: T.panelBg,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
    }}
  >
    {segments.map((s) => {
      const on = value === s.value;
      return (
        <button
          key={s.value}
          role="tab"
          aria-selected={on}
          onClick={() => onChange(s.value)}
          style={{
            padding: '4px 14px',
            fontSize: 12.5,
            fontWeight: on ? 600 : 500,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: on ? T.accent : T.textMuted,
            background: on ? T.surface : 'transparent',
            boxShadow: on ? '0 1px 2px rgba(29,31,38,0.08)' : 'none',
          }}
        >
          {s.label}
        </button>
      );
    })}
  </div>
);
