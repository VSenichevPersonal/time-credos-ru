// Типы ответа /s/reports (контракт docs/data-model/REPORTS_CONTRACT.md).
// Дашборд «Отчёты» и виджет «Бюджет» карточки проекта читают этот контракт.

// Срез группировки в UI дашборда.
export type GroupBy = 'dept' | 'project' | 'employee';

// Доля категории работ внутри строки (R3-D2 byCategory, контракт §byCategory).
export type CategoryShare = {
  category: string; // UPPER_CASE: CLIENT/PRESALE/PILOT/INTERNAL/INFRASTRUCTURE/TRAINING/OTHER
  hours: number; // Σ часов категории в строке (округл. 2 знака)
  share: number | null; // hours / row.fact (0..1), null если fact == 0
};

// Строка агрегата (одна группа или totals).
export type ReportRow = {
  key: string; // id сущности ('total' для итога)
  name: string; // отдел: код; проект: name; сотрудник: «Фамилия Имя»
  fact: number; // Σ часов всех записей группы
  client: number; // Σ часов записей проектов категории CLIENT
  norm: number | null; // нормо-часы периода (null для проектов)
  util: number | null; // утилизация = client / fact (0..1), null если fact == 0
  under: number | null; // недогруз = norm − fact (null где norm null)
  byCategory: CategoryShare[]; // разбивка fact по категории (по убыв. часов), [] если fact==0
};

// Проект несёт категорию, план и долю выработки (для виджета «Бюджет»).
export type ProjectRow = ReportRow & {
  code: string | null;
  category: string | null;
  plannedEffort: number | null; // план проекта (часы)
  budgetUsed: number | null; // факт/план (null если плана нет/0)
};

// Сотрудник несёт код отдела (для группировки «по людям» внутри отдела).
export type EmployeeRow = ReportRow & { dept: string | null };

// Полный ответ /s/reports.
export type ReportsResponse = {
  ok: boolean;
  period: { from: string; to: string };
  groupBy: string | null;
  totals: ReportRow;
  byDept: ReportRow[];
  byProject: ProjectRow[];
  byEmployee: EmployeeRow[];
  error?: string;
};
