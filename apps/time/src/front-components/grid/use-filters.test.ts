import { describe, expect, it } from 'vitest';

import type { EmployeeRef, ProjectRef, WorkTypeRef } from './types';
import { filterEmployees, filterProjects, filterWorkTypes, rowPasses } from './use-filters';
import type { FilterState } from './use-filters';

// ─── Хелперы ───────────────────────────────────────────────────────────────

const noFilter = (): FilterState => ({
  project: new Set(),
  department: new Set(),
  workType: new Set(),
  category: new Set(),
  employee: new Set(),
  status: new Set(),
});

const proj = (
  id: string,
  opts: { deptId?: string; category?: string } = {},
): ProjectRef => ({
  id,
  code: id,
  name: id,
  rawName: id,
  client: null,
  departmentId: opts.deptId ?? null,
  category: opts.category ?? null,
  approvalRequired: null,
});

const wt = (id: string, opts: { deptId?: string } = {}): WorkTypeRef => ({
  id,
  name: id,
  group: null,
  departmentId: opts.deptId ?? null,
});

const emp = (id: string, deptId: string | null = null): EmployeeRef => ({
  id,
  name: id,
  departmentId: deptId,
});

const projMap = (...projects: ProjectRef[]): Map<string, ProjectRef> =>
  new Map(projects.map((p) => [p.id, p]));

// ─── filterProjects ─────────────────────────────────────────────────────────

describe('filterProjects — пустой фильтр', () => {
  it('пустые фильтры → все проекты проходят', () => {
    const projects = [proj('p1'), proj('p2', { deptId: 'd1' })];
    expect(filterProjects(projects, noFilter())).toHaveLength(2);
  });

  it('пустой список проектов → пустой результат', () => {
    expect(filterProjects([], noFilter())).toEqual([]);
  });
});

describe('filterProjects — по project.id', () => {
  it('один выбранный проект → только он', () => {
    const projects = [proj('p1'), proj('p2'), proj('p3')];
    const state = { ...noFilter(), project: new Set(['p2']) };
    expect(filterProjects(projects, state).map((p) => p.id)).toEqual(['p2']);
  });

  it('два выбранных проекта → оба', () => {
    const projects = [proj('p1'), proj('p2'), proj('p3')];
    const state = { ...noFilter(), project: new Set(['p1', 'p3']) };
    expect(filterProjects(projects, state).map((p) => p.id)).toEqual(['p1', 'p3']);
  });
});

describe('filterProjects — по отделу', () => {
  it('dept-фильтр → только проекты из этого отдела', () => {
    const projects = [
      proj('p1', { deptId: 'd1' }),
      proj('p2', { deptId: 'd2' }),
      proj('p3', { deptId: 'd1' }),
    ];
    const state = { ...noFilter(), department: new Set(['d1']) };
    expect(filterProjects(projects, state).map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('проект без отдела отфильтровывается при dept-фильтре', () => {
    const projects = [proj('p1', { deptId: 'd1' }), proj('p2')];
    const state = { ...noFilter(), department: new Set(['d1']) };
    expect(filterProjects(projects, state).map((p) => p.id)).toEqual(['p1']);
  });
});

describe('filterProjects — по категории', () => {
  it('category-фильтр → только совпадающие', () => {
    const projects = [
      proj('p1', { category: 'CLIENT' }),
      proj('p2', { category: 'INTERNAL' }),
      proj('p3', { category: 'CLIENT' }),
    ];
    const state = { ...noFilter(), category: new Set(['CLIENT']) };
    expect(filterProjects(projects, state).map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('проект без категории отфильтровывается при category-фильтре', () => {
    const projects = [proj('p1', { category: 'CLIENT' }), proj('p2')];
    const state = { ...noFilter(), category: new Set(['CLIENT']) };
    expect(filterProjects(projects, state).map((p) => p.id)).toEqual(['p1']);
  });
});

describe('filterProjects — комбинированные фильтры (AND)', () => {
  it('project + dept (пересечение) → только проект из нужного отдела', () => {
    const projects = [
      proj('p1', { deptId: 'd1' }),
      proj('p2', { deptId: 'd2' }),
    ];
    const state = {
      ...noFilter(),
      project: new Set(['p1', 'p2']),
      department: new Set(['d1']),
    };
    expect(filterProjects(projects, state).map((p) => p.id)).toEqual(['p1']);
  });
});

// ─── filterWorkTypes ────────────────────────────────────────────────────────

describe('filterWorkTypes', () => {
  it('пустые фильтры → все', () => {
    const wts = [wt('w1'), wt('w2', { deptId: 'd1' })];
    expect(filterWorkTypes(wts, noFilter())).toHaveLength(2);
  });

  it('workType-фильтр → только выбранные', () => {
    const wts = [wt('w1'), wt('w2'), wt('w3')];
    const state = { ...noFilter(), workType: new Set(['w2']) };
    expect(filterWorkTypes(wts, state).map((w) => w.id)).toEqual(['w2']);
  });

  it('dept-фильтр → глобальные (deptId=null) проходят', () => {
    const wts = [wt('w1'), wt('w2', { deptId: 'd1' }), wt('w3', { deptId: 'd2' })];
    const state = { ...noFilter(), department: new Set(['d1']) };
    const result = filterWorkTypes(wts, state).map((w) => w.id);
    expect(result).toContain('w1'); // глобальный — проходит
    expect(result).toContain('w2'); // dept d1 — проходит
    expect(result).not.toContain('w3'); // dept d2 — не проходит
  });
});

// ─── rowPasses ──────────────────────────────────────────────────────────────

describe('rowPasses — базовые', () => {
  it('пустые фильтры → true', () => {
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), noFilter())).toBe(true);
  });

  it('project-фильтр совпадает → true', () => {
    const state = { ...noFilter(), project: new Set(['p1']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(true);
  });

  it('project-фильтр не совпадает → false', () => {
    const state = { ...noFilter(), project: new Set(['p2']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(false);
  });

  it('workType-фильтр совпадает → true', () => {
    const state = { ...noFilter(), workType: new Set(['w1']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(true);
  });

  it('workType-фильтр не совпадает → false', () => {
    const state = { ...noFilter(), workType: new Set(['w2']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(false);
  });
});

describe('rowPasses — dept-фильтр (через projectMap)', () => {
  it('dept совпадает → true', () => {
    const state = { ...noFilter(), department: new Set(['d1']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1', { deptId: 'd1' })), state)).toBe(true);
  });

  it('dept не совпадает → false', () => {
    const state = { ...noFilter(), department: new Set(['d2']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1', { deptId: 'd1' })), state)).toBe(false);
  });

  it('проект без отдела при dept-фильтре → false', () => {
    const state = { ...noFilter(), department: new Set(['d1']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(false);
  });

  it('проект не в map при dept-фильтре → false (нет данных об отделе)', () => {
    const state = { ...noFilter(), department: new Set(['d1']) };
    expect(rowPasses('p1', 'w1', projMap(), state)).toBe(false);
  });
});

describe('rowPasses — category-фильтр', () => {
  it('category совпадает → true', () => {
    const state = { ...noFilter(), category: new Set(['CLIENT']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1', { category: 'CLIENT' })), state)).toBe(true);
  });

  it('category не совпадает → false', () => {
    const state = { ...noFilter(), category: new Set(['CLIENT']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1', { category: 'INTERNAL' })), state)).toBe(false);
  });

  it('проект без категории при category-фильтре → false', () => {
    const state = { ...noFilter(), category: new Set(['CLIENT']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(false);
  });
});

describe('rowPasses — комбо (AND)', () => {
  it('project✓ + workType✓ → true', () => {
    const state = { ...noFilter(), project: new Set(['p1']), workType: new Set(['w1']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(true);
  });

  it('project✓ + workType✗ → false', () => {
    const state = { ...noFilter(), project: new Set(['p1']), workType: new Set(['w2']) };
    expect(rowPasses('p1', 'w1', projMap(proj('p1')), state)).toBe(false);
  });

  it('project✓ + dept✗ → false', () => {
    const state = {
      ...noFilter(),
      project: new Set(['p1']),
      department: new Set(['d2']),
    };
    expect(rowPasses('p1', 'w1', projMap(proj('p1', { deptId: 'd1' })), state)).toBe(false);
  });
});

// ─── filterEmployees ─────────────────────────────────────────────────────────

describe('filterEmployees', () => {
  it('пустые фильтры → все', () => {
    const emps = [emp('e1', 'd1'), emp('e2', null)];
    expect(filterEmployees(emps, noFilter())).toHaveLength(2);
  });

  it('dept-фильтр → только нужный отдел', () => {
    const emps = [emp('e1', 'd1'), emp('e2', 'd2'), emp('e3', 'd1')];
    const state = { ...noFilter(), department: new Set(['d1']) };
    expect(filterEmployees(emps, state).map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('сотрудник без отдела при dept-фильтре → отфильтровывается', () => {
    const emps = [emp('e1', 'd1'), emp('e2', null)];
    const state = { ...noFilter(), department: new Set(['d1']) };
    expect(filterEmployees(emps, state).map((e) => e.id)).toEqual(['e1']);
  });

  it('dept-фильтр не влияет на employee-Set (разные ключи)', () => {
    // employee-фильтр и dept-фильтр независимы; employee Set по id не реализован в filterEmployees
    const emps = [emp('e1', 'd1'), emp('e2', 'd2')];
    const state = { ...noFilter(), department: new Set(['d1']), employee: new Set(['e2']) };
    // filterEmployees использует только department, не employee
    expect(filterEmployees(emps, state).map((e) => e.id)).toEqual(['e1']);
  });
});
