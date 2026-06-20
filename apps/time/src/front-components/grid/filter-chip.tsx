import { useMemo, useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// Чип-дропдаун мультиселекта с поиском внутри. Закрытый — показывает счётчик
// выбранного. Открытый — список опций с галочками. Без модалок, поповер инлайн.

export type Option = { value: string; label: string };

type Props = {
  label: string;
  options: Option[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
};

export const FilterChip = ({ label, options, selected, onToggle, onClear }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const count = selected.size;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 28,
          padding: '0 10px',
          fontSize: 12,
          fontFamily: 'inherit',
          border: `1px solid ${count ? T.accentRing : T.border}`,
          borderRadius: 7,
          background: count ? T.accentSoft : T.surface,
          color: count ? T.accent : T.textMuted,
          cursor: 'pointer',
          fontWeight: count ? 600 : 500,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {count > 0 && (
          <span
            style={{
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10.5,
              fontWeight: 700,
              borderRadius: 8,
              background: T.accent,
              color: T.surface,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </span>
        )}
        <span style={{ fontSize: 9, opacity: 0.7 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: 'absolute',
              top: 32,
              left: 0,
              zIndex: 11,
              width: 248,
              maxHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 9,
              boxShadow: '0 8px 24px rgba(29,31,38,0.14)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 8, borderBottom: `1px solid ${T.border}` }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск…"
                style={{
                  width: '100%',
                  height: 28,
                  padding: '0 8px',
                  fontSize: 12,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  color: T.text,
                }}
              />
            </div>
            <div style={{ overflowY: 'auto', padding: 4 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '10px 8px', fontSize: 12, color: T.textFaint }}>
                  Ничего не найдено
                </div>
              ) : (
                filtered.map((o) => {
                  const on = selected.has(o.value);
                  return (
                    <button
                      key={o.value}
                      onClick={() => onToggle(o.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: 12,
                        textAlign: 'left',
                        border: 'none',
                        borderRadius: 6,
                        background: on ? T.accentSoft : 'transparent',
                        color: T.text,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span
                        style={{
                          width: 15,
                          height: 15,
                          flexShrink: 0,
                          borderRadius: 4,
                          border: `1.5px solid ${on ? T.accent : T.borderStrong}`,
                          background: on ? T.accent : 'transparent',
                          color: T.surface,
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {on ? '✓' : ''}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            {count > 0 && (
              <button
                onClick={onClear}
                style={{
                  padding: '7px 8px',
                  fontSize: 11.5,
                  border: 'none',
                  borderTop: `1px solid ${T.border}`,
                  background: T.surface,
                  color: T.textMuted,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Очистить «{label}»
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
