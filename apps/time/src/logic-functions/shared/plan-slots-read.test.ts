import { describe, expect, it } from 'vitest';

import {
  allocatedByEmployee,
  allocatedByMonth,
  allocatedByProject,
  isUsableSlot,
  type RawPlanSlot,
  slotMonthInPeriod,
} from './plan-slots-read';

const s = (over: Partial<RawPlanSlot> & { projectId: string }): RawPlanSlot => ({
  departmentId: null,
  employeeId: null,
  periodMonth: '2026-06',
  plannedHours: 10,
  ...over,
});

describe('isUsableSlot', () => {
  it('валидный слот (проект, месяц YYYY-MM, часы>0) → true', () => {
    expect(isUsableSlot(s({ projectId: 'P1', periodMonth: '2026-06', plannedHours: 10 }))).toBe(true);
  });
  it('пустой/нечисловой месяц → false (B3-гард)', () => {
    expect(isUsableSlot(s({ projectId: 'P1', periodMonth: '', plannedHours: 10 }))).toBe(false);
    expect(isUsableSlot(s({ projectId: 'P1', periodMonth: 'июнь', plannedHours: 10 }))).toBe(false);
  });
  it('часы 0/отрицательные/null → false', () => {
    expect(isUsableSlot(s({ projectId: 'P1', plannedHours: 0 }))).toBe(false);
    expect(isUsableSlot(s({ projectId: 'P1', plannedHours: -5 }))).toBe(false);
    expect(isUsableSlot(s({ projectId: 'P1', plannedHours: null }))).toBe(false);
  });
  it('без projectId → false', () => {
    expect(isUsableSlot(s({ projectId: '' }))).toBe(false);
  });
});

describe('slotMonthInPeriod', () => {
  it('пустые границы → true', () => {
    expect(slotMonthInPeriod('2026-06', null, null)).toBe(true);
  });
  it('месяц в окне → true, вне → false', () => {
    expect(slotMonthInPeriod('2026-06', '2026-06-01', '2026-06-30')).toBe(true);
    expect(slotMonthInPeriod('2026-05', '2026-06-01', '2026-06-30')).toBe(false);
    expect(slotMonthInPeriod('2026-07', '2026-06-01', '2026-06-30')).toBe(false);
  });
  it('частичное пересечение месяца с окном → true (целый месяц)', () => {
    // окно середины июня → весь июнь учитывается (семантика «целый месяц»).
    expect(slotMonthInPeriod('2026-06', '2026-06-15', '2026-06-20')).toBe(true);
  });
  it('пустой/невалидный месяц → false', () => {
    expect(slotMonthInPeriod('', null, null)).toBe(false);
    expect(slotMonthInPeriod(null, null, null)).toBe(false);
  });
});

describe('allocatedByProject', () => {
  it('Σ часов слотов по проекту', () => {
    const m = allocatedByProject([
      s({ projectId: 'P1', plannedHours: 100 }),
      s({ projectId: 'P1', periodMonth: '2026-07', plannedHours: 50 }),
      s({ projectId: 'P2', plannedHours: 30 }),
    ]);
    expect(m.get('P1')).toBe(150);
    expect(m.get('P2')).toBe(30);
  });
  it('фильтр периода режет по месяцу слота', () => {
    const m = allocatedByProject(
      [
        s({ projectId: 'P1', periodMonth: '2026-05', plannedHours: 10 }),
        s({ projectId: 'P1', periodMonth: '2026-06', plannedHours: 20 }),
      ],
      { from: '2026-06-01', to: '2026-06-30' },
    );
    expect(m.get('P1')).toBe(20);
  });
  it('мусорные/нулевые слоты исключены', () => {
    const m = allocatedByProject([
      s({ projectId: 'P1', periodMonth: '', plannedHours: 999 }),
      s({ projectId: 'P1', plannedHours: 0 }),
      s({ projectId: 'P1', plannedHours: 5 }),
    ]);
    expect(m.get('P1')).toBe(5);
  });
});

describe('allocatedByMonth', () => {
  it('Σ по месяцу + опц. фильтр отдела', () => {
    const slots = [
      s({ projectId: 'P1', periodMonth: '2026-06', departmentId: 'D1', plannedHours: 40 }),
      s({ projectId: 'P2', periodMonth: '2026-06', departmentId: 'D2', plannedHours: 60 }),
      s({ projectId: 'P1', periodMonth: '2026-07', departmentId: 'D1', plannedHours: 30 }),
    ];
    const all = allocatedByMonth(slots);
    expect(all.get('2026-06')).toBe(100);
    expect(all.get('2026-07')).toBe(30);
    const d1 = allocatedByMonth(slots, { departmentId: 'D1' });
    expect(d1.get('2026-06')).toBe(40);
    expect(d1.get('2026-07')).toBe(30);
  });
});

describe('allocatedByEmployee', () => {
  it('Σ только по персональным слотам (employeeId != null)', () => {
    const m = allocatedByEmployee([
      s({ projectId: 'P1', employeeId: 'E1', plannedHours: 20 }),
      s({ projectId: 'P2', employeeId: 'E1', plannedHours: 15 }),
      s({ projectId: 'P1', employeeId: null, plannedHours: 100 }), // отдельский — не учитывается
      s({ projectId: 'P1', employeeId: 'E2', plannedHours: 5 }),
    ]);
    expect(m.get('E1')).toBe(35);
    expect(m.get('E2')).toBe(5);
    expect(m.size).toBe(2);
  });
});
