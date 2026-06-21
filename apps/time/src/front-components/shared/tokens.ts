// SSOT дизайн-токенов приложения time. Единая точка цвета/типографики — чтобы не
// было дрейфа между экранами (сетка, ёмкость, отчёты, календарь).
// Нейтрали тинтованы в холодный hue (не чистые #000/#fff).
// Register: product — инструмент ввода, плотная таблица, спокойная палитра.
// Акцент (учётный синий) держим ≤10% площади: активная ячейка, today, действие.

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
  textFaint: '#9a9ea8',
  onAccent: '#ffffff', // текст/иконка на насыщенной заливке (accent/ok)
  // Акцент (учётный синий) — ≤10% площади
  accent: '#3b6fe0',
  accentHover: '#2f5fcc',
  accentSoft: '#eaf0fd',
  accentRing: '#bcd0fa',
  // Семантика загрузки
  over: '#c2410c', // перелив над нормой
  overSoft: '#fdeee4',
  under: '#9a9ea8', // недобор
  ok: '#15803d',
  okSoft: '#e9f6ed',
  warn: '#b45309', // мягкое предупреждение (>12 ч/день)
  warnSolid: '#92400e', // текст бейджа-предупреждения (напр. «без проекта»)
  warnTint: '#fef3c7', // фон бейджа-предупреждения
} as const;

export const FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
