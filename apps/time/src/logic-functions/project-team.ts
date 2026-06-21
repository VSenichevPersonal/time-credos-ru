/**
 * Чистый расчёт «Команда проекта» / «Проекты сотрудника» (REQ-0016 follow-up).
 *
 * Прямого relation проект→сотрудники НЕТ — команда выводится из записей
 * credosTimeEntry (кто списывал время на проект). Зеркально: проекты, где
 * сотрудник работал. Логика без сети → тестируется без живого REST (как
 * reports-calc). Контракт /s/project-team — в project-team.logic.ts.
 *
 * Сверка (правило 8): Timetta — «Команда проекта»/участники проекта. Здесь —
 * фактические участники (по списанным часам), не плановое штатное расписание.
 * [[no-billable-concept]] — billable-разрез не считаем.
 */

import { employeeCode, type RawEmployee, type RawEntry, type RawProject } from './reports-calc';

// Переиспользуем Raw-типы reports-calc (employee: firstName/lastName/departmentId).
export type { RawEmployee, RawEntry, RawProject };

// Справочник отделов (id → code) для колонки deptCode.
export type RawTeamDepartment = { id: string; code: string | null };

export type ProjectTeamInput = {
  entries: RawEntry[];
  employees: RawEmployee[];
  departments: RawTeamDepartment[];
};

// Участник команды проекта = сотрудник, списывавший время, с агрегатами.
export type TeamMemberRow = {
  employeeId: string;
  name: string; // ФИО (пусто/КОД если revealNames=false — затирает вызывающий)
  deptCode: string | null; // код отдела сотрудника
  totalHours: number; // Σ часов сотрудника на проекте за период
  entryCount: number; // число записей
  lastDate: string | null; // последняя дата списания (YYYY-MM-DD)
  share: number | null; // доля от часов проекта, 0..1 (null если итог 0)
};

// Проект, где сотрудник работал = тот же агрегат, но ключ — проект.
export type EmployeeProjectRow = {
  projectId: string;
  name: string; // имя проекта (не ПДн)
  code: string | null; // код проекта
  totalHours: number; // Σ часов сотрудника на проекте за период
  entryCount: number;
  lastDate: string | null;
  share: number | null; // доля от всех часов сотрудника за период
};

// Только день (YYYY-MM-DD) из ISO. null если нет даты.
const dayKey = (iso: string | null | undefined): string | null =>
  iso ? iso.slice(0, 10) : null;

// Запись попадает в период [from, to] по дню (включительно). from/to опц.:
// нет границы → не ограничиваем с этой стороны. Запись без даты учитывается,
// если обе границы пусты (нечего сравнить → не режем); иначе исключается.
const inPeriod = (
  entryDate: string | null | undefined,
  from: string | null,
  to: string | null,
): boolean => {
  const d = dayKey(entryDate);
  if (!from && !to) return true;
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

type Agg = { hours: number; count: number; lastDate: string | null };

// Накопление часов/числа записей/последней даты по ключу.
const bump = (map: Map<string, Agg>, key: string, hours: number, date: string | null): void => {
  const cur = map.get(key) ?? { hours: 0, count: 0, lastDate: null };
  cur.hours += hours;
  cur.count += 1;
  const d = dayKey(date);
  if (d && (!cur.lastDate || d > cur.lastDate)) cur.lastDate = d;
  map.set(key, cur);
};

const round2 = (n: number): number => Number(n.toFixed(2));
const round4 = (n: number): number => Number(n.toFixed(4));

/**
 * Команда проекта: записи проекта → агрегат по сотруднику. Сортировка по часам
 * убыв. (затем по имени для стабильности). Записи с hours==0/без employeeId
 * пропускаются. period — опц. фильтр [from, to] по дню.
 */
export const computeProjectTeam = (
  input: ProjectTeamInput,
  projectId: string,
  period: { from?: string | null; to?: string | null } = {},
): { ok: true; projectId: string; total: number; members: TeamMemberRow[] } => {
  const from = period.from ?? null;
  const to = period.to ?? null;
  const empById = new Map(input.employees.map((e) => [e.id, e]));
  const deptCode = new Map(input.departments.map((d) => [d.id, d.code ?? null]));

  // ФИО участника; если сотрудник неизвестен/без имени — стабильный КОД, не UUID.
  const empName = (e: RawEmployee | undefined, id: string): string =>
    (e ? [e.lastName, e.firstName].filter(Boolean).join(' ') : '') ||
    employeeCode({ id, departmentId: e?.departmentId ?? null }, deptCode);

  const agg = new Map<string, Agg>();
  let total = 0;
  for (const e of input.entries) {
    if (e.projectId !== projectId) continue; // запас: вызывающий уже фильтрует REST по проекту
    const hours = e.hours ?? 0;
    if (hours === 0 || !e.employeeId) continue;
    if (!inPeriod(e.date, from, to)) continue;
    bump(agg, e.employeeId, hours, e.date ?? null);
    total += hours;
  }

  const members: TeamMemberRow[] = [...agg.entries()]
    .map(([employeeId, a]) => {
      const emp = empById.get(employeeId);
      return {
        employeeId,
        name: empName(emp, employeeId),
        deptCode: emp?.departmentId ? deptCode.get(emp.departmentId) ?? null : null,
        totalHours: round2(a.hours),
        entryCount: a.count,
        lastDate: a.lastDate,
        share: total > 0 ? round4(a.hours / total) : null,
      };
    })
    .sort((x, y) => y.totalHours - x.totalHours || x.name.localeCompare(y.name));

  return { ok: true, projectId, total: round2(total), members };
};

export type EmployeeProjectsInput = {
  entries: RawEntry[];
  projects: RawProject[];
};

/**
 * Проекты сотрудника: записи сотрудника → агрегат по проекту. Зеркало
 * computeProjectTeam (тот же движок), сортировка по часам убыв. Имя проекта —
 * не ПДн, не затирается. period — опц. фильтр по дню.
 */
export const computeEmployeeProjects = (
  input: EmployeeProjectsInput,
  employeeId: string,
  period: { from?: string | null; to?: string | null } = {},
): { ok: true; employeeId: string; total: number; projects: EmployeeProjectRow[] } => {
  const from = period.from ?? null;
  const to = period.to ?? null;
  const projById = new Map(input.projects.map((p) => [p.id, p]));

  const agg = new Map<string, Agg>();
  let total = 0;
  for (const e of input.entries) {
    if (e.employeeId !== employeeId) continue;
    const hours = e.hours ?? 0;
    if (hours === 0 || !e.projectId) continue;
    if (!inPeriod(e.date, from, to)) continue;
    bump(agg, e.projectId, hours, e.date ?? null);
    total += hours;
  }

  const projects: EmployeeProjectRow[] = [...agg.entries()]
    .map(([projectId, a]) => {
      const p = projById.get(projectId);
      const name = p?.name ?? p?.code ?? projectId;
      return {
        projectId,
        name,
        code: p?.code ?? null,
        totalHours: round2(a.hours),
        entryCount: a.count,
        lastDate: a.lastDate,
        share: total > 0 ? round4(a.hours / total) : null,
      };
    })
    .sort((x, y) => y.totalHours - x.totalHours || x.name.localeCompare(y.name));

  return { ok: true, employeeId, total: round2(total), projects };
};
