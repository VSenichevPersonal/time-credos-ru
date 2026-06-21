import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchPlanSlots, savePlanSlots } from './plan-slots-rest';

// WI-47: клиент к /s/plan-slots (POST mode:read / mode:upsert).

const mockPost = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost })),
}));

beforeEach(() => vi.clearAllMocks());

describe('fetchPlanSlots', () => {
  it('возвращает слоты из ответа ok:true', async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      slots: [
        { periodMonth: '2026-01', plannedHours: 80, departmentId: 'd1' },
        { periodMonth: '2026-02', plannedHours: 40, departmentId: null },
      ],
    });
    const result = await fetchPlanSlots('p1');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ periodMonth: '2026-01', plannedHours: 80, departmentId: 'd1', employeeId: null });
    expect(result[1]).toEqual({ periodMonth: '2026-02', plannedHours: 40, departmentId: null, employeeId: null });
  });

  it('шлёт POST mode:read с projectId', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, slots: [] });
    await fetchPlanSlots('proj-42');
    expect(mockPost).toHaveBeenCalledWith('/s/plan-slots', { mode: 'read', projectId: 'proj-42' });
  });

  it('фильтрует слоты без periodMonth', async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      slots: [
        { periodMonth: null, plannedHours: 80 },
        { periodMonth: '2026-03', plannedHours: 60 },
      ],
    });
    const result = await fetchPlanSlots('p1');
    expect(result).toHaveLength(1);
    expect(result[0].periodMonth).toBe('2026-03');
  });

  it('plannedHours null → 0', async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      slots: [{ periodMonth: '2026-04', plannedHours: null }],
    });
    const [s] = await fetchPlanSlots('p1');
    expect(s.plannedHours).toBe(0);
  });

  it('несёт employeeId персонального слота (план на человека)', async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      slots: [
        { periodMonth: '2026-01', plannedHours: 80, departmentId: 'd1', employeeId: 'e1' },
        { periodMonth: '2026-01', plannedHours: 20, departmentId: 'd1', employeeId: null },
      ],
    });
    const result = await fetchPlanSlots('p1');
    expect(result[0].employeeId).toBe('e1'); // персональный
    expect(result[1].employeeId).toBe(null); // отдельский
  });

  it('ok:false → бросает ошибку с сообщением', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'не авторизован' });
    await expect(fetchPlanSlots('p1')).rejects.toThrow('не авторизован');
  });

  it('ok:false без error → дефолтное сообщение', async () => {
    mockPost.mockResolvedValueOnce({ ok: false });
    await expect(fetchPlanSlots('p1')).rejects.toThrow('Сервис слотов плана недоступен');
  });
});

describe('savePlanSlots', () => {
  it('возвращает true при ok:true', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    const result = await savePlanSlots('p1', [{ periodMonth: '2026-01', plannedHours: 80 }]);
    expect(result).toBe(true);
  });

  it('шлёт POST mode:upsert с projectId и слотами', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await savePlanSlots('proj-7', [
      { periodMonth: '2026-05', plannedHours: 40, departmentId: 'd1' },
    ]);
    expect(mockPost).toHaveBeenCalledWith('/s/plan-slots', {
      mode: 'upsert',
      projectId: 'proj-7',
      slots: [{ periodMonth: '2026-05', plannedHours: 40, departmentId: 'd1' }],
    });
  });

  it('departmentId null → undefined (не шлём пустое поле)', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await savePlanSlots('p1', [{ periodMonth: '2026-06', plannedHours: 20, departmentId: null }]);
    const sent = mockPost.mock.calls[0][1];
    expect(sent.slots[0].departmentId).toBeUndefined();
  });

  it('шлёт employeeId персонального слота в upsert', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await savePlanSlots('proj-9', [
      { periodMonth: '2026-07', plannedHours: 40, departmentId: 'd1', employeeId: 'e1' },
    ]);
    const sent = mockPost.mock.calls[0][1];
    expect(sent.slots[0].employeeId).toBe('e1');
    expect(sent.slots[0].departmentId).toBe('d1');
  });

  it('employeeId null → undefined (отдельский слот, не шлём пустое поле)', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await savePlanSlots('p1', [{ periodMonth: '2026-08', plannedHours: 10, employeeId: null }]);
    const sent = mockPost.mock.calls[0][1];
    expect(sent.slots[0].employeeId).toBeUndefined();
  });

  it('ok:false → бросает ошибку', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'timeout' });
    await expect(savePlanSlots('p1', [])).rejects.toThrow('timeout');
  });
});
