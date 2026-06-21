import { useState } from 'react';

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
  onReject: (comment: string) => void; // причина отклонения обязательна (Timetta)
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
            color: T.onAccent,
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
          <RejectButton
            count={submittedCount}
            busy={busy}
            onReject={onReject}
          />
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            style={{
              ...btnBase,
              border: 'none',
              background: busy ? T.okSoft : T.ok,
              color: T.onAccent,
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

// UC-APR-04: отклонение таймшита требует причину (Timetta — отклонение с
// обязательным комментарием). Кнопка «Отклонить» открывает inline-поповер с
// полем причины; reject отправляется только с непустым текстом. comment
// прокидывается до rejectComment — сотрудник видит, что исправить (UC-APR-05).
// Поповер на useState (Remote DOM-safe, host-DOM/window.prompt нет) — паттерн cell-comment.
const RejectButton = ({
  count,
  busy,
  onReject,
}: {
  count: number;
  busy: boolean;
  onReject: (comment: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0 && !busy;

  const confirm = () => {
    if (!canConfirm) return;
    onReject(trimmed);
    setReason('');
    setOpen(false);
  };

  const cancel = () => {
    setReason('');
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        style={{
          ...btnBase,
          border: `1px solid ${T.border}`,
          background: open ? T.overSoft : T.surface,
          color: T.over,
          opacity: busy ? 0.7 : 1,
        }}
        onMouseEnter={(e) => !busy && (e.currentTarget.style.background = T.overSoft)}
        onMouseLeave={(e) => !busy && (e.currentTarget.style.background = open ? T.overSoft : T.surface)}
      >
        Отклонить ({count})
      </button>
      {open && (
        <>
          <div
            onClick={cancel}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 34,
              left: 0,
              zIndex: 21,
              width: 280,
              background: T.surface,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: 9,
              boxShadow: '0 8px 24px rgba(29,31,38,0.16)',
              padding: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 6 }}>
              Причина отклонения (обязательно)
            </div>
            <textarea
              autoFocus
              value={reason}
              placeholder="Что исправить сотруднику…"
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) confirm();
                if (e.key === 'Escape') cancel();
              }}
              rows={3}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: 12,
                lineHeight: 1.4,
                border: `1px solid ${T.accent}`,
                borderRadius: 6,
                outline: 'none',
                color: T.text,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                background: T.surface,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={cancel}
                style={{
                  ...btnBase,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  color: T.textMuted,
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!canConfirm}
                title={trimmed.length === 0 ? 'Укажите причину отклонения' : undefined}
                style={{
                  ...btnBase,
                  border: 'none',
                  background: T.over,
                  color: T.onAccent,
                  opacity: canConfirm ? 1 : 0.5,
                  cursor: canConfirm ? 'pointer' : 'not-allowed',
                }}
              >
                Отклонить
              </button>
            </div>
          </div>
        </>
      )}
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
