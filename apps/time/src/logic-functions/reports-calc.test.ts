import { describe, expect, it } from 'vitest';

import {
  OLAP_DIMENSIONS,
  WORKDAY_TYPES,
  computeOlap,
  computeReports,
  computeTimeseries,
  finalize,
  fteHeadcountByDept,
  util,
  type OlapParams,
  type RawEmpDeptAssignment,
  type RawEmployee,
  type ReportsInput,
} from './reports-calc';

const PERIOD = { from: '2026-01-01', to: '2026-06-30' };

// Базовый набор: 1 отдел, 1 сотрудник, 2 проекта (клиентский + внутренний), 2 раб. дня.
const base = (): ReportsInput => ({
  entries: [
    { hours: 6, projectId: 'p-cli', employeeId: 'e1' },
    { hours: 2, projectId: 'p-int', employeeId: 'e1' },
  ],
  projects: [
    { id: 'p-cli', name: 'Клиент', code: 'OV-1', category: 'CLIENT', departmentId: 'd1', plannedEffort: 12 },
    { id: 'p-int', name: 'Внутр', code: 'OV-2', category: 'INTERNAL', departmentId: 'd1', plannedEffort: null },
  ],
  employees: [{ id: 'e1', firstName: 'Иван', lastName: 'Иванов', departmentId: 'd1' }],
  departments: [{ id: 'd1', code: 'OV', capacityFactor: 1 }],
  calendar: [
    { hours: 8, dayType: 'WORKDAY' },
    { hours: 7, dayType: 'SHORT' },
  ],
});

describe('util', () => {
  it('client/fact, округление 4 знака', () => {
    expect(util(6, 8)).toBe(0.75);
  });
  it('fact=0 -> null (без NaN)', () => {
    expect(util(0, 0)).toBeNull();
  });
});

describe('finalize', () => {
  it('under = norm - fact', () => {
    const r = finalize({ key: 'k', name: 'n', fact: 8, client: 6, norm: 15, util: null, under: null, byCategory: [] });
    expect(r.under).toBe(7);
    expect(r.util).toBe(0.75);
  });
  it('norm=null -> under=null', () => {
    const r = finalize({ key: 'k', name: 'n', fact: 8, client: 6, norm: null, util: null, under: null, byCategory: [] });
    expect(r.under).toBeNull();
  });
});

describe('computeReports — базовый', () => {
  const res = computeReports(base(), PERIOD);

  it('норма = Σ часов рабочих дней (8+7=15) × capacityFactor', () => {
    expect(res.byEmployee[0].norm).toBe(15);
    expect(res.byDept[0].norm).toBe(15); // headcount(вычисл.)=1 актив. сотр., factor=1
  });
  it('утилизация = client/fact = 6/8', () => {
    expect(res.totals.util).toBe(0.75);
    expect(res.byEmployee[0].util).toBe(0.75);
  });
  it('недогруз = норма-факт = 15-8 = 7', () => {
    expect(res.totals.under).toBe(7);
  });
  it('byProject: норма null, клиентский проект client=fact', () => {
    const cli = res.byProject.find((p) => p.key === 'p-cli');
    expect(cli?.norm).toBeNull();
    expect(cli?.util).toBe(1);
    expect(cli?.category).toBe('CLIENT');
  });
  it('byProject бюджет (F-A): plannedEffort + budgetUsed=факт/план', () => {
    const cli = res.byProject.find((p) => p.key === 'p-cli');
    expect(cli?.plannedEffort).toBe(12);
    expect(cli?.budgetUsed).toBe(0.5); // fact 6 / план 12
    const int = res.byProject.find((p) => p.key === 'p-int');
    expect(int?.plannedEffort).toBeNull();
    expect(int?.budgetUsed).toBeNull(); // нет плана → null (без деления на 0)
  });
  it('Σ byDept.fact == totals.fact', () => {
    const sum = res.byDept.reduce((s, r) => s + r.fact, 0);
    expect(sum).toBe(res.totals.fact);
  });
});

describe('computeReports — edge', () => {
  it('праздники/выходные не входят в норму', () => {
    const inp = base();
    inp.calendar = [
      { hours: 8, dayType: 'WORKDAY' },
      { hours: 8, dayType: 'HOLIDAY' },
      { hours: 0, dayType: 'WEEKEND' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(8); // только WORKDAY
  });

  it('0 ёмкость (пустой календарь) -> norm=0, under=-fact, util считается', () => {
    const inp = base();
    inp.calendar = [];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(0);
    expect(res.totals.under).toBe(-8);
    expect(res.totals.util).toBe(0.75);
  });

  it('пустой период (нет записей) -> util=null, строки пусты', () => {
    const inp = base();
    inp.entries = [];
    const res = computeReports(inp, PERIOD);
    expect(res.totals.fact).toBe(0);
    expect(res.totals.util).toBeNull();
    expect(res.byProject).toHaveLength(0);
    expect(res.byEmployee).toHaveLength(0);
    expect(res.byDept).toHaveLength(1); // отделы всегда (capacity-вид)
  });

  it('capacityFactor 0.8 применяется к личной норме', () => {
    const inp = base();
    inp.departments = [{ id: 'd1', code: 'OV', capacityFactor: 0.8 }];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(12); // 15 × 0.8
  });

  it('запись без employeeId падает в отдел через проект', () => {
    const inp = base();
    inp.entries = [{ hours: 5, projectId: 'p-cli', employeeId: null }];
    const res = computeReports(inp, PERIOD);
    expect(res.byDept[0].fact).toBe(5);
    expect(res.byEmployee).toHaveLength(0);
  });
});

// Дополнение QA (R2-QA): семантика util, множитель нормы отдела, группировки >1.
describe('computeReports — util семантика + группировки (QA)', () => {
  it('util=0 при fact>0 без клиентских часов (НЕ null) — отличие от пустого периода', () => {
    const inp = base();
    inp.entries = [{ hours: 5, projectId: 'p-int', employeeId: 'e1' }]; // только внутренний
    const res = computeReports(inp, PERIOD);
    expect(res.totals.fact).toBe(5);
    expect(res.totals.util).toBe(0); // client=0, fact>0 → 0, не null
  });

  it('норма отдела = baseNorm(15) × headcount(3 актив. сотр.) × factor(1) = 45', () => {
    const inp = base();
    // headcount ВЫЧИСЛЯЕМЫЙ: 3 активных сотрудника отдела → множитель 3.
    inp.departments = [{ id: 'd1', code: 'OV', capacityFactor: 1 }];
    inp.employees = [
      { id: 'e1', firstName: 'И', lastName: 'И', departmentId: 'd1' },
      { id: 'e2', firstName: 'П', lastName: 'П', departmentId: 'd1' },
      { id: 'e3', firstName: 'С', lastName: 'С', departmentId: 'd1' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byDept[0].norm).toBe(45);
    expect(res.byEmployee[0].norm).toBe(15); // личная норма headcount НЕ множит
  });

  it('группировка по 2 отделам: факт распределён, Σ byDept == totals', () => {
    const inp = base();
    inp.departments = [
      { id: 'd1', code: 'OV', capacityFactor: 1 },
      { id: 'd2', code: 'OIB', capacityFactor: 1 },
    ];
    inp.employees = [
      { id: 'e1', firstName: 'И', lastName: 'И', departmentId: 'd1' },
      { id: 'e2', firstName: 'П', lastName: 'П', departmentId: 'd2' },
    ];
    inp.entries = [
      { hours: 6, projectId: 'p-cli', employeeId: 'e1' },
      { hours: 4, projectId: 'p-int', employeeId: 'e2' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byDept.find((r) => r.key === 'd1')?.fact).toBe(6);
    expect(res.byDept.find((r) => r.key === 'd2')?.fact).toBe(4);
    expect(res.byDept.reduce((s, r) => s + r.fact, 0)).toBe(res.totals.fact);
    expect(res.byEmployee).toHaveLength(2);
  });

  it('budgetUsed > 1 при перевыработке плана (факт 20 / план 12)', () => {
    const inp = base();
    inp.entries = [{ hours: 20, projectId: 'p-cli', employeeId: 'e1' }];
    const res = computeReports(inp, PERIOD);
    expect(res.byProject.find((p) => p.key === 'p-cli')?.budgetUsed).toBeCloseTo(20 / 12, 4);
  });

  it('запись с hours=null пропускается (не ломает суммы)', () => {
    const inp = base();
    inp.entries = [
      { hours: null, projectId: 'p-cli', employeeId: 'e1' },
      { hours: 3, projectId: 'p-int', employeeId: 'e1' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.totals.fact).toBe(3);
  });
});

// F-D phase2: отсутствия вычитают рабочие часы из нормы сотрудника/отдела.
describe('computeReports — отсутствия→норма (F-D)', () => {
  // Календарь с ДАТАМИ: 3 рабочих дня по 8ч = база 24ч.
  const withDatedCalendar = (): ReportsInput => {
    const inp = base();
    inp.calendar = [
      { hours: 8, dayType: 'WORKDAY', date: '2026-03-02T00:00:00.000Z' },
      { hours: 8, dayType: 'WORKDAY', date: '2026-03-03T00:00:00.000Z' },
      { hours: 8, dayType: 'WORKDAY', date: '2026-03-04T00:00:00.000Z' },
      { hours: 0, dayType: 'WEEKEND', date: '2026-03-07T00:00:00.000Z' },
    ];
    return inp;
  };

  it('без отсутствий норма не меняется (обратная совместимость)', () => {
    const res = computeReports(withDatedCalendar(), PERIOD);
    expect(res.byEmployee[0].norm).toBe(24); // 3×8, без вычета
    expect(res.byDept[0].norm).toBe(24);
  });

  it('отсутствие 2 рабочих дня вычитает 16ч из личной нормы и нормы отдела', () => {
    const inp = withDatedCalendar();
    inp.absences = [
      { employeeId: 'e1', startDate: '2026-03-02T00:00:00.000Z', endDate: '2026-03-03T23:59:59.000Z' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(8); // 24 − 16 (2 раб. дня)
    expect(res.byDept[0].norm).toBe(8); // отдел = Σ по сотрудникам отдела
    expect(res.byEmployee[0].under).toBe(0); // норма 8 − факт 8 = 0
  });

  it('выходной в периоде отсутствия не вычитается', () => {
    const inp = withDatedCalendar();
    // вт–сб: вычитает только раб. дни 03-03,03-04; выходной 03-07 = 0
    inp.absences = [
      { employeeId: 'e1', startDate: '2026-03-03T00:00:00.000Z', endDate: '2026-03-07T23:59:59.000Z' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(8); // 24 − 16 (03-03 + 03-04)
  });

  it('отсутствие вне отчётного периода не вычитается', () => {
    const inp = withDatedCalendar();
    inp.absences = [
      { employeeId: 'e1', startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-01-10T23:59:59.000Z' },
    ];
    const res = computeReports(inp, PERIOD); // PERIOD = 2026 H1
    expect(res.byEmployee[0].norm).toBe(24);
  });

  it('SHORT-день вычитается своими часами (7ч)', () => {
    const inp = withDatedCalendar();
    inp.calendar = [
      { hours: 8, dayType: 'WORKDAY', date: '2026-03-02T00:00:00.000Z' },
      { hours: 7, dayType: 'SHORT', date: '2026-03-03T00:00:00.000Z' },
    ];
    inp.absences = [
      { employeeId: 'e1', startDate: '2026-03-03T00:00:00.000Z', endDate: '2026-03-03T23:59:59.000Z' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(8); // база 15 − 7 (SHORT)
  });

  it('норма не уходит ниже 0 при отсутствии длиннее периода', () => {
    const inp = withDatedCalendar();
    inp.absences = [
      { employeeId: 'e1', startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(0); // все раб. дни вычтены, не отрицательно
  });

  it('отсутствие другого сотрудника не трогает чужую норму', () => {
    const inp = withDatedCalendar();
    inp.employees = [
      { id: 'e1', firstName: 'И', lastName: 'И', departmentId: 'd1' },
      { id: 'e2', firstName: 'П', lastName: 'П', departmentId: 'd1' },
    ];
    inp.departments = [{ id: 'd1', code: 'OV', capacityFactor: 1 }];
    inp.absences = [
      { employeeId: 'e2', startDate: '2026-03-02T00:00:00.000Z', endDate: '2026-03-03T23:59:59.000Z' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee.find((e) => e.key === 'e1')?.norm).toBe(24); // e1 без отсутствия
    expect(res.byDept[0].norm).toBe(32); // база 24×2=48 − 16 = 32
  });

  it('календарь без date — отсутствие нечего вычесть (безопасная деградация)', () => {
    const inp = base(); // calendar без поля date
    inp.absences = [
      { employeeId: 'e1', startDate: '2026-03-02T00:00:00.000Z', endDate: '2026-03-03T23:59:59.000Z' },
    ];
    const res = computeReports(inp, PERIOD);
    expect(res.byEmployee[0].norm).toBe(15); // база 8+7, ничего не вычтено (нет дат)
  });
});

describe('computeReports — byCategory (R3-D2)', () => {
  it('totals.byCategory: часы+доля по категории, Σ часов == fact', () => {
    const res = computeReports(base(), PERIOD); // CLIENT 6 + INTERNAL 2 = 8
    const cats = res.totals.byCategory;
    const client = cats.find((c) => c.category === 'CLIENT');
    const internal = cats.find((c) => c.category === 'INTERNAL');
    expect(client?.hours).toBe(6);
    expect(client?.share).toBe(0.75); // 6/8
    expect(internal?.hours).toBe(2);
    expect(internal?.share).toBe(0.25);
    expect(cats.reduce((s, c) => s + c.hours, 0)).toBe(res.totals.fact);
  });

  it('byCategory отсортирован по убыванию часов', () => {
    const res = computeReports(base(), PERIOD);
    const h = res.totals.byCategory.map((c) => c.hours);
    expect(h).toEqual([...h].sort((a, b) => b - a));
  });

  it('byDept и byEmployee несут свою byCategory', () => {
    const res = computeReports(base(), PERIOD);
    expect(res.byEmployee[0].byCategory.find((c) => c.category === 'CLIENT')?.hours).toBe(6);
    expect(res.byDept.find((r) => r.key === 'd1')?.byCategory.length).toBe(2);
  });

  it('запись без проекта/категории → бакет OTHER', () => {
    const inp = base();
    inp.entries = [{ hours: 4, projectId: null, employeeId: 'e1' }];
    const res = computeReports(inp, PERIOD);
    expect(res.totals.byCategory).toEqual([{ category: 'OTHER', hours: 4, share: 1 }]);
  });

  it('пустой период → byCategory пуст', () => {
    const inp = base();
    inp.entries = [];
    const res = computeReports(inp, PERIOD);
    expect(res.totals.byCategory).toEqual([]);
  });
});

// ─── computeOlap ─────────────────────────────────────────────────────────────

const olapBase = (): ReportsInput => ({
  entries: [
    { hours: 6, projectId: 'p-cli', employeeId: 'e1', workTypeId: 'w1' },
    { hours: 2, projectId: 'p-int', employeeId: 'e1', workTypeId: 'w2' },
    { hours: 4, projectId: 'p-cli', employeeId: 'e2', workTypeId: 'w1' },
  ],
  projects: [
    { id: 'p-cli', name: 'Клиент', code: 'CLI', category: 'CLIENT', departmentId: 'd1', plannedEffort: null },
    { id: 'p-int', name: 'Внутр', code: 'INT', category: 'INTERNAL', departmentId: 'd1', plannedEffort: null },
  ],
  employees: [
    { id: 'e1', firstName: 'Иван', lastName: 'Иванов', departmentId: 'd1' },
    { id: 'e2', firstName: 'Мария', lastName: 'Петрова', departmentId: 'd1' },
  ],
  departments: [{ id: 'd1', code: 'OV', capacityFactor: 1 }],
  calendar: [{ hours: 8, dayType: 'WORKDAY', date: '2026-06-01' }],
  workTypes: [
    { id: 'w1', name: 'Разработка', group: 'DEV' },
    { id: 'w2', name: 'Тестирование', group: 'QA' },
  ],
});

const olap = (params: OlapParams) => computeOlap(olapBase(), PERIOD, params);

describe('computeOlap — базовый groupBy', () => {
  it('groupBy=project → 2 строки (p-cli + p-int)', () => {
    const { rows } = olap({ groupBy: 'project' });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.key).sort()).toEqual(['p-cli', 'p-int']);
  });

  it('groupBy=project → факт агрегируется (p-cli = 6+4 = 10)', () => {
    const { rows } = olap({ groupBy: 'project' });
    const cli = rows.find((r) => r.key === 'p-cli');
    expect(cli?.fact).toBe(10);
  });

  it('groupBy=employee → e1 = 8 (6+2), e2 = 4', () => {
    const { rows } = olap({ groupBy: 'employee' });
    const e1 = rows.find((r) => r.key === 'e1');
    const e2 = rows.find((r) => r.key === 'e2');
    expect(e1?.fact).toBe(8);
    expect(e2?.fact).toBe(4);
  });

  it('groupBy=dept → 1 строка (d1 = 12)', () => {
    const { rows } = olap({ groupBy: 'dept' });
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe('d1');
    expect(rows[0].fact).toBe(12);
  });

  it('groupBy=workType → w1=10, w2=2', () => {
    const { rows } = olap({ groupBy: 'workType' });
    expect(rows.find((r) => r.key === 'w1')?.fact).toBe(10);
    expect(rows.find((r) => r.key === 'w2')?.fact).toBe(2);
  });

  it('groupBy=workTypeGroup → DEV=10, QA=2', () => {
    const { rows } = olap({ groupBy: 'workTypeGroup' });
    expect(rows.find((r) => r.key === 'DEV')?.fact).toBe(10);
    expect(rows.find((r) => r.key === 'QA')?.fact).toBe(2);
  });
});

describe('computeOlap — totals', () => {
  it('totals.fact = Σ всех записей', () => {
    const { totals } = olap({ groupBy: 'project' });
    expect(totals.fact).toBe(12); // 6+2+4
  });

  it('hours=0 не учитываются', () => {
    const inp = olapBase();
    inp.entries.push({ hours: 0, projectId: 'p-cli', employeeId: 'e1' });
    const { totals } = computeOlap(inp, PERIOD, { groupBy: 'project' });
    expect(totals.fact).toBe(12); // 0 не плюсуется
  });
});

describe('computeOlap — фильтры', () => {
  it('filter category=CLIENT → только CLIENT-записи (p-cli)', () => {
    const { rows, totals } = olap({
      groupBy: 'project',
      filters: [{ dim: 'category', value: 'CLIENT' }],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe('p-cli');
    expect(totals.fact).toBe(10);
  });

  it('filter employee=e1 → только записи e1 (8 ч)', () => {
    const { totals } = olap({
      groupBy: 'project',
      filters: [{ dim: 'employee', value: 'e1' }],
    });
    expect(totals.fact).toBe(8); // 6+2
  });

  it('appliedFilters содержит label', () => {
    const { appliedFilters } = olap({
      groupBy: 'project',
      filters: [{ dim: 'dept', value: 'd1' }],
    });
    expect(appliedFilters[0].label).toBe('OV'); // dept.code
  });
});

describe('computeOlap — норма', () => {
  it('groupBy=dept → норма = baseNorm * headcount * capacityFactor', () => {
    // baseNorm=8 (1 WORKDAY), headcount d1=2, capacityFactor=1 → норма=16
    const { rows } = olap({ groupBy: 'dept' });
    expect(rows[0].norm).toBe(16);
  });

  it('groupBy=employee → норма = baseNorm * capacityFactor сотрудника', () => {
    // baseNorm=8, capacityFactor=1 → 8 на каждого
    const { rows } = olap({ groupBy: 'employee' });
    expect(rows.every((r) => r.norm === 8)).toBe(true);
  });

  it('groupBy=project → норма null (факт-режущий groupBy)', () => {
    const { rows } = olap({ groupBy: 'project' });
    expect(rows.every((r) => r.norm === null)).toBe(true);
  });

  it('groupBy=dept с filter category=CLIENT → норма null (fact-cutting фильтр)', () => {
    const { rows } = olap({
      groupBy: 'dept',
      filters: [{ dim: 'category', value: 'CLIENT' }],
    });
    expect(rows[0].norm).toBeNull();
  });
});

describe('computeOlap — сортировка', () => {
  it('дефолт: по fact убыв (p-cli=10 перед p-int=2)', () => {
    const { rows } = olap({ groupBy: 'project' });
    expect(rows[0].key).toBe('p-cli');
    expect(rows[1].key).toBe('p-int');
  });

  it('sort by name asc → алфавит', () => {
    const { rows } = olap({ groupBy: 'project', sort: { by: 'name', dir: 'asc' } });
    const names = rows.map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('sort by fact asc → p-int(2) перед p-cli(10)', () => {
    const { rows } = olap({ groupBy: 'project', sort: { by: 'fact', dir: 'asc' } });
    expect(rows[0].key).toBe('p-int');
  });
});

describe('computeOlap — пагинация', () => {
  it('limit=1 → 1 строка, hasNextPage=true, endCursor="1"', () => {
    const { rows, pageInfo } = olap({ groupBy: 'project', limit: 1 });
    expect(rows).toHaveLength(1);
    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.endCursor).toBe('1');
  });

  it('cursor="1" + limit=1 → вторая страница', () => {
    const first = olap({ groupBy: 'project', limit: 1 });
    const second = olap({ groupBy: 'project', limit: 1, cursor: first.pageInfo.endCursor });
    expect(second.rows[0].key).not.toBe(first.rows[0].key);
  });

  it('limit > total → hasNextPage=false, endCursor=null', () => {
    const { pageInfo } = olap({ groupBy: 'project', limit: 100 });
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.endCursor).toBeNull();
  });
});

describe('computeOlap — availableDims и drillable', () => {
  it('groupBy=project → "project" не в availableDims', () => {
    const { availableDims } = olap({ groupBy: 'project' });
    expect(availableDims).not.toContain('project');
  });

  it('filter dept + groupBy=employee → оба не в availableDims', () => {
    const { availableDims } = olap({
      groupBy: 'employee',
      filters: [{ dim: 'dept', value: 'd1' }],
    });
    expect(availableDims).not.toContain('employee');
    expect(availableDims).not.toContain('dept');
  });

  it('drillable каждой строки == availableDims', () => {
    const { rows, availableDims } = olap({ groupBy: 'project' });
    expect(rows.every((r) => r.drillable === availableDims || JSON.stringify(r.drillable) === JSON.stringify(availableDims))).toBe(true);
  });
});

describe('computeOlap — dimLabel', () => {
  it('groupBy=employee → name = "Фамилия Имя"', () => {
    const { rows } = olap({ groupBy: 'employee' });
    expect(rows.find((r) => r.key === 'e1')?.name).toBe('Иванов Иван');
  });

  it('groupBy=dept → name = dept.code', () => {
    const { rows } = olap({ groupBy: 'dept' });
    expect(rows[0].name).toBe('OV');
  });

  it('groupBy=project → name = project.name', () => {
    const { rows } = olap({ groupBy: 'project' });
    expect(rows.find((r) => r.key === 'p-cli')?.name).toBe('Клиент');
  });

  it('entry без employeeId (dimValue null) → строка не создаётся при groupBy=employee', () => {
    const inp = olapBase();
    inp.entries.push({ hours: 5, projectId: 'p-cli', employeeId: null });
    const { rows } = computeOlap(inp, PERIOD, { groupBy: 'employee' });
    expect(rows.find((r) => r.key === null)).toBeUndefined();
    expect(rows.map((r) => r.key)).not.toContain(null);
  });
});

describe('WORKDAY_TYPES — SSOT рабочих дней', () => {
  it('содержит WORKDAY и SHORT', () => {
    expect(WORKDAY_TYPES.has('WORKDAY')).toBe(true);
    expect(WORKDAY_TYPES.has('SHORT')).toBe(true);
  });

  it('не содержит HOLIDAY, DAYOFF (нерабочие дни вне нормы)', () => {
    expect(WORKDAY_TYPES.has('HOLIDAY')).toBe(false);
    expect(WORKDAY_TYPES.has('DAYOFF')).toBe(false);
    expect(WORKDAY_TYPES.has('')).toBe(false);
  });

  it('ровно 2 значения (SSOT-guard на расширение)', () => {
    expect(WORKDAY_TYPES.size).toBe(2);
  });
});

describe('OLAP_DIMENSIONS — SSOT набора осей', () => {
  const EXPECTED = ['dept', 'employee', 'project', 'workType', 'category', 'stage', 'workTypeGroup'];

  it('содержит все 7 ожидаемых осей', () => {
    for (const dim of EXPECTED) {
      expect(OLAP_DIMENSIONS).toContain(dim);
    }
  });

  it('ровно 7 осей (SSOT-guard на добавление без теста)', () => {
    expect(OLAP_DIMENSIONS).toHaveLength(7);
  });

  it('нет дублей', () => {
    expect(new Set(OLAP_DIMENSIONS).size).toBe(OLAP_DIMENSIONS.length);
  });
});

// REQ-0011: численность отдела = Σ FTE назначений, активных в периоде отчёта.
const emp = (over: Partial<RawEmployee> = {}): RawEmployee => ({
  id: 'e1', firstName: 'И', lastName: 'И', departmentId: 'd1', ...over,
});
const asgn = (over: Partial<RawEmpDeptAssignment> = {}): RawEmpDeptAssignment => ({
  employeeId: 'e1', departmentId: 'd1', ftePercent: 100, startDate: null, endDate: null, ...over,
});

describe('fteHeadcountByDept (REQ-0011)', () => {
  it('без assignments → null (fallback на count у вызывающего)', () => {
    expect(fteHeadcountByDept(undefined, [emp()], '2026-01-01', '2026-01-31')).toBeNull();
  });

  it('Σ FTE: два по 50% → 1.0', () => {
    const r = fteHeadcountByDept(
      [asgn({ employeeId: 'e1', ftePercent: 50 }), asgn({ employeeId: 'e2', ftePercent: 50 })],
      [], '2026-01-01', '2026-01-31',
    );
    expect(r?.get('d1')).toBeCloseTo(1.0);
  });

  it('дробный FTE: 30% → 0.3', () => {
    const r = fteHeadcountByDept([asgn({ ftePercent: 30 })], [], '2026-01-01', '2026-01-31');
    expect(r?.get('d1')).toBeCloseTo(0.3);
  });

  it('дата вне периода → не учитывается', () => {
    const r = fteHeadcountByDept([asgn({ endDate: '2025-12-31' })], [], '2026-01-01', '2026-01-31');
    expect(r?.get('d1')).toBeUndefined();
  });

  it('fallback: сотрудник без записей = 100% по departmentId', () => {
    const r = fteHeadcountByDept([], [emp()], '2026-01-01', '2026-01-31');
    expect(r?.get('d1')).toBeCloseTo(1.0);
  });

  it('50/50 на два отдела одним сотрудником', () => {
    const r = fteHeadcountByDept(
      [asgn({ departmentId: 'd1', ftePercent: 50 }), asgn({ departmentId: 'd2', ftePercent: 50 })],
      [], '2026-01-01', '2026-01-31',
    );
    expect(r?.get('d1')).toBeCloseTo(0.5);
    expect(r?.get('d2')).toBeCloseTo(0.5);
  });
});

describe('computeReports норма по FTE (REQ-0011)', () => {
  // baseNorm = 8+7 = 15 (1 рабочий + 1 сокращ. день), capacityFactor=1.
  it('norm отдела с FTE 50% = baseNorm × 0.5', () => {
    const input: ReportsInput = {
      ...base(),
      assignments: [asgn({ ftePercent: 50 })],
    };
    const res = computeReports(input, PERIOD);
    const dept = res.byDept.find((r) => r.key === 'd1');
    expect(dept?.norm).toBeCloseTo(15 * 0.5, 2);
  });

  it('без assignments — прежний count (norm = baseNorm × 1)', () => {
    const res = computeReports(base(), PERIOD);
    const dept = res.byDept.find((r) => r.key === 'd1');
    expect(dept?.norm).toBeCloseTo(15, 2);
  });
});

// ─── computeTimeseries (C4 «Тренд утилизации по месяцам») ────────────────────
describe('computeTimeseries — тренд по месяцам', () => {
  const YEAR = { from: '2026-01-01', to: '2026-12-31' };

  // 2 отдела. Календарь: янв = 2 раб. дня по 8ч (16ч), фев = 1 раб. день 8ч.
  // Записи: янв — e1 (d1) 6ч клиент + 2ч внутр; фев — e2 (d2) 4ч клиент.
  const ts = (): ReportsInput => ({
    entries: [
      { hours: 6, projectId: 'p-cli', employeeId: 'e1', date: '2026-01-15T00:00:00.000Z' },
      { hours: 2, projectId: 'p-int', employeeId: 'e1', date: '2026-01-20T00:00:00.000Z' },
      { hours: 4, projectId: 'p-cli', employeeId: 'e2', date: '2026-02-10T00:00:00.000Z' },
    ],
    projects: [
      { id: 'p-cli', name: 'Клиент', code: 'OV-1', category: 'CLIENT', departmentId: 'd1', plannedEffort: null },
      { id: 'p-int', name: 'Внутр', code: 'OV-2', category: 'INTERNAL', departmentId: 'd1', plannedEffort: null },
    ],
    employees: [
      { id: 'e1', firstName: 'Иван', lastName: 'Иванов', departmentId: 'd1' },
      { id: 'e2', firstName: 'Пётр', lastName: 'Петров', departmentId: 'd2' },
    ],
    departments: [
      { id: 'd1', code: 'OV', capacityFactor: 1 },
      { id: 'd2', code: 'OIB', capacityFactor: 1 },
    ],
    calendar: [
      { hours: 8, dayType: 'WORKDAY', date: '2026-01-12T00:00:00.000Z' },
      { hours: 8, dayType: 'WORKDAY', date: '2026-01-13T00:00:00.000Z' },
      { hours: 8, dayType: 'WORKDAY', date: '2026-02-09T00:00:00.000Z' },
    ],
  });

  it('раскладывает факт/клиента по месяцам даты записи', () => {
    const res = computeTimeseries(ts(), YEAR);
    const jan = res.months.find((m) => m.month === '2026-01');
    const feb = res.months.find((m) => m.month === '2026-02');
    expect(jan?.fact).toBe(8); // 6 + 2
    expect(jan?.client).toBe(6);
    expect(jan?.util).toBeCloseTo(6 / 8, 4);
    expect(feb?.fact).toBe(4);
    expect(feb?.client).toBe(4);
    expect(feb?.util).toBe(1);
  });

  it('норма месяца = Σ раб. часы × headcount по отделам (2 отдела)', () => {
    const res = computeTimeseries(ts(), YEAR);
    const jan = res.months.find((m) => m.month === '2026-01');
    const feb = res.months.find((m) => m.month === '2026-02');
    // янв база 16ч × 2 отдела (по 1 чел.) = 32; фев база 8ч × 2 = 16.
    expect(jan?.norm).toBe(32);
    expect(feb?.norm).toBe(16);
    expect(jan?.under).toBe(32 - 8);
    expect(feb?.under).toBe(16 - 4);
  });

  it('ИНВАРИАНТ: Σ по месяцам fact/client/norm == годовой итог (computeReports)', () => {
    const res = computeTimeseries(ts(), YEAR);
    const annual = computeReports(ts(), YEAR);
    const sum = (k: 'fact' | 'client' | 'norm') =>
      res.months.reduce((s, m) => s + m[k], 0);
    expect(sum('fact')).toBeCloseTo(annual.totals.fact, 2);
    expect(sum('client')).toBeCloseTo(annual.totals.client, 2);
    expect(sum('norm')).toBeCloseTo(annual.totals.norm ?? 0, 2);
  });

  it('пустой месяц (норма есть, факта нет) → fact=0, util=null, under=norm', () => {
    const inp = ts();
    // Добавим раб. день в марте без записей — должен дать точку с фактом 0.
    inp.calendar.push({ hours: 8, dayType: 'WORKDAY', date: '2026-03-05T00:00:00.000Z' });
    const res = computeTimeseries(inp, YEAR);
    const mar = res.months.find((m) => m.month === '2026-03');
    expect(mar).toBeDefined();
    expect(mar?.fact).toBe(0);
    expect(mar?.client).toBe(0);
    expect(mar?.util).toBeNull(); // деление 0/0 → null
    expect(mar?.norm).toBe(16); // 8ч × 2 отдела
    expect(mar?.under).toBe(16); // недогруз = вся норма
  });

  it('фильтр отдела: только записи и норма этого отдела', () => {
    const res = computeTimeseries(ts(), YEAR, { departmentId: 'd1' });
    expect(res.departmentId).toBe('d1');
    const jan = res.months.find((m) => m.month === '2026-01');
    const feb = res.months.find((m) => m.month === '2026-02');
    // d1: янв факт 8 (e1), норма 16 (1 отдел × 16ч). фев — записей d1 нет, факт 0.
    expect(jan?.fact).toBe(8);
    expect(jan?.norm).toBe(16);
    expect(feb?.fact).toBe(0); // e2 ∈ d2 — отфильтрован
    expect(feb?.norm).toBe(8); // норма d1 за фев (нет записей, но норма есть)
  });

  it('фильтр отдела + FTE: численность = Σ FTE назначений отдела', () => {
    const inp = ts();
    inp.assignments = [
      { employeeId: 'e1', departmentId: 'd1', ftePercent: 50, startDate: null, endDate: null },
    ];
    const res = computeTimeseries(inp, YEAR, { departmentId: 'd1' });
    const jan = res.months.find((m) => m.month === '2026-01');
    expect(jan?.norm).toBe(16 * 0.5); // база 16 × FTE 0.5
  });

  it('отсутствие вычитает раб. часы из нормы своего месяца', () => {
    const inp = ts();
    // e1 (d1) отсутствует 2026-01-12 (раб. день 8ч).
    inp.absences = [
      { employeeId: 'e1', startDate: '2026-01-12T00:00:00.000Z', endDate: '2026-01-12T23:59:59.000Z' },
    ];
    const res = computeTimeseries(inp, YEAR, { departmentId: 'd1' });
    const jan = res.months.find((m) => m.month === '2026-01');
    expect(jan?.norm).toBe(16 - 8); // 16 − 8ч отсутствия
  });

  it('запись без date в бакеты не попадает (безопасная деградация)', () => {
    const inp = ts();
    inp.entries.push({ hours: 99, projectId: 'p-cli', employeeId: 'e1', date: null });
    const res = computeTimeseries(inp, YEAR);
    const totalFact = res.months.reduce((s, m) => s + m.fact, 0);
    expect(totalFact).toBe(12); // 99ч без date проигнорированы
  });

  it('месяцы отсортированы по возрастанию', () => {
    const res = computeTimeseries(ts(), YEAR);
    const keys = res.months.map((m) => m.month);
    expect(keys).toEqual([...keys].sort());
  });
});
