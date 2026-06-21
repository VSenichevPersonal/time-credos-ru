import { describe, expect, it } from 'vitest';

import {
  computeEmployeeProjects,
  computeProjectTeam,
  type EmployeeProjectsInput,
  type ProjectTeamInput,
} from './project-team';

// 1 проект p1, 3 сотрудника (e1/e2 в OV, e3 в DEV), записи с датами + 1 чужой проект.
const teamInput = (): ProjectTeamInput => ({
  entries: [
    { hours: 6, projectId: 'p1', employeeId: 'e1', date: '2026-01-10' },
    { hours: 4, projectId: 'p1', employeeId: 'e1', date: '2026-02-15' },
    { hours: 10, projectId: 'p1', employeeId: 'e2', date: '2026-03-01' },
    { hours: 2, projectId: 'p1', employeeId: 'e3', date: '2026-01-05' },
    { hours: 99, projectId: 'p2', employeeId: 'e1', date: '2026-01-10' }, // чужой проект
    { hours: 0, projectId: 'p1', employeeId: 'e2', date: '2026-01-10' }, // 0 часов
    { hours: 5, projectId: 'p1', employeeId: null, date: '2026-01-10' }, // без сотрудника
  ],
  employees: [
    { id: 'e1', firstName: 'Иван', lastName: 'Иванов', departmentId: 'd-ov' },
    { id: 'e2', firstName: 'Пётр', lastName: 'Петров', departmentId: 'd-ov' },
    { id: 'e3', firstName: 'Анна', lastName: 'Сидорова', departmentId: 'd-dev' },
  ],
  departments: [
    { id: 'd-ov', code: 'OV' },
    { id: 'd-dev', code: 'DEV' },
  ],
});

describe('computeProjectTeam', () => {
  it('агрегирует часы/записи/последнюю дату по сотруднику, сортирует по часам убыв.', () => {
    const r = computeProjectTeam(teamInput(), 'p1');
    expect(r.ok).toBe(true);
    expect(r.total).toBe(22); // 6+4+10+2 (0 и без-сотрудника не считаются)
    // e1=10, e2=10 (ничья по часам) → tie-break по имени: «Иванов»<«Петров» → e1 раньше e2; e3=2 последний.
    expect(r.members.map((m) => m.employeeId)).toEqual(['e1', 'e2', 'e3']);
  });

  it('e1 = 10ч за 2 записи, последняя дата 2026-02-15', () => {
    const r = computeProjectTeam(teamInput(), 'p1');
    const e1 = r.members.find((m) => m.employeeId === 'e1');
    expect(e1).toMatchObject({
      totalHours: 10,
      entryCount: 2,
      lastDate: '2026-02-15',
      deptCode: 'OV',
      name: 'Иванов Иван',
    });
  });

  it('share = доля от итога проекта', () => {
    const r = computeProjectTeam(teamInput(), 'p1');
    const e3 = r.members.find((m) => m.employeeId === 'e3');
    expect(e3?.share).toBe(Number((2 / 22).toFixed(4)));
  });

  it('чужой проект, нулевые часы, записи без сотрудника не попадают', () => {
    const r = computeProjectTeam(teamInput(), 'p1');
    expect(r.members).toHaveLength(3);
    expect(r.members.every((m) => m.totalHours > 0)).toBe(true);
  });

  it('фильтр периода [from,to] по дню (включительно)', () => {
    const r = computeProjectTeam(teamInput(), 'p1', { from: '2026-01-01', to: '2026-01-31' });
    // только январские: e1 (6), e3 (2)
    expect(r.total).toBe(8);
    expect(r.members.map((m) => m.employeeId)).toEqual(['e1', 'e3']);
  });

  it('пустой проект → total 0, members пуст', () => {
    const r = computeProjectTeam(teamInput(), 'no-such');
    expect(r.total).toBe(0);
    expect(r.members).toEqual([]);
  });

  it('сотрудник без отдела → deptCode null; имя-фолбэк = стабильный КОД (не сырой UUID)', () => {
    const input: ProjectTeamInput = {
      entries: [{ hours: 3, projectId: 'p1', employeeId: 'ex', date: '2026-01-10' }],
      employees: [{ id: 'ex', firstName: null, lastName: null, departmentId: null }],
      departments: [],
    };
    const r = computeProjectTeam(input, 'p1');
    expect(r.members[0].deptCode).toBeNull();
    // Имя-фолбэк больше НЕ сырой id, а стабильный читаемый КОД.
    expect(r.members[0].name).not.toBe('ex');
    expect(r.members[0].name).toMatch(/^Сотрудник·/);
  });

  it('записи без даты учитываются только когда период не задан', () => {
    const input: ProjectTeamInput = {
      entries: [{ hours: 4, projectId: 'p1', employeeId: 'e1', date: null }],
      employees: [{ id: 'e1', firstName: 'И', lastName: 'И', departmentId: null }],
      departments: [],
    };
    expect(computeProjectTeam(input, 'p1').total).toBe(4); // без периода — считаем
    expect(computeProjectTeam(input, 'p1', { from: '2026-01-01' }).total).toBe(0); // с периодом — режем
  });
});

const empInput = (): EmployeeProjectsInput => ({
  entries: [
    { hours: 6, projectId: 'p1', employeeId: 'e1', date: '2026-01-10' },
    { hours: 4, projectId: 'p2', employeeId: 'e1', date: '2026-02-10' },
    { hours: 2, projectId: 'p1', employeeId: 'e1', date: '2026-03-10' },
    { hours: 8, projectId: 'p1', employeeId: 'e2', date: '2026-01-10' }, // чужой сотрудник
  ],
  projects: [
    { id: 'p1', name: 'Проект Альфа', code: 'A-1', category: 'CLIENT', departmentId: null, plannedEffort: null },
    { id: 'p2', name: 'Проект Бета', code: 'B-1', category: 'INTERNAL', departmentId: null, plannedEffort: null },
  ],
});

describe('computeEmployeeProjects', () => {
  it('агрегирует часы по проекту для сотрудника, сортирует по часам убыв.', () => {
    const r = computeEmployeeProjects(empInput(), 'e1');
    expect(r.total).toBe(12); // 6+4+2
    expect(r.projects.map((p) => p.projectId)).toEqual(['p1', 'p2']);
    expect(r.projects[0]).toMatchObject({
      projectId: 'p1',
      name: 'Проект Альфа',
      code: 'A-1',
      totalHours: 8,
      entryCount: 2,
      lastDate: '2026-03-10',
    });
  });

  it('share = доля от всех часов сотрудника', () => {
    const r = computeEmployeeProjects(empInput(), 'e1');
    expect(r.projects.find((p) => p.projectId === 'p2')?.share).toBe(Number((4 / 12).toFixed(4)));
  });

  it('фильтр периода', () => {
    const r = computeEmployeeProjects(empInput(), 'e1', { from: '2026-02-01', to: '2026-02-28' });
    expect(r.total).toBe(4);
    expect(r.projects.map((p) => p.projectId)).toEqual(['p2']);
  });
});
