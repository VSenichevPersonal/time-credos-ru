import { useState } from 'react';

import { T } from 'src/front-components/grid/tokens';

// Dropdown «Копировать ▾» вверху тулбара. Сворачивает кластер переноса прошлой
// недели в один контрол с ПОНЯТНЫМИ подписями (раньше: «Копировать неделю» +
// немое «…с часами»). Внизу — опасное «Очистить неделю» с confirm. Сверка:
// Timetta copyLines* / removeLines. Поповер на useState (Remote DOM, host-DOM нет).

type Props = {
  disabled?: boolean;
  onCopyRows: () => void; // только строки (структура), без часов
  onCopyHours: () => void; // строки и часы прошлой недели
  onClearWeek: () => void; // очистить неделю (опасное)
};

export const CopyMenu = ({ disabled, onCopyRows, onCopyHours, onClearWeek }: Props) => {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirmClear(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Перенести строки/часы прошлой недели или очистить неделю"
        style={{
          height: 28,
          padding: '0 11px',
          fontSize: 12,
          fontWeight: 500,
          border: `1px solid ${T.border}`,
          borderRadius: 7,
          background: open ? T.accentSoft : T.surface,
          color: disabled ? T.textFaint : open ? T.accent : T.textMuted,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        Копировать ▾
      </button>
      {open && (
        <>
          <div
            onClick={close}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              top: 32,
              right: 0,
              zIndex: 21,
              minWidth: 248,
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
              padding: 4,
            }}
          >
            <MenuItem
              label="Только строки"
              hint="проекты и виды работ прошлой недели, часы заново"
              onClick={() => {
                onCopyRows();
                close();
              }}
            />
            <MenuItem
              label="Строки и часы"
              hint="перенести часы прошлой недели на те же дни"
              onClick={() => {
                onCopyHours();
                close();
              }}
            />
            <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
            {confirmClear ? (
              <div style={{ padding: '6px 9px' }}>
                <div style={{ fontSize: 12, color: T.over, fontWeight: 600, marginBottom: 6 }}>
                  Удалить все несогласованные записи недели?
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onClearWeek();
                      close();
                    }}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 6,
                      background: T.over,
                      color: T.onAccent,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Очистить
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    style={{
                      height: 26,
                      padding: '0 10px',
                      fontSize: 12,
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      background: T.surface,
                      color: T.textMuted,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <MenuItem
                label="Очистить неделю"
                hint="удалить все несогласованные часы недели"
                danger
                onClick={() => setConfirmClear(true)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

const MenuItem = ({
  label,
  hint,
  danger,
  onClick,
}: {
  label: string;
  hint?: string;
  danger?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      padding: '7px 9px',
      textAlign: 'left',
      border: 'none',
      borderRadius: 6,
      background: 'transparent',
      color: danger ? T.over : T.text,
      cursor: 'pointer',
      fontFamily: 'inherit',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger ? T.overSoft : T.accentSoft;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
    }}
  >
    <span style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</span>
    {hint && (
      <span style={{ display: 'block', fontSize: 11, color: T.textFaint, marginTop: 1 }}>
        {hint}
      </span>
    )}
  </button>
);
