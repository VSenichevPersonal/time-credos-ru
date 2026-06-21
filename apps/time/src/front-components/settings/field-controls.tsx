import { T } from 'src/front-components/grid/tokens';

// Общие inline-контролы настроек: тоггл (BOOLEAN) и дропдаун (SELECT).
// Правка → onCommit (оптимистично, как в dept-section). Токены/русский/без host-DOM.

type SelectOption = { value: string; label: string };

// Тоггл вкл/выкл. role=switch + aria-checked для доступности.
export const Toggle = ({
  on,
  onChange,
  labels = ['Включено', 'Выключено'],
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  labels?: [string, string];
}) => (
  <button
    role="switch"
    aria-checked={on}
    onClick={() => onChange(!on)}
    style={{
      height: 28,
      padding: '0 12px',
      fontSize: 12,
      fontWeight: 600,
      border: `1px solid ${on ? T.accentRing : T.borderStrong}`,
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: 'inherit',
      color: on ? T.accent : T.textMuted,
      background: on ? T.accentSoft : T.surface,
      transition: 'color 120ms, background 120ms, border-color 120ms',
    }}
  >
    {on ? labels[0] : labels[1]}
  </button>
);

// Дропдаун SELECT: значения/ярлыки из select-options. Нативный <select>,
// стилизован токенами (доступность/клавиатура «из коробки»).
export const SelectField = ({
  value,
  options,
  width = 160,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  width?: number;
  onChange: (next: string) => void;
}) => (
  <select
    value={value}
    onChange={(e) => {
      if (e.target.value !== value) onChange(e.target.value);
    }}
    style={{
      width,
      height: 28,
      padding: '0 8px',
      fontSize: 12.5,
      border: `1px solid ${T.borderStrong}`,
      borderRadius: 6,
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      color: T.text,
      background: T.surface,
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);
