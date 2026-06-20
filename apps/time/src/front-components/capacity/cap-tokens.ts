import { T, FONT } from 'src/front-components/grid/tokens';

export { T, FONT };

// Цвет загрузки осмысленный (не радуга): спокойный зелёный (есть место) →
// янтарный (плотно) → терракотовый (перегруз). Три ступени, тинтованный фон +
// читаемый текст. Без чистых red/green — в тон нейтральной палитры доски.
export type LoadTone = {
  bg: string;
  fg: string;
};

export const loadTone = (ratio: number | null): LoadTone => {
  if (ratio === null) return { bg: T.headerBg, fg: T.textFaint }; // нет ёмкости
  if (ratio <= 0) return { bg: 'transparent', fg: T.textFaint }; // свободно
  if (ratio < 0.7) return { bg: '#e9f6ed', fg: '#15803d' }; // есть место
  if (ratio < 0.9) return { bg: '#fef6e7', fg: '#a96a09' }; // заполняется
  if (ratio <= 1.05) return { bg: '#fdecdf', fg: '#b45309' }; // плотно
  return { bg: '#fbe4dd', fg: '#b3401a' }; // перегруз
};

// Процент загрузки для подписи ячейки (tabular-nums). Нет ёмкости -> пусто.
export const formatPct = (ratio: number | null): string =>
  ratio === null ? '' : `${Math.round(ratio * 100)}%`;
