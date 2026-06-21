import { T } from 'src/front-components/grid/tokens';
import type { Notice } from 'src/front-components/grid/use-validation';

// Стек уведомлений валидации поверх сетки (REQ-0019-UI). Не модалка, не блокирует
// вид: лёгкие плашки в правом нижнем углу виджета.
//   · ERROR   — красноватый фон/рамка, держится до закрытия (ввод надо исправить);
//   · WARNING — янтарь, мягко, авто-гаснет (переработка: запись уже сохранена).
// Полная рамка + фон-тинт + ведущая иконка (без side-stripe — бан impeccable).
// aria-live=assertive для ошибки (важно), polite для предупреждения.

type Tone = { fg: string; bg: string; border: string; icon: string };

const TONES: Record<Notice['level'], Tone> = {
  error: { fg: T.over, bg: T.overSoft, border: '#f3c4ab', icon: '!' },
  warning: { fg: T.warnSolid, bg: T.warnTint, border: '#f6da90', icon: '△' },
};

const ToastRow = ({ notice, onClose }: { notice: Notice; onClose: () => void }) => {
  const tone = TONES[notice.level];
  return (
    <div
      role="status"
      aria-live={notice.level === 'error' ? 'assertive' : 'polite'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        maxWidth: 340,
        padding: '9px 10px 9px 11px',
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: 9,
        boxShadow: '0 4px 14px rgba(29, 31, 38, 0.10)',
        fontSize: 12.5,
        lineHeight: 1.4,
        color: tone.fg,
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          marginTop: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: tone.fg,
          color: T.onAccent,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {tone.icon}
      </span>
      <span style={{ flex: 1, fontWeight: 500 }}>{notice.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          padding: 0,
          border: 'none',
          borderRadius: 5,
          background: 'transparent',
          color: tone.fg,
          cursor: 'pointer',
          fontSize: 14,
          lineHeight: 1,
          fontFamily: 'inherit',
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </div>
  );
};

export const ValidationToast = ({
  notices,
  onDismiss,
}: {
  notices: Notice[];
  onDismiss: (id: number) => void;
}) => {
  if (notices.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        right: 14,
        bottom: 14,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'auto',
      }}
    >
      {notices.map((n) => (
        <ToastRow key={n.id} notice={n} onClose={() => onDismiss(n.id)} />
      ))}
    </div>
  );
};
