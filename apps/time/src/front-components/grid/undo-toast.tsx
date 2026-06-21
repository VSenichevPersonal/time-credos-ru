import { useEffect } from 'react';

import { T } from 'src/front-components/grid/tokens';

// W3A.7/W3A.11: тост «Отменить» для мгновенных деструктивных действий (обнулить
// часы строки / удалить ячейку). Не модалка — лёгкая плашка снизу-слева (правый
// угол занят ValidationToast). Авто-гаснет через timeoutMs (5с). Кнопка «Отменить»
// возвращает прежние значения (вызывающий хранит снимок и выполняет re-upsert).
//
// RemDOM-safe: только React-стейт/таймер, без host-DOM. Один тост за раз
// (последнее действие перекрывает прежнее — как в большинстве Excel-подобных UI).

export type UndoState = {
  id: number; // уникальный токен действия (смена id = новый тост)
  message: string;
  onUndo: () => void;
};

export const UndoToast = ({
  state,
  onDismiss,
  timeoutMs = 5000,
}: {
  state: UndoState | null;
  onDismiss: () => void;
  timeoutMs?: number;
}) => {
  // Авто-скрытие по таймеру; пересоздаётся при новом id (новое действие).
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(onDismiss, timeoutMs);
    return () => clearTimeout(t);
  }, [state, onDismiss, timeoutMs]);

  if (!state) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        left: 14,
        bottom: 14,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        maxWidth: 320,
        padding: '9px 10px 9px 12px',
        background: T.text,
        color: T.onAccent,
        border: 'none',
        borderRadius: 9,
        boxShadow: '0 4px 14px rgba(29, 31, 38, 0.18)',
        fontSize: 12.5,
        lineHeight: 1.4,
      }}
    >
      <span style={{ flex: 1, fontWeight: 500 }}>{state.message}</span>
      <button
        type="button"
        onClick={() => {
          state.onUndo();
          onDismiss();
        }}
        style={{
          flexShrink: 0,
          padding: '4px 10px',
          border: `1px solid ${T.onAccent}`,
          borderRadius: 6,
          background: 'transparent',
          color: T.onAccent,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        Отменить
      </button>
    </div>
  );
};
