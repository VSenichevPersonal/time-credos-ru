import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({
    get: mockGet, post: mockPost, patch: mockPatch, delete: mockDelete,
  })),
}));

import {
  deleteEntry,
  fetchDepartments,
  fetchEmployees,
  fetchEntries,
  fetchProjects,
  fetchWorkTypes,
  resolveEmployeeId,
  upsertEntry,
} from './time-rest';

const list = (key: string, rows: object[]) => ({ data: { [key]: rows } });

beforeEach(() => {
  mockGet.mockReset(); mockPost.mockReset();
  mockPatch.mockReset(); mockDelete.mockReset();
});

// ─── resolveEmployeeId ────────────────────────────────────────────────────

describe('resolveEmployeeId', () => {
  it('с ref → GET по ref, нашли → вернуть id', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEmployees', [{ id: 'emp-1' }]));
    expect(await resolveEmployeeId('ref-abc')).toBe('emp-1');
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'workspaceMemberRef[eq]:ref-abc' }) }),
    );
  });

  it('с ref → не нашли → fallback (второй запрос)', async () => {
    mockGet
      .mockResolvedValueOnce(list('credosTimeEmployees', []))          // byRef пусто
      .mockResolvedValueOnce(list('credosTimeEmployees', [{ id: 'emp-2' }])); // fallback
    expect(await resolveEmployeeId('ref-xyz')).toBe('emp-2');
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('null → сразу fallback (один запрос)', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEmployees', [{ id: 'emp-3' }]));
    expect(await resolveEmployeeId(null)).toBe('emp-3');
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'active[eq]:true' }) }),
    );
  });

  it('fallback пустой → null', async () => {
    mockGet
      .mockResolvedValueOnce(list('credosTimeEmployees', []))
      .mockResolvedValueOnce(list('credosTimeEmployees', []));
    expect(await resolveEmployeeId('ref-gone')).toBeNull();
  });
});

// ─── fetchProjects ────────────────────────────────────────────────────────

describe('fetchProjects', () => {
  it('объединяет проект и компанию по companyId', async () => {
    // fetchProjects делает Promise.all([projects, companies])
    mockGet
      .mockResolvedValueOnce(list('credosTimeProjects', [
        { id: 'p1', name: 'ОПИБ-2026-001 · Клиент · Проект 1', code: 'ОПИБ-2026-001', companyId: 'co1' },
      ]))
      .mockResolvedValueOnce(list('companies', [{ id: 'co1', name: 'ООО Клиент' }]));
    const result = await fetchProjects();
    expect(result[0].client).toBe('ООО Клиент');
    expect(result[0].code).toBe('ОПИБ-2026-001');
  });

  it('companyId=null → client=null', async () => {
    mockGet
      .mockResolvedValueOnce(list('credosTimeProjects', [
        { id: 'p2', name: 'Внутренний', code: null, companyId: null },
      ]))
      .mockResolvedValueOnce(list('companies', []));
    const [p] = await fetchProjects();
    expect(p.client).toBeNull();
    expect(p.code).toBeNull();
  });

  it('пустые списки → пустой массив', async () => {
    mockGet
      .mockResolvedValueOnce(list('credosTimeProjects', []))
      .mockResolvedValueOnce(list('companies', []));
    expect(await fetchProjects()).toEqual([]);
  });
});

// ─── fetchWorkTypes ───────────────────────────────────────────────────────

describe('fetchWorkTypes', () => {
  it('маппит поля, null group → null', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeWorkTypes', [
      { id: 'wt1', name: 'Разработка', group: null, departmentId: 'd1' },
    ]));
    const [wt] = await fetchWorkTypes();
    expect(wt).toEqual({ id: 'wt1', name: 'Разработка', group: null, departmentId: 'd1' });
  });
});

// ─── fetchDepartments ─────────────────────────────────────────────────────

describe('fetchDepartments', () => {
  it('approvalRequired null → null (не превращается в false)', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeDepartments', [
      { id: 'd1', name: 'ОПИБ', approvalRequired: null },
    ]));
    const [d] = await fetchDepartments();
    expect(d.approvalRequired).toBeNull();
  });
});

// ─── fetchEmployees ───────────────────────────────────────────────────────

describe('fetchEmployees', () => {
  it('возвращает активных сотрудников, departmentId null → null', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEmployees', [
      { id: 'e1', name: 'Иванов Иван', departmentId: null },
    ]));
    const [e] = await fetchEmployees();
    expect(e.departmentId).toBeNull();
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'active[eq]:true' }) }),
    );
  });
});

// ─── fetchEntries ─────────────────────────────────────────────────────────

describe('fetchEntries', () => {
  it('с employeeId → фильтр с employeeId', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEntries', []));
    await fetchEntries('2026-06-01', '2026-06-30', 'emp-1');
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEntries',
      expect.objectContaining({
        query: expect.objectContaining({
          filter: 'date[gte]:2026-06-01,date[lte]:2026-06-30,employeeId[eq]:emp-1',
        }),
      }),
    );
  });

  it('null employeeId → фильтр без employeeId', async () => {
    mockGet.mockResolvedValueOnce(list('credosTimeEntries', []));
    await fetchEntries('2026-06-01', '2026-06-30', null);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEntries',
      expect.objectContaining({
        query: expect.objectContaining({
          filter: 'date[gte]:2026-06-01,date[lte]:2026-06-30',
        }),
      }),
    );
  });
});

// ─── upsertEntry ──────────────────────────────────────────────────────────

describe('upsertEntry', () => {
  const base = {
    date: '2026-06-15', hours: 8,
    projectId: 'proj-1', workTypeId: 'wt-1', employeeId: 'emp-1',
  };

  it('без id → POST', async () => {
    mockPost.mockResolvedValueOnce({});
    await upsertEntry(base);
    expect(mockPost).toHaveBeenCalledWith('/rest/credosTimeEntries', expect.objectContaining({
      date: '2026-06-15T10:00:00.000Z',
      hours: 8,
    }));
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('с id → PATCH', async () => {
    mockPatch.mockResolvedValueOnce({});
    await upsertEntry({ ...base, id: 'entry-42' });
    expect(mockPatch).toHaveBeenCalledWith('/rest/credosTimeEntries/entry-42', expect.anything());
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('description=undefined → null в теле', async () => {
    mockPost.mockResolvedValueOnce({});
    await upsertEntry(base);
    expect(mockPost).toHaveBeenCalledWith('/rest/credosTimeEntries', expect.objectContaining({
      description: null,
    }));
  });
});

// ─── deleteEntry ──────────────────────────────────────────────────────────

describe('deleteEntry', () => {
  it('вызывает DELETE с правильным URL', async () => {
    mockDelete.mockResolvedValueOnce({});
    await deleteEntry('entry-99');
    expect(mockDelete).toHaveBeenCalledWith('/rest/credosTimeEntries/entry-99');
  });
});
