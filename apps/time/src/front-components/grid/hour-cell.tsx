import { useEffect, useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// Ячейка часов: показывает значение, по клику — инлайн-ввод decimal.
// Пустое/0 → запись удаляется. Валидация 0..24, нормализация запятой.

type Props = {
  value: number; // 0 = пусто
  weekend: boolean;
  onCommit: (hours: number) => void;
};

const parse = (raw: string): number | null => {
  const n = Number(raw.replace(',', '.').trim());
  if (Number.isNaN(n) || n < 0 || n > 24) return null;
  return Math.round(n * 4) / 4; // шаг 0.25 (поддержка 0.5)
};

const fmt = (n: number): string =>
  n === 0 ? '' : Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '');

export const HourCell = ({ value, weekend, onCommit }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!editing) setDraft(fmt(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parse(draft);
    if (parsed === null) {
      setDraft(fmt(value));
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  const base = {
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums' as const,
    background: weekend ? T.weekendBg : 'transparent',
    borderRight: `1px solid ${T.border}`,
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(fmt(value));
            setEditing(false);
          }
        }}
        style={{
          ...base,
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'right',
          border: `1px solid ${T.accent}`,
          borderRadius: 4,
          outline: 'none',
          color: T.text,
          fontFamily: 'inherit',
        }}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        ...base,
        cursor: 'pointer',
        color: value > 0 ? T.text : T.textFaint,
        fontWeight: value > 0 ? 500 : 400,
      }}
    >
      {value > 0 ? fmt(value) : '·'}
    </div>
  );
};
