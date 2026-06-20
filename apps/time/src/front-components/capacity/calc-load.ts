import type {
  CalendarDay,
  CapProject,
  DeptPlan,
  DeptPlanLoad,
  DeptRef,
  EmployeeRef,
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

// Раскид плановых часов РАВНОМЕРНО по календарным дням диапазона [startDate,
// endDate], пересечённым с колонкой периода. Общая логика для проектов и плановых
// загрузок отдела без проекта (REQ-0012).
const plannedHoursInPeriod = (
  plannedEffort: number | null,
  startDate: string | null,
  endDate: string | null,
  period: Period,
): number => {
  if (!plannedEffort || !startDate || !endDate) return 0;
  const ps = utcDay(new Date(startDate));
  const pe = utcDay(new Date(endDate));
  if (pe < ps) return 0;
  const totalDays = pe - ps + 1;
  const cs = utcDay(period.from);
  const ce = utcDay(period.to);
  const overlap = Math.min(pe, ce) - Math.max(ps, cs) + 1;
  if (overlap <= 0) return 0;
  return (plannedEffort * overlap) / totalDays;
};

// Часы проекта, попадающие в период: plannedEffort раскидан РАВНОМЕРНО по
// календарным дням периода действия проекта, пересечённым с колонкой.
export const projectHoursInPeriod = (
  project: CapProject,
  period: Period,
): number =>
  plannedHoursInPeriod(
    project.plannedEffort,
    project.startDate,
    project.endDate,
    period,
  );

// REQ-0012: часы плановой загрузки отдела (без проекта), попадающие в период.
// Раскид той же логикой, что и projectHoursInPeriod.
export const deptPlanHoursInPeriod = (
  plan: DeptPlan,
  period: Period,
): number =>
  plannedHoursInPeriod(plan.plannedEffort, plan.startDate, plan.endDate, period);

// Ячейки загрузки отдела по всем периодам. Загрузка = Σ часов проектов отдела +
// Σ плановых загрузок отдела без проекта (REQ-0012).
export const deptLoadCells = (
  dept: DeptRef,
  projects: CapProject[],
  periods: Period[],
  deptPlans: DeptPlan[] = [],
): LoadCell[] =>
  periods.map((period) => {
    const capacity = deptCapacity(dept, period);
    let load = 0;
    for (const p of projects) {
      if (p.departmentId === dept.id) load += projectHoursInPeriod(p, period);
    }
    for (const dp of deptPlans) {
      if (dp.departmentId === dept.id) load += deptPlanHoursInPeriod(dp, period);
    }
    return { capacity, load, free: capacity - load, ratio: capacity > 0 ? load / capacity : null };
  });

// Срез «по людям»: ячейки загрузки сотрудника. Личная ёмкость = рабочие часы
// периода × коэффициент его отдела. Загрузка = доля плановых часов проектов
// отдела, поделённая поровну на численность отдела (allocation по людям в модели
// нет — равномерное распределение, согласовано с REPORTS_CONTRACT byEmployee).
export const employeeLoadCells = (
  employee: EmployeeRef,
  dept: DeptRef | undefined,
  projects: CapProject[],
  periods: Period[],
  deptPlans: DeptPlan[] = [],
): LoadCell[] => {
  const factor = dept?.capacityFactor ?? 0.8;
  const share = dept && dept.headcount > 0 ? 1 / dept.headcount : 0;
  return periods.map((period) => {
    const capacity = period.workHours * factor;
    let deptLoad = 0;
    if (dept) {
      for (const p of projects) {
        if (p.departmentId === dept.id) deptLoad += projectHoursInPeriod(p, period);
      }
      // REQ-0012: плановые загрузки отдела без проекта тоже делятся поровну.
      for (const dp of deptPlans) {
        if (dp.departmentId === dept.id) deptLoad += deptPlanHoursInPeriod(dp, period);
      }
    }
    const load = deptLoad * share;
    return { capacity, load, free: capacity - load, ratio: capacity > 0 ? load / capacity : null };
  });
};

// Первый период, где отдел освобождается (ratio < threshold) — ответ продажам
// «когда обещать старт». null = окна в горизонте нет.
export const firstFreePeriod = (
  cells: LoadCell[],
  periods: Period[],
  threshold = 0.9,
): string | null => {
  for (let i = 0; i < cells.length; i++) {
    const r = cells[i].ratio;
    if (r !== null && r < threshold) return periods[i].label;
  }
  return null;
};

// Сводная строка «Все отделы»: суммарная ёмкость/загрузка компании по периодам.
export const summaryCells = (perDept: LoadCell[][], periods: Period[]): LoadCell[] =>
  periods.map((_, i) => {
    let capacity = 0;
    let load = 0;
    for (const cells of perDept) {
      capacity += cells[i]?.capacity ?? 0;
      load += cells[i]?.load ?? 0;
    }
    return { capacity, load, free: capacity - load, ratio: capacity > 0 ? load / capacity : null };
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

// REQ-0012: детализация плановых загрузок отдела без проекта по периодам.
// Возвращает только записи с ненулевым вкладом в горизонт, отсортированные по
// сумме часов desc. Для опциональной детализации в UI карточки отдела (Dev1).
export const deptPlanLoads = (
  dept: DeptRef,
  deptPlans: DeptPlan[],
  periods: Period[],
): DeptPlanLoad[] => {
  const out: DeptPlanLoad[] = [];
  for (const plan of deptPlans) {
    if (plan.departmentId !== dept.id) continue;
    const perPeriod = periods.map((per) => deptPlanHoursInPeriod(plan, per));
    const total = perPeriod.reduce((a, b) => a + b, 0);
    if (total > 0) out.push({ plan, perPeriod, total });
  }
  out.sort((a, b) => b.total - a.total);
  return out;
};
