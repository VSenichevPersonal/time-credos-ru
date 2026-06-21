import { useEffect, useRef, useState } from 'react';

import { T, cellFill } from 'src/front-components/grid/tokens';
import { fmtHours, isOvertime, parseHours } from 'src/front-components/grid/format';

// Ячейка часов: ЧИСТЫЙ ВВОД (WI-01, решение C1). Клик / печать цифры → сразу
// inline-редактирование. Никаких плавающих кнопок в ячейке (чип-нормы / ⇥-fill /
// ✎-коммент убраны — мышью были недостижимы, корень UX-бага «контролы появляются
// при наведении, но не нажимаются»). Все действия строки → меню строки ⋯ (row-menu).
//
// Ячейка несёт только статус (read-only, не интерактив): число, замок (locked),
// цвет-переработка, точка-индикатор комментария. tabular-nums, правое выравнивание.
// Активная (по клавиатуре) подсвечена кольцом. Enter/Tab подтверждают и навигация
// уводит фокус (управляет родитель через onKey).

type Props = {
  value: number; // 0 = пусто
  weekend: boolean;
  today: boolean;
  active: boolean;
  locked?: boolean; // W6-2: согласованная запись — только чтение
  overtimeThreshold?: number; // REQ-0019: порог переработки/день из настроек (fallback 12)
  seed: string | null; // символ, с которого начали печатать
  description?: string | null; // комментарий записи — read-only индикатор (правка в меню ⋯)
  onActivate: () => void;
  onCommit: (hours: number) => void;
  onKey: (e: { key: string; shiftKey: boolean }) => void; // навигация (родитель)
  onSeedConsumed: () => void;
};

export const HourCell = ({
  value,
  weekend,
  today,
  active,
  locked,
  overtimeThreshold,
  seed,
  description,
  onActivate,
  onCommit,
  onKey,
  onSeedConsumed,
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

  // REQ-0019: порог переработки — из настроек (overtimeThreshold), не хардкод 12.
  // isOvertime сам подставит дефолт OVERTIME_WARN_HOURS_DEFAULT, если порог не задан.
  const over = isOvertime(value, overtimeThreshold);
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
      aria-disabled={locked || undefined}
      aria-label={locked ? `Согласовано, только чтение: ${fmtHours(value)} ч` : undefined}
      title={
        locked
          ? 'Согласовано — правка запрещена'
          : over
            ? 'Переработка: часов больше порога'
            : description || undefined
      }
      onClick={() => {
        onActivate();
        if (locked) return; // W6-2: согласованную не редактируем
        setDraft(fmtHours(value));
        setEditing(true);
      }}
      onMouseDown={onActivate}
      style={{
        ...base,
        position: 'relative',
        cursor: locked ? 'default' : 'text',
        // Read-only: тихий нейтральный фон (не цвет-сигнал), приглушённый текст.
        background: locked ? T.panelBg : value > 0 ? cellFill(value) : bg,
        color: locked ? T.textMuted : over ? T.warn : value > 0 ? T.text : T.textFaint,
        fontWeight: value > 0 ? 500 : 400,
        boxShadow: active ? `inset 0 0 0 2px ${T.accent}` : 'none',
        borderRadius: active ? 4 : 0,
      }}
    >
      {/* W6-2: замок — статус read-only не только цветом (a11y). Слева, тихо. */}
      {locked && <LockGlyph />}

      {value > 0 ? fmtHours(value) : '·'}

      {/* Индикатор комментария: тихая точка-маркер (read-only), если описание есть.
          Правка комментария — в меню строки ⋯ → «Комментарий к записи…» (WI-01:
          интерактивная ✎-кнопка убрана из ячейки, мышью была недостижима). */}
      {value > 0 && description && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 3,
            left: 4,
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: T.accent,
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
};

// Тихий замок для read-only (согласованной) ячейки. Маленький, приглушённый,
// слева от числа. Несёт статус не только цветом (a11y): aria-hidden, т.к.
// смысл уже в aria-label контейнера.
const LockGlyph = () => (
  <svg
    aria-hidden
    width="9"
    height="9"
    viewBox="0 0 10 10"
    fill="none"
    style={{ marginRight: 5, opacity: 0.55, flexShrink: 0 }}
  >
    <rect x="1.5" y="4.5" width="7" height="5" rx="1" fill={T.textMuted} />
    <path
      d="M3 4.5V3a2 2 0 0 1 4 0v1.5"
      stroke={T.textMuted}
      strokeWidth="1.1"
      fill="none"
    />
  </svg>
);
