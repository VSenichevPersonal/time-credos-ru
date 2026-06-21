import { describe, expect, it } from 'vitest';

import { CSV_BOM, computeDetail, detailToCsv, escapeCsv, toCsvRow } from './reports-detail';
import type { DetailRow } from './reports-detail';
import type { ReportsInput } from './reports-calc';

const input = (over: Partial<ReportsInput> = {}): ReportsInput => ({
  from: '2026-06-01',
  to: '2026-06-30',
  entries: [],
  projects: [],
  employees: [],
  departments: [],
  workTypes: [],
  absences: [],
  calendar: [],
  empDeptAssignments: undefined,
  ...over,
});

const entry = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'e1',
  date: '2026-06-10',
  hours: 8,
  projectId: 'p1',
  employeeId: 'emp1',
  workTypeId: 'wt1',
  status: 'DRAFT',
  tags: [],
  ...over,
});

const dept = { id: 'd1', name: 'ОПИБ', code: 'OPIB', departmentId: null };
const project = { id: 'p1', name: 'Проект А', code: 'PA-001', departmentId: 'd1' };
const employee = { id: 'emp1', firstName: 'Иван', lastName: 'Иванов', departmentId: 'd1', name: 'Иванов Иван', workspaceMemberId: null };
const workType = { id: 'wt1', name: 'Разработка', category: 'DEV' };

const base = input({
  entries: [entry()],
  projects: [project],
  employees: [employee],
  departments: [dept],
  workTypes: [workType],
});

// ─── computeDetail ───────────────────────────────────────────────────────────

describe('computeDetail', () => {
  it('маппит все поля одной записи (revealNames=true)', () => {
    const rows = computeDetail(base, {}, true);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      date: '2026-06-10',
      employeeName: 'Иванов Иван',
      deptName: 'OPIB',
      projectName: 'PA-001 — Проект А',
      workTypeName: 'Разработка',
      hours: 8,
      status: 'DRAFT',
    });
  });

  // CISO-007 (152-ФЗ): по умолчанию (revealNames=false) ФИО НЕ отдаём — пустая строка.
  it('CISO-007: по умолчанию employeeName пустой (ФИО не утекает)', () => {
    const rows = computeDetail(base);
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeName).toBe('');
    // остальные поля (не ПДн) на месте
    expect(rows[0].date).toBe('2026-06-10');
    expect(rows[0].projectName).toBe('PA-001 — Проект А');
    expect(rows[0].hours).toBe(8);
  });

  it('CISO-007: CSV-экспорт без явного reveal не содержит ФИО', () => {
    const csv = detailToCsv(computeDetail(base));
    expect(csv).not.toContain('Иванов');
  });

  it('без фильтров возвращает все записи', () => {
    const i = input({
      entries: [entry({ id: 'e1', date: '2026-06-01' }), entry({ id: 'e2', date: '2026-06-02' })],
      projects: [project], employees: [employee], departments: [dept], workTypes: [workType],
    });
    expect(computeDetail(i)).toHaveLength(2);
  });

  it('фильтр employeeId — отсекает чужих', () => {
    const other = { ...employee, id: 'emp2' };
    const i = input({
      entries: [entry({ employeeId: 'emp1' }), entry({ id: 'e2', employeeId: 'emp2' })],
      projects: [project], employees: [employee, other], departments: [dept], workTypes: [workType],
    });
    const rows = computeDetail(i, { employeeId: 'emp1' }, true);
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeName).toBe('Иванов Иван');
  });

  it('фильтр projectId — отсекает чужие проекты', () => {
    const proj2 = { ...project, id: 'p2', code: 'PB-002', name: 'Проект Б' };
    const i = input({
      entries: [entry({ projectId: 'p1' }), entry({ id: 'e2', projectId: 'p2' })],
      projects: [project, proj2], employees: [employee], departments: [dept], workTypes: [workType],
    });
    expect(computeDetail(i, { projectId: 'p1' })).toHaveLength(1);
  });

  it('фильтр deptId — отсекает по отделу сотрудника', () => {
    const emp2 = { ...employee, id: 'emp2', departmentId: 'd2' };
    const dept2 = { ...dept, id: 'd2', code: 'OTHER' };
    const i = input({
      entries: [entry({ employeeId: 'emp1' }), entry({ id: 'e2', employeeId: 'emp2' })],
      projects: [project], employees: [employee, emp2], departments: [dept, dept2], workTypes: [workType],
    });
    expect(computeDetail(i, { deptId: 'd1' })).toHaveLength(1);
  });

  it('сортировка: по дате возр., затем по сотруднику', () => {
    const emp2 = { ...employee, id: 'emp2', firstName: 'Анна', lastName: 'Аракелян' };
    const i = input({
      entries: [
        entry({ id: 'e3', date: '2026-06-03', employeeId: 'emp1' }),
        entry({ id: 'e1', date: '2026-06-01', employeeId: 'emp2' }),
        entry({ id: 'e2', date: '2026-06-01', employeeId: 'emp1' }),
      ],
      projects: [project], employees: [employee, emp2], departments: [dept], workTypes: [workType],
    });
    const rows = computeDetail(i);
    expect(rows[0].date).toBe('2026-06-01');
    expect(rows[2].date).toBe('2026-06-03');
  });

  it('неизвестный сотрудник/проект → пустые строки, не падает', () => {
    const i = input({
      entries: [entry({ employeeId: null, projectId: null, workTypeId: null })],
      projects: [], employees: [], departments: [dept], workTypes: [],
    });
    const rows = computeDetail(i);
    expect(rows).toHaveLength(1);
    expect(rows[0].employeeName).toBe('');
    expect(rows[0].projectName).toBe('');
  });

  it('hours: нечисловое → 0', () => {
    const i = input({
      entries: [entry({ hours: null })],
      projects: [project], employees: [employee], departments: [dept], workTypes: [workType],
    });
    expect(computeDetail(i)[0].hours).toBe(0);
  });
});

// ─── detailToCsv ─────────────────────────────────────────────────────────────

describe('detailToCsv', () => {
  const row: DetailRow = {
    date: '2026-06-10',
    employeeName: 'Иванов Иван',
    deptName: 'OPIB',
    projectName: 'PA-001 — Проект А',
    workTypeName: 'Разработка',
    hours: 8,
    status: 'DRAFT',
  };

  // F-F (REQ-0006): 1С/RU-Excel → разделитель `;`, BOM (флаг).
  it('первая строка — заголовки (разделитель `;`)', () => {
    const csv = detailToCsv([row]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Дата;Сотрудник;Отдел;Проект;Вид работ;Часы;Статус');
  });

  it('данные-строка соответствует порядку колонок', () => {
    const csv = detailToCsv([row]);
    const dataLine = csv.split('\r\n')[1];
    expect(dataLine).toBe('2026-06-10;Иванов Иван;OPIB;PA-001 — Проект А;Разработка;8;DRAFT');
  });

  it('пустой список → только заголовок', () => {
    const csv = detailToCsv([]);
    expect(csv).toBe('Дата;Сотрудник;Отдел;Проект;Вид работ;Часы;Статус');
  });

  // RU-локаль: запятая в значении НЕ требует кавычек (разделитель `;`).
  it('значение с запятой при `;`-разделителе НЕ оборачивается', () => {
    const r: DetailRow = { ...row, projectName: 'Иванов, А.' };
    const csv = detailToCsv([r]);
    expect(csv).toContain('Иванов, А.');
    expect(csv).not.toContain('"Иванов, А."');
  });

  it('значение с `;` → обёртка в кавычки', () => {
    const r: DetailRow = { ...row, projectName: 'A; B' };
    const csv = detailToCsv([r]);
    expect(csv).toContain('"A; B"');
  });

  it('значение с кавычкой → двойные кавычки (RFC 4180)', () => {
    const r: DetailRow = { ...row, employeeName: 'O\'Brien "Bob"' };
    const csv = detailToCsv([r]);
    expect(csv).toContain('"O\'Brien ""Bob"""');
  });

  it('разделитель строк \r\n (Excel-совместимый)', () => {
    const csv = detailToCsv([row, row]);
    expect(csv.split('\r\n')).toHaveLength(3);
    expect(csv).not.toContain('\n\r');
  });

  // BOM — только по флагу withBom (для файла-выгрузки 1С/Excel).
  it('withBom=false (дефолт) → без BOM', () => {
    expect(detailToCsv([row]).startsWith(CSV_BOM)).toBe(false);
  });

  it('withBom=true → строка начинается с UTF-8 BOM', () => {
    const csv = detailToCsv([row], { withBom: true });
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('кастомный разделитель `,` (обратная совместимость)', () => {
    const csv = detailToCsv([row], { delimiter: ',' });
    expect(csv.split('\r\n')[0]).toBe('Дата,Сотрудник,Отдел,Проект,Вид работ,Часы,Статус');
  });
});

// ─── escapeCsv / toCsvRow (чистые) ──────────────────────────────────────────

describe('escapeCsv', () => {
  it('простое значение — без изменений', () => {
    expect(escapeCsv('Иванов')).toBe('Иванов');
    expect(escapeCsv(8)).toBe('8');
  });

  it('null/undefined → пустая строка', () => {
    expect(escapeCsv(null as unknown as string)).toBe('');
    expect(escapeCsv(undefined as unknown as string)).toBe('');
  });

  it('значение с разделителем `;` → кавычки', () => {
    expect(escapeCsv('a;b')).toBe('"a;b"');
  });

  it('кавычка → удвоение + обёртка', () => {
    expect(escapeCsv('a"b')).toBe('"a""b"');
  });

  it('перевод строки (CR/LF) → кавычки', () => {
    expect(escapeCsv('a\nb')).toBe('"a\nb"');
    expect(escapeCsv('a\r\nb')).toBe('"a\r\nb"');
  });

  it('запятая при дефолтном `;`-разделителе НЕ экранируется', () => {
    expect(escapeCsv('a,b')).toBe('a,b');
  });

  it('кастомный разделитель `,` → запятая экранируется', () => {
    expect(escapeCsv('a,b', ',')).toBe('"a,b"');
    expect(escapeCsv('a;b', ',')).toBe('a;b');
  });
});

describe('toCsvRow', () => {
  it('собирает строку через `;` с экранированием', () => {
    expect(toCsvRow(['2026-06-10', 'A; B', 8])).toBe('2026-06-10;"A; B";8');
  });

  it('кастомный разделитель', () => {
    expect(toCsvRow(['a', 'b'], ',')).toBe('a,b');
  });
});
