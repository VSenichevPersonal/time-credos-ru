import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockPatch = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet, patch: mockPatch })),
}));

import {
  fetchDeptSettings,
  fetchGlobalSettings,
  fetchHeadcounts,
  patchDept,
  patchGlobalSettings,
} from './settings-rest';

const deptResp = (rows: object[]) => ({ data: { credosTimeDepartments: rows } });
const empResp = (rows: object[]) => ({ data: { credosTimeEmployees: rows } });
const globalResp = (rows: object[]) => ({ data: { credosTimeSettings: rows } });

beforeEach(() => {
  mockGet.mockReset();
  mockPatch.mockReset();
});

// ─── fetchDeptSettings ────────────────────────────────────────────────────

describe('fetchDeptSettings', () => {
  it('возвращает список с дефолтами для null-полей', async () => {
    mockGet.mockResolvedValueOnce(deptResp([
      { id: 'd1', name: 'ОПИБ', code: 'OPIB', approvalRequired: null, capacityFactor: null },
    ]));
    const result = await fetchDeptSettings();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'd1', name: 'ОПИБ', code: 'OPIB',
      approvalRequired: false,  // null → false
      capacityFactor: 0.8,      // null → 0.8
    });
  });

  it('сохраняет явные значения (approvalRequired=true, capacityFactor=1.0)', async () => {
    mockGet.mockResolvedValueOnce(deptResp([
      { id: 'd2', name: 'Маркетинг', code: null, approvalRequired: true, capacityFactor: 1.0 },
    ]));
    const [d] = await fetchDeptSettings();
    expect(d.approvalRequired).toBe(true);
    expect(d.capacityFactor).toBe(1.0);
    expect(d.code).toBeNull();
  });

  it('пустой ответ → пустой массив', async () => {
    mockGet.mockResolvedValueOnce(deptResp([]));
    expect(await fetchDeptSettings()).toEqual([]);
  });

  it('запрашивает с limit=50 и orderBy name', async () => {
    mockGet.mockResolvedValueOnce(deptResp([]));
    await fetchDeptSettings();
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeDepartments',
      expect.objectContaining({ query: expect.objectContaining({ limit: '50' }) }),
    );
  });
});

// ─── fetchHeadcounts ──────────────────────────────────────────────────────

describe('fetchHeadcounts', () => {
  it('группирует сотрудников по departmentId', async () => {
    mockGet.mockResolvedValueOnce(empResp([
      { departmentId: 'd1' },
      { departmentId: 'd1' },
      { departmentId: 'd2' },
    ]));
    const counts = await fetchHeadcounts();
    expect(counts).toEqual({ d1: 2, d2: 1 });
  });

  it('сотрудник без departmentId → не считается', async () => {
    mockGet.mockResolvedValueOnce(empResp([
      { departmentId: null },
      { departmentId: 'd1' },
    ]));
    const counts = await fetchHeadcounts();
    expect(counts).toEqual({ d1: 1 });
  });

  it('пустой список → {}', async () => {
    mockGet.mockResolvedValueOnce(empResp([]));
    expect(await fetchHeadcounts()).toEqual({});
  });

  it('фильтрует только активных (filter=active[eq]:true)', async () => {
    mockGet.mockResolvedValueOnce(empResp([]));
    await fetchHeadcounts();
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeEmployees',
      expect.objectContaining({ query: expect.objectContaining({ filter: 'active[eq]:true' }) }),
    );
  });
});

// ─── fetchGlobalSettings ─────────────────────────────────────────────────

describe('fetchGlobalSettings', () => {
  it('маппит все поля с явными значениями', async () => {
    mockGet.mockResolvedValueOnce(globalResp([{
      id: 'gs1', normHoursPerDay: 7, fillTemplateHours: 6, overtimeWarnHours: 10,
      weekStartsOn: 'MONDAY', planningHorizonWeeks: 8, defaultCapacityFactor: 0.9,
      tentativeBookingEnabled: false, defaultApprovalRequired: true,
      approvalPeriod: 'MONTH', reminderEnabled: true, reminderDayOfWeek: 'THURSDAY',
      revealEmployeeNames: true,
    }]));
    const res = await fetchGlobalSettings();
    expect(res).not.toBeNull();
    expect(res!.normHoursPerDay).toBe(7);
    expect(res!.revealEmployeeNames).toBe(true);
    expect(res!.defaultApprovalRequired).toBe(true);
  });

  it('null-поля → дефолты GLOBAL_FALLBACK', async () => {
    mockGet.mockResolvedValueOnce(globalResp([{
      id: 'gs1', normHoursPerDay: null, tentativeBookingEnabled: null, weekStartsOn: null,
    }]));
    const res = await fetchGlobalSettings();
    expect(res!.normHoursPerDay).toBe(8);
    expect(res!.tentativeBookingEnabled).toBe(true);
    expect(res!.weekStartsOn).toBe('MONDAY');
    expect(res!.maxHoursPerDay).toBe(24); // лимит часов/день → дефолт
  });

  it('пустой список (сид не прошёл) → null', async () => {
    mockGet.mockResolvedValueOnce(globalResp([]));
    expect(await fetchGlobalSettings()).toBeNull();
  });

  it('запрашивает с limit=1', async () => {
    mockGet.mockResolvedValueOnce(globalResp([]));
    await fetchGlobalSettings();
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeSettings',
      expect.objectContaining({ query: { limit: '1' } }),
    );
  });
});

// ─── patchGlobalSettings ─────────────────────────────────────────────────

describe('patchGlobalSettings', () => {
  it('вызывает PATCH с правильным URL и телом', async () => {
    mockPatch.mockResolvedValueOnce({});
    await patchGlobalSettings('gs1', { normHoursPerDay: 7 });
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeSettings/gs1',
      { normHoursPerDay: 7 },
    );
  });

  it('partial patch — несколько полей', async () => {
    mockPatch.mockResolvedValueOnce({});
    await patchGlobalSettings('gs1', { reminderEnabled: true, reminderDayOfWeek: 'FRIDAY' });
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeSettings/gs1',
      { reminderEnabled: true, reminderDayOfWeek: 'FRIDAY' },
    );
  });
});

// ─── patchDept ────────────────────────────────────────────────────────────

describe('patchDept', () => {
  it('вызывает PATCH с правильным URL и телом', async () => {
    mockPatch.mockResolvedValueOnce({});
    await patchDept('dept-42', { approvalRequired: true });
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeDepartments/dept-42',
      { approvalRequired: true },
    );
  });

  it('partial patch — только одно поле', async () => {
    mockPatch.mockResolvedValueOnce({});
    await patchDept('dept-1', { capacityFactor: 0.9 });
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeDepartments/dept-1',
      { capacityFactor: 0.9 },
    );
  });
});
