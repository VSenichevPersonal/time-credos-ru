import { beforeEach, describe, expect, it, vi } from 'vitest';

// Мок RestApiClient — перехватываем до импорта модуля
const mockGet = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet })),
}));

import { fetchAbsences, resolveSelfIsManager } from './capacity-rest';

// Формат ответа capacity-rest: { data: { credosTimeEmployees: [...] } }
const empResp = (employees: object[]) => ({
  data: { credosTimeEmployees: employees },
});

beforeEach(() => {
  mockGet.mockReset();
});

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
