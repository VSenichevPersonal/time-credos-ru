import { T } from 'src/front-components/grid/tokens';
import type { ViewMode } from 'src/front-components/grid/types';

// Сегмент-контрол режимов: День / Неделя / Проект. Активный — лёгкая заливка.

const MODES: { mode: ViewMode; label: string }[] = [
  { mode: 'day', label: 'День' },
  { mode: 'week', label: 'Неделя' },
  { mode: 'project', label: 'Проект' },
];

type Props = { value: ViewMode; onChange: (mode: ViewMode) => void };

export const ModeSwitcher = ({ value, onChange }: Props) => (
  <div
    role="tablist"
    aria-label="Режим таймшита"
    style={{
      display: 'inline-flex',
      padding: 2,
      gap: 2,
      background: T.panelBg,
      border: `1px solid ${T.border}`,
      borderRadius: 8,
    }}
  >
    {MODES.map(({ mode, label }) => {
      const on = value === mode;
      return (
        <button
          key={mode}
          role="tab"
          aria-selected={on}
          onClick={() => onChange(mode)}
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
            boxShadow: on ? `0 1px 2px rgba(29,31,38,0.08)` : 'none',
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);
