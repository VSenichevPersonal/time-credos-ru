// reports MVP — detail-уровень (лист отдельных записей) + CSV-сериализация.
// Отдельный модуль от reports-calc.ts (его сейчас правит REQ-0011 FTE-поток —
// избегаем edit-коллизии). Чистые функции, тестируются изолированно.
//
// groupBy=detail в /s/reports: не агрегат, а 7 колонок MVP по каждой записи
// (из 40+ в Timetta берём минимум). Фильтры deptId/projectId/employeeId — для
// drill-down с агрегатных срезов в лист.

import type { ReportsInput, RawEntry } from './reports-calc';

// RawEntry не типизирует status (REST его отдаёт) — расширяем локально.
type DetailEntry = RawEntry & { status?: string | null };

export type DetailRow = {
  date: string;
  employeeName: string;
  deptName: string;
  projectName: string;
  workTypeName: string;
  hours: number;
  status: string;
};

export type DetailFilters = {
  deptId?: string | null;
  projectId?: string | null;
  employeeId?: string | null;
};

// Отдел записи = отдел сотрудника (приоритет), fallback — отдел проекта.
// Совпадает с deptOfEntry в reports-calc (факт идёт за человеком).
export const computeDetail = (
  input: ReportsInput,
  filters: DetailFilters = {},
): DetailRow[] => {
  const projById = new Map(input.projects.map((p) => [p.id, p]));
  const empById = new Map(input.employees.map((e) => [e.id, e]));
  const deptById = new Map(input.departments.map((d) => [d.id, d]));
  const wtById = new Map((input.workTypes ?? []).map((w) => [w.id, w]));

  const deptOfEntry = (e: DetailEntry): string | null => {
    const fromEmp = e.employeeId ? empById.get(e.employeeId)?.departmentId : null;
    if (fromEmp) return fromEmp;
    return e.projectId ? projById.get(e.projectId)?.departmentId ?? null : null;
  };

  const rows: DetailRow[] = [];
  for (const raw of input.entries as DetailEntry[]) {
    const deptId = deptOfEntry(raw);
    // Фильтры drill-down (AND): пустой фильтр не режет.
    if (filters.employeeId && raw.employeeId !== filters.employeeId) continue;
    if (filters.projectId && raw.projectId !== filters.projectId) continue;
    if (filters.deptId && deptId !== filters.deptId) continue;

    const emp = raw.employeeId ? empById.get(raw.employeeId) : undefined;
    const proj = raw.projectId ? projById.get(raw.projectId) : undefined;
    const dept = deptId ? deptById.get(deptId) : undefined;
    const wt = raw.workTypeId ? wtById.get(raw.workTypeId) : undefined;

    rows.push({
      date: raw.date ?? '',
      employeeName: emp ? [emp.lastName, emp.firstName].filter(Boolean).join(' ') : '',
      deptName: dept?.code ?? '',
      projectName: proj ? (proj.code ? `${proj.code} — ${proj.name}` : proj.name ?? '') : '',
      workTypeName: wt?.name ?? '',
      hours: Number(raw.hours) || 0,
      status: raw.status ?? '',
    });
  }

  // Стабильная сортировка: дата возр., затем сотрудник.
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName));
  return rows;
};

// CSV-сериализация (RFC 4180): экранируем ячейки с запятой/кавычкой/переводом
// строки (оборачиваем в кавычки, внутренние кавычки удваиваем). Разделитель строк
// \r\n (Excel-совместимо). Заголовки человекочитаемые.
const CSV_HEADERS = ['Дата', 'Сотрудник', 'Отдел', 'Проект', 'Вид работ', 'Часы', 'Статус'];

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const detailToCsv = (rows: DetailRow[]): string => {
  const lines = [CSV_HEADERS.join(',')];
  for (const r of rows) {
    lines.push(
      [r.date, r.employeeName, r.deptName, r.projectName, r.workTypeName, r.hours, r.status]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\r\n');
};
