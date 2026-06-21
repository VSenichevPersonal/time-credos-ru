import { describe, expect, it } from 'vitest';

import {
  ATTENDANCE_CODE,
  buildTimesheetGrid,
  enumerateDays,
  gridToCsv,
} from './reports-timesheet-grid';
import { CSV_BOM } from './reports-detail';
import type { ReportsInput } from './reports-calc';

const PERIOD = { from: '2026-06-01', to: '2026-06-30' };

const input = (over: Partial<ReportsInput> = {}): ReportsInput => ({
  entries: [],
  projects: [],
  employees: [],
  departments: [],
  calendar: [],
  absences: [],
  workTypes: [],
  assignments: undefined,
  ...over,
});

const dept = { id: 'd1', code: 'OPIB', capacityFactor: 1 };
const dept2 = { id: 'd2', code: 'ADM', capacityFactor: 1 };
const project = { id: 'p1', name: 'Проект А', code: 'PA', category: 'CLIENT', departmentId: 'd1', plannedEffort: null };
const emp1 = { id: 'emp1', firstName: 'Иван', lastName: 'Иванов', departmentId: 'd1' };
const emp2 = { id: 'emp2', firstName: 'Пётр', lastName: 'Петров', departmentId: 'd2' };

const entry = (over: Partial<Record<string, unknown>> = {}) => ({
  hours: 8,
  date: '2026-06-02',
  projectId: 'p1',
  employeeId: 'emp1',
  ...over,
});

describe('enumerateDays', () => {
  it('перечисляет дни месяца включительно', () => {
    const days = enumerateDays('2026-06-01', '2026-06-30');
    expect(days).toHaveLength(30);
    expect(days[0]).toBe('2026-06-01');
    expect(days[29]).toBe('2026-06-30');
  });

  it('один день для from==to', () => {
    expect(enumerateDays('2026-06-15', '2026-06-15')).toEqual(['2026-06-15']);
  });

  it('пусто при from>to', () => {
    expect(enumerateDays('2026-06-30', '2026-06-01')).toEqual([]);
  });
});

describe('buildTimesheetGrid', () => {
  it('строит сетку сотрудник×день: часы попадают в нужную колонку, Итого = сумма', () => {
    const grid = buildTimesheetGrid(
      input({
        entries: [
          entry({ date: '2026-06-02', hours: 8 }),
          entry({ date: '2026-06-03', hours: 4 }),
          entry({ date: '2026-06-03', hours: 4 }), // вторая запись того же дня суммируется
        ],
        projects: [project],
        employees: [emp1],
        departments: [dept],
      }),
      PERIOD,
    );
    expect(grid.dates).toHaveLength(30);
    expect(grid.rows).toHaveLength(1);
    const row = grid.rows[0];
    expect(row.employeeKey).toBe('emp1');
    expect(row.cells[1].hours).toBe(8); // 2 июня (индекс 1)
    expect(row.cells[2].hours).toBe(8); // 3 июня: 4+4
    expect(row.cells[0].hours).toBe(0); // 1 июня пусто
    expect(row.total).toBe(16);
  });

  it('запись вне периода игнорируется', () => {
    const grid = buildTimesheetGrid(
      input({
        entries: [entry({ date: '2026-05-31', hours: 8 })],
        projects: [project],
        employees: [emp1],
        departments: [dept],
      }),
      PERIOD,
    );
    expect(grid.rows).toHaveLength(0); // нет строк — все часы вне окна
  });

  it('CISO-007: reveal=false → имя пустое, ключ сохранён', () => {
    const grid = buildTimesheetGrid(
      input({ entries: [entry()], projects: [project], employees: [emp1], departments: [dept] }),
      PERIOD,
      {},
      false,
    );
    expect(grid.rows[0].employeeName).toBe('');
    expect(grid.rows[0].employeeKey).toBe('emp1');
  });

  it('CISO-007: reveal=true → ФИО (Фамилия Имя)', () => {
    const grid = buildTimesheetGrid(
      input({ entries: [entry()], projects: [project], employees: [emp1], departments: [dept] }),
      PERIOD,
      {},
      true,
    );
    expect(grid.rows[0].employeeName).toBe('Иванов Иван');
  });

  it('фильтр deptId режет чужой отдел', () => {
    const grid = buildTimesheetGrid(
      input({
        entries: [entry({ employeeId: 'emp1' }), entry({ employeeId: 'emp2' })],
        projects: [project],
        employees: [emp1, emp2],
        departments: [dept, dept2],
      }),
      PERIOD,
      { deptId: 'd1' },
    );
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0].employeeKey).toBe('emp1');
  });

  it('фильтр projectId режет чужой проект', () => {
    const grid = buildTimesheetGrid(
      input({
        entries: [entry({ projectId: 'p1' }), entry({ projectId: 'p2', employeeId: 'emp2' })],
        projects: [project, { ...project, id: 'p2', departmentId: 'd2' }],
        employees: [emp1, emp2],
        departments: [dept, dept2],
      }),
      PERIOD,
      { projectId: 'p1' },
    );
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0].employeeKey).toBe('emp1');
  });

  it('withCodes: явка «Я» при часах, код отсутствия при отсутствии', () => {
    const grid = buildTimesheetGrid(
      input({
        entries: [entry({ date: '2026-06-02', hours: 8 })],
        projects: [project],
        employees: [emp1],
        departments: [dept],
        absences: [
          { employeeId: 'emp1', startDate: '2026-06-05', endDate: '2026-06-06', absenceType: 'VACATION' } as never,
        ],
      }),
      PERIOD,
      {},
      false,
      { withCodes: true },
    );
    const row = grid.rows[0];
    expect(row.cells[1].code).toBe(ATTENDANCE_CODE); // 2 июня — явка
    expect(row.cells[4].code).toBe('ОТ'); // 5 июня — отпуск
    expect(row.cells[5].code).toBe('ОТ'); // 6 июня — отпуск
    expect(row.cells[5].hours).toBe(0);
    expect(row.cells[0].code).toBeNull(); // пустой день — нет кода
  });

  it('withCodes: явка имеет приоритет над отсутствием в один день', () => {
    const grid = buildTimesheetGrid(
      input({
        entries: [entry({ date: '2026-06-05', hours: 8 })],
        projects: [project],
        employees: [emp1],
        departments: [dept],
        absences: [
          { employeeId: 'emp1', startDate: '2026-06-05', endDate: '2026-06-05', absenceType: 'SICK' } as never,
        ],
      }),
      PERIOD,
      {},
      false,
      { withCodes: true },
    );
    expect(grid.rows[0].cells[4].code).toBe(ATTENDANCE_CODE); // часы важнее
  });

  it('без withCodes коды не проставляются', () => {
    const grid = buildTimesheetGrid(
      input({ entries: [entry()], projects: [project], employees: [emp1], departments: [dept] }),
      PERIOD,
    );
    expect(grid.rows[0].cells[1].code).toBeNull();
  });

  it('сотрудник только с отсутствием (withCodes) попадает в табель', () => {
    const grid = buildTimesheetGrid(
      input({
        employees: [emp1],
        departments: [dept],
        absences: [
          { employeeId: 'emp1', startDate: '2026-06-10', endDate: '2026-06-10', absenceType: 'SICK' } as never,
        ],
      }),
      PERIOD,
      {},
      false,
      { withCodes: true },
    );
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0].total).toBe(0);
    expect(grid.rows[0].cells[9].code).toBe('Б');
  });
});

describe('gridToCsv', () => {
  const grid = () =>
    buildTimesheetGrid(
      input({
        entries: [entry({ date: '2026-06-02', hours: 8 }), entry({ date: '2026-06-03', hours: 4 })],
        projects: [project],
        employees: [emp1],
        departments: [dept],
      }),
      PERIOD,
      {},
      true,
    );

  it('BOM + разделитель `;` + шапка с номерами дней и Итого', () => {
    const csv = gridToCsv(grid(), { withBom: true });
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    const lines = csv.slice(CSV_BOM.length).split('\r\n');
    const header = lines[0].split(';');
    expect(header[0]).toBe('Сотрудник');
    expect(header[1]).toBe('Отдел');
    expect(header[2]).toBe('1'); // 1 июня
    expect(header[31]).toBe('30'); // 30 июня
    expect(header[header.length - 1]).toBe('Итого');
  });

  it('вторая строка — полные даты', () => {
    const lines = gridToCsv(grid()).split('\r\n');
    const dateRow = lines[1].split(';');
    expect(dateRow[1]).toBe('Дата');
    expect(dateRow[2]).toBe('2026-06-01');
    expect(dateRow[31]).toBe('2026-06-30');
  });

  it('строка сотрудника: ФИО, отдел, часы по дням, Итого', () => {
    const lines = gridToCsv(grid()).split('\r\n');
    const cols = lines[2].split(';');
    expect(cols[0]).toBe('Иванов Иван');
    expect(cols[1]).toBe('OPIB');
    expect(cols[3]).toBe('8'); // 2 июня
    expect(cols[4]).toBe('4'); // 3 июня
    expect(cols[cols.length - 1]).toBe('12'); // Итого
  });

  it('reveal=false → в первой колонке КОД сотрудника, не ФИО', () => {
    const g = buildTimesheetGrid(
      input({ entries: [entry()], projects: [project], employees: [emp1], departments: [dept] }),
      PERIOD,
      {},
      false,
    );
    const cols = gridToCsv(g).split('\r\n')[2].split(';');
    expect(cols[0]).toBe('emp1');
  });

  it('withCodes → ячейка «Я 8» и код отсутствия', () => {
    const g = buildTimesheetGrid(
      input({
        entries: [entry({ date: '2026-06-02', hours: 8 })],
        projects: [project],
        employees: [emp1],
        departments: [dept],
        absences: [
          { employeeId: 'emp1', startDate: '2026-06-04', endDate: '2026-06-04', absenceType: 'UNPAID' } as never,
        ],
      }),
      PERIOD,
      {},
      true,
      { withCodes: true },
    );
    const cols = gridToCsv(g).split('\r\n')[2].split(';');
    expect(cols[3]).toBe('Я 8'); // 2 июня
    expect(cols[5]).toBe('ДО'); // 4 июня — без сохранения
  });
});
