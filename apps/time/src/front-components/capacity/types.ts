// Типы доски планирования загрузки (capacity).

// Метрика ячейки. Дефолт — «свободно ч» (то, что продажи могут ещё обещать).
export type CellMetric = 'pct' | 'free' | 'plan';

// Отдел с параметрами ёмкости.
export type DeptRef = {
  id: string;
  name: string;
  code: string | null;
  headcount: number; // численность (0 если не задана)
  capacityFactor: number; // коэффициент (отпуска/накладные)
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
export type LoadCell = {
  capacity: number; // ёмкость (человеко-часы)
  load: number; // плановая загрузка (человеко-часы)
  free: number; // свободно = ёмкость − загрузка (может быть < 0 при перегрузе)
  ratio: number | null; // load/capacity (null если ёмкость 0)
};

// Вклад проекта в загрузку отдела за период (для детализации).
export type ProjectLoad = {
  project: CapProject;
  perPeriod: number[]; // часы по колонкам горизонта
  total: number; // всего часов в горизонте
};
