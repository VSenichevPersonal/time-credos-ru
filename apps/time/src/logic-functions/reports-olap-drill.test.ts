import { describe, it, expect } from 'vitest';

import { computeOlap, type OlapParams, type ReportsInput } from './reports-calc';

// OLAP drill-down — инвариант консистентности: при drill (re-query с value
// родительской строки как filter) суммы дочерних строк сходятся к родителю.
// Это фундамент доверия к drill-UI (DP-0002 «объяснимые числа»): кликнул цифру
// → углубился → суммы не разъезжаются. Тесты в отдельном файле, т.к. reports-calc
// .test.ts в это время правит REQ-0011-поток (FTE) — избегаем edit-коллизии.
//
// Фикстура (self-contained, факт-ориентированная — норма/FTE не проверяется):
//   e1/p-cli/w1 = 6 · e1/p-int/w2 = 2 · e2/p-cli/w1 = 4   → итого 12
//   p-cli (CLIENT, d1) = 10 · p-int (INTERNAL, d1) = 2
//   e1 = 8 · e2 = 4 · d1 = 12 · w1 = 10 · w2 = 2 · DEV = 10 · QA = 2

const PERIOD = { from: '2026-01-01', to: '2026-06-30' };

const base = (): ReportsInput => ({
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

const olap = (params: OlapParams) => computeOlap(base(), PERIOD, params);
const sumFact = (rows: { fact: number }[]) => rows.reduce((s, r) => s + r.fact, 0);

// Факт строки groupBy по конкретному ключу (родитель для drill).
const factOf = (groupBy: OlapParams['groupBy'], key: string): number =>
  olap({ groupBy }).rows.find((r) => r.key === key)?.fact ?? -1;

describe('OLAP drill-консистентность — Σ дочерних = родитель', () => {
  it('dept→project: drill отдела d1 (12) → проекты d1 суммируются в 12', () => {
    const parent = factOf('dept', 'd1');
    const { rows, totals } = olap({ groupBy: 'project', filters: [{ dim: 'dept', value: 'd1' }] });
    expect(parent).toBe(12);
    expect(sumFact(rows)).toBe(parent);
    expect(totals.fact).toBe(parent);
  });

  it('project→employee: drill проекта p-cli (10) → сотрудники суммируются в 10', () => {
    const parent = factOf('project', 'p-cli');
    const { rows, totals } = olap({ groupBy: 'employee', filters: [{ dim: 'project', value: 'p-cli' }] });
    expect(parent).toBe(10);
    expect(sumFact(rows)).toBe(parent);
    expect(totals.fact).toBe(parent);
    // p-cli делают e1 (6) и e2 (4).
    expect(rows.find((r) => r.key === 'e1')?.fact).toBe(6);
    expect(rows.find((r) => r.key === 'e2')?.fact).toBe(4);
  });

  it('dept→employee: drill отдела d1 (12) → сотрудники суммируются в 12', () => {
    const parent = factOf('dept', 'd1');
    const { rows } = olap({ groupBy: 'employee', filters: [{ dim: 'dept', value: 'd1' }] });
    expect(sumFact(rows)).toBe(parent);
  });

  it('workTypeGroup→workType: drill группы DEV (10) → виды работ суммируются в 10', () => {
    const parent = factOf('workTypeGroup', 'DEV');
    const { rows } = olap({ groupBy: 'workType', filters: [{ dim: 'workTypeGroup', value: 'DEV' }] });
    expect(parent).toBe(10);
    expect(sumFact(rows)).toBe(parent);
  });
});

describe('OLAP drill — cross-filter (несколько фильтров = AND)', () => {
  it('dept=d1 AND category=CLIENT → только CLIENT-факт (10), e1=6 e2=4', () => {
    const { rows, totals, appliedFilters } = olap({
      groupBy: 'employee',
      filters: [
        { dim: 'dept', value: 'd1' },
        { dim: 'category', value: 'CLIENT' },
      ],
    });
    expect(totals.fact).toBe(10); // p-int (INTERNAL, 2ч) отсечён
    expect(sumFact(rows)).toBe(10);
    expect(rows.find((r) => r.key === 'e1')?.fact).toBe(6);
    expect(rows.find((r) => r.key === 'e2')?.fact).toBe(4);
    expect(appliedFilters).toHaveLength(2);
  });

  it('взаимоисключающие фильтры (project=p-cli AND category=INTERNAL) → 0 факта', () => {
    const { rows, totals } = olap({
      groupBy: 'employee',
      filters: [
        { dim: 'project', value: 'p-cli' }, // CLIENT
        { dim: 'category', value: 'INTERNAL' },
      ],
    });
    expect(totals.fact).toBe(0);
    expect(sumFact(rows)).toBe(0);
  });
});

describe('OLAP drill — grand-total инвариант (Σ строк = totals, без фильтра)', () => {
  it.each(['project', 'employee', 'dept', 'workType', 'workTypeGroup', 'category'] as const)(
    'groupBy=%s → Σ rows.fact == totals.fact == 12',
    (groupBy) => {
      const { rows, totals } = olap({ groupBy });
      expect(sumFact(rows)).toBe(12);
      expect(totals.fact).toBe(12);
    },
  );
});

describe('OLAP drill — byCategory-состав строки = её fact (инлайн-explain корректен)', () => {
  it.each(['dept', 'project', 'employee'] as const)(
    'groupBy=%s → у каждой строки Σ byCategory.hours == fact',
    (groupBy) => {
      const { rows } = olap({ groupBy });
      for (const r of rows) {
        const catSum = r.byCategory.reduce((s, c) => s + c.hours, 0);
        expect(catSum).toBeCloseTo(r.fact, 5);
      }
    },
  );

  it('dept d1: byCategory = CLIENT 10 + INTERNAL 2 = 12', () => {
    const { rows } = olap({ groupBy: 'dept' });
    const d1 = rows.find((r) => r.key === 'd1');
    const byCat = Object.fromEntries((d1?.byCategory ?? []).map((c) => [c.category, c.hours]));
    expect(byCat.CLIENT).toBe(10);
    expect(byCat.INTERNAL).toBe(2);
  });
});

describe('OLAP drill — рекурсивный 2-уровневый drill сходится', () => {
  it('dept d1 (12) → project p-cli (10) → employee (e1 6 + e2 4 = 10)', () => {
    // Уровень 0: отдел.
    const lvl0 = factOf('dept', 'd1');
    expect(lvl0).toBe(12);
    // Уровень 1: drill в проекты отдела → берём p-cli.
    const lvl1 = olap({ groupBy: 'project', filters: [{ dim: 'dept', value: 'd1' }] });
    const pcli = lvl1.rows.find((r) => r.key === 'p-cli');
    expect(pcli?.fact).toBe(10);
    // Уровень 2: drill в сотрудников проекта p-cli внутри отдела d1.
    const lvl2 = olap({
      groupBy: 'employee',
      filters: [
        { dim: 'dept', value: 'd1' },
        { dim: 'project', value: 'p-cli' },
      ],
    });
    expect(sumFact(lvl2.rows)).toBe(pcli?.fact);
  });

  it('drill всегда сужает: дочерний totals ≤ родительский', () => {
    const root = olap({ groupBy: 'dept' }).totals.fact;
    const drilled = olap({ groupBy: 'employee', filters: [{ dim: 'category', value: 'CLIENT' }] }).totals.fact;
    expect(drilled).toBeLessThanOrEqual(root);
  });
});
