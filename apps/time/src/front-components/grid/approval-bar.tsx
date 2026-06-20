import { T } from 'src/front-components/grid/tokens';
import { ENTRY_STATUS_LABELS } from 'src/constants/labels';
import type { PeriodStatus } from 'src/front-components/grid/use-approval';
import { gapsSummary, type WeekGaps } from 'src/front-components/grid/gaps';

// Инлайн-полоса согласования периода (в подвале сетки). Без модалок: бейдж
// статуса + кнопки. Цвета из токенов: нейтральный/янтарный/зелёный/терракот.
// Видна только когда согласование требуется по проектам периода.

type Props = {
  status: PeriodStatus;
  isManager: boolean;
  canSubmit: boolean;
  canResolve: boolean;
  draftCount: number;
  submittedCount: number;
  busy: boolean;
  weekGaps?: WeekGaps; // REQ-0015 §1: чеклист пробелов недели перед отправкой
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
};

// Палитра бейджа по статусу (фон/текст/граница). Терракот = T.over.
const BADGE: Record<Exclude<PeriodStatus, 'none'>, { bg: string; fg: string }> = {
  DRAFT: { bg: T.headerBg, fg: T.textMuted },
  SUBMITTED: { bg: T.overSoft, fg: T.warn },
  APPROVED: { bg: T.okSoft, fg: T.ok },
  REJECTED: { bg: T.overSoft, fg: T.over },
};

const STATUS_LABEL: Record<Exclude<PeriodStatus, 'none'>, string> = {
  DRAFT: ENTRY_STATUS_LABELS.Draft,
  SUBMITTED: ENTRY_STATUS_LABELS.Submitted,
  APPROVED: ENTRY_STATUS_LABELS.Approved,
  REJECTED: ENTRY_STATUS_LABELS.Rejected,
};

const btnBase = {
  height: 26,
  padding: '0 12px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'background 160ms cubic-bezier(0.22,1,0.36,1), opacity 160ms',
} as const;

const Badge = ({ status }: { status: Exclude<PeriodStatus, 'none'> }) => {
  const c = BADGE[status];
  const dot = status === 'SUBMITTED' ? T.warn : status === 'APPROVED' ? T.ok : status === 'REJECTED' ? T.over : T.textFaint;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 22,
        padding: '0 10px',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 11,
        background: c.bg,
        color: c.fg,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: dot }} />
      {STATUS_LABEL[status]}
    </span>
  );
};

export const ApprovalBar = ({
  status,
  isManager,
  canSubmit,
  canResolve,
  draftCount,
  submittedCount,
  busy,
  weekGaps,
  onSubmit,
  onApprove,
  onReject,
}: Props) => {
  if (status === 'none') return null;

  // REQ-0015 §1: предупреждение о пробелах показываем сотруднику, когда есть что
  // отправлять (canSubmit) и неделя заполнена не до нормы. Не блокирует отправку.
  const gapText = !isManager && canSubmit && weekGaps ? gapsSummary(weekGaps) : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderTop: `1px solid ${T.border}`,
        background: T.panelBg,
      }}
    >
      {gapText && <GapsNotice text={gapText} />}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 12px',
        }}
      >
      <Badge status={status} />

      {/* Сотрудник: отправить черновики на согласование (инлайн). */}
      {!isManager && canSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          style={{
            ...btnBase,
            marginLeft: 'auto',
            border: 'none',
            color: '#fff',
            background: busy ? T.accentRing : T.accent,
            opacity: busy ? 0.7 : 1,
          }}
          onMouseEnter={(e) => !busy && (e.currentTarget.style.background = T.accentHover)}
          onMouseLeave={(e) => !busy && (e.currentTarget.style.background = T.accent)}
        >
          Отправить на согласование ({draftCount})
        </button>
      )}

      {/* Руководитель: согласовать/отклонить ожидающие. */}
      {isManager && canResolve && (
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            style={{
              ...btnBase,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: T.over,
              opacity: busy ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !busy && (e.currentTarget.style.background = T.overSoft)}
            onMouseLeave={(e) => !busy && (e.currentTarget.style.background = T.surface)}
          >
            Отклонить ({submittedCount})
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            style={{
              ...btnBase,
              border: 'none',
              background: busy ? T.okSoft : T.ok,
              color: '#fff',
              opacity: busy ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !busy && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => !busy && (e.currentTarget.style.opacity = '1')}
          >
            Согласовать ({submittedCount})
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

// REQ-0015 §1: инлайн-чеклист пробелов недели (без модалок). Янтарный тон —
// мягкое предупреждение, не ошибка: отправка не блокируется.
const GapsNotice = ({ text }: { text: string }) => (
  <div
    role="status"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '6px 12px',
      fontSize: 12,
      color: T.warn,
      background: T.overSoft,
      borderBottom: `1px solid ${T.border}`,
    }}
  >
    <span aria-hidden style={{ fontWeight: 700 }}>!</span>
    <span>
      Не вся неделя заполнена по норме: {text}. Проверьте перед отправкой.
    </span>
  </div>
);
