import { DAILY_NORM_HOURS, fmtHours } from 'src/front-components/grid/format';
import type { WeekDay } from 'src/front-components/grid/use-week';
import type { NormForDay } from 'src/front-components/grid/use-daily-norm';
import { validateWeekUnderfill } from 'src/constants/validation';

// REQ-0015 §1: pre-submit чеклист пробелов недели. Клиентский расчёт по уже
// загруженной неделе (без доп. запросов). T2 SSOT: норма дня — из произв.
// календаря (normFor); нерабочий день/праздник (норма 0) пробелом не считается.
// Без normFor — деградация на DAILY_NORM_HOURS×будни (back-compat).
// Не блокирует отправку — только предупреждает.
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
  normHours: number; // норма недели (Σ по рабочим дням) — для UC-VAL-03
  factHours: number; // факт недели (Σ по рабочим дням) — для UC-VAL-03
};

// Чистый расчёт: пробелы по будням недели. dayTotals — итоги по 7 дням (из
// useGridModel). Выходные игнорируем. Дни ровно/выше нормы пробелом не считаем.
export const calcWeekGaps = (
  days: WeekDay[],
  dayTotals: number[],
  normFor?: NormForDay,
): WeekGaps => {
  const gaps: DayGap[] = [];
  let emptyCount = 0;
  let underCount = 0;
  let missingHours = 0;
  let normHours = 0; // норма недели — Σ по рабочим дням (UC-VAL-03)
  let factHours = 0; // факт недели — Σ по рабочим дням (UC-VAL-03)

  days.forEach((d, i) => {
    const norm = normFor ? normFor(d.iso, d.isWeekend) : d.isWeekend ? 0 : DAILY_NORM_HOURS;
    if (norm <= 0) return; // нерабочий день/праздник — не пробел
    const total = dayTotals[i] ?? 0;
    normHours += norm;
    factHours += total;
    if (total >= norm) return;
    const kind: DayGap['kind'] = total <= 0 ? 'empty' : 'under';
    if (kind === 'empty') emptyCount += 1;
    else underCount += 1;
    missingHours += norm - total;
    gaps.push({ iso: d.iso, dayLabel: d.dayLabel, total, norm, kind });
  });

  return { gaps, emptyCount, underCount, missingHours, normHours, factHours };
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

// UC-VAL-03: недобор недельной нормы (факт < норма) для подтверждения при submit.
// SSOT-правило — validateWeekUnderfill (constants/validation.ts), порог = норма
// недели из произв. календаря (g.normHours), вход = факт недели (g.factHours).
// Возвращает '' когда недобора нет (факт ≥ норма или норма 0) — поповер не нужен.
// WARNING, не блок: недозаполнение легитимно (отпуск/неполная ставка) — отправка
// разрешена после осознанного подтверждения. Сверка: Timetta — предупреждение о
// неполном таймшите при отправке.
export const weekUnderfillNotice = (g: WeekGaps): string => {
  const finding = validateWeekUnderfill(g.factHours, g.normHours);
  if (!finding) return '';
  return `Неделя недозаполнена: ${fmtHours(g.factHours)} из ${fmtHours(g.normHours)} ч. Всё равно отправить?`;
};

// Склонение «день» для русского чеклиста (1 день / 2 дня / 5 дней).
const pluralDay = (n: number): string => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'дня';
  return 'дней';
};
