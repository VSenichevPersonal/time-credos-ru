import { useState } from 'react';

import { T } from 'src/front-components/capacity/cap-tokens';

// Сегмент-контрол. Используется для режима (Общий/Детализация) и для
// гранулярности (Недели/Месяцы). Активный сегмент — лёгкая заливка.
// Неактивные сегменты дают hover/focus-отклик — видно, что это переключатель.

type Segment<V extends string> = { value: V; label: string };

type Props<V extends string> = {
  ariaLabel: string;
  value: V;
  segments: Segment<V>[];
  onChange: (value: V) => void;
};

const Seg = <V extends string>({
  s,
  on,
  onChange,
}: {
  s: Segment<V>;
  on: boolean;
  onChange: (value: V) => void;
}) => {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <button
      role="tab"
      aria-selected={on}
      onClick={() => onChange(s.value)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        padding: '4px 14px',
        fontSize: 12.5,
        fontWeight: on ? 600 : 500,
        border: 'none',
        borderRadius: 6,
        cursor: on ? 'default' : 'pointer',
        fontFamily: 'inherit',
        color: on ? T.accent : hover ? T.text : T.textMuted,
        background: on ? T.surface : hover ? T.surface : 'transparent',
        boxShadow: on
          ? '0 1px 2px rgba(29,31,38,0.08)'
          : focus
            ? `0 0 0 2px ${T.accentRing}`
            : 'none',
        transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease',
      }}
    >
      {s.label}
    </button>
  );
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
    {segments.map((s) => (
      <Seg key={s.value} s={s} on={value === s.value} onChange={onChange} />
    ))}
  </div>
);
