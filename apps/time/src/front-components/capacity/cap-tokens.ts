import { T, FONT } from 'src/front-components/grid/tokens';
import type { CellMetric, LoadCell } from 'src/front-components/capacity/types';

export { T, FONT };

// Доска отвечает на вопрос «где продать» → СВОБОДНОЕ место = позитивный видимый
// сигнал: чем больше свободно, тем заметнее спокойный зелёный. Полная загрузка —
// нейтрально (тихо). Перегруз (>100%) — единственная тревога (терракот).
// Без чистых red/green, в тон нейтральной палитры.
export type LoadTone = {
  bg: string;
  fg: string;
};

export const loadTone = (ratio: number | null): LoadTone => {
  if (ratio === null) return { bg: T.headerBg, fg: T.textFaint }; // нет ёмкости
  if (ratio > 1.0) return { bg: '#fbe4dd', fg: '#b3401a' }; // перегруз — тревога
  const free = Math.max(0, Math.min(1, 1 - ratio)); // доля свободного
  if (free <= 0.02) return { bg: 'transparent', fg: T.textMuted }; // ~полная загрузка
  const a = (0.05 + free * 0.2).toFixed(3); // 0.05..0.25 — больше свободно = заметнее
  return { bg: `rgba(21, 128, 61, ${a})`, fg: T.text };
};

// Процент загрузки для подписи ячейки (tabular-nums). Нет ёмкости -> пусто.
export const formatPct = (ratio: number | null): string =>
  ratio === null ? '' : `${Math.round(ratio * 100)}%`;

// DP-0006 §3: средняя загрузка за горизонт (по периодам с ёмкостью) — одна цифра
// на строку вместо чтения всех колонок. null = нет ёмкости ни в одном периоде.
export const SIGMA_W = 72; // ширина колонки «Σ горизонт» (фикс, не flex)
export const avgRatio = (cells: LoadCell[]): number | null => {
  const valid = cells.filter((c) => c.capacity > 0);
  if (valid.length === 0) return null;
  return valid.reduce((s, c) => s + (c.ratio ?? 0), 0) / valid.length;
};

// Значение ячейки по выбранной метрике. Свободно — со знаком (+можно взять / −перегруз).
export const formatCell = (metric: CellMetric, cell: LoadCell): string => {
  if (cell.capacity <= 0) return '';
  if (metric === 'pct') return formatPct(cell.ratio);
  if (metric === 'plan') {
    const l = Math.round(cell.load);
    return l > 0 ? String(l) : '';
  }
  const f = Math.round(cell.free); // free
  return f > 0 ? `+${f}` : String(f);
};
