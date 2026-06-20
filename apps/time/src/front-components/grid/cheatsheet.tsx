import { T } from 'src/front-components/grid/tokens';

// Подсказка горячих клавиш (по «?»). Инлайн-поповер, не модалка.

const KEYS: { keys: string; desc: string }[] = [
  { keys: '↑ ↓ ← →', desc: 'перемещение по ячейкам' },
  { keys: '0–9', desc: 'начать ввод часов' },
  { keys: 'Enter', desc: 'подтвердить и вниз' },
  { keys: 'Tab', desc: 'подтвердить и вправо' },
  { keys: 'Shift+Tab', desc: 'влево' },
  { keys: 'Esc', desc: 'отмена ввода' },
  { keys: '0 / Del', desc: 'удалить запись' },
  { keys: 'Shift+Enter', desc: 'часы на все будни строки' },
  { keys: '?', desc: 'эта подсказка' },
];

const Kbd = ({ children }: { children: string }) => (
  <kbd
    style={{
      display: 'inline-block',
      padding: '1px 6px',
      fontSize: 11,
      fontFamily: 'inherit',
      border: `1px solid ${T.borderStrong}`,
      borderRadius: 5,
      background: T.panelBg,
      color: T.text,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </kbd>
);

export const Cheatsheet = ({ onClose }: { onClose: () => void }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
    <div
      style={{
        position: 'absolute',
        top: 38,
        right: 0,
        zIndex: 21,
        width: 280,
        background: T.surface,
        border: `1px solid ${T.borderStrong}`,
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(29,31,38,0.16)',
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 8 }}>
        Горячие клавиши
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {KEYS.map((k) => (
          <div key={k.keys} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 96 }}>
              <Kbd>{k.keys}</Kbd>
            </span>
            <span style={{ fontSize: 12, color: T.textMuted }}>{k.desc}</span>
          </div>
        ))}
      </div>
    </div>
  </>
);
