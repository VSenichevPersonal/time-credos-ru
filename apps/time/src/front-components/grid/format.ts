import { T } from 'src/front-components/grid/tokens';
import { WEEKLY_NORM_HOURS } from 'src/constants/labels';

// SSOT форматирования часов и цветов загрузки (раньше дублировалось в cell/row/footer).

export const DAILY_NORM_HOURS = WEEKLY_NORM_HOURS / 5; // 8 ч/будний день

// REQ-0019: порог «мягкого» предупреждения о переработке (ч/день). Дефолт = 12;
// реальное значение — из настроек credosTimeSettings.overtimeWarnHours (UI читает
// через useGlobalSettings и передаёт в isOvertime). Сверка: Timetta помечает
// аномально длинный день. Константа — fallback и SSOT дефолта.
export const OVERTIME_WARN_HOURS_DEFAULT = 12;

// Превышает ли значение дня порог переработки. Чистая функция: порог можно
// подставить из настроек (fallback OVERTIME_WARN_HOURS_DEFAULT).
export const isOvertime = (
  value: number,
  threshold: number = OVERTIME_WARN_HOURS_DEFAULT,
): boolean => value > threshold;

// Часы → строка: пусто для 0, без хвостовых нулей («8», «2.5», «0.25»).
export const fmtHours = (n: number): string => {
  if (!n) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
};

// То же, но с заглушкой «—» для итоговых колонок.
export const fmtTotal = (n: number): string => (n > 0 ? fmtHours(n) : '—');

// Квантование к шагу 0.25 и проверка диапазона 0..24. null — вне диапазона.
const quantize = (hours: number): number | null => {
  if (Number.isNaN(hours) || hours < 0 || hours > 24) return null;
  return Math.round(hours * 4) / 4;
};

// Сырое число часов из разных форматов (без квантования/диапазона). null — не распознано.
// Поддержка (люди думают в ч:мин — Timetta даёт выбор Decimal/HH:MM):
//   «1.5» / «1,5»   — десятичные (точка/запятая)
//   «1:30»          — HH:MM
//   «1ч30м» / «1ч»  — русские суффиксы ч/м (минуты опциональны)
//   «30м» / «90м»   — только минуты (90м → 1.5 ч)
//   «1h30» / «1h»   — латинский h (+ опц. минуты)
const parseFlexible = (s: string): number | null => {
  // Чистое десятичное (точка/запятая): «1.5», «.5», «3», «3.».
  if (/^\d*[.,]?\d+$/.test(s) || /^\d+[.,]$/.test(s)) {
    const n = Number(s.replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }
  // HH:MM: «1:30», «:45», «2:».
  let m = /^(\d*):(\d*)$/.exec(s);
  if (m) {
    const h = m[1] === '' ? 0 : Number(m[1]);
    const min = m[2] === '' ? 0 : Number(m[2]);
    return h + min / 60;
  }
  // Часы/минуты с суффиксами ч/h/м/m: «1ч30м», «1ч», «30м», «1h30м», «90м».
  m = /^(?:(\d+)\s*[чh])?\s*(?:(\d+)\s*[мm])?$/.exec(s);
  if (m && (m[1] !== undefined || m[2] !== undefined)) {
    const h = m[1] ? Number(m[1]) : 0;
    const min = m[2] ? Number(m[2]) : 0;
    return h + min / 60;
  }
  // «1h30» — латинский h как разделитель без суффикса минут.
  m = /^(\d+)h(\d+)$/.exec(s);
  if (m) return Number(m[1]) + Number(m[2]) / 60;
  return null;
};

// Парсинг ввода: гибкие форматы → часы float, шаг 0.25, диапазон 0..24.
// Пустой/пробельный ввод → 0 (очистка ячейки). null — нераспознано/вне диапазона.
export const parseHours = (raw: string): number | null => {
  const s = raw.trim().toLowerCase();
  if (s === '') return 0;
  const hours = parseFlexible(s);
  return hours === null ? null : quantize(hours);
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
