import { describe, expect, it } from 'vitest';

import {
  computeReports,
  finalize,
  util,
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
  departments: [{ id: 'd1', code: 'OV', capacityFactor: 1, headcount: 1 }],
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
    const r = finalize({ key: 'k', name: 'n', fact: 8, client: 6, norm: 15, util: null, under: null });
    expect(r.under).toBe(7);
    expect(r.util).toBe(0.75);
  });
  it('norm=null -> under=null', () => {
    const r = finalize({ key: 'k', name: 'n', fact: 8, client: 6, norm: null, util: null, under: null });
    expect(r.under).toBeNull();
  });
});

describe('computeReports — базовый', () => {
  const res = computeReports(base(), PERIOD);

  it('норма = Σ часов рабочих дней (8+7=15) × capacityFactor', () => {
    expect(res.byEmployee[0].norm).toBe(15);
    expect(res.byDept[0].norm).toBe(15); // headcount=1, factor=1
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
    inp.departments = [{ id: 'd1', code: 'OV', capacityFactor: 0.8, headcount: 1 }];
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

  it('норма отдела учитывает headcount: baseNorm(15) × headcount(3) × factor(1) = 45', () => {
    const inp = base();
    inp.departments = [{ id: 'd1', code: 'OV', capacityFactor: 1, headcount: 3 }];
    const res = computeReports(inp, PERIOD);
    expect(res.byDept[0].norm).toBe(45);
    expect(res.byEmployee[0].norm).toBe(15); // личная норма headcount НЕ множит
  });

  it('группировка по 2 отделам: факт распределён, Σ byDept == totals', () => {
    const inp = base();
    inp.departments = [
      { id: 'd1', code: 'OV', capacityFactor: 1, headcount: 1 },
      { id: 'd2', code: 'OIB', capacityFactor: 1, headcount: 1 },
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
