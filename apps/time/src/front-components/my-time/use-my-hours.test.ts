import { describe, expect, it } from 'vitest';

import type { ApiEntry, ProjectRef } from 'src/front-components/grid/types';
import { buildProjectHours } from './use-my-hours';

const e = (projectId: string | null, hours: number): ApiEntry => ({
  id: `${projectId}-${hours}-${Math.random()}`,
  date: '2026-06-15T10:00:00.000Z',
  hours,
  description: null,
  status: null,
  projectId,
  workTypeId: 'w1',
  employeeId: 'emp1',
});

const proj = (id: string, name: string): ProjectRef => ({
  id,
  code: null,
  name,
  rawName: name,
  client: null,
  departmentId: null,
  category: null,
  approvalRequired: null,
});

describe('buildProjectHours', () => {
  it('пустой ввод → пустой массив', () => {
    expect(buildProjectHours([], [])).toEqual([]);
  });

  it('суммирует часы по проекту и подставляет имя', () => {
    const res = buildProjectHours(
      [e('p1', 4), e('p1', 4), e('p2', 2)],
      [proj('p1', 'Альфа'), proj('p2', 'Бета')],
    );
    expect(res).toEqual([
      { projectId: 'p1', name: 'Альфа', hours: 8 },
      { projectId: 'p2', name: 'Бета', hours: 2 },
    ]);
  });

  it('сортирует по убыванию часов', () => {
    const res = buildProjectHours([e('p1', 1), e('p2', 9)], [proj('p1', 'A'), proj('p2', 'B')]);
    expect(res[0].projectId).toBe('p2');
  });

  it('записи без проекта игнорируются', () => {
    expect(buildProjectHours([e(null, 5)], [])).toEqual([]);
  });

  it('неизвестный проект → запасное имя', () => {
    const res = buildProjectHours([e('px', 3)], []);
    expect(res[0].name).toBe('Проект без названия');
  });

  it('hours не-число → трактуется как 0 (не NaN)', () => {
    // ApiEntry.hours помечен как number, но REST может вернуть null/undefined
    const bad = { ...e('p1', 0), hours: null as unknown as number };
    const res = buildProjectHours([bad, e('p1', 5)], [proj('p1', 'A')]);
    expect(res[0].hours).toBe(5);
  });

  it('round2 floating-point: 0.005 + 0.005 → 0.01 (нет IEEE 754 артефакта)', () => {
    const res = buildProjectHours([e('p1', 0.005), e('p1', 0.005)], [proj('p1', 'X')]);
    expect(res[0].hours).toBe(0.01);
  });
});
