import { beforeEach, describe, expect, it, vi } from 'vitest';

// Мок RestApiClient — перехватываем до импорта модуля
const mockGet = vi.fn();
const mockPatch = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet, patch: mockPatch })),
}));

import {
  fetchAbsences,
  fetchBookings,
  fetchCalendar,
  fetchDeptPlans,
  fetchDepartments,
  fetchEmployees,
  fetchProjectDeptShares,
  fetchProjects,
  patchDeptPlan,
  patchProject,
  resolveSelfIsManager,
} from './capacity-rest';

// Формат ответа capacity-rest: { data: { credosTimeEmployees: [...] } }
const empResp = (employees: object[]) => ({
  data: { credosTimeEmployees: employees },
});

beforeEach(() => {
  mockGet.mockReset();
  mockPatch.mockReset();
});

// helpers
const listOf = (key: string, items: object[]) => ({ data: { [key]: items } });

describe('resolveSelfIsManager — с workspaceMemberRef', () => {
  it('workspaceMemberRef → filter byRef, нашли isManager=true → true', async () => {
    mockGet.mockResolvedValueOnce(
      empResp([{ id: 'e1', isManager: true }]),
    );
    const result = await resolveSelfIsManager('ref-123');
    expect(result).toBe(true);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'workspaceMemberRef[eq]:ref-123' }) }),
    );
  });

  it('workspaceMemberRef → нашли isManager=false → false', async () => {
    mockGet.mockResolvedValueOnce(
      empResp([{ id: 'e1', isManager: false }]),
    );
    expect(await resolveSelfIsManager('ref-123')).toBe(false);
  });

  it('workspaceMemberRef → пустой список → fallback (второй запрос)', async () => {
    // Первый запрос by ref → пусто, второй fallback → есть isManager=true
    mockGet
      .mockResolvedValueOnce(empResp([]))
      .mockResolvedValueOnce(empResp([{ id: 'e2', isManager: true }]));
    expect(await resolveSelfIsManager('ref-unknown')).toBe(true);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});

describe('resolveSelfIsManager — без workspaceMemberRef (null)', () => {
  it('null → сразу fallback (первый и единственный запрос)', async () => {
    mockGet.mockResolvedValueOnce(
      empResp([{ id: 'e1', isManager: true }]),
    );
    const result = await resolveSelfIsManager(null);
    expect(result).toBe(true);
    expect(mockGet).toHaveBeenCalledTimes(1);
    // [bug]#3 fix: fallback фильтрует по isManager[eq]:true (не orderBy)
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({
        query: expect.objectContaining({ filter: 'isManager[eq]:true' }),
      }),
    );
  });

  it('null fallback → есть руководитель в воркспейсе → true', async () => {
    // [bug]#3 fix: filter=isManager[eq]:true возвращает только руководителей,
    // поэтому решение по длине списка, а не по полю первой строки.
    mockGet.mockResolvedValueOnce(
      empResp([{ id: 'e1', isManager: true }]),
    );
    expect(await resolveSelfIsManager(null)).toBe(true);
  });

  it('null fallback → пустой список → false (нет руководителей)', async () => {
    mockGet.mockResolvedValueOnce(empResp([]));
    expect(await resolveSelfIsManager(null)).toBe(false);
  });
});

describe('fetchAbsences — W3-1', () => {
  const absResp = (absences: object[]) => ({
    data: { credosTimeAbsences: absences },
  });

  it('фильтрует пересечением с горизонтом (endDate>=from, startDate<=to) и мапит поля', async () => {
    mockGet.mockResolvedValueOnce(
      absResp([
        { employeeId: 'e1', startDate: '2026-06-01T10:00:00.000Z', endDate: '2026-06-10T10:00:00.000Z' },
        { employeeId: null, startDate: null, endDate: null },
      ]),
    );
    const result = await fetchAbsences('2026-06-01', '2026-09-30');
    expect(result).toEqual([
      { employeeId: 'e1', startDate: '2026-06-01T10:00:00.000Z', endDate: '2026-06-10T10:00:00.000Z' },
      { employeeId: null, startDate: null, endDate: null },
    ]);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeAbsences',
      expect.objectContaining({
        query: expect.objectContaining({
          filter: 'endDate[gte]:2026-06-01,startDate[lte]:2026-09-30',
        }),
      }),
    );
  });

  it('пустой ответ → []', async () => {
    mockGet.mockResolvedValueOnce(absResp([]));
    expect(await fetchAbsences('2026-06-01', '2026-09-30')).toEqual([]);
  });
});

// ─── fetchDepartments ─────────────────────────────────────────────────────────

describe('fetchDepartments', () => {
  it('маппит код, headcount из активных сотрудников (FTE fallback), capacityFactor дефолт 0.8', async () => {
    // Promise.all([departments, employees, empDeptAssignments]) — 3 параллельных запроса.
    // Сотрудники без FTE-записей → fallback headcount (100% на departmentId).
    mockGet
      .mockResolvedValueOnce(listOf('credosTimeDepartments', [
        { id: 'd1', name: 'Dev', code: 'DEV', capacityFactor: 1 },
        { id: 'd2', name: 'QA', code: null, capacityFactor: null },
      ]))
      .mockResolvedValueOnce(listOf('credosTimeEmployees', [
        { id: 'e1', departmentId: 'd1' },
        { id: 'e2', departmentId: 'd1' },
        { id: 'e3', departmentId: 'd2' },
      ]))
      .mockResolvedValueOnce(listOf('credosTimeEmployeeDepartments', [])); // нет FTE-записей → fallback
    const result = await fetchDepartments();
    expect(result).toHaveLength(2);
    expect(result.find((d) => d.id === 'd1')).toMatchObject({
      code: 'DEV', headcount: 2, capacityFactor: 1,
    });
    expect(result.find((d) => d.id === 'd2')).toMatchObject({
      code: null, headcount: 1, capacityFactor: 0.8, // дефолт
    });
  });

  it('пустые депты → []', async () => {
    mockGet
      .mockResolvedValueOnce(listOf('credosTimeDepartments', []))
      .mockResolvedValueOnce(listOf('credosTimeEmployees', []))
      .mockResolvedValueOnce(listOf('credosTimeEmployeeDepartments', []));
    expect(await fetchDepartments()).toEqual([]);
  });
});

// ─── fetchProjects ─────────────────────────────────────────────────────────────

describe('fetchProjects', () => {
  it('маппит поля (code/departmentId/plannedEffort — null если нет)', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeProjects', [
      { id: 'p1', name: 'А', code: 'AA', departmentId: 'd1', plannedEffort: 100, startDate: '2026-01-01', endDate: '2026-06-30' },
      { id: 'p2', name: 'Б', code: null, departmentId: null, plannedEffort: null },
    ]));
    const result = await fetchProjects();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'p1', code: 'AA', plannedEffort: 100, startDate: '2026-01-01' });
    expect(result[1]).toMatchObject({ id: 'p2', code: null, plannedEffort: null, departmentId: null });
  });

  it('запрашивает /credosTimeProjects с limit=300', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeProjects', []));
    await fetchProjects();
    expect(mockGet).toHaveBeenCalledWith('/rest/credosTimeProjects',
      expect.objectContaining({ query: expect.objectContaining({ limit: '300' }) }),
    );
  });
});

// ─── fetchDeptPlans ────────────────────────────────────────────────────────────

describe('fetchDeptPlans — REQ-0012', () => {
  it('маппит label (дефолт ""), category/plannedEffort null если нет', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeDeptPlans', [
      { id: 'dp1', label: 'Пресейл', departmentId: 'd1', category: 'PRESALE', plannedEffort: 50, startDate: '2026-01-01', endDate: '2026-03-31' },
      { id: 'dp2', departmentId: null, label: null, category: null, plannedEffort: null },
    ]));
    const result = await fetchDeptPlans();
    expect(result[0]).toMatchObject({ id: 'dp1', label: 'Пресейл', category: 'PRESALE', plannedEffort: 50 });
    expect(result[1]).toMatchObject({ id: 'dp2', label: '', category: null, plannedEffort: null });
  });

  it('пустой ответ → []', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeDeptPlans', []));
    expect(await fetchDeptPlans()).toEqual([]);
  });
});

// ─── fetchProjectDeptShares — REQ-0013 13b ──────────────────────────────────────

describe('fetchProjectDeptShares — REQ-0013 13b', () => {
  it('маппит projectId/departmentId/plannedEffortShare (null если нет)', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeProjectDepartments', [
      { projectId: 'p1', departmentId: 'd1', plannedEffortShare: 60 },
      { projectId: 'p1', departmentId: 'd2', plannedEffortShare: 40 },
      { projectId: null, departmentId: null, plannedEffortShare: null },
    ]));
    const result = await fetchProjectDeptShares();
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ projectId: 'p1', departmentId: 'd1', plannedEffortShare: 60 });
    expect(result[2]).toEqual({ projectId: null, departmentId: null, plannedEffortShare: null });
  });

  it('запрашивает /credosTimeProjectDepartments с limit=300', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeProjectDepartments', []));
    await fetchProjectDeptShares();
    expect(mockGet).toHaveBeenCalledWith('/rest/credosTimeProjectDepartments',
      expect.objectContaining({ query: expect.objectContaining({ limit: '300' }) }),
    );
  });

  it('пустой ответ → []', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeProjectDepartments', []));
    expect(await fetchProjectDeptShares()).toEqual([]);
  });
});

// ─── fetchEmployees ────────────────────────────────────────────────────────────

describe('fetchEmployees', () => {
  it('фильтрует active=true, маппит name/departmentId', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeEmployees', [
      { id: 'e1', name: 'Иванов', departmentId: 'd1', active: true },
      { id: 'e2', name: 'Петров', departmentId: null, active: true },
    ]));
    const result = await fetchEmployees();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'e1', name: 'Иванов', departmentId: 'd1' });
    expect(result[1].departmentId).toBeNull();
  });

  it('запрашивает filter=active[eq]:true', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeEmployees', []));
    await fetchEmployees();
    expect(mockGet).toHaveBeenCalledWith('/rest/credosTimeEmployees',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'active[eq]:true' }) }),
    );
  });
});

// ─── fetchCalendar ─────────────────────────────────────────────────────────────

describe('fetchCalendar', () => {
  it('маппит date (slice 10) и hours (дефолт 0)', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeWorkdayCalendars', [
      { date: '2026-06-01T00:00:00.000Z', hours: 8 },
      { date: '2026-06-02T00:00:00.000Z', hours: null },
    ]));
    const result = await fetchCalendar('2026-06-01', '2026-06-30');
    expect(result[0]).toEqual({ date: '2026-06-01', hours: 8 });
    expect(result[1]).toEqual({ date: '2026-06-02', hours: 0 });
  });

  it('filter=date[gte]:from,date[lte]:to', async () => {
    mockGet.mockResolvedValueOnce(listOf('credosTimeWorkdayCalendars', []));
    await fetchCalendar('2026-01-01', '2026-06-30');
    expect(mockGet).toHaveBeenCalledWith('/rest/credosTimeWorkdayCalendars',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'date[gte]:2026-01-01,date[lte]:2026-06-30' }) }),
    );
  });
});

// ─── patchProject ─────────────────────────────────────────────────────────────

describe('patchProject', () => {
  it('патчит /credosTimeProjects/:id с plannedEffort', async () => {
    mockPatch.mockResolvedValueOnce(undefined);
    await patchProject('p1', { plannedEffort: 120 });
    expect(mockPatch).toHaveBeenCalledWith('/rest/credosTimeProjects/p1', { plannedEffort: 120 });
  });

  it('startDate/endDate конвертируются в ISO DateTime', async () => {
    mockPatch.mockResolvedValueOnce(undefined);
    await patchProject('p1', { startDate: '2026-01-01', endDate: '2026-06-30' });
    const [, data] = mockPatch.mock.calls[0];
    expect(data.startDate).toBe('2026-01-01T10:00:00.000Z');
    expect(data.endDate).toBe('2026-06-30T10:00:00.000Z');
  });

  it('null startDate → null (не undefined)', async () => {
    mockPatch.mockResolvedValueOnce(undefined);
    await patchProject('p1', { startDate: null });
    expect(mockPatch.mock.calls[0][1].startDate).toBeNull();
  });
});

// ─── patchDeptPlan ─────────────────────────────────────────────────────────────

describe('patchDeptPlan — REQ-0012', () => {
  it('патчит /credosTimeDeptPlans/:id', async () => {
    mockPatch.mockResolvedValueOnce(undefined);
    await patchDeptPlan('dp1', { plannedEffort: 50 });
    expect(mockPatch).toHaveBeenCalledWith('/rest/credosTimeDeptPlans/dp1', { plannedEffort: 50 });
  });

  it('endDate null → null', async () => {
    mockPatch.mockResolvedValueOnce(undefined);
    await patchDeptPlan('dp1', { endDate: null });
    expect(mockPatch.mock.calls[0][1].endDate).toBeNull();
  });
});

// ─── fetchBookings (REQ-0004 Часть C) ─────────────────────────────────────────

const bookingResp = (rows: object[]) => ({ data: { credosTimeBookings: rows } });
const rawBooking = (over: Record<string, unknown> = {}) => ({
  id: 'b1',
  employeeId: 'e1',
  projectId: 'p1',
  bookingType: 'HARD',
  hours: 80,
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  ...over,
});

describe('fetchBookings', () => {
  it('маппит поля и возвращает массив', async () => {
    mockGet.mockResolvedValueOnce(bookingResp([rawBooking()]));
    const result = await fetchBookings('2026-06-01', '2026-06-30');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'b1',
      employeeId: 'e1',
      projectId: 'p1',
      bookingType: 'HARD',
      hours: 80,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
  });

  it('неизвестный bookingType → SOFT (дефолт)', async () => {
    mockGet.mockResolvedValueOnce(bookingResp([rawBooking({ bookingType: 'UNKNOWN' })]));
    const [b] = await fetchBookings('2026-06-01', '2026-06-30');
    expect(b.bookingType).toBe('SOFT');
  });

  it('null-поля → null', async () => {
    mockGet.mockResolvedValueOnce(bookingResp([rawBooking({ employeeId: null, projectId: null, hours: null, startDate: null, endDate: null })]));
    const [b] = await fetchBookings('2026-06-01', '2026-06-30');
    expect(b.employeeId).toBeNull();
    expect(b.hours).toBeNull();
    expect(b.startDate).toBeNull();
  });

  it('пустой ответ → []', async () => {
    mockGet.mockResolvedValueOnce(bookingResp([]));
    expect(await fetchBookings('2026-06-01', '2026-06-30')).toEqual([]);
  });

  it('запрос содержит date-range фильтр и limit=400', async () => {
    mockGet.mockResolvedValueOnce(bookingResp([]));
    await fetchBookings('2026-06-01', '2026-06-30');
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeBookings',
      expect.objectContaining({
        query: expect.objectContaining({
          filter: 'endDate[gte]:2026-06-01,startDate[lte]:2026-06-30',
          limit: '400',
        }),
      }),
    );
  });
});
