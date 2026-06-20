import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet })),
}));

import { fetchProjectSummary } from './summary-rest';

// Promise.all([proj, entries, stages]) → порядок важен
const setup = (proj: object, entries: object[], stages: object[]) => {
  mockGet
    .mockResolvedValueOnce({ data: { credosTimeProject: proj } })
    .mockResolvedValueOnce({ data: { credosTimeEntries: entries } })
    .mockResolvedValueOnce({ data: { credosTimeStages: stages } });
};

beforeEach(() => mockGet.mockReset());

describe('fetchProjectSummary', () => {
  it('агрегирует fact, team, entries, stages', async () => {
    setup(
      { code: 'ОПИБ-2026-001', name: 'Проект', plannedEffort: 160 },
      [
        { hours: 8, date: '2026-06-15T00:00:00Z', employeeId: 'e1' },
        { hours: 4, date: '2026-06-16T00:00:00Z', employeeId: 'e1' },
        { hours: 6, date: '2026-06-17T00:00:00Z', employeeId: 'e2' },
      ],
      [{ id: 's1' }, { id: 's2' }],
    );
    const s = await fetchProjectSummary('proj-1');
    expect(s.fact).toBe(18);        // 8+4+6
    expect(s.team).toBe(2);         // e1, e2 уникальных
    expect(s.entries).toBe(3);
    expect(s.stages).toBe(2);
    expect(s.plannedEffort).toBe(160);
  });

  it('lastDate = максимальная дата среди записей', async () => {
    setup({},
      [
        { hours: 4, date: '2026-06-10T00:00:00Z', employeeId: 'e1' },
        { hours: 8, date: '2026-06-20T00:00:00Z', employeeId: 'e1' },
        { hours: 2, date: '2026-06-05T00:00:00Z', employeeId: 'e1' },
      ],
      [],
    );
    const s = await fetchProjectSummary('p');
    expect(s.lastDate).toBe('2026-06-20');
  });

  it('нет записей → fact=0, team=0, lastDate=null', async () => {
    setup({ name: 'Пустой' }, [], []);
    const s = await fetchProjectSummary('p');
    expect(s.fact).toBe(0);
    expect(s.team).toBe(0);
    expect(s.lastDate).toBeNull();
  });

  it('null-поля проекта → дефолты', async () => {
    setup(
      { code: null, name: null, category: null, status: null,
        startDate: null, endDate: null, plannedEffort: null },
      [], [],
    );
    const s = await fetchProjectSummary('p');
    expect(s.code).toBeNull();
    expect(s.name).toBe('');         // null → ''
    expect(s.category).toBeNull();
    expect(s.plannedEffort).toBeNull();
  });

  it('startDate/endDate обрезаются до 10 символов', async () => {
    setup(
      { startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T23:59:59.000Z' },
      [], [],
    );
    const s = await fetchProjectSummary('p');
    expect(s.startDate).toBe('2026-01-01');
    expect(s.endDate).toBe('2026-12-31');
  });

  it('employeeId=null в записи → не считается в team', async () => {
    setup({},
      [
        { hours: 8, date: '2026-06-15', employeeId: null },
        { hours: 4, date: '2026-06-16', employeeId: 'e1' },
      ],
      [],
    );
    const s = await fetchProjectSummary('p');
    expect(s.team).toBe(1);
  });

  it('запрашивает по правильному projectId', async () => {
    setup({ name: 'X' }, [], []);
    await fetchProjectSummary('proj-42');
    expect(mockGet).toHaveBeenCalledWith('/rest/credosTimeProjects/proj-42');
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEntries',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'projectId[eq]:proj-42' }) }),
    );
  });
});
