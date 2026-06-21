// REQ-0006 п.4 — Табель учёта рабочего времени (форма ближе к Т-13) в CSV.
// Сетка: строки = сотрудники, колонки = дни месяца (1..N), ячейка = Σ часов за
// день + колонка «Итого». Шапка с датами. Для кадров / 1С:ЗУП.
//
// Отдельный модуль (как reports-detail.ts) — чистые функции buildTimesheetGrid /
// gridToCsv, тестируются изолированно без сети. CSV-примитивы (escapeCsv/toCsvRow/
// CSV_BOM/CSV_DELIMITER) ПЕРЕИСПОЛЬЗУЮТСЯ из reports-detail (НЕ дублируем).
//
// СВЕРКА (Timetta «Таймшиты»): Timetta агрегирует часы по сотрудник×период
// (HoursTotal). Сетка день×сотрудник — это кадровая форма Т-13, которую REQ-0006
// п.4 описывает явно. [[no-billable-concept]]: только часы, без billable/оплаты.
//
// CISO-007 (152-ФЗ): ФИО только при revealNames (настройка revealEmployeeNames,
// REQ-0019). Иначе — КОД сотрудника (employeeId).

import type { ReportsInput, RawEntry, RawAbsence } from './reports-calc';
import { CSV_BOM, CSV_DELIMITER, toCsvRow } from './reports-detail';

// Т-13 буквенные коды явки/неявки. Маппинг типов отсутствия (UPPER_CASE как на
// сервере; REST отдаёт SELECT в верхнем регистре) → буквенный код графы Т-13.
//   Я  — явка (отработанные часы)
//   ОТ — ежегодный отпуск (Vacation)
//   Б  — временная нетрудоспособность / больничный (Sick)
//   ДО — отпуск без сохранения зарплаты (Unpaid)
//   К  — командировка (BUSINESS_TRIP — пока нет в модели, на будущее REQ-0006 п.1)
//   НН — иные неявки по невыясненным причинам (Other / неизвестный тип)
export const ATTENDANCE_CODE = 'Я';
const ABSENCE_CODE_BY_TYPE: Record<string, string> = {
  VACATION: 'ОТ',
  SICK: 'Б',
  UNPAID: 'ДО',
  BUSINESS_TRIP: 'К',
  OTHER: 'НН',
};
const absenceCode = (type: string | null | undefined): string =>
  ABSENCE_CODE_BY_TYPE[(type ?? '').toUpperCase()] ?? 'НН';

// RawAbsence в reports-calc не типизирует absenceType (для нормы он не нужен) —
// расширяем локально: код графы табеля зависит от типа отсутствия.
type GridAbsence = RawAbsence & { absenceType?: string | null };

export type GridFilters = {
  deptId?: string | null;
  projectId?: string | null;
};

export type GridOptions = {
  // Показывать буквенный код Т-13 в ячейке («Я 8», «ОТ») вместо голых часов.
  // По умолчанию false — только часы (минимальная форма).
  withCodes?: boolean;
};

// Ячейка дня: часы (Σ записей сотрудника за день) и опц. буквенный код Т-13.
export type GridCell = {
  hours: number;
  code: string | null; // 'Я' | 'ОТ' | 'Б' | 'ДО' | 'К' | 'НН' | null (пустой день)
};

export type GridRow = {
  employeeKey: string; // employeeId (всегда) — стабильный ключ строки
  employeeName: string; // ФИО при reveal, иначе '' (код берётся из employeeKey)
  deptName: string;
  cells: GridCell[]; // длина = число дней периода (по dates)
  total: number; // Σ часов сотрудника за период
};

export type TimesheetGrid = {
  period: { from: string; to: string };
  dates: string[]; // YYYY-MM-DD каждого дня периода (колонки сетки)
  rows: GridRow[];
  withCodes: boolean;
};

// YYYY-MM-DD из ISO/даты.
const dayKey = (iso: string | null | undefined): string | null =>
  iso ? iso.slice(0, 10) : null;

// Список дней [from, to] включительно (по календарным суткам UTC). Месяц обычно,
// но функция корректна для любого диапазона. Ограничение 366 дней — защита от
// случайного огромного периода (табель — это месяц).
export const enumerateDays = (from: string, to: string): string[] => {
  const start = dayKey(from);
  const end = dayKey(to);
  if (!start || !end || start > end) return [];
  const out: string[] = [];
  const d = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  for (let i = 0; i < 366 && d <= last; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
};

// Чистая, тестируемая. Строит табель-сетку сотрудник×день.
// Источники: entries (часы по дате), absences (буквенный код графы для дней
// отсутствия), employees/departments (имена/коды). Фильтры deptId/projectId —
// как в /s/reports (drill). projectId режет ТОЛЬКО записи (отсутствия не привязаны
// к проекту → при фильтре проекта коды отсутствий не показываем).
export const buildTimesheetGrid = (
  input: ReportsInput,
  period: { from: string; to: string },
  filters: GridFilters = {},
  revealNames = false,
  options: GridOptions = {},
): TimesheetGrid => {
  const withCodes = options.withCodes === true;
  const dates = enumerateDays(period.from, period.to);
  const dateIndex = new Map(dates.map((d, i) => [d, i]));

  const empById = new Map(input.employees.map((e) => [e.id, e]));
  const projById = new Map(input.projects.map((p) => [p.id, p]));
  const deptById = new Map(input.departments.map((d) => [d.id, d]));

  // Отдел записи = отдел сотрудника (приоритет), fallback — отдел проекта
  // (зеркало deptOfEntry в reports-calc / reports-detail).
  const deptOfEntry = (e: RawEntry): string | null => {
    const fromEmp = e.employeeId ? empById.get(e.employeeId)?.departmentId : null;
    if (fromEmp) return fromEmp;
    return e.projectId ? projById.get(e.projectId)?.departmentId ?? null : null;
  };

  // Аккумулятор по сотруднику: часы по индексу дня + флаг наличия записей в строке.
  type Acc = { hours: number[]; total: number; deptId: string | null };
  const acc = new Map<string, Acc>();
  const ensure = (empId: string, deptId: string | null): Acc => {
    let a = acc.get(empId);
    if (!a) {
      a = { hours: new Array(dates.length).fill(0), total: 0, deptId };
      acc.set(empId, a);
    } else if (a.deptId == null && deptId != null) {
      a.deptId = deptId; // уточняем отдел, если первый раз был неизвестен
    }
    return a;
  };

  // 1) Часы записей по дням.
  for (const e of input.entries) {
    if (!e.employeeId) continue;
    const day = dayKey(e.date);
    if (!day) continue;
    const idx = dateIndex.get(day);
    if (idx === undefined) continue; // запись вне периода (страховка)
    const deptId = deptOfEntry(e);
    // Фильтры drill (AND): пустой не режет.
    if (filters.deptId && deptId !== filters.deptId) continue;
    if (filters.projectId && e.projectId !== filters.projectId) continue;
    const hours = Number(e.hours) || 0;
    if (hours === 0) continue;
    const a = ensure(e.employeeId, deptId);
    a.hours[idx] += hours;
    a.total += hours;
  }

  // 2) Буквенные коды отсутствий по дням (только если withCodes и нет фильтра
  //    проекта — отсутствия к проекту не привязаны). Код пишем в карту (день→код),
  //    часы у отсутствия = 0 (неявка). Если в день есть и часы, и отсутствие —
  //    приоритет у явки «Я» (фактически отработанное время).
  const absCodeByEmpDay = new Map<string, string>(); // ключ `${empId}|${idx}`
  if (withCodes && !filters.projectId) {
    const absences = (input.absences ?? []) as GridAbsence[];
    for (const ab of absences) {
      if (!ab.employeeId) continue;
      const emp = empById.get(ab.employeeId);
      // Фильтр отдела применяем по отделу сотрудника.
      if (filters.deptId && emp?.departmentId !== filters.deptId) continue;
      const start = dayKey(ab.startDate);
      const end = dayKey(ab.endDate) ?? start;
      if (!start) continue;
      const code = absenceCode(ab.absenceType);
      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        if (d < start) continue;
        if (end && d > end) break; // dates отсортированы → дальше только больше
        absCodeByEmpDay.set(`${ab.employeeId}|${i}`, code);
      }
      // Отсутствие создаёт строку даже без часов-записей (сотрудник в табеле есть).
      ensure(ab.employeeId, emp?.departmentId ?? null);
    }
  }

  // 3) Сборка строк.
  const rows: GridRow[] = [];
  for (const [empId, a] of acc) {
    const emp = empById.get(empId);
    const dept = a.deptId ? deptById.get(a.deptId) : undefined;
    const cells: GridCell[] = a.hours.map((h, i) => {
      let code: string | null = null;
      if (withCodes) {
        if (h > 0) code = ATTENDANCE_CODE; // явка — приоритет над отсутствием
        else code = absCodeByEmpDay.get(`${empId}|${i}`) ?? null;
      }
      return { hours: Number(h.toFixed(2)), code };
    });
    rows.push({
      employeeKey: empId,
      employeeName: revealNames && emp ? [emp.lastName, emp.firstName].filter(Boolean).join(' ') : '',
      deptName: dept?.code ?? '',
      cells,
      total: Number(a.total.toFixed(2)),
    });
  }

  // Стабильная сортировка: отдел, затем имя/ключ сотрудника.
  rows.sort(
    (x, y) =>
      x.deptName.localeCompare(y.deptName) ||
      (x.employeeName || x.employeeKey).localeCompare(y.employeeName || y.employeeKey),
  );

  return { period, dates, rows, withCodes };
};

// ─── CSV-сериализация табель-сетки ──────────────────────────────────────────
// Тот же формат, что detailToCsv: BOM (опц.) + разделитель `;` (RU-Excel/1С) +
// \r\n. Переиспользуем toCsvRow/CSV_BOM/CSV_DELIMITER.
//
// Шапка: «Сотрудник; Отдел; 1; 2; …; N; Итого» — номера дней месяца. Вторая
// строка — полные даты (YYYY-MM-DD) для однозначности (период может пересекать
// месяцы). Ячейка: «8» (часы) или «Я 8» / «ОТ» (withCodes).

const cellText = (c: GridCell, withCodes: boolean): string => {
  if (!withCodes) return c.hours > 0 ? String(c.hours) : '';
  if (c.code === ATTENDANCE_CODE) return `${ATTENDANCE_CODE} ${c.hours}`;
  if (c.code) return c.code; // код отсутствия без часов
  return '';
};

export type GridCsvOptions = {
  delimiter?: string;
  withBom?: boolean;
};

export const gridToCsv = (grid: TimesheetGrid, opts: GridCsvOptions = {}): string => {
  const delimiter = opts.delimiter ?? CSV_DELIMITER;
  const dayNumbers = grid.dates.map((d) => String(Number(d.slice(8, 10)))); // '1'..'31'
  const header = ['Сотрудник', 'Отдел', ...dayNumbers, 'Итого'];
  // Подзаголовок с полными датами (для периода через границу месяца).
  const dateRow = ['', 'Дата', ...grid.dates, ''];

  const lines = [toCsvRow(header, delimiter), toCsvRow(dateRow, delimiter)];
  for (const r of grid.rows) {
    // CISO-007: ФИО при reveal, иначе КОД (employeeKey).
    const who = r.employeeName || r.employeeKey;
    const cells = r.cells.map((c) => cellText(c, grid.withCodes));
    lines.push(toCsvRow([who, r.deptName, ...cells, r.total], delimiter));
  }
  const body = lines.join('\r\n');
  return opts.withBom ? CSV_BOM + body : body;
};
