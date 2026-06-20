import { T } from 'src/front-components/grid/tokens';
import { WEEKLY_NORM_HOURS } from 'src/constants/labels';

// SSOT форматирования часов и цветов загрузки (раньше дублировалось в cell/row/footer).

export const DAILY_NORM_HOURS = WEEKLY_NORM_HOURS / 5; // 8 ч/будний день

// Часы → строка: пусто для 0, без хвостовых нулей («8», «2.5», «0.25»).
export const fmtHours = (n: number): string => {
  if (!n) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
};

// То же, но с заглушкой «—» для итоговых колонок.
export const fmtTotal = (n: number): string => (n > 0 ? fmtHours(n) : '—');

// Парсинг ввода: запятая/точка, шаг 0.25, диапазон 0..24.
export const parseHours = (raw: string): number | null => {
  const n = Number(raw.replace(',', '.').trim());
  if (Number.isNaN(n) || n < 0 || n > 24) return null;
  return Math.round(n * 4) / 4;
};

export type LoadLevel = 'empty' | 'under' | 'ok' | 'over';

// Уровень загрузки относительно нормы (для цвета итога).
export const loadLevel = (total: number, norm: number): LoadLevel => {
  if (total <= 0) return 'empty';
  if (total > norm) return 'over';
  if (total >= norm) return 'ok';
  return 'under';
};

export const loadColor = (level: LoadLevel): string =>
  level === 'over' ? T.over : level === 'ok' ? T.ok : level === 'under' ? T.text : T.textFaint;

// Подпись «недобор / норма / переработка» для строки-индикатора.
export const loadHint = (total: number, norm: number): string => {
  const level = loadLevel(total, norm);
  if (level === 'empty') return 'нет записей';
  if (level === 'over') return `переработка +${fmtHours(total - norm)} ч`;
  if (level === 'ok') return 'норма выполнена';
  return `недобор ${fmtHours(norm - total)} ч`;
};
