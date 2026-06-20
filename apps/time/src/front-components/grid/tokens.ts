// Дизайн-токены сетки. Нейтрали тинтованы в холодный hue (не чистые #000/#fff).
// Register: product — инструмент ввода, плотная таблица, спокойная палитра.

export const T = {
  // Поверхности
  bg: '#fbfbfc',
  surface: '#ffffff',
  headerBg: '#f4f5f7',
  weekendBg: '#f8f8fa',
  rowAlt: '#fcfcfd',
  // Границы
  border: '#e6e7eb',
  borderStrong: '#d4d6dc',
  // Текст
  text: '#1d1f26',
  textMuted: '#6b6f7a',
  textFaint: '#9a9ea8',
  // Акцент (учётный синий) — ≤10% площади
  accent: '#3b6fe0',
  accentSoft: '#eaf0fd',
  // Семантика загрузки
  over: '#c2410c', // перелив над нормой
  under: '#9a9ea8', // недобор
  ok: '#15803d',
} as const;

export const FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
