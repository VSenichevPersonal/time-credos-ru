import { describe, expect, it } from 'vitest';

import { employeeCode, empName, type RawEmployee } from './reports-calc';

// Пакет UX/UI регресс: редакция ФИО (CISO-007 / 152-ФЗ минимизация).
// SSOT-резолвер ярлыка сотрудника. Баг этой волны (fix-employee-label):
// при reveal=false ярлык ОБЯЗАН быть читаемым КОДом — НЕ сырой UUID, НЕ пусто.
// Интеграция покрыта в missing-timesheets/reports.logic; здесь — сама ЧИСТАЯ
// функция-предикат (детерминизм, формат, dept-группировка, отсутствие ПДн).

const emp = (over: Partial<RawEmployee> = {}): RawEmployee => ({
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  firstName: 'Иван',
  lastName: 'Петров',
  departmentId: null,
  ...over,
});

describe('employeeCode — НЕ сырой UUID и НЕ пусто (баг редакции ФИО)', () => {
  it('всегда непустой', () => {
    expect(employeeCode(emp())).not.toBe('');
    expect(employeeCode(emp({ departmentId: 'dept-xyz' })).length).toBeGreaterThan(0);
  });

  it('НЕ равен сырому id/UUID (личность не раскрывается через id)', () => {
    const e = emp({ id: 'a1b2c3d4-0000-4000-8000-000000000001' });
    const code = employeeCode(e);
    expect(code).not.toBe(e.id);
    expect(code).not.toContain(e.id); // полный UUID не утекает
  });

  it('начинается с человекочитаемого префикса «Сотрудник·»', () => {
    expect(employeeCode(emp())).toMatch(/^Сотрудник·/);
  });

  it('НЕ содержит ПДн (ни имени, ни фамилии)', () => {
    const code = employeeCode(emp({ firstName: 'Иван', lastName: 'Петров' }));
    expect(code).not.toContain('Иван');
    expect(code).not.toContain('Петров');
  });
});

describe('employeeCode — детерминизм', () => {
  it('один id → один и тот же код (стабильность между вызовами)', () => {
    const e = emp({ id: 'ffff1111-2222-4333-8444-555566667777' });
    expect(employeeCode(e)).toBe(employeeCode(e));
  });

  it('разные id → суффикс разводит однофамильцев (различимость)', () => {
    const a = employeeCode(emp({ id: 'aaaa0000-0000-4000-8000-00000000000a' }));
    const b = employeeCode(emp({ id: 'bbbb0000-0000-4000-8000-00000000000b' }));
    expect(a).not.toBe(b);
  });
});

describe('employeeCode — отдел в коде (читаемая группировка)', () => {
  it('с картой отдел→код подставляет код отдела', () => {
    const deptMap = new Map<string, string | null>([['d-1', 'ENG']]);
    const code = employeeCode(emp({ departmentId: 'd-1' }), deptMap);
    expect(code).toContain('ENG');
  });

  it('без карты, но с departmentId → префикс id отдела (не сырой полный UUID)', () => {
    const code = employeeCode(emp({ departmentId: 'deptABCDEF-long-id' }));
    expect(code).toContain('dept'); // первые 4 символа
    expect(code).not.toContain('deptABCDEF-long-id');
  });

  it('без отдела → плейсхолдер «—», не пусто и не «null»', () => {
    const code = employeeCode(emp({ departmentId: null }));
    expect(code).toContain('—');
    expect(code).not.toContain('null');
  });

  it('departmentId есть, но в карте значение null → фолбэк на префикс id отдела', () => {
    const deptMap = new Map<string, string | null>([['d-2', null]]);
    const code = employeeCode(emp({ departmentId: 'd-2xxxx' }), deptMap);
    expect(code).toContain('d-2x'); // 4 символа id отдела
  });
});

describe('empName — ФИО при наличии, иначе фолбэк на КОД', () => {
  it('фамилия+имя → «Фамилия Имя»', () => {
    expect(empName(emp({ lastName: 'Петров', firstName: 'Иван' }))).toBe('Петров Иван');
  });

  it('только фамилия → фамилия', () => {
    expect(empName(emp({ lastName: 'Петров', firstName: null }))).toBe('Петров');
  });

  it('пустые имя и фамилия → фолбэк на стабильный КОД (не пусто, не UUID)', () => {
    const e = emp({ firstName: null, lastName: null });
    const name = empName(e);
    expect(name).not.toBe('');
    expect(name).not.toBe(e.id);
    expect(name).toMatch(/^Сотрудник·/);
  });

  it('пустые строки (не null) тоже → фолбэк на КОД', () => {
    const name = empName(emp({ firstName: '', lastName: '' }));
    expect(name).toMatch(/^Сотрудник·/);
  });
});
