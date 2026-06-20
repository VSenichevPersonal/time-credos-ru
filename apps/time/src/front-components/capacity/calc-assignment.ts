import type { Assignment } from 'src/front-components/capacity/assignment-types';
import type { EmployeeRef, Period } from 'src/front-components/capacity/types';

// DP-0005: чистые расчёты ресурсной аллокации (DOM-free, unit-тестируемо).
// Раскид часов назначения РАВНОМЕРНО по календарным дням [startDate, endDate],
// пересечённым с колонкой периода — зеркало plannedHoursInPeriod из calc-load.
// TODO(integration): при проводке вынести единый spread в calc-load и импортить.

const DAY_MS = 86400000;
const utcDay = (d: Date): number =>
  Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY_MS);

// Часы назначения, попадающие в период (раскид по диапазону дат назначения).
export const assignmentHoursInPeriod = (a: Assignment, period: Period): number => {
  if (!a.plannedHours || !a.startDate || !a.endDate) return 0;
  const ps = utcDay(new Date(a.startDate));
  const pe = utcDay(new Date(a.endDate));
  if (pe < ps) return 0;
  const totalDays = pe - ps + 1;
  const cs = utcDay(period.from);
  const ce = utcDay(period.to);
  const overlap = Math.min(pe, ce) - Math.max(ps, cs) + 1;
  if (overlap <= 0) return 0;
  return (a.plannedHours * overlap) / totalDays;
};

// Отдел назначения: явный department, иначе отдел именованного сотрудника.
export const assignmentDeptId = (
  a: Assignment,
  empDeptById: Map<string, string | null>,
): string | null =>
  a.departmentId ?? (a.employeeId ? empDeptById.get(a.employeeId) ?? null : null);

// Индекс employeeId → departmentId (для резолва отдела назначения).
export const empDeptIndex = (employees: EmployeeRef[]): Map<string, string | null> =>
  new Map(employees.map((e) => [e.id, e.departmentId]));

// Загрузка ОДНОГО сотрудника за период = Σ его назначений (РЕАЛЬНО, не делёж).
// Кросс-проектная: учитываются все назначения сотрудника (для детекта перегруза).
export const employeeAssignedHours = (
  employeeId: string,
  assignments: Assignment[],
  period: Period,
): number => {
  let sum = 0;
  for (const a of assignments) {
    if (a.employeeId === employeeId) sum += assignmentHoursInPeriod(a, period);
  }
  return sum;
};

// Загрузка ОТДЕЛА за период = Σ назначений, чей отдел (явный ?? сотрудника) = deptId.
export const deptAssignedHours = (
  deptId: string,
  assignments: Assignment[],
  empDeptById: Map<string, string | null>,
  period: Period,
): number => {
  let sum = 0;
  for (const a of assignments) {
    if (assignmentDeptId(a, empDeptById) === deptId) sum += assignmentHoursInPeriod(a, period);
  }
  return sum;
};

// Доля отделов в проекте = Σ часов назначений проекта по отделам (заменяет ручной
// projectDepartment). Возвращает Map<deptId, часы> по всему диапазону назначений.
export const projectDeptShares = (
  projectId: string,
  assignments: Assignment[],
  empDeptById: Map<string, string | null>,
): Map<string, number> => {
  const out = new Map<string, number>();
  for (const a of assignments) {
    if (a.projectId !== projectId || !a.plannedHours) continue;
    const dept = assignmentDeptId(a, empDeptById);
    if (!dept) continue;
    out.set(dept, (out.get(dept) ?? 0) + a.plannedHours);
  }
  return out;
};

// Валидация плана проекта: Σ назначенных часов vs plannedEffort (мягкая — варн,
// не блок). under>0 → недораспределено, under<0 → перебор плана.
export const projectPlanCoverage = (
  projectId: string,
  assignments: Assignment[],
  plannedEffort: number | null,
): { assigned: number; planned: number | null; under: number | null } => {
  let assigned = 0;
  for (const a of assignments) {
    if (a.projectId === projectId && a.plannedHours) assigned += a.plannedHours;
  }
  return {
    assigned,
    planned: plannedEffort,
    under: plannedEffort == null ? null : plannedEffort - assigned,
  };
};
