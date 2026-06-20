import { describe, expect, it } from 'vitest';

import {
  assignmentDeptId,
  assignmentHoursInPeriod,
  deptAssignedHours,
  empDeptIndex,
  employeeAssignedHours,
  projectDeptShares,
  projectPlanCoverage,
} from 'src/front-components/capacity/calc-assignment';
import type { Assignment } from 'src/front-components/capacity/assignment-types';
import type { EmployeeRef, Period } from 'src/front-components/capacity/types';

// DP-0005: контракт ресурсной аллокации. Раскид по диапазону — зеркало
// plannedHoursInPeriod (см. calc-load.test projectHoursInPeriod).

const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d));

const period = (from: Date, to: Date): Period => ({
  key: 'p',
  label: 'p',
  from,
  to,
  workHours: 40,
});

const asg = (over: Partial<Assignment> = {}): Assignment => ({
  id: 'a1',
  employeeId: 'e1',
  roleLabel: null,
  projectId: 'p1',
  departmentId: null,
  startDate: '2026-01-01',
  endDate: '2026-01-31', // 31 дн
  plannedHours: 310,
  bookingType: 'HARD',
  ...over,
});

const emp = (id: string, departmentId: string | null): EmployeeRef => ({
  id,
  name: id,
  departmentId,
});

describe('assignmentHoursInPeriod', () => {
  it('раскидывает часы пропорц. пересечению диапазона с колонкой', () => {
    // 310 ч / 31 день = 10 ч/день. Период 10 дней внутри → 100 ч.
    const p = period(utc(2026, 0, 1), utc(2026, 0, 10));
    expect(assignmentHoursInPeriod(asg(), p)).toBe(100);
  });

  it('весь диапазон внутри периода → все часы', () => {
    const p = period(utc(2026, 0, 1), utc(2026, 1, 28));
    expect(assignmentHoursInPeriod(asg(), p)).toBe(310);
  });

  it('нет пересечения → 0', () => {
    const p = period(utc(2026, 2, 1), utc(2026, 2, 31));
    expect(assignmentHoursInPeriod(asg(), p)).toBe(0);
  });

  it('null часы/даты или endDate<startDate → 0', () => {
    const p = period(utc(2026, 0, 1), utc(2026, 0, 31));
    expect(assignmentHoursInPeriod(asg({ plannedHours: null }), p)).toBe(0);
    expect(assignmentHoursInPeriod(asg({ startDate: null }), p)).toBe(0);
    expect(assignmentHoursInPeriod(asg({ endDate: null }), p)).toBe(0);
    expect(assignmentHoursInPeriod(asg({ startDate: '2026-02-01', endDate: '2026-01-01' }), p)).toBe(0);
  });
});

describe('assignmentDeptId', () => {
  const idx = empDeptIndex([emp('e1', 'd1'), emp('e2', null)]);

  it('явный departmentId приоритетнее отдела сотрудника', () => {
    expect(assignmentDeptId(asg({ departmentId: 'd2' }), idx)).toBe('d2');
  });

  it('без явного → отдел именованного сотрудника', () => {
    expect(assignmentDeptId(asg({ departmentId: null, employeeId: 'e1' }), idx)).toBe('d1');
  });

  it('обобщённая роль (employee=null) без явного отдела → null', () => {
    expect(assignmentDeptId(asg({ employeeId: null, departmentId: null }), idx)).toBeNull();
  });
});

describe('employeeAssignedHours (реальная загрузка, не делёж)', () => {
  it('суммирует ВСЕ назначения сотрудника по всем проектам (кросс-проект перегруз)', () => {
    const p = period(utc(2026, 0, 1), utc(2026, 0, 10)); // 10 дн
    const list: Assignment[] = [
      asg({ id: 'a1', projectId: 'p1', plannedHours: 310 }), // 100 ч в периоде
      asg({ id: 'a2', projectId: 'p2', plannedHours: 310 }), // ещё 100 ч → перегруз
      asg({ id: 'a3', employeeId: 'e2', plannedHours: 310 }), // другой сотрудник — не в счёт
    ];
    expect(employeeAssignedHours('e1', list, p)).toBe(200);
  });
});

describe('deptAssignedHours', () => {
  it('Σ назначений отдела (явный отдел + отдел сотрудника)', () => {
    const idx = empDeptIndex([emp('e1', 'd1'), emp('e2', 'd2')]);
    const p = period(utc(2026, 0, 1), utc(2026, 0, 10));
    const list: Assignment[] = [
      asg({ id: 'a1', employeeId: 'e1', departmentId: null }), // → d1 (из сотрудника), 100
      asg({ id: 'a2', employeeId: null, departmentId: 'd1' }), // → d1 (явный), 100
      asg({ id: 'a3', employeeId: 'e2', departmentId: null }), // → d2, не в счёт
    ];
    expect(deptAssignedHours('d1', list, idx, p)).toBe(200);
  });
});

describe('projectDeptShares (derived доля отдела)', () => {
  it('группирует часы назначений проекта по отделам', () => {
    const idx = empDeptIndex([emp('e1', 'd1'), emp('e2', 'd2')]);
    const list: Assignment[] = [
      asg({ id: 'a1', projectId: 'p1', employeeId: 'e1', plannedHours: 100 }),
      asg({ id: 'a2', projectId: 'p1', employeeId: 'e2', plannedHours: 60 }),
      asg({ id: 'a3', projectId: 'p1', employeeId: null, departmentId: 'd1', plannedHours: 40 }),
      asg({ id: 'a4', projectId: 'p2', employeeId: 'e1', plannedHours: 999 }), // другой проект
    ];
    const shares = projectDeptShares('p1', list, idx);
    expect(shares.get('d1')).toBe(140); // 100 + 40
    expect(shares.get('d2')).toBe(60);
    expect(shares.has('p2')).toBe(false);
  });
});

describe('projectPlanCoverage (валидация Σ vs план)', () => {
  const list: Assignment[] = [
    asg({ id: 'a1', projectId: 'p1', plannedHours: 120 }),
    asg({ id: 'a2', projectId: 'p1', plannedHours: 80 }),
  ];

  it('недораспределено → under>0', () => {
    expect(projectPlanCoverage('p1', list, 300)).toEqual({ assigned: 200, planned: 300, under: 100 });
  });

  it('перебор плана → under<0', () => {
    expect(projectPlanCoverage('p1', list, 150)).toEqual({ assigned: 200, planned: 150, under: -50 });
  });

  it('план не задан → under=null', () => {
    expect(projectPlanCoverage('p1', list, null)).toEqual({ assigned: 200, planned: null, under: null });
  });
});
