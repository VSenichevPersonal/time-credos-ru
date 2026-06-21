import type {
  Absence,
  Booking,
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

// WI-05: сумма рабочих часов диапазона дат [startKey..endKey] (YYYY-MM-DD,
// включительно) из календаря. Строковые границы — чтобы не плодить Date.
// Используется делителем/числителем раскида плана по РАБОЧИМ дням.
const workHoursBetweenKeys = (
  hoursByDay: Map<string, number>,
  startKey: string,
  endKey: string,
): number => {
  if (endKey < startKey) return 0;
  let sum = 0;
  for (const [day, h] of hoursByDay) {
    if (day < startKey || day > endKey) continue;
    sum += h;
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

// WI-05: контекст раскида плана по РАБОЧИМ дням производственного календаря.
//   hoursByDay  — карта YYYY-MM-DD → рабочих часов дня (buildHoursByDay). Делитель
//                 раскида = Σ рабочих часов диапазона плана, числитель = Σ рабочих
//                 часов пересечения с колонкой. План «капает» только на будни,
//                 поэтому бьётся с ёмкостью (она тоже по рабочим часам календаря).
//   horizonEnd  — последний день горизонта доски (YYYY-MM-DD). Для проекта БЕЗ
//                 endDate: раскид от startDate до horizonEnd (иначе план невидим).
// Контекст ОПЦИОНАЛЕН: без hoursByDay поведение прежнее (равномерно по календарным
// дням) — обратная совместимость для вызовов без производственного календаря.
export type PlanSpread = {
  hoursByDay?: Map<string, number>;
  horizonEnd?: string;
};

// Раскид плановых часов по диапазону [startDate, endDate], пересечённому с колонкой
// периода. С PlanSpread.hoursByDay — РАВНОМЕРНО по РАБОЧИМ дням (производственный
// календарь: выходные/праздники/короткие дни учтены, инвариант Σ=plannedEffort).
// Без него — прежнее равномерно-по-календарным-дням (back-compat). Общая логика
// для проектов, долей отделов (REQ-0013), планов отдела (REQ-0012) и броней (C).
export const plannedHoursInPeriod = (
  plannedEffort: number | null,
  startDate: string | null,
  endDate: string | null,
  period: Period,
  spread?: PlanSpread,
): number => {
  if (!plannedEffort || !startDate) return 0;
  // Проект без endDate: тянем раскид до конца горизонта доски (если он задан),
  // иначе (нет горизонта) — прежнее поведение «нет даты конца → 0».
  const effEnd = endDate ?? spread?.horizonEnd ?? null;
  if (!effEnd) return 0;

  // Путь по РАБОЧИМ дням (есть производственный календарь).
  if (spread?.hoursByDay) {
    const sKey = startDate.slice(0, 10);
    const eKey = effEnd.slice(0, 10);
    if (eKey < sKey) return 0;
    const totalWork = workHoursBetweenKeys(spread.hoursByDay, sKey, eKey);
    if (totalWork <= 0) return 0; // нет рабочих дней в диапазоне → деление-на-0 защита
    const loKey = dateKey(period.from);
    const hiKey = dateKey(period.to);
    const overStart = sKey > loKey ? sKey : loKey;
    const overEnd = eKey < hiKey ? eKey : hiKey;
    const overlapWork = workHoursBetweenKeys(spread.hoursByDay, overStart, overEnd);
    if (overlapWork <= 0) return 0;
    return (plannedEffort * overlapWork) / totalWork;
  }

  // Back-compat: равномерно по КАЛЕНДАРНЫМ дням (нет производственного календаря).
  const ps = utcDay(new Date(startDate));
  const pe = utcDay(new Date(effEnd));
  if (pe < ps) return 0;
  const totalDays = pe - ps + 1;
  const cs = utcDay(period.from);
  const ce = utcDay(period.to);
  const overlap = Math.min(pe, ce) - Math.max(ps, cs) + 1;
  if (overlap <= 0) return 0;
  return (plannedEffort * overlap) / totalDays;
};

// Часы проекта, попадающие в период: plannedEffort раскидан по периоду действия
// проекта, пересечённому с колонкой. С PlanSpread — по РАБОЧИМ дням (WI-05);
// без него — по календарным (back-compat). Проект без endDate тянется до
// spread.horizonEnd (если задан).
export const projectHoursInPeriod = (
  project: CapProject,
  period: Period,
  spread?: PlanSpread,
): number =>
  plannedHoursInPeriod(
    project.plannedEffort,
    project.startDate,
    project.endDate,
    period,
    spread,
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
  spread?: PlanSpread,
): number =>
  plannedHoursInPeriod(
    share.plannedEffortShare,
    project.startDate,
    project.endDate,
    period,
    spread,
  );

// Часы ОДНОГО проекта, попадающие в загрузку ОТДЕЛА за период, с учётом долей.
// Если у проекта есть доли (sharesByProject) → Σ часов долей ЭТОГО отдела (раскид
// по датам проекта). Fallback (обратная совместимость): у проекта нет ни одной
// доли → старое поведение: весь plannedEffort на project.departmentId.
export const projectDeptHoursInPeriod = (
  project: CapProject,
  deptId: string,
  period: Period,
  sharesByProject?: Map<string, ProjectDeptShare[]>,
  spread?: PlanSpread,
): number => {
  const shares = sharesByProject?.get(project.id);
  if (shares && shares.length > 0) {
    let sum = 0;
    for (const s of shares) {
      if (s.departmentId === deptId) sum += projectShareHoursInPeriod(project, s, period, spread);
    }
    return sum;
  }
  // Fallback: долей нет → целый plannedEffort на «родной» отдел проекта.
  return project.departmentId === deptId ? projectHoursInPeriod(project, period, spread) : 0;
};

// REQ-0012: часы плановой загрузки отдела (без проекта), попадающие в период.
// Раскид той же логикой, что и projectHoursInPeriod.
export const deptPlanHoursInPeriod = (
  plan: DeptPlan,
  period: Period,
  spread?: PlanSpread,
): number =>
  plannedHoursInPeriod(plan.plannedEffort, plan.startDate, plan.endDate, period, spread);

// ===========================================================================
// REQ-0004 Часть C: БРОНЬ ёмкости ресурса (credosTimeBooking) как СЛОЙ Demand.
// Инвариант Timetta (booking-concept/methods): бронь — отдельная ось (резерв),
// НЕ план-оценка и НЕ факт. HARD потребляет ёмкость → суммируется к load (Demand)
// наравне с планом; SOFT НЕ потребляет → отдельный пунктирный слой (тумблер
// tentativeBookingEnabled). Овербукинг НЕ блокируется — показывается как конфликт.
// Раскид hours — той же plannedHoursInPeriod (равномерно по дням периода брони).
// ===========================================================================

// Часы ОДНОЙ брони, попадающие в период (раскид hours по дням [startDate..endDate]).
// С PlanSpread — по РАБОЧИМ дням (WI-05); без него — по календарным (back-compat).
export const bookingHoursInPeriod = (
  booking: Booking,
  period: Period,
  spread?: PlanSpread,
): number =>
  plannedHoursInPeriod(booking.hours, booking.startDate, booking.endDate, period, spread);

// Суммарные часы броней (HARD и SOFT раздельно) для набора броней за период.
export type BookingHours = { hard: number; soft: number };

const sumBookingHours = (
  bookings: Booking[],
  period: Period,
  spread?: PlanSpread,
): BookingHours => {
  let hard = 0;
  let soft = 0;
  for (const b of bookings) {
    const h = bookingHoursInPeriod(b, period, spread);
    if (h <= 0) continue;
    if (b.bookingType === 'HARD') hard += h;
    else soft += h;
  }
  return { hard, soft };
};

// Контекст броней, собираемый в UI один раз на загрузку доски. byEmployee —
// брони, сгруппированные по employeeId (раскид по проектам не нужен: на доске
// учитываем нагрузку ЧЕЛОВЕКА/ОТДЕЛА, не проекта). includeSoft зеркалит
// settings.tentativeBookingEnabled — когда выкл, SOFT-слой не рисуем (но всё равно
// считаем для индикатора=0 при выкл проще: фильтруем на показе, см. cells ниже).
export type BookingCtx = {
  byEmployee: Map<string, Booking[]>;
  employees: EmployeeRef[]; // для агрегации по отделу (employeeId → departmentId)
  includeSoft: boolean;
};

export const buildBookingCtx = (
  bookings: Booking[],
  employees: EmployeeRef[],
  includeSoft: boolean,
): BookingCtx => {
  const byEmployee = new Map<string, Booking[]>();
  for (const b of bookings) {
    if (!b.employeeId) continue;
    const arr = byEmployee.get(b.employeeId) ?? [];
    arr.push(b);
    byEmployee.set(b.employeeId, arr);
  }
  return { byEmployee, employees, includeSoft };
};

// Часы броней ОТДЕЛА за период = Σ броней его сотрудников (HARD/SOFT раздельно).
export const deptBookingHours = (
  dept: DeptRef,
  ctx: BookingCtx | undefined,
  period: Period,
  spread?: PlanSpread,
): BookingHours => {
  if (!ctx) return { hard: 0, soft: 0 };
  let hard = 0;
  let soft = 0;
  for (const e of ctx.employees) {
    if (e.departmentId !== dept.id) continue;
    const bs = ctx.byEmployee.get(e.id);
    if (!bs) continue;
    const h = sumBookingHours(bs, period, spread);
    hard += h.hard;
    soft += h.soft;
  }
  return { hard, soft };
};

// Часы броней ОДНОГО сотрудника за период (HARD/SOFT раздельно).
const empBookingHours = (
  employeeId: string,
  ctx: BookingCtx | undefined,
  period: Period,
  spread?: PlanSpread,
): BookingHours => {
  if (!ctx) return { hard: 0, soft: 0 };
  const bs = ctx.byEmployee.get(employeeId);
  return bs ? sumBookingHours(bs, period, spread) : { hard: 0, soft: 0 };
};

// Собрать LoadCell с учётом слоёв брони. planLoad — Demand плана (проекты+dept-plan).
// HARD прибавляется к load (потребляет ёмкость); SOFT отдельно (не входит в load,
// показывается, только если includeSoft). conflict = Demand > ёмкости.
const composeCell = (
  capacity: number,
  planLoad: number,
  booking: BookingHours,
  includeSoft: boolean,
): LoadCell => {
  const hardBooking = booking.hard;
  const softBooking = includeSoft ? booking.soft : 0;
  const load = planLoad + hardBooking; // Demand (потребляющий ёмкость)
  const conflict = capacity > 0 && load > capacity;
  return {
    capacity,
    load,
    free: capacity - load,
    ratio: capacity > 0 ? load / capacity : null,
    hardBooking,
    softBooking,
    conflict,
  };
};

// Ячейки загрузки отдела по всем периодам. Загрузка = Σ часов проектов отдела +
// Σ плановых загрузок отдела без проекта (REQ-0012) + Σ HARD-броней (REQ-0004 C).
// REQ-0013 13b: вклад проектов считается по долям отделов (sharesByProject), с
// fallback на целый plannedEffort. bookingCtx опционален (без него — прежнее).
export const deptLoadCells = (
  dept: DeptRef,
  projects: CapProject[],
  periods: Period[],
  deptPlans: DeptPlan[] = [],
  ctx?: AbsenceCtx,
  sharesByProject?: Map<string, ProjectDeptShare[]>,
  bookingCtx?: BookingCtx,
  spread?: PlanSpread,
): LoadCell[] =>
  periods.map((period) => {
    const capacity = deptCapacity(dept, period, ctx);
    let planLoad = 0;
    for (const p of projects) {
      planLoad += projectDeptHoursInPeriod(p, dept.id, period, sharesByProject, spread);
    }
    for (const dp of deptPlans) {
      if (dp.departmentId === dept.id) planLoad += deptPlanHoursInPeriod(dp, period, spread);
    }
    const booking = deptBookingHours(dept, bookingCtx, period, spread);
    return composeCell(capacity, planLoad, booking, bookingCtx?.includeSoft ?? false);
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
  bookingCtx?: BookingCtx,
  spread?: PlanSpread,
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
        deptLoad += projectDeptHoursInPeriod(p, dept.id, period, sharesByProject, spread);
      }
      // REQ-0012: плановые загрузки отдела без проекта тоже делятся поровну.
      for (const dp of deptPlans) {
        if (dp.departmentId === dept.id) deptLoad += deptPlanHoursInPeriod(dp, period, spread);
      }
    }
    // REQ-0004 C: личные брони сотрудника НЕ делятся на численность — это его
    // персональный резерв (employee×проект). HARD → в Demand, SOFT → пунктир.
    const planLoad = deptLoad * share;
    const booking = empBookingHours(employee.id, bookingCtx, period, spread);
    return composeCell(capacity, planLoad, booking, bookingCtx?.includeSoft ?? false);
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
// REQ-0004 C: суммируем и слои брони (hard/soft); conflict — если сумма Demand
// превышает суммарную ёмкость.
export const summaryCells = (perDept: LoadCell[][], periods: Period[]): LoadCell[] =>
  periods.map((_, i) => {
    let capacity = 0;
    let load = 0;
    let hardBooking = 0;
    let softBooking = 0;
    for (const cells of perDept) {
      const c = cells[i];
      capacity += c?.capacity ?? 0;
      load += c?.load ?? 0;
      hardBooking += c?.hardBooking ?? 0;
      softBooking += c?.softBooking ?? 0;
    }
    return {
      capacity,
      load,
      free: capacity - load,
      ratio: capacity > 0 ? load / capacity : null,
      hardBooking,
      softBooking,
      conflict: capacity > 0 && load > capacity,
    };
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
  spread?: PlanSpread,
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
    // WI-05: проект без endDate раскидываем до конца горизонта (spread.horizonEnd),
    // иначе (нет горизонта) — как раньше: без даты конца в «без плана».
    const hasEnd = !!p.endDate || !!spread?.horizonEnd;
    if (!p.startDate || !hasEnd) {
      unplanned.push(p);
      continue;
    }
    const perPeriod = periods.map((per) =>
      projectDeptHoursInPeriod(p, dept.id, per, sharesByProject, spread),
    );
    const total = perPeriod.reduce((a, b) => a + b, 0);
    if (total > 0) planned.push({ project: p, perPeriod, total });
    else unplanned.push(p);
  }
  planned.sort((a, b) => b.total - a.total);
  return { planned, unplanned };
};

// Drill 3-й уровень (заказчик «дрилл-даун полный»): раскрытие ПРОЕКТА внутри
// отдела → его доли по ВСЕМ участвующим отделам (мульти-отдел REQ-0013 13b).
// Вклад каждой доли раскидан по датам проекта (projectShareHoursInPeriod).
// Переиспользует уже загруженные sharesByProject — без новых запросов.
// Пусто (или одна доля = текущий отдел) → детализировать нечего.
export type ProjectDeptBreakdown = {
  departmentId: string | null;
  perPeriod: number[];
  total: number;
};

export const projectDeptShareLoads = (
  project: CapProject,
  periods: Period[],
  sharesByProject?: Map<string, ProjectDeptShare[]>,
  spread?: PlanSpread,
): ProjectDeptBreakdown[] => {
  const shares = sharesByProject?.get(project.id);
  if (!shares || shares.length === 0) return [];
  const out: ProjectDeptBreakdown[] = [];
  for (const s of shares) {
    const perPeriod = periods.map((per) => projectShareHoursInPeriod(project, s, per, spread));
    const total = perPeriod.reduce((a, b) => a + b, 0);
    if (total > 0) out.push({ departmentId: s.departmentId, perPeriod, total });
  }
  out.sort((a, b) => b.total - a.total);
  return out;
};

// REQ-0012: детализация плановых загрузок отдела без проекта по периодам.
// Возвращает только записи с ненулевым вкладом в горизонт, отсортированные по
// сумме часов desc. Для опциональной детализации в UI карточки отдела (Dev1).
export const deptPlanLoads = (
  dept: DeptRef,
  deptPlans: DeptPlan[],
  periods: Period[],
  spread?: PlanSpread,
): DeptPlanLoad[] => {
  const out: DeptPlanLoad[] = [];
  for (const plan of deptPlans) {
    if (plan.departmentId !== dept.id) continue;
    const perPeriod = periods.map((per) => deptPlanHoursInPeriod(plan, per, spread));
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
