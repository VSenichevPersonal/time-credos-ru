import { plannedHoursInPeriod, type PlanSpread } from 'src/front-components/capacity/calc-load';
import type { DeptRef, Period } from 'src/front-components/capacity/types';

// WI-11 (Фаза-1 «Планировать»): живое превью раскида плана ДО сохранения.
// Чистый расчёт (без сети/React) — переиспользует plannedHoursInPeriod из WI-05,
// поэтому превью совпадает с тем, что ляжет на доску (раскид по РАБОЧИМ дням).
// Сверка: Timetta resource-plan — диапазон + превью по периодам + строка Σ.

const DAY_MS = 86400000;
const MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];
const dateKey = (d: Date): string => d.toISOString().slice(0, 10);

// Сумма рабочих часов диапазона [from..to] (включительно) из календаря дня.
const workHoursOf = (hoursByDay: Map<string, number>, from: Date, to: Date): number => {
  let sum = 0;
  for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
    sum += hoursByDay.get(dateKey(new Date(t))) ?? 0;
  }
  return sum;
};

// Понедельник недели, содержащей date (UTC).
const mondayOf = (d: Date): Date => {
  const dow = (d.getUTCDay() + 6) % 7; // 0=пн
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow));
};

// Колонки превью по диапазону [startKey..endKey] (включительно): месяцы или недели.
// Каждая — Period с workHours из производственного календаря. Пустой/невалидный
// диапазон → []. Гранулярность как у доски: короткие проекты читаемее по неделям.
export const previewBuckets = (
  startKey: string,
  endKey: string,
  hoursByDay: Map<string, number>,
  granularity: 'week' | 'month',
): Period[] => {
  if (!startKey || !endKey || endKey < startKey) return [];
  const start = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const out: Period[] = [];
  if (granularity === 'week') {
    let from = mondayOf(start);
    let guard = 0;
    while (from.getTime() <= end.getTime() && guard < 520) {
      const to = new Date(from.getTime() + 6 * DAY_MS);
      out.push({
        key: dateKey(from),
        label: `${from.getUTCDate()} ${MONTHS[from.getUTCMonth()]}`,
        from,
        to,
        workHours: workHoursOf(hoursByDay, from, to),
      });
      from = new Date(to.getTime() + DAY_MS);
      guard++;
    }
  } else {
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    let guard = 0;
    while ((y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) && guard < 240) {
      const from = new Date(Date.UTC(y, m, 1));
      const to = new Date(Date.UTC(y, m + 1, 0));
      out.push({
        key: `${y}-${m}`,
        label: `${MONTHS[m]} ${String(y).slice(2)}`,
        from,
        to,
        workHours: workHoursOf(hoursByDay, from, to),
      });
      m++;
      if (m > 11) { m = 0; y++; }
      guard++;
    }
  }
  return out;
};

// Способ выбора масштаба превью: до ~70 дней — недели (детально), иначе месяцы.
export const previewGranularity = (startKey: string, endKey: string): 'week' | 'month' => {
  if (!startKey || !endKey || endKey < startKey) return 'month';
  const days = (Date.parse(endKey) - Date.parse(startKey)) / DAY_MS + 1;
  return days <= 70 ? 'week' : 'month';
};

export type PreviewRow = {
  key: string;
  label: string;
  hours: number; // плановые часы, легшие в период (по рабочим дням)
  capacity: number | null; // ёмкость отдела за период (null = нет отдела/ёмкости)
  over: boolean; // план > ёмкости отдела (овербукинг, мягкое предупреждение)
};

export type PreviewResult = {
  rows: PreviewRow[];
  total: number; // Σ раскид (для сверки с plannedEffort)
  maxHours: number; // для масштаба мини-бара
};

// Живое превью раскида: для диапазона С..ПО считает часы по периодам той же
// формулой, что доска (plannedHoursInPeriod, рабочие дни). Овербукинг = план
// периода > ёмкости отдела (deptCapacity = workHours×headcount×factor). dept
// опционален — без него овербукинг не считается (просто раскид + Σ).
export const computePreview = (
  plannedEffort: number | null,
  startKey: string,
  endKey: string,
  hoursByDay: Map<string, number>,
  dept?: DeptRef,
): PreviewResult => {
  const granularity = previewGranularity(startKey, endKey);
  const buckets = previewBuckets(startKey, endKey, hoursByDay, granularity);
  const spread: PlanSpread = { hoursByDay };

  let total = 0;
  let maxHours = 0;
  const rows: PreviewRow[] = buckets.map((p) => {
    const hours = plannedHoursInPeriod(plannedEffort, startKey, endKey, p, spread);
    total += hours;
    if (hours > maxHours) maxHours = hours;
    const capacity =
      dept && dept.headcount > 0
        ? p.workHours * dept.headcount * dept.capacityFactor
        : null;
    return {
      key: p.key,
      label: p.label,
      hours,
      capacity,
      over: capacity != null && hours > capacity + 0.5,
    };
  });

  return { rows, total, maxHours };
};

// Валидация диапазона для способа «Равномерно»: ПО обязательна и ≥ С.
// Возвращает текст ошибки (для подписи) или null. Объём не блокирует сохранение
// (можно очистить план), но без даты ПО раскид неоднозначен — обязываем.
export const validateRange = (
  startKey: string,
  endKey: string,
): string | null => {
  if (!startKey) return 'укажите дату начала «С»';
  if (!endKey) return 'укажите дату «ПО» — иначе план не попадёт на доску';
  if (endKey < startKey) return 'дата «ПО» раньше «С»';
  return null;
};
