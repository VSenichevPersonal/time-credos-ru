import { describe, expect, it } from 'vitest';

import {
  buildTimesheetOwner,
  ownerDepartment,
  ownerName,
} from './whose-timesheet';
import type { DepartmentRef, EmployeeRef } from './types';

// REQ on-behalf #1 (read-only): индикатор «чей таймшит» — ФИО · отдел.
// ПДн (CISO-007): reveal=true → ФИО (employee.name), reveal=false → КОД без ПДн.

const emp = (over: Partial<EmployeeRef> = {}): EmployeeRef => ({
  id: 'aabbccdd-1122-4000-8000-112233445566',
  name: 'Иванов Иван',
  departmentId: 'd1',
  ...over,
});

const depts: DepartmentRef[] = [
  { id: 'd1', name: 'Отдел разработки', approvalRequired: null },
  { id: 'd2', name: 'Бухгалтерия', approvalRequired: true },
];

describe('ownerName', () => {
  it('reveal=true → ФИО из name', () => {
    expect(ownerName(emp(), true)).toBe('Иванов Иван');
  });

  it('reveal=false → КОД без ПДн (Сотрудник·XXXX)', () => {
    const label = ownerName(emp(), false);
    expect(label).toMatch(/^Сотрудник·[0-9A-F]{4}$/);
    expect(label).not.toContain('Иванов');
  });

  it('код = последние 4 hex-символа id (стабильность)', () => {
    expect(ownerName(emp({ id: 'aabbccdd-1122-4000-8000-112233445566' }), false)).toBe(
      'Сотрудник·5566',
    );
  });

  it('reveal=true, пустое ФИО → fallback на КОД', () => {
    const label = ownerName(emp({ name: '   ' }), true);
    expect(label).toMatch(/^Сотрудник·[0-9A-F]{4}$/);
  });
});

describe('ownerDepartment', () => {
  it('по departmentId → название отдела', () => {
    expect(ownerDepartment(emp({ departmentId: 'd2' }), depts)).toBe('Бухгалтерия');
  });

  it('нет привязки → null', () => {
    expect(ownerDepartment(emp({ departmentId: null }), depts)).toBeNull();
  });

  it('отдел не найден в справочнике → null', () => {
    expect(ownerDepartment(emp({ departmentId: 'unknown' }), depts)).toBeNull();
  });
});

describe('buildTimesheetOwner', () => {
  const employees = [emp()];

  it('employeeId=null → null (индикатор не рисуется)', () => {
    expect(buildTimesheetOwner(null, employees, depts, true)).toBeNull();
  });

  it('reveal=true → ФИО · отдел в full', () => {
    const owner = buildTimesheetOwner(emp().id, employees, depts, true);
    expect(owner).not.toBeNull();
    expect(owner!.label).toBe('Иванов Иван');
    expect(owner!.department).toBe('Отдел разработки');
    expect(owner!.full).toBe('Иванов Иван · Отдел разработки');
  });

  it('reveal=false → КОД · отдел (ФИО скрыто)', () => {
    const owner = buildTimesheetOwner(emp().id, employees, depts, false);
    expect(owner!.label).toMatch(/^Сотрудник·/);
    expect(owner!.full).not.toContain('Иванов');
    expect(owner!.full).toContain('Отдел разработки');
  });

  it('сотрудник не в справочнике → КОД по id, без отдела', () => {
    const owner = buildTimesheetOwner(
      'ffffffff-0000-4000-8000-00000000abcd',
      employees,
      depts,
      true,
    );
    expect(owner!.label).toBe('Сотрудник·ABCD');
    expect(owner!.department).toBeNull();
    expect(owner!.full).toBe('Сотрудник·ABCD');
  });

  it('нет отдела → full = только подпись (без « · »)', () => {
    const owner = buildTimesheetOwner(
      emp().id,
      [emp({ departmentId: null })],
      depts,
      true,
    );
    expect(owner!.full).toBe('Иванов Иван');
  });
});
