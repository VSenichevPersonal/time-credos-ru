import { beforeEach, describe, expect, it, vi } from 'vitest';

// Мок RestApiClient — перехватываем до импорта модуля
const mockGet = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet })),
}));

import { resolveSelfIsManager } from './capacity-rest';

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
