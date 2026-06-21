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

// ─── Resource Gap (Timetta resource-gap) ────────────────────────────────────
// Gap = Demand − Capacity = load − capacity = −free. Знак по Timetta:
//   gap > 0 → ДЕФИЦИТ (спрос выше ёмкости, нужны люди),
//   gap < 0 → ПРОФИЦИТ (свободная ёмкость, можно продавать),
//   gap ≈ 0 → баланс.
// Gap% = (Demand − Capacity)/Capacity = ratio − 1.

// Абсолютный gap в часах (Demand − Capacity).
export const gapHours = (cell: LoadCell): number => cell.load - cell.capacity;

// Gap% = ratio − 1 (null если нет ёмкости).
export const gapPct = (cell: LoadCell): number | null =>
  cell.ratio === null ? null : cell.ratio - 1;

// Цветовая шкала Resource Gap по нормам отклонения ±5/10/15% (Timetta).
// Тинтованная, не кричащая (impeccable). Профицит — спокойный синий (можно
// продать), дефицит — янтарь→терракот (перегруз). Баланс — прозрачно.
// Пороги: |gap%| ≤ 5% баланс; 5..15% близко (янтарь/мягкий синий);
// >15% сильное отклонение (терракот для дефицита, насыщенный синий профицит).
const GAP_OK = 0.05; // ±5% — в норме
const GAP_NEAR = 0.15; // ±15% — граница «сильного» отклонения
export const gapTone = (pct: number | null): LoadTone => {
  if (pct === null) return { bg: T.headerBg, fg: T.textFaint }; // нет ёмкости
  const a = Math.abs(pct);
  if (a <= GAP_OK) return { bg: 'transparent', fg: T.textMuted }; // баланс
  if (pct > 0) {
    // дефицит/перегруз: близко → янтарь, сильно → терракот
    return pct <= GAP_NEAR
      ? { bg: T.warnTint, fg: T.warnSolid }
      : { bg: '#fbe4dd', fg: '#b3401a' };
  }
  // профицит: близко → лёгкий синий, сильно → заметнее
  const al = a <= GAP_NEAR ? '0.10' : '0.20';
  return { bg: `rgba(59, 111, 224, ${al})`, fg: T.text };
};

// Знак-иконка (не цвет) для доступности: ▲ дефицит, ▼ профицит, ● баланс.
export const gapIcon = (pct: number | null): string => {
  if (pct === null) return '';
  if (Math.abs(pct) <= GAP_OK) return '●';
  return pct > 0 ? '▲' : '▼';
};

// Подпись gap: «+12ч 8%» дефицит / «−40ч 25%» профицит. Знак часов = знак gap.
export const formatGap = (cell: LoadCell): string => {
  if (cell.capacity <= 0) return '';
  const h = Math.round(gapHours(cell));
  const pct = gapPct(cell);
  const sign = h > 0 ? '+' : '';
  const pctTxt = pct === null ? '' : ` ${Math.abs(Math.round(pct * 100))}%`;
  return `${sign}${h}ч${pctTxt}`;
};

// DP-0006 §3: средняя загрузка за горизонт (по периодам с ёмкостью) — одна цифра
// на строку вместо чтения всех колонок. null = нет ёмкости ни в одном периоде.
export const SIGMA_W = 72; // ширина колонки «Σ горизонт» (фикс, не flex)
export const avgRatio = (cells: LoadCell[]): number | null => {
  const valid = cells.filter((c) => c.capacity > 0);
  if (valid.length === 0) return null;
  return valid.reduce((s, c) => s + (c.ratio ?? 0), 0) / valid.length;
};

// ─── REQ-0004 Часть C: индикатор брони в ячейке ──────────────────────────────
// Бронь — отдельный слой Demand, показывается ПОД основным значением ячейки тихой
// подстрокой (не badge, не цвет-заливка — заливка уже несёт load-тон). HARD —
// сплошная (потребляет ёмкость, входит в load); SOFT — пунктир + приглушённо
// (не потребляет, тумблер). Конфликт (Demand>ёмкости) — тонкая терракот-обводка
// + знак ▲, без смены заливки. impeccable: quiet, дублирование не-цветом (a11y).
export const BOOK_INK = '#5b6472'; // приглушённый HARD-текст (тон нейтрали)
export const BOOK_SOFT_INK = '#8a93a3'; // ещё тише — SOFT
export const CONFLICT_RING = '#b3401a'; // та же терракот-семантика перегруза

// Метка-подстрока брони: «📌4 ⋯2» (HARD 4ч, SOFT 2ч). Возвращает части, чтобы UI
// мог стилизовать SOFT пунктиром. Пусто, если броней нет.
export const bookingParts = (
  cell: LoadCell,
): { hard: number; soft: number; has: boolean } => {
  const hard = Math.round(cell.hardBooking);
  const soft = Math.round(cell.softBooking);
  return { hard, soft, has: hard > 0 || soft > 0 };
};

// Обводка конфликта (овербукинг) — inset-тень, поверх любой заливки. '' если нет.
export const conflictShadow = (cell: LoadCell): string =>
  cell.conflict ? `inset 0 0 0 1.5px ${CONFLICT_RING}` : '';

// Значение ячейки по выбранной метрике. Свободно — со знаком (+можно взять / −перегруз).
export const formatCell = (metric: CellMetric, cell: LoadCell): string => {
  if (cell.capacity <= 0) return '';
  if (metric === 'pct') return formatPct(cell.ratio);
  if (metric === 'gap') return formatGap(cell);
  if (metric === 'plan') {
    const l = Math.round(cell.load);
    return l > 0 ? String(l) : '';
  }
  const f = Math.round(cell.free); // free
  return f > 0 ? `+${f}` : String(f);
};
