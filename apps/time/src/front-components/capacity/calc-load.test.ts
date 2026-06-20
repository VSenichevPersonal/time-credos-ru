import { describe, expect, it } from 'vitest';

import {
  buildPeriods,
  deptCapacity,
  deptLoadCells,
  deptProjectLoads,
  projectHoursInPeriod,
} from 'src/front-components/capacity/calc-load';
import type {
  CalendarDay,
  CapProject,
  DeptRef,
  Period,
} from 'src/front-components/capacity/types';

const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d));

const period = (key: string, from: Date, to: Date, workHours: number): Period => ({
  key,
  label: key,
  from,
  to,
  workHours,
});

const dept = (over: Partial<DeptRef> = {}): DeptRef => ({
  id: 'd1',
  name: 'Отдел',
  code: 'DEV',
  headcount: 5,
  capacityFactor: 0.8,
  ...over,
});

const project = (over: Partial<CapProject> = {}): CapProject => ({
  id: 'p1',
  code: 'DEV-2026-001',
  name: 'Проект',
  departmentId: 'd1',
  plannedEffort: 100,
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  ...over,
});

// Будни 2026-01-12..2026-01-25 по 8ч, выходные 0. Покрывает 2 недели.
const calendar: CalendarDay[] = (() => {
  const out: CalendarDay[] = [];
  for (let d = 12; d <= 25; d++) {
    const date = utc(2026, 0, d);
    const dow = date.getUTCDay(); // 0=вс, 6=сб
    out.push({
      date: `2026-01-${String(d).padStart(2, '0')}`,
      hours: dow === 0 || dow === 6 ? 0 : 8,
    });
  }
  return out;
})();

describe('buildPeriods (week)', () => {
  const periods = buildPeriods(utc(2026, 0, 15), calendar, 'week', 2);

  it('выравнивает на понедельник недели якоря', () => {
    expect(periods).toHaveLength(2);
    expect(periods[0].key).toBe('2026-01-12');
    expect(periods[0].from.toISOString().slice(0, 10)).toBe('2026-01-12');
    expect(periods[0].to.toISOString().slice(0, 10)).toBe('2026-01-18');
  });

  it('суммирует рабочие часы недели (5×8 = 40, выходные 0)', () => {
    expect(periods[0].workHours).toBe(40);
    expect(periods[1].workHours).toBe(40);
  });

  it('вторая колонка начинается со следующего понедельника', () => {
    expect(periods[1].key).toBe('2026-01-19');
  });

  it('подпись колонки — день + русский месяц', () => {
    expect(periods[0].label).toBe('12 янв');
  });
});

describe('buildPeriods (month)', () => {
  const periods = buildPeriods(utc(2026, 0, 15), calendar, 'month', 2);

  it('перебирает месяцы с переходом через границу года', () => {
    expect(periods[0].key).toBe('2026-0');
    expect(periods[0].from.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(periods[0].to.toISOString().slice(0, 10)).toBe('2026-01-31');
    expect(periods[1].to.toISOString().slice(0, 10)).toBe('2026-02-28');
  });

  it('подпись — месяц + 2 цифры года', () => {
    expect(periods[0].label).toBe('янв 26');
    expect(periods[1].label).toBe('фев 26');
  });
});

describe('deptCapacity', () => {
  it('= рабочие часы × headcount × коэффициент', () => {
    expect(deptCapacity(dept(), period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40))).toBe(160);
  });

  it('headcount 0 → ёмкость 0', () => {
    expect(deptCapacity(dept({ headcount: 0 }), period('w', utc(2026, 0, 12), utc(2026, 0, 18), 40))).toBe(0);
  });
});

describe('projectHoursInPeriod', () => {
  const p = period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40); // 5 дней

  it('раскидывает план равномерно по дням и берёт пересечение', () => {
    // проект 2026-01-01..01-10 = 10 дней, план 100 → 10ч/день; пересечение 5 дней → 50
    expect(projectHoursInPeriod(project(), p)).toBe(50);
  });

  it('0 без плана или без дат', () => {
    expect(projectHoursInPeriod(project({ plannedEffort: null }), p)).toBe(0);
    expect(projectHoursInPeriod(project({ startDate: null }), p)).toBe(0);
    expect(projectHoursInPeriod(project({ endDate: null }), p)).toBe(0);
  });

  it('0 при отсутствии пересечения', () => {
    const far = period('w', utc(2026, 5, 1), utc(2026, 5, 7), 40);
    expect(projectHoursInPeriod(project(), far)).toBe(0);
  });

  it('0 при endDate < startDate (некорректный диапазон)', () => {
    expect(projectHoursInPeriod(project({ startDate: '2026-01-10', endDate: '2026-01-01' }), p)).toBe(0);
  });

  it('проект целиком внутри периода → весь план', () => {
    const wide = period('w', utc(2025, 11, 1), utc(2026, 1, 1), 40);
    expect(projectHoursInPeriod(project(), wide)).toBe(100);
  });
});

describe('deptLoadCells', () => {
  const periods = [period('w', utc(2026, 0, 1), utc(2026, 0, 5), 40)];

  it('считает ёмкость, загрузку и ratio, фильтрует по отделу', () => {
    const projects = [
      project(),
      project({ id: 'p2', departmentId: 'other' }), // чужой отдел — игнор
    ];
    const [cell] = deptLoadCells(dept(), projects, periods);
    expect(cell.capacity).toBe(160);
    expect(cell.load).toBe(50);
    expect(cell.ratio).toBeCloseTo(50 / 160);
  });

  it('ratio = null при нулевой ёмкости', () => {
    const [cell] = deptLoadCells(dept({ headcount: 0 }), [project()], periods);
    expect(cell.capacity).toBe(0);
    expect(cell.ratio).toBeNull();
  });
});

describe('deptProjectLoads', () => {
  const periods = [
    period('w1', utc(2026, 0, 1), utc(2026, 0, 5), 40),
    period('w2', utc(2026, 0, 6), utc(2026, 0, 10), 40),
  ];

  it('разделяет проекты с планом и без, сортирует по сумме часов desc', () => {
    const small = project({ id: 'small', plannedEffort: 10 });
    const big = project({ id: 'big', plannedEffort: 100 });
    const noPlan = project({ id: 'noplan', plannedEffort: null });
    const otherDept = project({ id: 'x', departmentId: 'other' });

    const { planned, unplanned } = deptProjectLoads(dept(), [small, big, noPlan, otherDept], periods);

    expect(planned.map((x) => x.project.id)).toEqual(['big', 'small']);
    expect(planned[0].total).toBeGreaterThan(planned[1].total);
    expect(unplanned.map((x) => x.id)).toContain('noplan');
    // проект чужого отдела не попадает ни в planned, ни в unplanned
    expect([...planned.map((x) => x.project.id), ...unplanned.map((x) => x.id)]).not.toContain('x');
  });

  it('план с нулевым попаданием в горизонт уходит в unplanned', () => {
    const future = project({ id: 'fut', startDate: '2027-01-01', endDate: '2027-02-01' });
    const { planned, unplanned } = deptProjectLoads(dept(), [future], periods);
    expect(planned).toHaveLength(0);
    expect(unplanned.map((x) => x.id)).toEqual(['fut']);
  });
});
