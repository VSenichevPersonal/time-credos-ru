/**
 * Чистый расчёт агрегатов /s/reports (без сети) — для unit-тестов (QA R2-QA).
 * Логика утилизации/нормы/недогруза вынесена из reports.logic.ts, чтобы покрыть
 * edge-кейсы (0 ёмкость, праздники, пустой период) без живого REST.
 *
 * Метрики см. reports.logic.ts. CLIENT и WORKDAY/SHORT — UPPER_CASE значения SELECT.
 */

// CLIENT_CATEGORY — из SSOT select-options (тип-завязан на WorkCategory), не хардкод. [ssot-bug]#1
import { CLIENT_CATEGORY } from 'src/constants/select-options';

export { CLIENT_CATEGORY };

export type RawEntry = {
  hours: number | null;
  projectId: string | null;
  employeeId: string | null;
  workTypeId?: string | null; // W4-1 OLAP: ось «вид работ»/«группа видов».
  stageId?: string | null; // W4-1 OLAP: ось «этап».
};
// Справочник видов работ — для осей workType/workTypeGroup (W4-1).
export type RawWorkType = { id: string; name: string | null; group: string | null };
export type RawProject = {
  id: string;
  name: string | null;
  code: string | null;
  category: string | null;
  departmentId: string | null;
  plannedEffort: number | null;
};
export type RawEmployee = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  departmentId: string | null;
};
// headcount (численность) — НЕ ручное поле: вычисляется как число активных
// сотрудников отдела (count credosTimeEmployee where department=X, active=true).
// Поле credosTimeDepartment.headcount в расчёте нормы/ёмкости НЕ используется.
export type RawDepartment = {
  id: string;
  code: string | null;
  capacityFactor: number | null;
};
// date нужен для пересечения дней календаря с периодом отсутствия (F-D phase2).
// Если date == null — день учитывается в базовой норме, но НЕ может быть вычтен
// отсутствием (нечего сопоставить по дате) → деградация безопасная.
export type RawCalendarDay = { hours: number | null; dayType: string | null; date?: string | null };

// Отсутствие сотрудника (отпуск/больничный/...). Период [startDate, endDate]
// (включительно по дню) вычитает рабочие часы календаря из НОРМЫ сотрудника/отдела.
export type RawAbsence = {
  employeeId: string | null;
  startDate: string | null;
  endDate: string | null;
};

// Разбивка часов по категории (R3-D2): доля категории внутри строки.
export type CategoryShare = { category: string; hours: number; share: number | null };

export type Row = {
  key: string;
  name: string;
  fact: number;
  client: number;
  norm: number | null;
  util: number | null;
  under: number | null;
  byCategory: CategoryShare[];
};

export type ReportsInput = {
  entries: RawEntry[];
  projects: RawProject[];
  employees: RawEmployee[];
  departments: RawDepartment[];
  calendar: RawCalendarDay[];
  absences?: RawAbsence[]; // F-D phase2: вычет рабочих часов отсутствий из нормы.
  workTypes?: RawWorkType[]; // W4-1 OLAP: справочник для осей workType/workTypeGroup.
};

// Строка проекта + бюджет (F-A: план vs факт). budgetUsed = fact/plannedEffort.
export type ProjectRow = Row & {
  code: string | null;
  category: string | null;
  plannedEffort: number | null;
  budgetUsed: number | null;
};

export type ReportsResult = {
  ok: true;
  period: { from: string; to: string };
  totals: Row;
  byDept: Row[];
  byProject: ProjectRow[];
  byEmployee: (Row & { dept: string | null })[];
};

export const WORKDAY_TYPES = new Set(['WORKDAY', 'SHORT']);

export const util = (client: number, fact: number): number | null =>
  fact > 0 ? Number((client / fact).toFixed(4)) : null;

// Утилизация/недогруз на готовую строку (после суммирования fact/client/norm).
export const finalize = (row: Row): Row => ({
  ...row,
  util: util(row.client, row.fact),
  under: row.norm == null ? null : Number((row.norm - row.fact).toFixed(2)),
});

// Только день (YYYY-MM-DD) из ISO-строки/даты — для пересечения дней.
const dayKey = (iso: string | null | undefined): string | null =>
  iso ? iso.slice(0, 10) : null;

export const computeReports = (
  input: ReportsInput,
  period: { from: string; to: string },
): ReportsResult => {
  const { entries, projects, employees, departments, calendar } = input;
  const absences = input.absences ?? [];

  // Рабочие дни календаря (WORKDAY|SHORT). hoursByDay — для вычета отсутствий по дате.
  const workdays = calendar.filter((d) => WORKDAY_TYPES.has(d.dayType ?? ''));
  // Базовая норма периода = Σ часов рабочих дней производств. календаря.
  const baseNorm = workdays.reduce((s, d) => s + (d.hours ?? 0), 0);
  // Карта рабочий-день(YYYY-MM-DD) → часы дня (для пересечения с отсутствиями).
  const hoursByDay = new Map<string, number>();
  for (const d of workdays) {
    const k = dayKey(d.date);
    if (k) hoursByDay.set(k, (hoursByDay.get(k) ?? 0) + (d.hours ?? 0));
  }

  const projById = new Map(projects.map((p) => [p.id, p]));
  const deptById = new Map(departments.map((d) => [d.id, d]));
  const empById = new Map(employees.map((e) => [e.id, e]));

  // Вычисляемая численность отдела (headcount) = число активных сотрудников.
  // employees сюда приходят уже отфильтрованными по active=true (см. reports.logic),
  // поэтому простой count по departmentId = численность для ёмкости/нормы.
  // REQ-0011 (FTE-взвешивание) — отдельная задача, здесь не делаем.
  const headcountByDept = new Map<string, number>();
  for (const e of employees) {
    if (e.departmentId) headcountByDept.set(e.departmentId, (headcountByDept.get(e.departmentId) ?? 0) + 1);
  }

  // Часы отсутствий сотрудника = Σ часов рабочих дней календаря, попадающих в
  // период любого его отсутствия [startDate, endDate] (по дню, включительно).
  // Период отчёта уже ограничен (календарь грузится только за [from, to]) →
  // пересечение с периодом обеспечивается составом hoursByDay. Дни вне рабочих
  // (выходные/праздники) в hoursByDay отсутствуют → автоматически 0.
  const periodFrom = dayKey(period.from);
  const periodTo = dayKey(period.to);
  const absenceHoursByEmp = new Map<string, number>();
  for (const a of absences) {
    if (!a.employeeId) continue;
    const start = dayKey(a.startDate);
    const end = dayKey(a.endDate) ?? start;
    if (!start) continue;
    let sum = 0;
    for (const [day, h] of hoursByDay) {
      if (day < start) continue;
      if (end && day > end) continue;
      if (periodFrom && day < periodFrom) continue;
      if (periodTo && day > periodTo) continue;
      sum += h;
    }
    if (sum > 0) absenceHoursByEmp.set(a.employeeId, (absenceHoursByEmp.get(a.employeeId) ?? 0) + sum);
  }
  // Часы отсутствий отдела = Σ по его сотрудникам.
  const absenceHoursByDept = new Map<string, number>();
  for (const e of employees) {
    const h = absenceHoursByEmp.get(e.id) ?? 0;
    if (h > 0 && e.departmentId)
      absenceHoursByDept.set(e.departmentId, (absenceHoursByDept.get(e.departmentId) ?? 0) + h);
  }

  const empName = (e: RawEmployee): string =>
    [e.lastName, e.firstName].filter(Boolean).join(' ') || e.id;
  // Норма отдела = база × headcount × factor − часы отсутствий сотрудников отдела.
  // headcount — ВЫЧИСЛЯЕМЫЙ (число активных сотрудников отдела), не ручное поле.
  // Вычет не опускает норму ниже 0 (защита от переучёта отсутствий).
  const deptNorm = (d: RawDepartment): number => {
    const headcount = headcountByDept.get(d.id) ?? 0;
    const base = baseNorm * headcount * (d.capacityFactor ?? 1);
    return Math.max(0, base - (absenceHoursByDept.get(d.id) ?? 0));
  };
  // Личная норма = база × factor отдела − часы отсутствий сотрудника (не ниже 0).
  const empNorm = (e: RawEmployee): number => {
    const d = e.departmentId ? deptById.get(e.departmentId) : undefined;
    const base = baseNorm * (d?.capacityFactor ?? 1);
    return Math.max(0, base - (absenceHoursByEmp.get(e.id) ?? 0));
  };

  const isClient = (projectId: string | null): boolean =>
    !!projectId && projById.get(projectId)?.category === CLIENT_CATEGORY;
  const deptOfEntry = (e: RawEntry): string | null => {
    const fromEmp = e.employeeId ? empById.get(e.employeeId)?.departmentId : null;
    if (fromEmp) return fromEmp;
    return e.projectId ? (projById.get(e.projectId)?.departmentId ?? null) : null;
  };

  // Категория записи = категория её проекта (UPPER_CASE), иначе 'OTHER' (R3-D2).
  const catOfEntry = (e: RawEntry): string =>
    (e.projectId ? projById.get(e.projectId)?.category : null) ?? 'OTHER';

  type Acc = { fact: number; client: number; cats: Map<string, number> };
  const accDept = new Map<string, Acc>();
  const accProject = new Map<string, Acc>();
  const accEmployee = new Map<string, Acc>();
  const totalCats = new Map<string, number>();
  let totalFact = 0;
  let totalClient = 0;

  const bump = (
    map: Map<string, Acc>,
    key: string | null,
    hours: number,
    client: number,
    cat: string,
  ): void => {
    if (!key) return;
    const cur = map.get(key) ?? { fact: 0, client: 0, cats: new Map<string, number>() };
    cur.fact += hours;
    cur.client += client;
    cur.cats.set(cat, (cur.cats.get(cat) ?? 0) + hours);
    map.set(key, cur);
  };

  // byCategory[] из карты категория→часы, доля = часы/факт (отсортировано по убыв.).
  const buildCats = (cats: Map<string, number> | undefined, fact: number): CategoryShare[] =>
    [...(cats?.entries() ?? [])]
      .map(([category, hours]) => ({
        category,
        hours: Number(hours.toFixed(2)),
        share: fact > 0 ? Number((hours / fact).toFixed(4)) : null,
      }))
      .sort((a, b) => b.hours - a.hours);

  for (const e of entries) {
    const hours = e.hours ?? 0;
    if (hours === 0) continue;
    const client = isClient(e.projectId) ? hours : 0;
    const cat = catOfEntry(e);
    totalFact += hours;
    totalClient += client;
    totalCats.set(cat, (totalCats.get(cat) ?? 0) + hours);
    bump(accDept, deptOfEntry(e), hours, client, cat);
    bump(accProject, e.projectId, hours, client, cat);
    bump(accEmployee, e.employeeId, hours, client, cat);
  }

  const EMPTY_ACC: Acc = { fact: 0, client: 0, cats: new Map<string, number>() };

  const byDept: Row[] = departments.map((d) => {
    const a = accDept.get(d.id) ?? EMPTY_ACC;
    return finalize({
      key: d.id,
      name: d.code ?? d.id,
      fact: a.fact,
      client: a.client,
      norm: Number(deptNorm(d).toFixed(2)),
      util: null,
      under: null,
      byCategory: buildCats(a.cats, a.fact),
    });
  });

  const byProject: ProjectRow[] = projects
    .filter((p) => accProject.has(p.id))
    .map((p) => {
      const a = accProject.get(p.id) ?? EMPTY_ACC;
      const planned = p.plannedEffort;
      return {
        ...finalize({
          key: p.id,
          name: p.name ?? p.code ?? p.id,
          fact: a.fact,
          client: a.client,
          norm: null,
          util: null,
          under: null,
          byCategory: buildCats(a.cats, a.fact),
        }),
        code: p.code,
        category: p.category,
        plannedEffort: planned ?? null,
        // F-A бюджет: доля выработки плана (факт/план). null если плана нет/0.
        budgetUsed: planned && planned > 0 ? Number((a.fact / planned).toFixed(4)) : null,
      };
    });

  const byEmployee: (Row & { dept: string | null })[] = employees
    .filter((e) => accEmployee.has(e.id))
    .map((e) => {
      const a = accEmployee.get(e.id) ?? EMPTY_ACC;
      const d = e.departmentId ? deptById.get(e.departmentId) : undefined;
      return {
        ...finalize({
          key: e.id,
          name: empName(e),
          fact: a.fact,
          client: a.client,
          norm: Number(empNorm(e).toFixed(2)),
          util: null,
          under: null,
          byCategory: buildCats(a.cats, a.fact),
        }),
        dept: d?.code ?? null,
      };
    });

  const totalNorm = byDept.reduce((s, r) => s + (r.norm ?? 0), 0);

  return {
    ok: true,
    period,
    totals: finalize({
      key: 'total',
      name: 'Итого',
      fact: totalFact,
      client: totalClient,
      norm: Number(totalNorm.toFixed(2)),
      util: null,
      under: null,
      byCategory: buildCats(totalCats, totalFact),
    }),
    byDept,
    byProject,
    byEmployee,
  };
};
