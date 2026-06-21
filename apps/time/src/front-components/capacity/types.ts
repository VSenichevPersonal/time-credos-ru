// Типы доски планирования загрузки (capacity).

// Метрика ячейки. Дефолт — «свободно ч» (то, что продажи могут ещё обещать).
// 'gap' — Resource Gap (Timetta): Demand−Capacity со знаком (дефицит/профицит).
export type CellMetric = 'pct' | 'free' | 'plan' | 'gap';

// Ось группировки доски планирования.
export type CapAxis = 'dept' | 'employee';

// Отдел с параметрами ёмкости.
export type DeptRef = {
  id: string;
  name: string;
  code: string | null;
  headcount: number; // численность (0 если не задана)
  capacityFactor: number; // коэффициент (отпуска/накладные)
};

// Сотрудник для среза «по людям». Личная ёмкость = workHours × capacityFactor отдела.
export type EmployeeRef = {
  id: string;
  name: string;
  departmentId: string | null;
};

// Проект, формирующий загрузку. plannedEffort раскидывается по периоду.
export type CapProject = {
  id: string;
  code: string | null;
  name: string;
  departmentId: string | null;
  plannedEffort: number | null; // плановые часы
  startDate: string | null; // ISO
  endDate: string | null; // ISO
};

// REQ-0013 13b: доля участия отдела в проекте (join credosTimeProjectDepartment).
// plannedEffortShare — ЧАСЫ доли отдела в проекте (не %). Загрузка отдела на доске
// = Σ долей ЭТОГО отдела, каждая раскидана по периоду действия проекта той же
// логикой plannedHoursInPeriod (даты берутся у проекта, эффорт — доля отдела).
// Σ долей проекта ≈ его plannedEffort (валидация мягкая). projectId связывает
// долю с датами проекта (start/end у доли нет).
export type ProjectDeptShare = {
  projectId: string | null;
  departmentId: string | null;
  plannedEffortShare: number | null; // плановые часы доли отдела
};

// REQ-0011: назначение сотрудника на отдел в % FTE с датами действия (join
// credosTimeEmployeeDepartment). Численность отдела (headcount) для ёмкости =
// Σ(ftePercent/100) сотрудников с активной записью в периоде. Дата активна:
// startDate ≤ конец периода И (endDate пуст ИЛИ endDate ≥ начало периода).
// Fallback (нет записей вообще): старый count по employee.departmentId (100%).
export type EmpDeptAssignment = {
  employeeId: string | null;
  departmentId: string | null;
  ftePercent: number | null; // 0..100, доля ставки в отделе
  startDate: string | null; // ISO, пусто = с начала времён
  endDate: string | null; // ISO, пусто = бессрочно
};

// REQ-0012: плановая загрузка отдела БЕЗ привязки к проекту (резерв/пресейл-бронь
// /прочее). plannedEffort раскидывается по периоду той же логикой, что у проекта,
// и суммируется к загрузке отдела на доске.
export type DeptPlan = {
  id: string;
  label: string;
  departmentId: string | null;
  category: string | null;
  plannedEffort: number | null; // плановые часы
  startDate: string | null; // ISO
  endDate: string | null; // ISO
};

// W3-1: отсутствие сотрудника (отпуск/больничный/...). Период [startDate,
// endDate] (по дню, включительно) уменьшает ёмкость сотрудника/отдела на доске —
// вычитаются рабочие часы календаря, попавшие в пересечение с периодом колонки.
export type Absence = {
  employeeId: string | null;
  startDate: string | null; // ISO
  endDate: string | null; // ISO
};

// REQ-0004 Часть C: бронь ёмкости ресурса (резерв человека под проект на период).
// Самостоятельная ось данных (НЕ план-оценка, НЕ факт). hours раскидывается по
// раб. дням периода (как план). type:
//   HARD — потребляет ёмкость → в Demand наравне с планом (сплошная плашка);
//   SOFT — НЕ потребляет → отдельный пунктирный слой (тумблер tentativeBookingEnabled).
export type Booking = {
  id: string;
  employeeId: string | null;
  projectId: string | null;
  bookingType: 'SOFT' | 'HARD';
  hours: number | null;
  startDate: string | null; // ISO
  endDate: string | null; // ISO
};

// День производственного календаря (для ёмкости недели).
export type CalendarDay = {
  date: string; // YYYY-MM-DD
  hours: number; // рабочих часов в дне (0 для выходных/праздников)
};

// Колонка горизонта планирования (неделя или месяц).
export type Period = {
  key: string; // стабильный ключ
  label: string; // подпись колонки
  from: Date; // включительно
  to: Date; // включительно
  workHours: number; // сумма рабочих часов периода (на 1 сотрудника) из календаря
};

// Ячейка загрузки отдела за период.
// REQ-0004 Часть C: бронь учитывается как отдельный слой Demand.
//   · hardBooking — часы HARD-броней периода. ВКЛЮЧЕНЫ в load (потребляют ёмкость,
//     влияют на free/ratio/gap) и продублированы здесь как индикатор.
//   · softBooking — часы SOFT-броней периода. НЕ включены в load (не потребляют);
//     показываются отдельным пунктирным слоем (тумблер tentativeBookingEnabled).
//   · conflict — true, если суммарный Demand (план + HARD-бронь) > ёмкости
//     (овербукинг). Подсветка, НЕ блок.
export type LoadCell = {
  capacity: number; // ёмкость (человеко-часы)
  load: number; // плановая загрузка + HARD-брони (человеко-часы) = Demand
  free: number; // свободно = ёмкость − загрузка (может быть < 0 при перегрузе)
  ratio: number | null; // load/capacity (null если ёмкость 0)
  hardBooking: number; // часы HARD-броней (уже входят в load) — индикатор
  softBooking: number; // часы SOFT-броней (НЕ входят в load) — пунктирный слой
  conflict: boolean; // Demand > ёмкости (овербукинг) — подсветка
};

// Патч плана проекта (ввод руководителем). undefined-поля не трогаются.
export type ProjectPatch = {
  plannedEffort?: number | null;
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
};

// Вклад проекта в загрузку отдела за период (для детализации).
export type ProjectLoad = {
  project: CapProject;
  perPeriod: number[]; // часы по колонкам горизонта
  total: number; // всего часов в горизонте
};

// REQ-0012: вклад плановой загрузки отдела (без проекта) за период.
export type DeptPlanLoad = {
  plan: DeptPlan;
  perPeriod: number[]; // часы по колонкам горизонта
  total: number; // всего часов в горизонте
};
