import { useMemo, useRef, useState } from 'react';

import { T } from 'src/front-components/grid/tokens';
import { useDropdownDirection } from 'src/front-components/grid/use-dropdown-direction';

// Комбобокс с автокомплитом: печатаешь — фильтрует, ↑↓ выбор, Enter подтверждает.
// «Недавние» опции (recentIds) поднимаются вверх под подзаголовком.

export type ComboItem = { id: string; label: string };

type Props = {
  placeholder: string;
  items: ComboItem[];
  recentIds?: string[];
  value: string | null; // выбранный id
  onChange: (id: string | null) => void;
  onConfirm?: () => void; // Tab/Enter после выбора (переход к следующему полю)
  width?: number;
  autoFocus?: boolean;
};

export const Autocomplete = ({
  placeholder,
  items,
  recentIds = [],
  value,
  onChange,
  onConfirm,
  width = 240,
  autoFocus,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Направление меню: у нижней кромки фикс-виджета открываем вверх (UI_PLAYBOOK §2.1).
  const { dropUp, maxH, measure } = useDropdownDirection();

  const openMenu = () => {
    measure(inputRef.current);
    setOpen(true);
    setHi(0);
  };

  const selectedLabel = items.find((i) => i.id === value)?.label ?? '';

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
    if (!q && recentIds.length) {
      const recentSet = new Set(recentIds);
      const recent = recentIds
        .map((id) => match.find((i) => i.id === id))
        .filter((i): i is ComboItem => Boolean(i));
      const rest = match.filter((i) => !recentSet.has(i.id));
      return { recent, rest };
    }
    return { recent: [] as ComboItem[], rest: match };
  }, [items, query, recentIds]);

  const flat = [...list.recent, ...list.rest];

  const choose = (item: ComboItem) => {
    onChange(item.id);
    setQuery('');
    setOpen(false);
    onConfirm?.();
  };

  return (
    <div style={{ position: 'relative', width }}>
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        onFocus={openMenu}
        onChange={(e) => {
          setQuery(e.target.value);
          openMenu();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHi((h) => Math.min(flat.length - 1, h + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHi((h) => Math.max(0, h - 1));
          } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (open && flat[hi]) {
              e.preventDefault();
              choose(flat[hi]);
            }
          } else if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{
          width: '100%',
          height: 30,
          padding: '0 9px',
          fontSize: 12.5,
          border: `1px solid ${value ? T.accentRing : T.borderStrong}`,
          borderRadius: 7,
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          color: T.text,
          background: T.surface,
        }}
      />
      {open && flat.length > 0 && (
        <div
          style={{
            position: 'absolute',
            ...(dropUp ? { bottom: 33 } : { top: 33 }),
            left: 0,
            zIndex: 12,
            width,
            maxHeight: maxH,
            overflowY: 'auto',
            background: T.surface,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 9,
            boxShadow: dropUp
              ? '0 -8px 24px rgba(29,31,38,0.14)'
              : '0 8px 24px rgba(29,31,38,0.14)',
            padding: 4,
          }}
        >
          {list.recent.length > 0 && (
            <div style={{ padding: '4px 8px 2px', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: T.textFaint, textTransform: 'uppercase' }}>
              Недавние
            </div>
          )}
          {flat.map((item, idx) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(item);
              }}
              onMouseEnter={() => setHi(idx)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 8px',
                fontSize: 12.5,
                textAlign: 'left',
                border: 'none',
                borderRadius: 6,
                background: idx === hi ? T.accentSoft : 'transparent',
                color: T.text,
                cursor: 'pointer',
                fontFamily: 'inherit',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
              {list.recent.length > 0 && idx === list.recent.length - 1 && (
                <div style={{ height: 1, background: T.border, margin: '4px -4px 2px' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
