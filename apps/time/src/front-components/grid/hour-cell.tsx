import { useEffect, useRef, useState } from 'react';

import { T, cellFill } from 'src/front-components/grid/tokens';
import { fmtHours, parseHours } from 'src/front-components/grid/format';

// Ячейка часов: tabular-nums, правое выравнивание. Активная (по клавиатуре)
// подсвечена кольцом. Печать цифры → сразу ввод (seed). Enter/Tab подтверждают
// и навигация уводит фокус (управляет родитель через onKey).

type Props = {
  value: number; // 0 = пусто
  weekend: boolean;
  today: boolean;
  active: boolean;
  locked?: boolean; // W6-2: согласованная запись — только чтение
  seed: string | null; // символ, с которого начали печатать
  onActivate: () => void;
  onCommit: (hours: number) => void;
  onKey: (e: { key: string; shiftKey: boolean }) => void; // навигация (родитель)
  onSeedConsumed: () => void;
  onFill?: () => void; // U5: заполнить будни строки значением этой ячейки
};

export const HourCell = ({
  value,
  weekend,
  today,
  active,
  locked,
  seed,
  onActivate,
  onCommit,
  onKey,
  onSeedConsumed,
  onFill,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Вход в редактирование по seed (печать цифры на активной ячейке). Заблокированную
  // (согласованную) ячейку не редактируем — только seed гасим.
  useEffect(() => {
    if (active && seed !== null && !editing) {
      if (!locked) {
        setDraft(seed === '0' ? '' : seed);
        setEditing(true);
      }
      onSeedConsumed();
    }
  }, [active, seed, editing, locked, onSeedConsumed]);

  useEffect(() => {
    if (!editing) setDraft(fmtHours(value));
  }, [value, editing]);

  const commit = (): boolean => {
    const parsed = parseHours(draft);
    if (parsed === null) {
      setDraft(fmtHours(value));
      return false;
    }
    if (parsed !== value) onCommit(parsed);
    return true;
  };

  const over12 = value > 12;
  const bg = today ? T.todayCol : weekend ? T.weekendBg : 'transparent';
  const base = {
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums' as const,
    borderRight: `1px solid ${T.border}`,
    boxSizing: 'border-box' as const,
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          commit();
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (commit()) {
              setEditing(false);
              onKey({ key: e.key, shiftKey: e.shiftKey });
            }
          } else if (e.key === 'Escape') {
            setDraft(fmtHours(value));
            setEditing(false);
          }
        }}
        style={{
          ...base,
          width: '100%',
          textAlign: 'right',
          border: `1px solid ${T.accent}`,
          borderRadius: 4,
          outline: 'none',
          color: T.text,
          fontFamily: 'inherit',
          background: T.surface,
        }}
      />
    );
  }

  return (
    <div
      tabIndex={-1}
      title={locked ? 'Согласовано — только чтение' : undefined}
      onClick={() => {
        onActivate();
        if (locked) return; // W6-2: согласованную не редактируем
        setDraft(fmtHours(value));
        setEditing(true);
      }}
      onMouseDown={onActivate}
      style={{
        ...base,
        cursor: locked ? 'default' : 'text',
        background: value > 0 ? cellFill(value) : bg,
        color: locked ? T.textMuted : over12 ? T.warn : value > 0 ? T.text : T.textFaint,
        fontWeight: value > 0 ? 500 : 400,
        boxShadow: active ? `inset 0 0 0 2px ${T.accent}` : 'none',
        borderRadius: active ? 4 : 0,
      }}
    >
      {value > 0 ? fmtHours(value) : '·'}
    </div>
  );
};
