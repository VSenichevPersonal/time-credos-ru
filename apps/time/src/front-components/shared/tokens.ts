// SSOT дизайн-токенов приложения time. Единая точка цвета/типографики — чтобы не
// было дрейфа между экранами (сетка, ёмкость, отчёты, календарь).
// Нейтрали тинтованы в холодный hue (не чистые #000/#fff).
// Register: product — инструмент ввода, плотная таблица, спокойная палитра.
// Акцент держим ≤10% площади: активная ячейка, today, действие.
//
// Бренд Credos (SSOT — credos ru bitrix /docs/design-system/tokens.css):
//   --ds-cyan  #00bef3 (primary, яркий — только заливки/иконки, контраст 2.2 на белом)
//   --ds-accent #2e47d7 (indigo — кнопки-действия; контраст 7.0 на белом → AA/AAA)
//   --ds-ink   #0a225e (navy — заголовки/тёмный фон)
// Учётный акцент time = бренд-indigo #2e47d7 (был нейтральный #3b6fe0, контраст 4.6
// на грани). Cyan для accent-текста непригоден (низкий контраст) — оставлен в палитре
// чипа sky/turquoise. Бренд-синий единый: T.accent ← чип blue ← heatmap (ACCENT_RGB).

// RGB бренд-индиго для полупрозрачных заливок (heatmap сетки/доски). SSOT — чтобы
// тинт-заливки не дрейфовали от T.accent. = #2e47d7.
export const ACCENT_RGB = '46, 71, 215';

export const T = {
  // Поверхности
  bg: '#fbfbfc',
  surface: '#ffffff',
  headerBg: '#f4f5f7',
  panelBg: '#f7f8fa', // второй нейтральный слой (фильтры/тулбар)
  weekendBg: '#f8f8fa',
  rowAlt: '#fcfcfd',
  todayCol: '#f3f7ff', // тонкая подсветка колонки «сегодня»
  // Границы
  border: '#e6e7eb',
  borderStrong: '#d4d6dc',
  // Текст
  text: '#1d1f26',
  textMuted: '#6b6f7a',
  // textFaint поднят до AA-порога UI (F2.14): #9a9ea8 давал 2.68 на белом (фейл).
  // #7c8089 = 3.96 на #fff, 3.69 на todayCol/weekendBg (≥3:1 для middot/плейсхолдеров/
  // disabled — non-essential текст). Тинт в холодный hue палитры.
  textFaint: '#7c8089',
  onAccent: '#ffffff', // текст/иконка на насыщенной заливке (accent/ok)
  // Акцент (бренд Credos indigo) — ≤10% площади
  accent: '#2e47d7',
  accentHover: '#2539b0', // темнее на hover (контраст 9.2)
  accentSoft: '#eaedfb', // светлый indigo-тинт (фон чипа/soft-кнопки)
  accentRing: '#bcc6f5', // focus-ring (indigo)
  // Семантика загрузки
  over: '#c2410c', // перелив над нормой
  overSoft: '#fdeee4',
  overBorder: '#f3c4ab', // F2.6: рамка тоста-ошибки (был хардкод в validation-toast)
  under: '#7c8089', // недобор (= textFaint, AA)
  ok: '#15803d',
  okSoft: '#e9f6ed',
  warn: '#b45309', // мягкое предупреждение (>12 ч/день)
  warnSolid: '#92400e', // текст бейджа-предупреждения (напр. «без проекта»)
  warnTint: '#fef3c7', // фон бейджа-предупреждения
  warnBorder: '#f6da90', // F2.6: рамка тоста-warning/reminder (был хардкод)
} as const;

export const FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
