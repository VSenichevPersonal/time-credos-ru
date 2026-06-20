import { DAILY_NORM_HOURS, fmtHours } from 'src/front-components/grid/format';
import type { WeekDay } from 'src/front-components/grid/use-week';

// REQ-0015 §1: pre-submit чеклист пробелов недели. Клиентский расчёт по уже
// загруженной неделе (без доп. запросов). Норма дня — DAILY_NORM_HOURS (8 ч),
// рабочие дни — будни (!isWeekend); производственного календаря нет, выходные
// берём из use-week. Не блокирует отправку — только предупреждает.
// Сверка: Timetta pre-submit (подсветка незаполненных/недозаполненных дней).

export type DayGap = {
  iso: string;
  dayLabel: string; // «Пн»
  total: number; // фактические часы дня
  norm: number; // норма дня (8 ч)
  kind: 'empty' | 'under'; // незаполнен полностью / ниже нормы
};

export type WeekGaps = {
  gaps: DayGap[];
  emptyCount: number; // незаполненных рабочих дней
  underCount: number; // рабочих дней ниже нормы (но не пустых)
  missingHours: number; // суммарный недобор до нормы по будням
};

// Чистый расчёт: пробелы по будням недели. dayTotals — итоги по 7 дням (из
// useGridModel). Выходные игнорируем. Дни ровно/выше нормы пробелом не считаем.
export const calcWeekGaps = (days: WeekDay[], dayTotals: number[]): WeekGaps => {
  const gaps: DayGap[] = [];
  let emptyCount = 0;
  let underCount = 0;
  let missingHours = 0;

  days.forEach((d, i) => {
    if (d.isWeekend) return;
    const total = dayTotals[i] ?? 0;
    if (total >= DAILY_NORM_HOURS) return;
    const kind: DayGap['kind'] = total <= 0 ? 'empty' : 'under';
    if (kind === 'empty') emptyCount += 1;
    else underCount += 1;
    missingHours += DAILY_NORM_HOURS - total;
    gaps.push({ iso: d.iso, dayLabel: d.dayLabel, total, norm: DAILY_NORM_HOURS, kind });
  });

  return { gaps, emptyCount, underCount, missingHours };
};

// Короткая сводка для инлайн-подсказки: «Пробелы: 2 дня пусто, 1 ниже нормы
// (недобор 10 ч)». Пусто → '' (показывать панель не нужно).
export const gapsSummary = (g: WeekGaps): string => {
  if (g.gaps.length === 0) return '';
  const parts: string[] = [];
  if (g.emptyCount > 0) parts.push(`${g.emptyCount} ${pluralDay(g.emptyCount)} не заполнено`);
  if (g.underCount > 0) parts.push(`${g.underCount} ниже нормы`);
  return `${parts.join(', ')} (недобор ${fmtHours(g.missingHours)} ч)`;
};

// Склонение «день» для русского чеклиста (1 день / 2 дня / 5 дней).
const pluralDay = (n: number): string => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'дня';
  return 'дней';
};
