import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet })),
}));

// useSelfEmployee хук не тестируем (нужен React + useUserId SDK);
// resolveSelfEmployee — чистый резолвер, тестируем напрямую.
import { resolveSelfEmployee } from './use-self-employee';

const list = (key: string, rows: object[]) => ({ data: { [key]: rows } });

beforeEach(() => mockGet.mockReset());

describe('resolveSelfEmployee — CISO-006: невалидный userId → рядовой без fetch', () => {
  it('null userId → employeeId=null, isManager=false (нет запросов)', async () => {
    const result = await resolveSelfEmployee(null);
    expect(result).toEqual({ employeeId: null, isManager: false });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('пустая строка → рядовой без fetch', async () => {
    const result = await resolveSelfEmployee('');
    expect(result).toEqual({ employeeId: null, isManager: false });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('не-UUID (инъекция filter) → рядовой без fetch', async () => {
    const result = await resolveSelfEmployee('userId[gte]:evil');
    expect(result).toEqual({ employeeId: null, isManager: false });
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('UUID с лишними символами → рядовой без fetch', async () => {
    const result = await resolveSelfEmployee('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee,extra');
    expect(result).toEqual({ employeeId: null, isManager: false });
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('resolveSelfEmployee — цепочка userId → member → employee', () => {
  const VALID_UUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

  it('нет workspaceMember → employeeId=null, isManager=false', async () => {
    mockGet.mockResolvedValueOnce(list('workspaceMembers', []));
    const result = await resolveSelfEmployee(VALID_UUID);
    expect(result).toEqual({ employeeId: null, isManager: false });
    // второй запрос не делался
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('member найден, но нет employee → employeeId=null, isManager=false', async () => {
    mockGet
      .mockResolvedValueOnce(list('workspaceMembers', [{ id: 'm1' }]))
      .mockResolvedValueOnce(list('credosTimeEmployees', []));
    const result = await resolveSelfEmployee(VALID_UUID);
    expect(result).toEqual({ employeeId: null, isManager: false });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('isManager=true → { employeeId, isManager: true }', async () => {
    mockGet
      .mockResolvedValueOnce(list('workspaceMembers', [{ id: 'm1' }]))
      .mockResolvedValueOnce(list('credosTimeEmployees', [{ id: 'e1', isManager: true }]));
    const result = await resolveSelfEmployee(VALID_UUID);
    expect(result).toEqual({ employeeId: 'e1', isManager: true });
  });

  it('isManager=false → { employeeId, isManager: false }', async () => {
    mockGet
      .mockResolvedValueOnce(list('workspaceMembers', [{ id: 'm1' }]))
      .mockResolvedValueOnce(list('credosTimeEmployees', [{ id: 'e2', isManager: false }]));
    const result = await resolveSelfEmployee(VALID_UUID);
    expect(result).toEqual({ employeeId: 'e2', isManager: false });
  });

  it('isManager=null → isManager: false (не true)', async () => {
    mockGet
      .mockResolvedValueOnce(list('workspaceMembers', [{ id: 'm1' }]))
      .mockResolvedValueOnce(list('credosTimeEmployees', [{ id: 'e3', isManager: null }]));
    const result = await resolveSelfEmployee(VALID_UUID);
    expect(result).toEqual({ employeeId: 'e3', isManager: false });
  });

  it('isManager отсутствует (undefined) → isManager: false', async () => {
    mockGet
      .mockResolvedValueOnce(list('workspaceMembers', [{ id: 'm1' }]))
      .mockResolvedValueOnce(list('credosTimeEmployees', [{ id: 'e4' }]));
    const result = await resolveSelfEmployee(VALID_UUID);
    expect(result).toEqual({ employeeId: 'e4', isManager: false });
  });

  it('первый запрос: filter=userId[eq]:<uuid>, limit=1', async () => {
    mockGet.mockResolvedValueOnce(list('workspaceMembers', []));
    await resolveSelfEmployee(VALID_UUID);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/workspaceMembers',
      expect.objectContaining({
        query: expect.objectContaining({ filter: `userId[eq]:${VALID_UUID}`, limit: '1' }),
      }),
    );
  });

  it('второй запрос: filter=workspaceMemberRef[eq]:<memberId>, limit=1', async () => {
    mockGet
      .mockResolvedValueOnce(list('workspaceMembers', [{ id: 'member-abc' }]))
      .mockResolvedValueOnce(list('credosTimeEmployees', []));
    await resolveSelfEmployee(VALID_UUID);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({
        query: expect.objectContaining({ filter: 'workspaceMemberRef[eq]:member-abc', limit: '1' }),
      }),
    );
  });

  it('сетевая ошибка на первом запросе → пробрасывается (хук ловит в catch → рядовой)', async () => {
    mockGet.mockRejectedValueOnce(new Error('network error'));
    await expect(resolveSelfEmployee(VALID_UUID)).rejects.toThrow('network error');
  });

  it('сетевая ошибка на втором запросе → пробрасывается', async () => {
    mockGet
      .mockResolvedValueOnce(list('workspaceMembers', [{ id: 'm1' }]))
      .mockRejectedValueOnce(new Error('timeout'));
    await expect(resolveSelfEmployee(VALID_UUID)).rejects.toThrow('timeout');
  });
});
