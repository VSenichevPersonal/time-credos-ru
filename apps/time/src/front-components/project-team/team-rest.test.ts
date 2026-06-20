import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet })),
}));

import { fetchEmployees, fetchProjectEntries } from './team-rest';

const list = (key: string, rows: object[]) => ({ data: { [key]: rows } });

beforeEach(() => mockGet.mockReset());

describe('fetchProjectEntries', () => {
  it('возвращает записи проекта', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEntries', [
      { hours: 8, date: '2026-06-15', employeeId: 'e1' },
    ]));
    const result = await fetchProjectEntries('proj-1');
    expect(result).toHaveLength(1);
    expect(result[0].hours).toBe(8);
  });

  it('фильтрует по projectId', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEntries', []));
    await fetchProjectEntries('proj-42');
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEntries',
      expect.objectContaining({
        query: expect.objectContaining({ filter: 'projectId[eq]:proj-42' }),
      }),
    );
  });

  it('пустой ответ → []', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEntries', []));
    expect(await fetchProjectEntries('p')).toEqual([]);
  });
});

describe('fetchEmployees', () => {
  it('возвращает сотрудников', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEmployees', [
      { id: 'e1', name: 'Иванов Иван' },
      { id: 'e2', name: 'Петров Пётр' },
    ]));
    const result = await fetchEmployees();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Иванов Иван');
  });

  it('запрашивает с limit=300 и orderBy name', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEmployees', []));
    await fetchEmployees();
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({
        query: expect.objectContaining({ limit: '300', orderBy: 'name[AscNullsFirst]' }),
      }),
    );
  });
});
