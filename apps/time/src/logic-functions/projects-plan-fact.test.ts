import { describe, expect, it } from 'vitest';

import {
  computeProjectsPlanFact,
  type ProjectsPlanFactInput,
  type RawEntry,
  type RawPlanSlot,
  type RawProjectPlan,
} from './projects-plan-fact';

const slot = (over: Partial<RawPlanSlot> & { projectId: string }): RawPlanSlot => ({
  departmentId: null,
  employeeId: null,
  periodMonth: '2026-06',
  plannedHours: 0,
  ...over,
});

const p = (over: Partial<RawProjectPlan> & { id: string }): RawProjectPlan => ({
  name: null,
  code: null,
  status: 'IN_PROGRESS',
  plannedEffort: null,
  startDate: null,
  endDate: null,
  ...over,
});

const e = (over: Partial<RawEntry> & { projectId: string; hours: number }): RawEntry => ({
  employeeId: 'emp-1',
  date: '2026-06-10',
  ...over,
});

describe('computeProjectsPlanFact', () => {
  it('считает план/факт/остаток без перерасхода', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', code: 'A', name: 'Альфа', plannedEffort: 100 })],
      entries: [
        e({ projectId: 'P1', hours: 30 }),
        e({ projectId: 'P1', hours: 10 }),
      ],
    };
    const res = computeProjectsPlanFact(input);
    expect(res.ok).toBe(true);
    expect(res.count).toBe(1);
    const row = res.rows[0];
    expect(row.planned).toBe(100);
    expect(row.fact).toBe(40);
    expect(row.remaining).toBe(60);
    expect(row.overrun).toBe(false);
    expect(row.pct).toBe(0.4);
    expect(res.totals).toEqual({
      planned: 100,
      allocated: 0,
      fact: 40,
      remaining: 60,
      unallocated: 100,
      overrunCount: 0,
      overbookedCount: 0,
    });
  });

  it('помечает перерасход (факт>план → remaining<0, overrun=true)', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 50 })],
      entries: [e({ projectId: 'P1', hours: 70 })],
    };
    const res = computeProjectsPlanFact(input);
    const row = res.rows[0];
    expect(row.fact).toBe(70);
    expect(row.remaining).toBe(-20);
    expect(row.overrun).toBe(true);
    expect(row.pct).toBe(1.4);
    expect(res.totals.overrunCount).toBe(1);
    expect(res.totals.remaining).toBe(-20);
  });

  it('факт ровно = план → НЕ перерасход (overrun только при строгом >)', () => {
    const res = computeProjectsPlanFact({
      projects: [p({ id: 'P1', plannedEffort: 40 })],
      entries: [e({ projectId: 'P1', hours: 40 })],
    });
    expect(res.rows[0].overrun).toBe(false);
    expect(res.rows[0].remaining).toBe(0);
    expect(res.rows[0].pct).toBe(1);
  });

  it('план не задан → planned/remaining/pct = null, overrun=false, fact считается', () => {
    const res = computeProjectsPlanFact({
      projects: [p({ id: 'P1', plannedEffort: null })],
      entries: [e({ projectId: 'P1', hours: 25 })],
    });
    const row = res.rows[0];
    expect(row.planned).toBeNull();
    expect(row.remaining).toBeNull();
    expect(row.pct).toBeNull();
    expect(row.overrun).toBe(false);
    expect(row.fact).toBe(25);
    // Проект без плана не вносит вклад в totals.planned/remaining.
    expect(res.totals.planned).toBe(0);
    expect(res.totals.fact).toBe(25);
    expect(res.totals.remaining).toBe(0);
  });

  it('проект без записей → fact=0, remaining=весь план', () => {
    const res = computeProjectsPlanFact({
      projects: [p({ id: 'P1', plannedEffort: 80 })],
      entries: [],
    });
    expect(res.rows[0].fact).toBe(0);
    expect(res.rows[0].remaining).toBe(80);
    expect(res.rows[0].pct).toBe(0);
    expect(res.rows[0].overrun).toBe(false);
  });

  it('период-фильтр режет факт по дню записи', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 100 })],
      entries: [
        e({ projectId: 'P1', hours: 10, date: '2026-05-31' }),
        e({ projectId: 'P1', hours: 20, date: '2026-06-15' }),
        e({ projectId: 'P1', hours: 5, date: '2026-07-01' }),
      ],
    };
    const res = computeProjectsPlanFact(input, { from: '2026-06-01', to: '2026-06-30' });
    expect(res.rows[0].fact).toBe(20);
    expect(res.rows[0].remaining).toBe(80);
  });

  it('перерасход сортируется наверх, затем по факту убыв.', () => {
    const input: ProjectsPlanFactInput = {
      projects: [
        p({ id: 'P1', name: 'Малый', plannedEffort: 100 }),
        p({ id: 'P2', name: 'Перерасход', plannedEffort: 10 }),
        p({ id: 'P3', name: 'Большой', plannedEffort: 1000 }),
      ],
      entries: [
        e({ projectId: 'P1', hours: 5 }),
        e({ projectId: 'P2', hours: 50 }), // overrun
        e({ projectId: 'P3', hours: 500 }),
      ],
    };
    const res = computeProjectsPlanFact(input);
    expect(res.rows.map((r) => r.projectId)).toEqual(['P2', 'P3', 'P1']);
    expect(res.rows[0].overrun).toBe(true);
  });

  it('фильтр по статусу оставляет только совпавшие проекты', () => {
    const input: ProjectsPlanFactInput = {
      projects: [
        p({ id: 'P1', status: 'IN_PROGRESS', plannedEffort: 10 }),
        p({ id: 'P2', status: 'DONE', plannedEffort: 20 }),
      ],
      entries: [],
    };
    const res = computeProjectsPlanFact(input, { status: 'IN_PROGRESS' });
    expect(res.count).toBe(1);
    expect(res.rows[0].projectId).toBe('P1');
  });

  it('фильтр по отделу проекта (departmentId на проекте)', () => {
    const projects = [
      { ...p({ id: 'P1', plannedEffort: 10 }), departmentId: 'D1' },
      { ...p({ id: 'P2', plannedEffort: 20 }), departmentId: 'D2' },
    ] as RawProjectPlan[];
    const res = computeProjectsPlanFact({ projects, entries: [] }, { departmentId: 'D1' });
    expect(res.count).toBe(1);
    expect(res.rows[0].projectId).toBe('P1');
  });

  it('записи без часов/без projectId игнорируются', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 100 })],
      entries: [
        e({ projectId: 'P1', hours: 0 }),
        { projectId: null, hours: 50, employeeId: 'x', date: '2026-06-10' },
        e({ projectId: 'P1', hours: 15 }),
      ],
    };
    const res = computeProjectsPlanFact(input);
    expect(res.rows[0].fact).toBe(15);
  });

  // ===== B1: ТРИ ВЕЛИЧИНЫ (бюджет / распланировано / факт) =====

  it('бюджет, распланировано (Σслотов), факт — три РАЗНЫЕ величины', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 500 })], // бюджет 500
      entries: [e({ projectId: 'P1', hours: 120 })], // факт 120
      slots: [
        slot({ projectId: 'P1', periodMonth: '2026-06', plannedHours: 200 }),
        slot({ projectId: 'P1', periodMonth: '2026-07', plannedHours: 100 }),
      ], // распланировано 300
    };
    const row = computeProjectsPlanFact(input).rows[0];
    expect(row.planned).toBe(500); // бюджет
    expect(row.allocated).toBe(300); // распланировано = Σслотов
    expect(row.fact).toBe(120); // факт
    // Ось распределения: остаток = 500 − 300 = 200, не переаллокация.
    expect(row.unallocated).toBe(200);
    expect(row.overbooked).toBe(false);
    expect(row.allocatedPct).toBe(0.6);
    // Ось освоения (отдельно): остаток = 500 − 120 = 380, освоение 0.24.
    expect(row.remaining).toBe(380);
    expect(row.pct).toBe(0.24);
  });

  it('переаллокация бюджета видна: распланировано > бюджет → overbooked, unallocated<0', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 100 })],
      entries: [],
      slots: [
        slot({ projectId: 'P1', periodMonth: '2026-06', plannedHours: 80 }),
        slot({ projectId: 'P1', periodMonth: '2026-07', plannedHours: 50 }),
      ], // распланировано 130 > бюджет 100
    };
    const res = computeProjectsPlanFact(input);
    const row = res.rows[0];
    expect(row.allocated).toBe(130);
    expect(row.unallocated).toBe(-30); // переаллокация на 30 ч
    expect(row.overbooked).toBe(true);
    expect(row.allocatedPct).toBe(1.3);
    // overbooked НЕ есть overrun (факт=0 < бюджет) — разные оси.
    expect(row.overrun).toBe(false);
    expect(res.totals.overbookedCount).toBe(1);
    expect(res.totals.allocated).toBe(130);
    expect(res.totals.unallocated).toBe(-30);
  });

  it('распланировано режется периодом по месяцу слота', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 1000 })],
      entries: [],
      slots: [
        slot({ projectId: 'P1', periodMonth: '2026-05', plannedHours: 100 }),
        slot({ projectId: 'P1', periodMonth: '2026-06', plannedHours: 200 }),
        slot({ projectId: 'P1', periodMonth: '2026-07', plannedHours: 300 }),
      ],
    };
    const res = computeProjectsPlanFact(input, { from: '2026-06-01', to: '2026-06-30' });
    expect(res.rows[0].allocated).toBe(200); // только июнь
  });

  it('слоты не переданы → allocated=0, unallocated=весь бюджет', () => {
    const res = computeProjectsPlanFact({
      projects: [p({ id: 'P1', plannedEffort: 80 })],
      entries: [],
    });
    expect(res.rows[0].allocated).toBe(0);
    expect(res.rows[0].unallocated).toBe(80);
    expect(res.rows[0].overbooked).toBe(false);
    expect(res.rows[0].allocatedPct).toBe(0);
  });

  it('мусорные/нулевые слоты не учитываются в распланировано', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 100 })],
      entries: [],
      slots: [
        slot({ projectId: 'P1', periodMonth: '', plannedHours: 999 }), // мусор (пустой месяц)
        slot({ projectId: 'P1', periodMonth: '2026-06', plannedHours: 0 }), // 0
        slot({ projectId: 'P1', periodMonth: '2026-06', plannedHours: 40 }), // валидный
        slot({ projectId: 'P2', periodMonth: '2026-06', plannedHours: 70 }), // чужой проект
      ],
    };
    expect(computeProjectsPlanFact(input).rows[0].allocated).toBe(40);
  });

  it('персональные + отдельские слоты суммируются в распланировано проекта', () => {
    const input: ProjectsPlanFactInput = {
      projects: [p({ id: 'P1', plannedEffort: 300 })],
      entries: [],
      slots: [
        slot({ projectId: 'P1', periodMonth: '2026-06', employeeId: 'E1', plannedHours: 50 }),
        slot({ projectId: 'P1', periodMonth: '2026-06', departmentId: 'D1', plannedHours: 80 }),
      ],
    };
    expect(computeProjectsPlanFact(input).rows[0].allocated).toBe(130);
  });

  it('name fallback: code, затем id если оба пусты', () => {
    const res = computeProjectsPlanFact({
      projects: [
        p({ id: 'P1', name: null, code: 'CODE-1' }),
        p({ id: 'P2', name: null, code: null }),
      ],
      entries: [],
    });
    const byId = new Map(res.rows.map((r) => [r.projectId, r.name]));
    expect(byId.get('P1')).toBe('CODE-1');
    expect(byId.get('P2')).toBe('P2');
  });
});
