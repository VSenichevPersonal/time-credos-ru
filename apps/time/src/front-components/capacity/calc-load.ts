import type {
  Absence,
  CalendarDay,
  CapProject,
  DeptPlan,
  DeptPlanLoad,
  DeptRef,
  EmpDeptAssignment,
  EmployeeRef,
  LoadCell,
  Period,
  ProjectDeptShare,
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

// ===========================================================================
// W3-1: вычет отсутствий из ёмкости доски.
// Образец логики — reports-calc.ts (норма /s/reports вычитает рабочие часы
// отсутствий по дате). На доске нет dayType: рабочие часы дня берём из календаря
// напрямую (выходные/праздники в нём = 0 → не вычитаются). Сверка с Timetta:
// доступная ёмкость уменьшается на отпуска/больничные.
// ===========================================================================

// Карта YYYY-MM-DD → рабочих часов дня (из календаря). Дни вне диапазона
// календаря/выходные отсутствуют или равны 0 → вычет по ним = 0 (деградация).
export const buildHoursByDay = (calendar: CalendarDay[]): Map<string, number> => {
  const m = new Map<string, number>();
  for (const c of calendar) m.set(c.date, (m.get(c.date) ?? 0) + (c.hours ?? 0));
  return m;
};

// Часы ОДНОГО отсутствия, попадающие в колонку: Σ рабочих часов календаря по
// дням пересечения [startDate, endDate] отсутствия и [from, to] периода.
export const absenceHoursInPeriod = (
  absence: Absence,
  hoursByDay: Map<string, number>,
  period: Period,
): number => {
  const start = absence.startDate ? absence.startDate.slice(0, 10) : null;
  if (!start) return 0;
  const end = (absence.endDate ? absence.endDate.slice(0, 10) : null) ?? start;
  if (end < start) return 0;
  const lo = dateKey(period.from);
  const hi = dateKey(period.to);
  let sum = 0;
  for (const [day, h] of hoursByDay) {
    if (day < start || day > end) continue;
    if (day < lo || day > hi) continue;
    sum += h;
  }
  return sum;
};

// Карта employeeId → часы его отсутствий, попавшие в период (по всем отсутствиям).
export const absenceHoursByEmpInPeriod = (
  absences: Absence[],
  hoursByDay: Map<string, number>,
  period: Period,
): Map<string, number> => {
  const out = new Map<string, number>();
  for (const a of absences) {
    if (!a.employeeId) continue;
    const h = absenceHoursInPeriod(a, hoursByDay, period);
    if (h > 0) out.set(a.employeeId, (out.get(a.employeeId) ?? 0) + h);
  }
  return out;
};

// Контекст вычета отсутствий, собираемый в UI один раз на загрузку доски.
// employees нужны, чтобы агрегировать часы отсутствий по отделу (employeeId →
// departmentId). Опционален во всех расчётах — без него поведение прежнее.
export type AbsenceCtx = {
  absences: Absence[];
  employees: EmployeeRef[];
  hoursByDay: Map<string, number>;
};

export const buildAbsenceCtx = (
  absences: Absence[],
  employees: EmployeeRef[],
  calendar: CalendarDay[],
): AbsenceCtx => ({
  absences,
  employees,
  hoursByDay: buildHoursByDay(calendar),
});

// Часы отсутствий отдела за период = Σ часов отсутствий его сотрудников.
const deptAbsenceHours = (
  dept: DeptRef,
  ctx: AbsenceCtx | undefined,
  period: Period,
): number => {
  if (!ctx) return 0;
  const byEmp = absenceHoursByEmpInPeriod(ctx.absences, ctx.hoursByDay, period);
  let sum = 0;
  for (const e of ctx.employees) {
    if (e.departmentId === dept.id) sum += byEmp.get(e.id) ?? 0;
  }
  return sum;
};

// Ёмкость отдела за период = рабочие часы периода × headcount × коэффициент,
// уменьшенная на часы отсутствий сотрудников отдела (не ниже 0). Без ctx —
// прежняя формула (обратная совместимость UI до проводки отсутствий).
export const deptCapacity = (
  dept: DeptRef,
  period: Period,
  ctx?: AbsenceCtx,
): number => {
  const base = period.workHours * dept.headcount * dept.capacityFactor;
  return Math.max(0, base - deptAbsenceHours(dept, ctx, period));
};

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

// ===========================================================================
// REQ-0013 13b: загрузка отдела по ДОЛЯМ (credosTimeProjectDepartment).
// Часы доли отдела раскидываются по периоду ДЕЙСТВИЯ ПРОЕКТА (start/end проекта,
// у доли своих дат нет), но эффорт = plannedEffortShare (часы доли), а не весь
// plannedEffort. Σ долей проекта ≈ его plannedEffort. Сверка с Timetta: часы
// проекта раскладываются по подразделениям команды.
// ===========================================================================

// Карта projectId → его доли отделов. Доли без projectId отбрасываются.
export const buildSharesByProject = (
  shares: ProjectDeptShare[],
): Map<string, ProjectDeptShare[]> => {
  const m = new Map<string, ProjectDeptShare[]>();
  for (const s of shares) {
    if (!s.projectId) continue;
    const arr = m.get(s.projectId) ?? [];
    arr.push(s);
    m.set(s.projectId, arr);
  }
  return m;
};

// Часы доли отдела ОДНОГО проекта в периоде: plannedEffortShare раскидан по датам
// проекта (та же plannedHoursInPeriod). 0, если у проекта нет дат/доли пусты.
export const projectShareHoursInPeriod = (
  project: CapProject,
  share: ProjectDeptShare,
  period: Period,
): number =>
  plannedHoursInPeriod(
    share.plannedEffortShare,
    project.startDate,
    project.endDate,
    period,
  );

// Часы ОДНОГО проекта, попадающие в загрузку ОТДЕЛА за период, с учётом долей.
// Если у проекта есть доли (sharesByProject) → Σ часов долей ЭТОГО отдела (раскид
// по датам проекта). Fallback (обратная совместимость): у проекта нет ни одной
// доли → старое поведение: весь plannedEffort на project.departmentId.
const projectDeptHoursInPeriod = (
  project: CapProject,
  deptId: string,
  period: Period,
  sharesByProject?: Map<string, ProjectDeptShare[]>,
): number => {
  const shares = sharesByProject?.get(project.id);
  if (shares && shares.length > 0) {
    let sum = 0;
    for (const s of shares) {
      if (s.departmentId === deptId) sum += projectShareHoursInPeriod(project, s, period);
    }
    return sum;
  }
  // Fallback: долей нет → целый plannedEffort на «родной» отдел проекта.
  return project.departmentId === deptId ? projectHoursInPeriod(project, period) : 0;
};

// REQ-0012: часы плановой загрузки отдела (без проекта), попадающие в период.
// Раскид той же логикой, что и projectHoursInPeriod.
export const deptPlanHoursInPeriod = (
  plan: DeptPlan,
  period: Period,
): number =>
  plannedHoursInPeriod(plan.plannedEffort, plan.startDate, plan.endDate, period);

// Ячейки загрузки отдела по всем периодам. Загрузка = Σ часов проектов отдела +
// Σ плановых загрузок отдела без проекта (REQ-0012). REQ-0013 13b: вклад проектов
// считается по долям отделов (sharesByProject), с fallback на целый plannedEffort.
export const deptLoadCells = (
  dept: DeptRef,
  projects: CapProject[],
  periods: Period[],
  deptPlans: DeptPlan[] = [],
  ctx?: AbsenceCtx,
  sharesByProject?: Map<string, ProjectDeptShare[]>,
): LoadCell[] =>
  periods.map((period) => {
    const capacity = deptCapacity(dept, period, ctx);
    let load = 0;
    for (const p of projects) {
      load += projectDeptHoursInPeriod(p, dept.id, period, sharesByProject);
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
  ctx?: AbsenceCtx,
  sharesByProject?: Map<string, ProjectDeptShare[]>,
): LoadCell[] => {
  const factor = dept?.capacityFactor ?? 0.8;
  const share = dept && dept.headcount > 0 ? 1 / dept.headcount : 0;
  return periods.map((period) => {
    // W3-1: личная ёмкость уменьшается на часы отсутствий ЭТОГО сотрудника
    // (не ниже 0). Без ctx — прежняя формула.
    const baseCapacity = period.workHours * factor;
    const absHours = ctx
      ? absenceHoursByEmpInPeriod(ctx.absences, ctx.hoursByDay, period).get(employee.id) ?? 0
      : 0;
    const capacity = Math.max(0, baseCapacity - absHours);
    let deptLoad = 0;
    if (dept) {
      // REQ-0013 13b: загрузка отдела по долям проектов (fallback на plannedEffort).
      for (const p of projects) {
        deptLoad += projectDeptHoursInPeriod(p, dept.id, period, sharesByProject);
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
// REQ-0013 13b: проект попадает в детализацию отдела, если у отдела есть доля в нём
// (sharesByProject), и его вклад = часы ДОЛИ (раскид по датам проекта). Fallback
// (у проекта нет долей): прежнее — проект «родного» отдела по целому plannedEffort.
export const deptProjectLoads = (
  dept: DeptRef,
  projects: CapProject[],
  periods: Period[],
  sharesByProject?: Map<string, ProjectDeptShare[]>,
): { planned: ProjectLoad[]; unplanned: CapProject[] } => {
  const planned: ProjectLoad[] = [];
  const unplanned: CapProject[] = [];
  for (const p of projects) {
    const shares = sharesByProject?.get(p.id);
    const hasShares = !!shares && shares.length > 0;
    // Относится ли проект к отделу: по доле (13b) либо по departmentId (fallback).
    const belongs = hasShares
      ? shares.some((s) => s.departmentId === dept.id)
      : p.departmentId === dept.id;
    if (!belongs) continue;
    if (!p.startDate || !p.endDate) {
      unplanned.push(p);
      continue;
    }
    const perPeriod = periods.map((per) =>
      projectDeptHoursInPeriod(p, dept.id, per, sharesByProject),
    );
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

// ===========================================================================
// REQ-0011: численность отдела (headcount) = Σ FTE сотрудников с активной
// записью назначения в периоде. Зеркало REQ-0013 (доли отделов проекта):
// сотрудник может работать в нескольких отделах с долями (50/50). Сверка с
// Timetta: частичная занятость (FTE) и срок действия назначения.
// ===========================================================================

// Назначение активно в окне [from, to] (YYYY-MM-DD, включительно по дню):
// startDate ≤ to И (endDate пуст ИЛИ endDate ≥ from). Пустой startDate = с начала
// времён (всегда ≤ to), пустой endDate = бессрочно. Сравнение строкой ISO по дню.
export const isAssignmentActive = (
  assignment: EmpDeptAssignment,
  from: string,
  to: string,
): boolean => {
  const start = assignment.startDate ? assignment.startDate.slice(0, 10) : null;
  const end = assignment.endDate ? assignment.endDate.slice(0, 10) : null;
  if (start && start > to) return false;
  if (end && end < from) return false;
  return true;
};

// Доля ставки записи в единицах FTE (ftePercent/100), отнормированная в [0, 1].
// Пустой ftePercent трактуем как 100% (1.0) — назначение без указанной доли = полная ставка.
const fteUnits = (ftePercent: number | null): number => {
  const pct = ftePercent == null ? 100 : ftePercent;
  if (!(pct > 0)) return 0;
  return Math.min(pct, 100) / 100;
};

// Численность отделов = Σ FTE назначений, активных в окне [from, to].
// Fallback: если у сотрудника НЕТ ни одной записи назначения вообще — он учитывается
// как 100% по employee.departmentId (обратная совместимость до перехода на FTE).
// Сотрудник С записями, но без активной в окне, в численность НЕ попадает (0).
export const fteHeadcountByDept = (
  assignments: EmpDeptAssignment[],
  employees: EmployeeRef[],
  from: string,
  to: string,
): Map<string, number> => {
  const counts = new Map<string, number>();
  // Множество сотрудников, у которых есть хотя бы одна запись назначения —
  // для них fallback по departmentId не применяется.
  const hasAssignment = new Set<string>();
  for (const a of assignments) {
    if (a.employeeId) hasAssignment.add(a.employeeId);
    if (!a.departmentId) continue;
    if (!isAssignmentActive(a, from, to)) continue;
    const fte = fteUnits(a.ftePercent);
    if (fte > 0) counts.set(a.departmentId, (counts.get(a.departmentId) ?? 0) + fte);
  }
  // Fallback по сотрудникам без единой записи: 100% на их «родной» отдел.
  for (const e of employees) {
    if (hasAssignment.has(e.id)) continue;
    if (!e.departmentId) continue;
    counts.set(e.departmentId, (counts.get(e.departmentId) ?? 0) + 1);
  }
  return counts;
};
