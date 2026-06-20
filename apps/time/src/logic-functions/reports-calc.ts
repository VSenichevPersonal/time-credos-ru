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
  // W3-2: теги записи (MULTI_SELECT). Многозначны → срез по тегу = отдельный
  // fan-out проход (часы разносятся по каждому тегу), а не как одно-значные оси
  // выше. Чтобы не ломать одно-ключевой OLAP-движок, полноценная ось «тег» —
  // follow-up; здесь только переносим данные в расчёт.
  tags?: string[] | null;
  // C4 timeseries: дата записи (ISO). Нужна для помесячного бакетирования факта.
  // Опц. — старые срезы (computeReports/computeOlap) её не используют.
  date?: string | null;
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

// REQ-0011: FTE-назначение сотрудника на отдел (employee × department × % FTE × даты).
// Численность отдела для нормы = Σ(ftePercent/100) назначений, активных в периоде отчёта.
export type RawEmpDeptAssignment = {
  employeeId: string | null;
  departmentId: string | null;
  ftePercent: number | null;
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
  // REQ-0011: FTE-назначения. Если переданы — численность отдела = Σ FTE активных
  // в периоде назначений (fallback: сотрудник без записей = 100% по departmentId).
  // Не переданы → прежнее поведение: count активных сотрудников (обратная совместимость).
  assignments?: RawEmpDeptAssignment[];
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

// REQ-0011: численность отделов = Σ FTE назначений, активных в окне [from, to]
// (включительно по дню). Назначение активно: startDate ≤ to И (endDate пуст ИЛИ
// endDate ≥ from). ftePercent пуст = 100%. Fallback: сотрудник без единой записи
// назначения учитывается как 100% по departmentId. Без assignments → null
// (вызывающий применяет прежний count по сотрудникам). Зеркало capacity calc-load.
export const fteHeadcountByDept = (
  assignments: RawEmpDeptAssignment[] | undefined,
  employees: RawEmployee[],
  from: string,
  to: string,
): Map<string, number> | null => {
  if (!assignments) return null;
  const counts = new Map<string, number>();
  const hasAssignment = new Set<string>();
  for (const a of assignments) {
    if (a.employeeId) hasAssignment.add(a.employeeId);
    if (!a.departmentId) continue;
    const start = dayKey(a.startDate);
    const end = dayKey(a.endDate);
    if (start && start > to) continue;
    if (end && end < from) continue;
    const pct = a.ftePercent == null ? 100 : a.ftePercent;
    if (!(pct > 0)) continue;
    const fte = Math.min(pct, 100) / 100;
    counts.set(a.departmentId, (counts.get(a.departmentId) ?? 0) + fte);
  }
  for (const e of employees) {
    if (hasAssignment.has(e.id) || !e.departmentId) continue;
    counts.set(e.departmentId, (counts.get(e.departmentId) ?? 0) + 1);
  }
  return counts;
};

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

  // Вычисляемая численность отдела (headcount). REQ-0011: если переданы FTE-назначения
  // (input.assignments) — численность = Σ(ftePercent/100) активных в периоде отчёта
  // назначений (fallback по сотрудникам без записей = 100%). Иначе — прежний count
  // активных сотрудников по departmentId (employees приходят отфильтрованными active=true).
  const fteHeadcount = fteHeadcountByDept(
    input.assignments,
    employees,
    period.from,
    period.to,
  );
  const headcountByDept = fteHeadcount ?? new Map<string, number>();
  if (!fteHeadcount) {
    for (const e of employees) {
      if (e.departmentId) headcountByDept.set(e.departmentId, (headcountByDept.get(e.departmentId) ?? 0) + 1);
    }
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

// ===========================================================================
// W4-1 OLAP: параметрический /s/reports (groupBy + filters[] + курсор).
// Аддитивно к computeReports (старый 3-срезовый ответ сохранён для совместимости).
// ===========================================================================

export type OlapDimension =
  | 'dept'
  | 'employee'
  | 'project'
  | 'workType'
  | 'category'
  | 'stage'
  | 'workTypeGroup';

export const OLAP_DIMENSIONS: OlapDimension[] = [
  'dept',
  'employee',
  'project',
  'workType',
  'category',
  'stage',
  'workTypeGroup',
];

// Измерения, фильтр по которым РЕЖЕТ факт (норма периода остаётся целой → under
// становится бессмысленным). При активном таком фильтре норму не считаем (null).
const FACT_CUTTING_DIMS = new Set<OlapDimension>([
  'project',
  'workType',
  'category',
  'stage',
  'workTypeGroup',
]);

export type OlapFilter = { dim: OlapDimension; value: string };
export type OlapSort = { by: 'fact' | 'util' | 'under' | 'name'; dir: 'asc' | 'desc' };
export type OlapParams = {
  groupBy: OlapDimension;
  filters?: OlapFilter[];
  limit?: number;
  cursor?: string | null;
  sort?: OlapSort;
};

export type OlapRow = Row & { drillable: OlapDimension[] };
export type OlapResult = {
  ok: true;
  period: { from: string; to: string };
  groupBy: OlapDimension;
  appliedFilters: { dim: OlapDimension; value: string; label: string }[];
  totals: Row;
  rows: OlapRow[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  availableDims: OlapDimension[];
};

export const computeOlap = (
  input: ReportsInput,
  period: { from: string; to: string },
  params: OlapParams,
): OlapResult => {
  const { entries, projects, employees, departments, calendar } = input;
  const absences = input.absences ?? [];
  const workTypes = input.workTypes ?? [];
  const groupBy = params.groupBy;
  const filters = params.filters ?? [];
  const limit = Math.max(1, Math.min(params.limit ?? 100, 1000));
  const offset = params.cursor ? Math.max(0, parseInt(params.cursor, 10) || 0) : 0;

  const projById = new Map(projects.map((p) => [p.id, p]));
  const deptById = new Map(departments.map((d) => [d.id, d]));
  const empById = new Map(employees.map((e) => [e.id, e]));
  const wtById = new Map(workTypes.map((w) => [w.id, w]));

  const empName = (e: RawEmployee): string =>
    [e.lastName, e.firstName].filter(Boolean).join(' ') || e.id;
  const deptOfEntry = (e: RawEntry): string | null => {
    const fromEmp = e.employeeId ? empById.get(e.employeeId)?.departmentId : null;
    if (fromEmp) return fromEmp;
    return e.projectId ? (projById.get(e.projectId)?.departmentId ?? null) : null;
  };
  const catOfEntry = (e: RawEntry): string =>
    (e.projectId ? projById.get(e.projectId)?.category : null) ?? 'OTHER';
  const isClient = (projectId: string | null): boolean =>
    !!projectId && projById.get(projectId)?.category === CLIENT_CATEGORY;

  // Значение измерения для записи (для группировки и фильтрации).
  const dimValue = (e: RawEntry, dim: OlapDimension): string | null => {
    switch (dim) {
      case 'dept':
        return deptOfEntry(e);
      case 'employee':
        return e.employeeId ?? null;
      case 'project':
        return e.projectId ?? null;
      case 'workType':
        return e.workTypeId ?? null;
      case 'category':
        return catOfEntry(e);
      case 'stage':
        return e.stageId ?? null;
      case 'workTypeGroup':
        return (e.workTypeId ? wtById.get(e.workTypeId)?.group : null) ?? null;
      default:
        return null;
    }
  };

  // Человекочитаемое имя ключа измерения.
  const dimLabel = (dim: OlapDimension, key: string): string => {
    switch (dim) {
      case 'dept':
        return deptById.get(key)?.code ?? key;
      case 'employee': {
        const e = empById.get(key);
        return e ? empName(e) : key;
      }
      case 'project': {
        const p = projById.get(key);
        return p?.name ?? p?.code ?? key;
      }
      case 'workType':
        return wtById.get(key)?.name ?? key;
      case 'category':
      case 'workTypeGroup':
        return key; // UPPER_CASE-код; UI маппит в русский ярлык
      case 'stage':
        return key; // имя этапа резолвит UI (справочник этапов не в этом контракте)
      default:
        return key;
    }
  };

  const matchesFilters = (e: RawEntry): boolean =>
    filters.every((f) => dimValue(e, f.dim) === f.value);

  // --- Норма (только для groupBy dept/employee и без факт-режущих фильтров) ---
  const factCutting = filters.some((f) => FACT_CUTTING_DIMS.has(f.dim));
  const normApplies = (groupBy === 'dept' || groupBy === 'employee') && !factCutting;

  const workdayCal = calendar.filter((d) => WORKDAY_TYPES.has(d.dayType ?? ''));
  const baseNorm = workdayCal.reduce((s, d) => s + (d.hours ?? 0), 0);
  const hoursByDay = new Map<string, number>();
  for (const d of workdayCal) {
    const k = dayKey(d.date);
    if (k) hoursByDay.set(k, (hoursByDay.get(k) ?? 0) + (d.hours ?? 0));
  }
  const pFrom = dayKey(period.from);
  const pTo = dayKey(period.to);
  const absByEmp = new Map<string, number>();
  for (const a of absences) {
    if (!a.employeeId) continue;
    const start = dayKey(a.startDate);
    const end = dayKey(a.endDate) ?? start;
    if (!start) continue;
    let sum = 0;
    for (const [day, h] of hoursByDay) {
      if (day < start || (end && day > end)) continue;
      if (pFrom && day < pFrom) continue;
      if (pTo && day > pTo) continue;
      sum += h;
    }
    if (sum > 0) absByEmp.set(a.employeeId, (absByEmp.get(a.employeeId) ?? 0) + sum);
  }
  // REQ-0011: численность отдела для нормы = Σ FTE активных в периоде назначений
  // (fallback по сотрудникам без записей = 100%). Без input.assignments — прежний count.
  const fteHeadcount = fteHeadcountByDept(
    input.assignments,
    employees,
    period.from,
    period.to,
  );
  const headcountByDept = fteHeadcount ?? new Map<string, number>();
  if (!fteHeadcount)
    for (const e of employees)
      if (e.departmentId) headcountByDept.set(e.departmentId, (headcountByDept.get(e.departmentId) ?? 0) + 1);
  const absByDept = new Map<string, number>();
  for (const e of employees) {
    const h = absByEmp.get(e.id) ?? 0;
    if (h > 0 && e.departmentId) absByDept.set(e.departmentId, (absByDept.get(e.departmentId) ?? 0) + h);
  }
  const normOfKey = (key: string): number | null => {
    if (!normApplies) return null;
    if (groupBy === 'employee') {
      const e = empById.get(key);
      if (!e) return null;
      const d = e.departmentId ? deptById.get(e.departmentId) : undefined;
      return Math.max(0, baseNorm * (d?.capacityFactor ?? 1) - (absByEmp.get(key) ?? 0));
    }
    // dept
    const d = deptById.get(key);
    if (!d) return null;
    return Math.max(0, baseNorm * (headcountByDept.get(key) ?? 0) * (d.capacityFactor ?? 1) - (absByDept.get(key) ?? 0));
  };

  // --- Один проход: фильтр → накопление по ключу groupBy ---
  type Acc = { fact: number; client: number; cats: Map<string, number> };
  const acc = new Map<string, Acc>();
  const totalCats = new Map<string, number>();
  let totalFact = 0;
  let totalClient = 0;
  for (const e of entries) {
    const hours = e.hours ?? 0;
    if (hours === 0) continue;
    if (!matchesFilters(e)) continue;
    const key = dimValue(e, groupBy);
    if (!key) continue;
    const client = isClient(e.projectId) ? hours : 0;
    const cat = catOfEntry(e);
    totalFact += hours;
    totalClient += client;
    totalCats.set(cat, (totalCats.get(cat) ?? 0) + hours);
    const cur = acc.get(key) ?? { fact: 0, client: 0, cats: new Map<string, number>() };
    cur.fact += hours;
    cur.client += client;
    cur.cats.set(cat, (cur.cats.get(cat) ?? 0) + hours);
    acc.set(key, cur);
  }

  const buildCats = (cats: Map<string, number>, fact: number): CategoryShare[] =>
    [...cats.entries()]
      .map(([category, hours]) => ({
        category,
        hours: Number(hours.toFixed(2)),
        share: fact > 0 ? Number((hours / fact).toFixed(4)) : null,
      }))
      .sort((a, b) => b.hours - a.hours);

  // Доступные оси drill = все, кроме groupBy и уже зафильтрованных.
  const usedDims = new Set<OlapDimension>([groupBy, ...filters.map((f) => f.dim)]);
  const availableDims = OLAP_DIMENSIONS.filter((d) => !usedDims.has(d));

  let rows: OlapRow[] = [...acc.entries()].map(([key, a]) => ({
    ...finalize({
      key,
      name: dimLabel(groupBy, key),
      fact: a.fact,
      client: a.client,
      norm: normOfKey(key),
      util: null,
      under: null,
      byCategory: buildCats(a.cats, a.fact),
    }),
    drillable: availableDims,
  }));

  // Сортировка (дефолт: факт убыв.).
  const sortBy = params.sort?.by ?? 'fact';
  const dir = params.sort?.dir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    if (sortBy === 'name') return dir * a.name.localeCompare(b.name);
    const av = (a[sortBy] ?? 0) as number;
    const bv = (b[sortBy] ?? 0) as number;
    return dir * (av - bv);
  });

  const total = rows.length;
  const page = rows.slice(offset, offset + limit);
  const hasNextPage = offset + limit < total;

  return {
    ok: true,
    period,
    groupBy,
    appliedFilters: filters.map((f) => ({ dim: f.dim, value: f.value, label: dimLabel(f.dim, f.value) })),
    totals: finalize({
      key: 'total',
      name: 'Итого',
      fact: totalFact,
      client: totalClient,
      norm: null, // итог-норма по срезу неоднозначна при фильтрах — UI берёт из rows при необходимости
      util: null,
      under: null,
      byCategory: buildCats(totalCats, totalFact),
    }),
    rows: page,
    pageInfo: { hasNextPage, endCursor: hasNextPage ? String(offset + limit) : null },
    availableDims,
  };
};

// ===========================================================================
// C4 (Kimai reporting): «Тренд утилизации по месяцам» — динамика факт/норма/
// утилизация/недогруз ПО МЕСЯЦАМ за период (напр. янв–дек), опц. разрез по отделу.
// Аддитивно: те же формулы, что в computeReports (календарь, отсутствия, FTE-
// headcount), но разложенные по месяцам. 12 точек → пагинация не нужна.
//
// ИНВАРИАНТ: Σ по месяцам fact == годовой fact, Σ по месяцам norm == годовая
// norm (тот же набор рабочих дней/отсутствий, просто сгруппированный по месяцам).
// ===========================================================================

// YYYY-MM из ISO-строки/даты (бакет месяца). null если даты нет.
const monthKey = (iso: string | null | undefined): string | null =>
  iso ? iso.slice(0, 7) : null;

export type TimeseriesPoint = {
  month: string; // 'YYYY-MM'
  fact: number; // Σ часов записей месяца (после опц. фильтра отдела)
  client: number; // Σ клиентских часов месяца
  norm: number; // нормо-часы месяца (рабочие дни месяца × headcount/FTE × factor − отсутствия)
  util: number | null; // client / fact, null если fact == 0
  under: number; // norm − fact (>0 недогруз, <0 перегруз)
};

export type TimeseriesParams = {
  // Опц. фильтр отдела: считать только записи/норму этого отдела (по его id,
  // как в OLAP-фильтрах). null/undefined → весь воркспейс (все отделы).
  departmentId?: string | null;
};

export type TimeseriesResult = {
  ok: true;
  period: { from: string; to: string };
  departmentId: string | null;
  months: TimeseriesPoint[];
};

export const computeTimeseries = (
  input: ReportsInput,
  period: { from: string; to: string },
  params: TimeseriesParams = {},
): TimeseriesResult => {
  const { entries, projects, employees, departments, calendar } = input;
  const absences = input.absences ?? [];
  const deptFilter = params.departmentId ?? null;

  const projById = new Map(projects.map((p) => [p.id, p]));
  const empById = new Map(employees.map((e) => [e.id, e]));

  const isClient = (projectId: string | null): boolean =>
    !!projectId && projById.get(projectId)?.category === CLIENT_CATEGORY;
  const deptOfEntry = (e: RawEntry): string | null => {
    const fromEmp = e.employeeId ? empById.get(e.employeeId)?.departmentId : null;
    if (fromEmp) return fromEmp;
    return e.projectId ? (projById.get(e.projectId)?.departmentId ?? null) : null;
  };

  // Отделы, попадающие в норму: при фильтре — только он, иначе все.
  const normDepartments = deptFilter
    ? departments.filter((d) => d.id === deptFilter)
    : departments;
  // Сотрудники, чьи отсутствия вычитаются: при фильтре — только отдела фильтра.
  const normEmployees = deptFilter
    ? employees.filter((e) => e.departmentId === deptFilter)
    : employees;

  // REQ-0011: численность по FTE (как в computeReports). headcount по периоду
  // отчёта целиком — он постоянен в пределах периода (назначение активно/нет).
  const fteHeadcount = fteHeadcountByDept(
    input.assignments,
    employees,
    period.from,
    period.to,
  );
  const headcountByDept = fteHeadcount ?? new Map<string, number>();
  if (!fteHeadcount)
    for (const e of employees)
      if (e.departmentId)
        headcountByDept.set(e.departmentId, (headcountByDept.get(e.departmentId) ?? 0) + 1);

  const pFrom = dayKey(period.from);
  const pTo = dayKey(period.to);

  // Рабочие дни календаря с датами → группируем часы по месяцу (для нормы) и
  // строим карту день→часы (для пересечения с отсутствиями).
  const workdays = calendar.filter((d) => WORKDAY_TYPES.has(d.dayType ?? ''));
  const baseNormByMonth = new Map<string, number>();
  const hoursByDay = new Map<string, number>();
  for (const d of workdays) {
    const day = dayKey(d.date);
    const m = monthKey(d.date);
    const h = d.hours ?? 0;
    if (m) baseNormByMonth.set(m, (baseNormByMonth.get(m) ?? 0) + h);
    if (day) hoursByDay.set(day, (hoursByDay.get(day) ?? 0) + h);
  }

  // Часы отсутствий по (отдел, месяц) — вычитаются из нормы месяца этого отдела.
  // Только сотрудники, попадающие в norm-набор (учёт фильтра отдела).
  const normEmpIds = new Set(normEmployees.map((e) => e.id));
  const absHoursByDeptMonth = new Map<string, number>(); // ключ `${deptId}|${YYYY-MM}`
  for (const a of absences) {
    if (!a.employeeId || !normEmpIds.has(a.employeeId)) continue;
    const dept = empById.get(a.employeeId)?.departmentId;
    if (!dept) continue;
    const start = dayKey(a.startDate);
    const end = dayKey(a.endDate) ?? start;
    if (!start) continue;
    for (const [day, h] of hoursByDay) {
      if (day < start || (end && day > end)) continue;
      if (pFrom && day < pFrom) continue;
      if (pTo && day > pTo) continue;
      const m = day.slice(0, 7);
      const k = `${dept}|${m}`;
      absHoursByDeptMonth.set(k, (absHoursByDeptMonth.get(k) ?? 0) + h);
    }
  }

  // Норма месяца = Σ по norm-отделам: baseNorm(месяц) × headcount × factor −
  // отсутствия(отдел, месяц). Не ниже 0 на каждый отдел (как в computeReports).
  const normOfMonth = (month: string): number => {
    const base = baseNormByMonth.get(month) ?? 0;
    let sum = 0;
    for (const d of normDepartments) {
      const headcount = headcountByDept.get(d.id) ?? 0;
      const gross = base * headcount * (d.capacityFactor ?? 1);
      const abs = absHoursByDeptMonth.get(`${d.id}|${month}`) ?? 0;
      sum += Math.max(0, gross - abs);
    }
    return sum;
  };

  // Накопление факта/клиента по месяцам (после опц. фильтра отдела).
  type Acc = { fact: number; client: number };
  const accByMonth = new Map<string, Acc>();
  for (const e of entries) {
    const hours = e.hours ?? 0;
    if (hours === 0) continue;
    if (deptFilter && deptOfEntry(e) !== deptFilter) continue;
    // Факт раскладывается по месяцу даты записи (credosTimeEntry.date). Запись без
    // date в бакеты не попадает (нечего сопоставить) → безопасная деградация.
    const m = monthKey(e.date);
    if (!m) continue;
    const cur = accByMonth.get(m) ?? { fact: 0, client: 0 };
    cur.fact += hours;
    cur.client += isClient(e.projectId) ? hours : 0;
    accByMonth.set(m, cur);
  }

  // Множество месяцев = все месяцы с фактом ∪ все месяцы рабочего календаря
  // (норма есть даже в месяце без записей — для тренда недогруза).
  const monthsSet = new Set<string>([...accByMonth.keys(), ...baseNormByMonth.keys()]);
  const months = [...monthsSet].sort();

  const points: TimeseriesPoint[] = months.map((month) => {
    const a = accByMonth.get(month) ?? { fact: 0, client: 0 };
    const norm = Number(normOfMonth(month).toFixed(2));
    const fact = Number(a.fact.toFixed(2));
    return {
      month,
      fact,
      client: Number(a.client.toFixed(2)),
      norm,
      util: util(a.client, a.fact),
      under: Number((norm - fact).toFixed(2)),
    };
  });

  return {
    ok: true,
    period,
    departmentId: deptFilter,
    months: points,
  };
};
