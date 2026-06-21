import { useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// Контекст-меню строки (⋯). Собирает разбросанные действия одной строки под
// видимый триггер с ПОДПИСЯМИ (раньше: немой «⧉» + 10px-квадрат в ячейке).
// Сверка: Timetta removeLines / Kimai Duplicate. Поповер на useState — host-DOM
// недоступен (Remote DOM), паттерн как cheatsheet/autocomplete.
//
// rowLocked=true (вся строка согласована) → правящие пункты скрыты, остаётся
// только «Дублировать» (создаёт новую строку, согласованную не трогает).

type Props = {
  rowLocked?: boolean;
  hasHours?: boolean; // есть что заполнять/очищать (иначе пункты не нужны)
  onDuplicate: () => void;
  onFillWeekdays: () => void; // норма дня во все пустые будни строки (WI-02 SSOT)
  onClearRow: () => void; // обнулить все часы строки
  onDeleteRow: () => void; // убрать строку из сетки целиком
};

type Item = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  hint?: string;
  dividerBefore?: boolean; // визуальный разделитель кластеров
};

export const RowMenu = ({
  rowLocked,
  hasHours,
  onDuplicate,
  onFillWeekdays,
  onClearRow,
  onDeleteRow,
}: Props) => {
  const [open, setOpen] = useState(false);

  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  const items: Item[] = [
    { label: 'Дублировать строку', onClick: run(onDuplicate), hint: 'тот же проект, новый вид работ' },
  ];
  if (!rowLocked) {
    items.push({
      label: 'Заполнить будни нормой',
      onClick: run(onFillWeekdays),
      hint: 'норма дня в пустые будни этой строки',
      dividerBefore: true,
    });
    if (hasHours)
      items.push({ label: 'Очистить строку', onClick: run(onClearRow), hint: 'все часы строки → пусто' });
    items.push({ label: 'Удалить строку', onClick: run(onDeleteRow), danger: true, dividerBefore: true });
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="Действия со строкой"
        aria-label="Действия со строкой"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          border: 'none',
          borderRadius: 6,
          background: open ? T.accentSoft : 'transparent',
          color: open ? T.accent : T.textMuted,
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          fontFamily: 'inherit',
        }}
      >
        ⋯
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 28,
              left: 0,
              zIndex: 21,
              minWidth: 210,
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
              padding: 4,
            }}
          >
            {items.map((it) => (
              <div key={it.label}>
                {it.dividerBefore && (
                  <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={it.onClick}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '7px 9px',
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: 6,
                    background: 'transparent',
                    color: it.danger ? T.over : T.text,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = it.danger ? T.overSoft : T.accentSoft;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{it.label}</span>
                  {it.hint && (
                    <span style={{ display: 'block', fontSize: 11, color: T.textFaint, marginTop: 1 }}>
                      {it.hint}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
