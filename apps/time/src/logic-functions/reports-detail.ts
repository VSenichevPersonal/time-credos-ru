// reports MVP — detail-уровень (лист отдельных записей) + CSV-сериализация.
// Отдельный модуль от reports-calc.ts (его сейчас правит REQ-0011 FTE-поток —
// избегаем edit-коллизии). Чистые функции, тестируются изолированно.
//
// groupBy=detail в /s/reports: не агрегат, а 7 колонок MVP по каждой записи
// (из 40+ в Timetta берём минимум). Фильтры deptId/projectId/employeeId — для
// drill-down с агрегатных срезов в лист.

import { employeeCode, type ReportsInput, type RawEntry } from './reports-calc';

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
//
// CISO-007 (152-ФЗ, минимизация ПДн): employeeName=ФИО — персональные данные.
// detail/CSV доступны любому аутентифицированному юзеру (logic-function ходит
// под сервис-токеном, per-user RBAC обходится). Server-actor по HTTP-роуту
// недостижим: RoutePayload.userWorkspaceId НЕ маппится на workspaceMember/employee
// через Core REST (см. A1_CURRENT_USER_RESEARCH.md §3). Поэтому ФИО НЕ отдаём по
// умолчанию (revealNames=false → пустая строка). TODO(CISO-005): когда появится
// доверенный server-identity (userWorkspaceId→workspaceMember), резолвить актора и
// отдавать ФИО руководителю с scope по его подчинённым (RBAC_MODEL: менеджер видит
// только свою команду).
export const computeDetail = (
  input: ReportsInput,
  filters: DetailFilters = {},
  revealNames = false,
): DetailRow[] => {
  const projById = new Map(input.projects.map((p) => [p.id, p]));
  const empById = new Map(input.employees.map((e) => [e.id, e]));
  const deptById = new Map(input.departments.map((d) => [d.id, d]));
  const deptCodeById = new Map(input.departments.map((d) => [d.id, d.code ?? null]));
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
      // CISO-007: ФИО только при revealNames (доверенный руководитель). Иначе —
      // стабильный КОД сотрудника (не пусто/UUID), чтобы строки были различимы.
      employeeName:
        revealNames && emp
          ? [emp.lastName, emp.firstName].filter(Boolean).join(' ')
          : raw.employeeId
            ? employeeCode(
                { id: raw.employeeId, departmentId: emp?.departmentId ?? deptId },
                deptCodeById,
              )
            : '',
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

// ─── CSV-сериализация (RFC 4180 + 1С/RU-Excel) ──────────────────────────────
// F-F (REQ-0006): выгрузка под 1С:ЗУП / RU-локаль Excel.
//   · Разделитель полей `;` — в русской локали Excel запятая = десятичный знак,
//     поэтому стандарт RU-выгрузки — точка с запятой (1С импортирует так же).
//   · BOM (﻿) в начале файла — иначе Excel/1С читают UTF-8 кириллицу как
//     кракозябры. Добавляется при отдаче файла (флаг withBom), не в чистой строке.
//   · Экранирование: ячейка с разделителем/кавычкой/переводом строки оборачивается
//     в кавычки, внутренние кавычки удваиваются (RFC 4180). Экранируем под ЛЮБОЙ
//     разделитель — escapeCsv знает текущий delimiter.
//   · Разделитель строк \r\n (Excel/1С-совместимо).

export const CSV_BOM = '﻿';
export const CSV_DELIMITER = ';'; // RU-локаль Excel / 1С
const CSV_HEADERS = ['Дата', 'Сотрудник', 'Отдел', 'Проект', 'Вид работ', 'Часы', 'Статус'];

// Чистая, тестируемая. Оборачивает в кавычки, если в значении есть разделитель,
// кавычка или перевод строки; удваивает внутренние кавычки.
export const escapeCsv = (v: string | number, delimiter: string = CSV_DELIMITER): string => {
  const s = String(v ?? '');
  // спецсимволы: текущий разделитель, кавычка, CR, LF
  const needsQuote = s.includes(delimiter) || /["\r\n]/.test(s);
  return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
};

// WI-54 / W6B.14: дробные часы в CSV под RU-локаль Excel. Разделитель полей `;`
// (CSV_DELIMITER), поэтому десятичный разделитель числа = ЗАПЯТАЯ (8,5), иначе
// RU-Excel читает `8.5` как текст/дату. Применяется ТОЛЬКО к числам; строки
// (даты ISO `2026-06-10`, коды, ФИО) не трогаем. Целые остаются без дробной части
// (8 → '8'). NaN/не-конечное → '0' (как и в расчётах: `Number(x)||0`).
// Чистая, тестируемая.
export const csvNum = (n: number): string => {
  if (!Number.isFinite(n)) return '0';
  return String(n).replace('.', ',');
};

// Чистая, тестируемая. Собирает одну CSV-строку из ячеек с экранированием.
// Числовые ячейки → десятичная запятая (csvNum) для RU-Excel; строки — как есть.
export const toCsvRow = (cells: Array<string | number>, delimiter: string = CSV_DELIMITER): string =>
  cells.map((c) => escapeCsv(typeof c === 'number' ? csvNum(c) : c, delimiter)).join(delimiter);

export type CsvOptions = {
  delimiter?: string; // по умолчанию `;` (1С/RU-Excel)
  withBom?: boolean; // префикс ﻿ (по умолчанию false — чистая строка)
};

export const detailToCsv = (rows: DetailRow[], opts: CsvOptions = {}): string => {
  const delimiter = opts.delimiter ?? CSV_DELIMITER;
  const lines = [toCsvRow(CSV_HEADERS, delimiter)];
  for (const r of rows) {
    lines.push(
      toCsvRow(
        [r.date, r.employeeName, r.deptName, r.projectName, r.workTypeName, r.hours, r.status],
        delimiter,
      ),
    );
  }
  const body = lines.join('\r\n');
  return opts.withBom ? CSV_BOM + body : body;
};
