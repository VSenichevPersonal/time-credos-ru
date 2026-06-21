import { useState } from 'react';

import { T, cellFill } from 'src/front-components/grid/tokens';

// Легенда визуальных сигналов недельной сетки. Заказчик: пользователь не понимал
// значок 🔒 (согласованная ячейка — только чтение). Поясняем РЕАЛЬНО используемые
// в сетке сигналы, не больше: замок (locked), тинт-заливка по часам (cellFill),
// цвет переработки (T.warn), бледная норма-подсказка (T.textFaint).
//
// Формат — по образцу легенды доски планирования (capacity/board-legend): одна
// компактная строка свотчей в шапке, мелкий кегль, flex-wrap. Сворачиваемая
// (useState): не съедает фикс-высоту виджета. Свёрнута — только ссылка-триггер.
// Remote DOM-safe: useState, дизайн-токены, без host-DOM.

// Замок — тот же глиф, что в ячейке (hour-cell LockGlyph), чтобы легенда читалась
// один-в-один с сеткой. Дублируем минимально (read-only-презентация), логику
// ячейки не трогаем.
const LockSwatch = () => (
  <svg
    aria-hidden
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    style={{ flexShrink: 0, opacity: 0.7 }}
  >
    <rect x="1.5" y="4.5" width="7" height="5" rx="1" fill={T.textMuted} />
    <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" stroke={T.textMuted} strokeWidth="1.1" fill="none" />
  </svg>
);

const Item = ({ swatch, label }: { swatch: React.ReactNode; label: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
    {swatch}
    <span style={{ fontSize: 11, color: T.textMuted }}>{label}</span>
  </span>
);

// Цветной квадрат-свотч (заливка ячейки по часам). Граница — как у ячейки сетки.
const FillSwatch = () => (
  <span
    aria-hidden
    style={{
      width: 14,
      height: 14,
      borderRadius: 3,
      background: cellFill(8),
      border: `1px solid ${T.border}`,
      flexShrink: 0,
    }}
  />
);

// Цифра-образец: переработка (T.warn) и норма-подсказка (T.textFaint). tabular-nums —
// как числа в ячейках сетки, чтобы образец совпадал с реальным начертанием.
const NumGlyph = ({ color, faint }: { color: string; faint?: boolean }) => (
  <span
    aria-hidden
    style={{
      fontSize: 12,
      fontWeight: faint ? 400 : 500,
      color,
      opacity: faint ? 0.55 : 1,
      fontVariantNumeric: 'tabular-nums',
      width: 16,
      textAlign: 'center',
      flexShrink: 0,
    }}
  >
    8
  </span>
);

// Подписи легенды — единый список (SSOT). Порядок = порядок свотчей в строке.
// Вынесено для теста (чистые данные без рендера, env=node).
export const LEGEND_LABELS = [
  'Согласовано (только чтение)',
  'Цвет = заполненные часы',
  'Переработка (больше нормы)',
  'Норма дня (подсказка)',
] as const;

export const GridLegend = () => {
  const [open, setOpen] = useState(false);

  const toggle = {
    appearance: 'none' as const,
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 600,
    color: T.textMuted,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '5px 14px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={toggle}
        onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
        onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
      >
        <span aria-hidden style={{ fontSize: 9, transform: open ? 'none' : 'rotate(-90deg)' }}>
          ▾
        </span>
        Обозначения
      </button>

      {open && (
        <>
          <Item swatch={<LockSwatch />} label={LEGEND_LABELS[0]} />
          <Item swatch={<FillSwatch />} label={LEGEND_LABELS[1]} />
          <Item swatch={<NumGlyph color={T.warn} />} label={LEGEND_LABELS[2]} />
          <Item swatch={<NumGlyph color={T.textFaint} faint />} label={LEGEND_LABELS[3]} />
        </>
      )}
    </div>
  );
};
