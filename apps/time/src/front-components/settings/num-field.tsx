import { useEffect, useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// Инлайн-инпут числа: правит локальный черновик, коммитит по blur/Enter
// (только валидное и изменившееся значение). Десятичные — через точку/запятую.

type Props = {
  value: number;
  min?: number;
  width?: number;
  onCommit: (v: number) => void;
};

export const NumField = ({ value, min = 0, width = 76, onCommit }: Props) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number(draft.replace(',', '.'));
    if (Number.isFinite(n) && n >= min && n !== value) onCommit(n);
    else setDraft(String(value));
  };

  return (
    <input
      value={draft}
      inputMode="decimal"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        else if (e.key === 'Escape') setDraft(String(value));
      }}
      style={{
        width,
        height: 28,
        padding: '0 8px',
        fontSize: 12.5,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 6,
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        color: T.text,
        background: T.surface,
      }}
    />
  );
};
