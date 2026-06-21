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

// ─── upsertEntry (CISO-012: роутинг через /s/time-entry) ──────────────────

describe('upsertEntry', () => {
  const base = {
    date: '2026-06-15', hours: 8,
    projectId: 'proj-1', workTypeId: 'wt-1', employeeId: 'emp-1',
  };

  it('пишет через /s/time-entry op=upsert (без id → без id в теле)', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    const res = await upsertEntry(base);
    expect(res.ok).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/s/time-entry', expect.objectContaining({
      op: 'upsert',
      date: '2026-06-15T10:00:00.000Z',
      hours: 8,
    }));
    // прямой REST не трогаем (роут отработал)
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('с id → /s/ op=upsert с id', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await upsertEntry({ ...base, id: 'entry-42' });
    expect(mockPost).toHaveBeenCalledWith('/s/time-entry', expect.objectContaining({
      op: 'upsert', id: 'entry-42',
    }));
  });

  it('серверный ERROR cannot_modify_approved → ok:false проброшен', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'cannot_modify_approved' });
    const res = await upsertEntry({ ...base, id: 'entry-appr' });
    expect(res).toEqual({ ok: false, error: 'cannot_modify_approved', validation: undefined, warnings: undefined });
  });

  it('серверный WARNING (переработка) проброшен в warnings', async () => {
    const warn = { level: 'warning', code: 'overtime_per_day', message: 'много' };
    mockPost.mockResolvedValueOnce({ ok: true, warnings: [warn] });
    const res = await upsertEntry(base);
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([warn]);
  });

  it('/s/ недоступна → fallback на прямой REST POST, ok:true', async () => {
    mockPost
      .mockRejectedValueOnce(new Error('404')) // /s/time-entry упал
      .mockResolvedValueOnce({});              // fallback POST /rest/
    const res = await upsertEntry(base);
    expect(res.ok).toBe(true);
    expect(mockPost).toHaveBeenLastCalledWith('/rest/credosTimeEntries', expect.objectContaining({
      date: '2026-06-15T10:00:00.000Z', employeeId: 'emp-1',
    }));
  });

  it('fallback с id → прямой REST PATCH', async () => {
    mockPost.mockRejectedValueOnce(new Error('500')); // /s/ упал
    mockPatch.mockResolvedValueOnce({});
    await upsertEntry({ ...base, id: 'entry-42' });
    expect(mockPatch).toHaveBeenCalledWith('/rest/credosTimeEntries/entry-42', expect.anything());
  });
});

// ─── deleteEntry (CISO-012: роутинг через /s/time-entry) ──────────────────

describe('deleteEntry', () => {
  it('удаляет через /s/time-entry op=delete', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    const res = await deleteEntry('entry-99');
    expect(res.ok).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/s/time-entry', expect.objectContaining({
      op: 'delete', id: 'entry-99',
    }));
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('серверный ERROR cannot_modify_approved → ok:false', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'cannot_modify_approved' });
    const res = await deleteEntry('entry-appr');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('cannot_modify_approved');
  });

  it('/s/ недоступна → fallback на прямой REST DELETE', async () => {
    mockPost.mockRejectedValueOnce(new Error('404'));
    mockDelete.mockResolvedValueOnce({});
    const res = await deleteEntry('entry-99');
    expect(res.ok).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('/rest/credosTimeEntries/entry-99');
  });
});
