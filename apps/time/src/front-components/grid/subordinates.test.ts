import { describe, expect, it } from 'vitest';

import type { EmployeeRef } from 'src/front-components/grid/types';
import {
  departmentsHeadedBy,
  isEnteredByManager,
  subordinatesOf,
} from 'src/front-components/grid/subordinates';

const emp = (id: string, departmentId: string | null, name = ''): EmployeeRef => ({
  id,
  name,
  departmentId,
});

describe('departmentsHeadedBy', () => {
  const depts = [
    { id: 'd1', headId: 'mgr' },
    { id: 'd2', headId: 'other' },
    { id: 'd3', headId: 'mgr' },
    { id: 'd4', headId: null },
  ];

  it('возвращает отделы, где head = руководитель', () => {
    expect(departmentsHeadedBy('mgr', depts).sort()).toEqual(['d1', 'd3']);
  });

  it('чужой head не попадает', () => {
    expect(departmentsHeadedBy('mgr', depts)).not.toContain('d2');
  });

  it('null managerEmployeeId → пусто (селектор скрыт)', () => {
    expect(departmentsHeadedBy(null, depts)).toEqual([]);
  });

  it('нет своих отделов → пусто', () => {
    expect(departmentsHeadedBy('nobody', depts)).toEqual([]);
  });
});

describe('subordinatesOf', () => {
  const employees = [
    emp('mgr', 'd1', 'Яковлев'),
    emp('a', 'd1', 'Борисов'),
    emp('b', 'd1', 'Антонов'),
    emp('c', 'd2', 'Чужой отдел'),
    emp('d', null, 'Без отдела'),
  ];

  it('сотрудники подведомственных отделов, кроме самого руководителя', () => {
    const subs = subordinatesOf('mgr', ['d1'], employees).map((e) => e.id);
    expect(subs).toEqual(['b', 'a']); // отсортировано по ФИО (Антонов, Борисов)
  });

  it('сам руководитель не входит в список подчинённых', () => {
    const subs = subordinatesOf('mgr', ['d1'], employees).map((e) => e.id);
    expect(subs).not.toContain('mgr');
  });

  it('сотрудники чужих отделов исключены', () => {
    const subs = subordinatesOf('mgr', ['d1'], employees).map((e) => e.id);
    expect(subs).not.toContain('c');
  });

  it('сотрудники без отдела исключены', () => {
    const subs = subordinatesOf('mgr', ['d1'], employees).map((e) => e.id);
    expect(subs).not.toContain('d');
  });

  it('нет подведомственных отделов → пусто', () => {
    expect(subordinatesOf('mgr', [], employees)).toEqual([]);
  });

  it('сортировка по ФИО (ru)', () => {
    const subs = subordinatesOf('mgr', ['d1'], employees).map((e) => e.name);
    expect(subs).toEqual(['Антонов', 'Борисов']);
  });
});

describe('isEnteredByManager', () => {
  it('actor задан и ≠ владелец → введено руководителем', () => {
    expect(isEnteredByManager('mgr', 'emp')).toBe(true);
  });

  it('actor пуст → ввёл сам сотрудник', () => {
    expect(isEnteredByManager(null, 'emp')).toBe(false);
    expect(isEnteredByManager(undefined, 'emp')).toBe(false);
    expect(isEnteredByManager('', 'emp')).toBe(false);
    expect(isEnteredByManager('   ', 'emp')).toBe(false);
  });

  it('actor === владелец → НЕ on-behalf (сам же и есть актор)', () => {
    expect(isEnteredByManager('emp', 'emp')).toBe(false);
  });

  it('actor задан, владелец неизвестен → считаем on-behalf', () => {
    expect(isEnteredByManager('mgr', null)).toBe(true);
    expect(isEnteredByManager('mgr', undefined)).toBe(true);
  });
});
