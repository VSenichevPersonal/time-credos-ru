import type {
  CalendarDay,
  CapProject,
  DeptRef,
  LoadCell,
  Period,
  ProjectLoad,
} from 'src/front-components/capacity/types';

const DAY_MS = 86400000;
const MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];
const utcDay = (d: Date): number =>
  Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY_MS);
const dateKey = (d: Date): string => d.toISOString().slice(0, 10);

// Понедельник недели, содержащей date (UTC).
const mondayOf = (d: Date): Date => {
  const dow = (d.getUTCDay() + 6) % 7; // 0=пн
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow));
};

// Сумма рабочих часов диапазона [from..to] (на 1 сотрудника) из календаря.
const workHoursBetween = (
  hoursByDay: Map<string, number>,
  from: Date,
  to: Date,
): number => {
  let sum = 0;
  for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
    sum += hoursByDay.get(dateKey(new Date(t))) ?? 0;
  }
  return sum;
};

// Колонки горизонта: недели или месяцы от anchor на horizon периодов.
export const buildPeriods = (
  anchor: Date,
  calendar: CalendarDay[],
  granularity: 'week' | 'month',
  count: number,
): Period[] => {
  const hoursByDay = new Map(calendar.map((c) => [c.date, c.hours]));
  const periods: Period[] = [];
  if (granularity === 'week') {
    let from = mondayOf(anchor);
    for (let i = 0; i < count; i++) {
      const to = new Date(from.getTime() + 6 * DAY_MS);
      periods.push({
        key: dateKey(from),
        label: `${from.getUTCDate()} ${MONTHS[from.getUTCMonth()]}`,
        from,
        to,
        workHours: workHoursBetween(hoursByDay, from, to),
      });
      from = new Date(to.getTime() + DAY_MS);
    }
  } else {
    let y = anchor.getUTCFullYear();
    let m = anchor.getUTCMonth();
    for (let i = 0; i < count; i++) {
      const from = new Date(Date.UTC(y, m, 1));
      const to = new Date(Date.UTC(y, m + 1, 0));
      periods.push({
        key: `${y}-${m}`,
        label: `${MONTHS[m]} ${String(y).slice(2)}`,
        from,
        to,
        workHours: workHoursBetween(hoursByDay, from, to),
      });
      m++;
      if (m > 11) { m = 0; y++; }
    }
  }
  return periods;
};

// Ёмкость отдела за период = рабочие часы периода × headcount × коэффициент.
export const deptCapacity = (dept: DeptRef, period: Period): number =>
  period.workHours * dept.headcount * dept.capacityFactor;

// Часы проекта, попадающие в период: plannedEffort раскидан РАВНОМЕРНО по
// календарным дням периода действия проекта, пересечённым с колонкой.
export const projectHoursInPeriod = (
  project: CapProject,
  period: Period,
): number => {
  if (!project.plannedEffort || !project.startDate || !project.endDate) return 0;
  const ps = utcDay(new Date(project.startDate));
  const pe = utcDay(new Date(project.endDate));
  if (pe < ps) return 0;
  const totalDays = pe - ps + 1;
  const cs = utcDay(period.from);
  const ce = utcDay(period.to);
  const overlap = Math.min(pe, ce) - Math.max(ps, cs) + 1;
  if (overlap <= 0) return 0;
  return (project.plannedEffort * overlap) / totalDays;
};

// Ячейки загрузки отдела по всем периодам.
export const deptLoadCells = (
  dept: DeptRef,
  projects: CapProject[],
  periods: Period[],
): LoadCell[] =>
  periods.map((period) => {
    const capacity = deptCapacity(dept, period);
    let load = 0;
    for (const p of projects) {
      if (p.departmentId === dept.id) load += projectHoursInPeriod(p, period);
    }
    return { capacity, load, ratio: capacity > 0 ? load / capacity : null };
  });

// Детализация: вклад каждого проекта отдела по периодам (только с планом/датами).
export const deptProjectLoads = (
  dept: DeptRef,
  projects: CapProject[],
  periods: Period[],
): { planned: ProjectLoad[]; unplanned: CapProject[] } => {
  const planned: ProjectLoad[] = [];
  const unplanned: CapProject[] = [];
  for (const p of projects) {
    if (p.departmentId !== dept.id) continue;
    if (!p.plannedEffort || !p.startDate || !p.endDate) {
      unplanned.push(p);
      continue;
    }
    const perPeriod = periods.map((per) => projectHoursInPeriod(p, per));
    const total = perPeriod.reduce((a, b) => a + b, 0);
    if (total > 0) planned.push({ project: p, perPeriod, total });
    else unplanned.push(p);
  }
  planned.sort((a, b) => b.total - a.total);
  return { planned, unplanned };
};
