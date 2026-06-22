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
  selected?: boolean; // E1.3: входит в прямоугольник выделения (Shift+клик)
  locked?: boolean; // W6-2: согласованная запись — только чтение
  normHint?: number; // W3A.17: норма дня — бледный плейсхолдер пустой ячейки (0=нет)
  overtimeThreshold?: number; // REQ-0019: порог переработки/день из настроек (fallback 12)
  seed: string | null; // символ, с которого начали печатать
  description?: string | null; // комментарий записи — read-only индикатор (правка в меню ⋯)
  onActivate: (extend?: boolean) => void; // extend=true → Shift+клик (диапазон)
  onCommit: (hours: number) => void;
  onKey: (e: { key: string; shiftKey: boolean }) => void; // навигация (родитель)
  onSeedConsumed: () => void;
  onLockedClick?: () => void; // WI-10: клик по 🔒-ячейке → путь отзыва согласования (не тупик)
};

export const HourCell = ({
  value,
  weekend,
  today,
  active,
  selected,
  locked,
  normHint,
  overtimeThreshold,
  seed,
  description,
  onActivate,
  onCommit,
  onKey,
  onSeedConsumed,
  onLockedClick,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false); // E1.6: ввод не распознан → красная рамка
  const inputRef = useRef<HTMLInputElement>(null);
  // E1.5 (F2-паттерн): отличаем вход по клику (выделить всё) от входа по seed-печати
  // (цифра уже заменила значение — выделять/select не нужно).
  const selectOnFocus = useRef(false);

  // Вход в редактирование по seed (печать цифры на активной ячейке). Заблокированную
  // (согласованную) ячейку не редактируем — только seed гасим. Seed уже ЗАМЕНЯЕТ
  // значение (E1.5): draft = сам символ, не дописывается к старому.
  useEffect(() => {
    if (active && seed !== null && !editing) {
      if (!locked) {
        setDraft(seed === '0' ? '' : seed);
        setInvalid(false);
        selectOnFocus.current = false; // seed-ввод: не выделять (уже заменили)
        setEditing(true);
      }
      onSeedConsumed();
    }
  }, [active, seed, editing, locked, onSeedConsumed]);

  useEffect(() => {
    if (!editing) {
      setDraft(fmtHours(value));
      setInvalid(false);
    }
  }, [value, editing]);

  // E1.5: при входе по клику — выделить весь текст (Excel: клик в ячейку = заменить).
  // Remote DOM: у input в песочнице может НЕ быть метода select() → гард по typeof,
  // иначе TypeError роняет виджет (краш при клике по ячейке).
  useEffect(() => {
    if (editing && selectOnFocus.current) {
      const el = inputRef.current as { select?: () => void } | null;
      if (el && typeof el.select === 'function') el.select();
      selectOnFocus.current = false;
    }
  }, [editing]);

  // Возврат: true — закрывать редактор; false — оставить открытым (невалид, E1.6).
  const commit = (): boolean => {
    const parsed = parseHours(draft);
    if (parsed === null) {
      setInvalid(true); // E1.6: НЕ откатываем молча — красная рамка + подсказка
      return false;
    }
    setInvalid(false);
    if (parsed !== value) onCommit(parsed);
    return true;
  };

  // REQ-0019: порог переработки — из настроек (overtimeThreshold), не хардкод 12.
  // isOvertime сам подставит дефолт OVERTIME_WARN_HOURS_DEFAULT, если порог не задан.
  const over = isOvertime(value, overtimeThreshold);
  const bg = today ? T.todayCol : weekend ? T.weekendBg : 'transparent';
  const base = {
    height: 40, // W3A.25: 32→40 (заказчик просил крупнее, ref T ~64×40)
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
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          placeholder="" // подсказку формата убрали (засоряла) — форматы 8 / 8:30 понятны
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            if (invalid) setInvalid(false); // правит ввод → снять красную рамку
          }}
          onBlur={() => {
            // E1.6: уход с ячейки при невалиде — откат к последнему значению
            // (редактор закрывается, держать его нельзя). Подсказка живёт пока редактируем.
            if (!commit()) setDraft(fmtHours(value));
            setInvalid(false);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              // E1.6: невалид → НЕ закрываем, держим красную рамку + подсказку.
              if (commit()) {
                setEditing(false);
                onKey({ key: e.key, shiftKey: e.shiftKey });
              }
            } else if (e.key === 'Escape') {
              setDraft(fmtHours(value));
              setInvalid(false);
              setEditing(false);
            } else if (e.key === 'Home' || e.key === 'End') {
              // W3A.8: в режиме РЕДАКТИРОВАНИЯ Home/End двигают курсор внутри инпута
              // (нативно), а не прыгают по ячейкам — гасим всплытие к контейнеру.
              e.stopPropagation();
            }
          }}
          style={{
            ...base,
            width: '100%',
            textAlign: 'right',
            border: `1px solid ${invalid ? T.over : T.accent}`,
            borderRadius: 4,
            outline: 'none',
            color: invalid ? T.over : T.text,
            fontFamily: 'inherit',
            background: T.surface,
          }}
        />
        {/* E1.6: подсказка форматов вместо тихого отката — под инпутом, не закрывает сетку. */}
        {invalid && (
          <div
            role="alert"
            style={{
              position: 'absolute',
              top: 'calc(100% + 2px)',
              right: 0,
              zIndex: 5,
              whiteSpace: 'nowrap',
              fontSize: 11,
              lineHeight: 1.3,
              color: T.over,
              background: T.surface,
              border: `1px solid ${T.over}`,
              borderRadius: 4,
              padding: '3px 6px',
              boxShadow: '0 4px 14px rgba(29,31,38,0.12)',
            }}
          >
            Не понял. Форматы: 8 · 1.5 · 1:30 · 1ч30м
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      tabIndex={-1}
      aria-disabled={locked || undefined}
      aria-label={
        locked
          ? `Согласовано, только чтение: ${fmtHours(value)} ч${onLockedClick ? '. Нажмите, чтобы отозвать согласование для правки' : ''}`
          : undefined
      }
      title={
        locked
          ? onLockedClick
            ? 'Согласовано — нажмите, чтобы отозвать для правки'
            : 'Согласовано — правка запрещена'
          : over
            ? 'Переработка: часов больше порога'
            : description || undefined
      }
      onClick={(e) => {
        // E1.3: Shift+клик — расширить выделение-диапазон, в правку НЕ входим.
        if (e.shiftKey) {
          onActivate(true);
          return;
        }
        onActivate(false);
        if (locked) {
          // WI-10: клик по 🔒 — не тупик. Ведём к отзыву согласования (revoke/recall),
          // если путь доступен (onLockedClick задан); иначе остаётся read-only.
          onLockedClick?.();
          return; // W6-2: согласованную не редактируем
        }
        setDraft(fmtHours(value));
        selectOnFocus.current = true; // E1.5: клик = выделить всё (Excel-паттерн)
        setEditing(true);
      }}
      onMouseDown={() => onActivate(false)}
      style={{
        ...base,
        position: 'relative',
        cursor: locked ? (onLockedClick ? 'pointer' : 'default') : 'text',
        // Read-only: тихий нейтральный фон (не цвет-сигнал), приглушённый текст.
        // E1.3: ячейка в диапазоне выделения (не активная) — лёгкая accent-подложка.
        background:
          selected && !active
            ? T.accentSoft
            : locked
              ? T.panelBg
              : value > 0
                ? cellFill(value)
                : bg,
        color: locked ? T.textMuted : over ? T.warn : value > 0 ? T.text : T.textFaint,
        fontWeight: value > 0 ? 500 : 400,
        boxShadow: active ? `inset 0 0 0 2px ${T.accent}` : 'none',
        borderRadius: active ? 4 : 0,
      }}
    >
      {/* W6-2: замок — статус read-only не только цветом (a11y). Слева, тихо. */}
      {locked && <LockGlyph />}

      {/* W3A.17: пустая ячейка показывает бледную норму дня (placeholder), а не «·».
          Подсказывает ожидаемое значение, не навязчиво. Для locked/нулевой нормы
          (выходной/праздник) — прежняя нейтральная точка. */}
      {value > 0 ? (
        fmtHours(value)
      ) : !locked && normHint && normHint > 0 ? (
        <span aria-hidden style={{ color: T.textFaint, opacity: 0.55, fontWeight: 400 }}>
          {fmtHours(normHint)}
        </span>
      ) : (
        '·'
      )}

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
