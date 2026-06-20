/**
 * Чистый расчёт агрегатов /s/reports (без сети) — для unit-тестов (QA R2-QA).
 * Логика утилизации/нормы/недогруза вынесена из reports.logic.ts, чтобы покрыть
 * edge-кейсы (0 ёмкость, праздники, пустой период) без живого REST.
 *
 * Метрики см. reports.logic.ts. CLIENT и WORKDAY/SHORT — UPPER_CASE значения SELECT.
 */

export type RawEntry = {
  hours: number | null;
  projectId: string | null;
  employeeId: string | null;
};
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
export type RawDepartment = {
  id: string;
  code: string | null;
  capacityFactor: number | null;
  headcount: number | null;
};
export type RawCalendarDay = { hours: number | null; dayType: string | null };

export type Row = {
  key: string;
  name: string;
  fact: number;
  client: number;
  norm: number | null;
  util: number | null;
  under: number | null;
};

export type ReportsInput = {
  entries: RawEntry[];
  projects: RawProject[];
  employees: RawEmployee[];
  departments: RawDepartment[];
  calendar: RawCalendarDay[];
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

export const CLIENT_CATEGORY = 'CLIENT';
export const WORKDAY_TYPES = new Set(['WORKDAY', 'SHORT']);

export const util = (client: number, fact: number): number | null =>
  fact > 0 ? Number((client / fact).toFixed(4)) : null;

// Утилизация/недогруз на готовую строку (после суммирования fact/client/norm).
export const finalize = (row: Row): Row => ({
  ...row,
  util: util(row.client, row.fact),
  under: row.norm == null ? null : Number((row.norm - row.fact).toFixed(2)),
});

export const computeReports = (
  input: ReportsInput,
  period: { from: string; to: string },
): ReportsResult => {
  const { entries, projects, employees, departments, calendar } = input;

  // Базовая норма периода = Σ часов рабочих дней (WORKDAY|SHORT) производств. календаря.
  const baseNorm = calendar
    .filter((d) => WORKDAY_TYPES.has(d.dayType ?? ''))
    .reduce((s, d) => s + (d.hours ?? 0), 0);

  const projById = new Map(projects.map((p) => [p.id, p]));
  const deptById = new Map(departments.map((d) => [d.id, d]));
  const empById = new Map(employees.map((e) => [e.id, e]));

  const empName = (e: RawEmployee): string =>
    [e.lastName, e.firstName].filter(Boolean).join(' ') || e.id;
  const deptNorm = (d: RawDepartment): number =>
    baseNorm * (d.headcount ?? 0) * (d.capacityFactor ?? 1);
  const empNorm = (e: RawEmployee): number => {
    const d = e.departmentId ? deptById.get(e.departmentId) : undefined;
    return baseNorm * (d?.capacityFactor ?? 1);
  };

  const isClient = (projectId: string | null): boolean =>
    !!projectId && projById.get(projectId)?.category === CLIENT_CATEGORY;
  const deptOfEntry = (e: RawEntry): string | null => {
    const fromEmp = e.employeeId ? empById.get(e.employeeId)?.departmentId : null;
    if (fromEmp) return fromEmp;
    return e.projectId ? (projById.get(e.projectId)?.departmentId ?? null) : null;
  };

  const accDept = new Map<string, { fact: number; client: number }>();
  const accProject = new Map<string, { fact: number; client: number }>();
  const accEmployee = new Map<string, { fact: number; client: number }>();
  let totalFact = 0;
  let totalClient = 0;

  const bump = (
    map: Map<string, { fact: number; client: number }>,
    key: string | null,
    hours: number,
    client: number,
  ): void => {
    if (!key) return;
    const cur = map.get(key) ?? { fact: 0, client: 0 };
    cur.fact += hours;
    cur.client += client;
    map.set(key, cur);
  };

  for (const e of entries) {
    const hours = e.hours ?? 0;
    if (hours === 0) continue;
    const client = isClient(e.projectId) ? hours : 0;
    totalFact += hours;
    totalClient += client;
    bump(accDept, deptOfEntry(e), hours, client);
    bump(accProject, e.projectId, hours, client);
    bump(accEmployee, e.employeeId, hours, client);
  }

  const byDept: Row[] = departments.map((d) => {
    const a = accDept.get(d.id) ?? { fact: 0, client: 0 };
    return finalize({
      key: d.id,
      name: d.code ?? d.id,
      fact: a.fact,
      client: a.client,
      norm: Number(deptNorm(d).toFixed(2)),
      util: null,
      under: null,
    });
  });

  const byProject: ProjectRow[] = projects
    .filter((p) => accProject.has(p.id))
    .map((p) => {
      const a = accProject.get(p.id) ?? { fact: 0, client: 0 };
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
      const a = accEmployee.get(e.id) ?? { fact: 0, client: 0 };
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
    }),
    byDept,
    byProject,
    byEmployee,
  };
};
