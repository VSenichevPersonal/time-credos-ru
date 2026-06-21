import { T, FONT } from 'src/front-components/grid/tokens';
import { ACCENT_RGB } from 'src/front-components/shared/tokens';
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
// Пороги (референс Timetta, решение арха): |gap%| ≤ 10% баланс; 10..20% близко
// (янтарь/мягкий синий); >20% сильное отклонение (терракот дефицит, синий профицит).
// ±10/20% вместо прежних ±5/15% — меньше ложного «красного шума» на мелких расхождениях.
const GAP_OK = 0.1; // ±10% — в норме
const GAP_NEAR = 0.2; // ±20% — граница «сильного» отклонения
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
  // профицит: близко → лёгкий синий, сильно → заметнее. Ступени разведены
  // (F2.14: 0.10 vs 0.20 едва различались без легенды) → 0.09 / 0.24 — шаг крупнее,
  // глаз различает «близко/сильно» без чтения подписи. Бренд-индиго (ACCENT_RGB).
  const al = a <= GAP_NEAR ? '0.09' : '0.24';
  return { bg: `rgba(${ACCENT_RGB}, ${al})`, fg: T.text };
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

// Раздельные части gap для компактного рендера в ячейке (вмещение, impeccable):
// часы — главное (знак=знак gap), % — вторичное (приглушённый меньший кегль).
// Знак-иконка ▼/▲ рисуется отдельно (gapIcon). Часы — самодостаточны (Timetta:
// gap читаем в ячейке знаком+часами), % уходит вторым планом и НЕ переносит строку.
export const formatGapHours = (cell: LoadCell): string => {
  if (cell.capacity <= 0) return '';
  const h = Math.round(gapHours(cell));
  // Часы — главный носитель: явный знак (+дефицит / −профицит), иконка ▼/▲ дублирует
  // не-цветом (a11y). «−» из Math.round уже есть, «+» добавляем для дефицита.
  const sign = h > 0 ? '+' : '';
  return `${sign}${h}ч`;
};

export const formatGapPctShort = (cell: LoadCell): string => {
  if (cell.capacity <= 0) return '';
  const pct = gapPct(cell);
  return pct === null ? '' : `${Math.abs(Math.round(pct * 100))}%`;
};

// Мин-ширина колонки-периода. Gap-режим несёт самую длинную подпись
// (знак-иконка + «−1112ч» + «83%»), поэтому ему нужна ширина больше базовой —
// иначе данные жмутся/переносятся. Едина для обёртки доски, шапки и строк,
// чтобы колонки тела и заголовков-дат не разъезжались.
export const COL_W = 56; // базовая (free/pct/plan/fact)
export const COL_W_GAP = 68; // gap (вмещает «−1112ч 83%» одной строкой)
export const colWidth = (metric: CellMetric): number =>
  metric === 'gap' ? COL_W_GAP : COL_W;

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

// W6C.23 (RG elastic-overtime): пояснение перегруза для тултипа ячейки.
// «Перегруз: N ч спрос / M ч ёмкость (+K ч)» — спрос (Demand=load, план+HARD-бронь),
// ёмкость и превышение (K = спрос − ёмкость, округлено вверх ≥1 чтобы не показать
// «+0 ч» при дробном перегрузе). Пусто, если конфликта нет. Числа — целые часы.
export const overbookTip = (cell: LoadCell): string => {
  if (!cell.conflict) return '';
  const demand = Math.round(cell.load);
  const capacity = Math.round(cell.capacity);
  const over = Math.max(1, Math.round(cell.load - cell.capacity));
  return `Перегруз: ${demand} ч спрос / ${capacity} ч ёмкость (+${over} ч)`;
};

// Значение ДОЧЕРНЕЙ строки (проект / план без проекта) в выбранной метрике.
// Метрика согласована на всех уровнях (как drill в Timetta): дочерняя строка
// показывает свой ВКЛАД в показатель отдела.
//   v        — плановые часы строки за период (≥0, её вклад в Demand);
//   capacity — ёмкость отдела за период (для метрики «Загрузка %»).
// plan → часы; pct → доля ёмкости отдела; gap → +ч (увеличивает дефицит);
// free → -ч (потребляет ёмкость → меньше свободно). v ≤ 0 → пусто.
export const childCell = (
  metric: CellMetric,
  v: number,
  capacity: number | undefined,
): string => {
  if (v <= 0) return '';
  const h = Math.round(v);
  if (metric === 'pct') return capacity && capacity > 0 ? `${Math.round((v / capacity) * 100)}%` : '';
  if (metric === 'gap') return `+${h}`;
  if (metric === 'free') return `-${h}`;
  return String(h); // plan
};

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
