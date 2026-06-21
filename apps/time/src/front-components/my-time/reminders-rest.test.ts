import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPost = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost })),
}));

import { fetchReminders } from './reminders-rest';

beforeEach(() => { mockPost.mockReset(); });

const okResp = (): import('./reminders-rest').RemindersResponse => ({
  ok: true,
  enabled: true,
  reminderDayOfWeek: 'FRIDAY',
  week: { from: '2026-06-16', to: '2026-06-22' },
  threshold: 40,
  total: 2,
  rows: [
    { employeeId: 'e1', name: '', deptCode: 'OPIB', norm: 40, fact: 32, under: 8 },
    { employeeId: 'e2', name: '', deptCode: 'OPIB', norm: 40, fact: 0, under: 40 },
  ],
});

describe('fetchReminders', () => {
  it('ok=true → возвращает полный ответ', async () => {
    mockPost.mockResolvedValueOnce(okResp());
    const res = await fetchReminders();
    expect(res.ok).toBe(true);
    expect(res.enabled).toBe(true);
    expect(res.rows).toHaveLength(2);
    expect(res.total).toBe(2);
  });

  it('POST-тело содержит mode=missing-timesheets', async () => {
    mockPost.mockResolvedValueOnce(okResp());
    await fetchReminders();
    expect(mockPost).toHaveBeenCalledWith('/s/reminders', { mode: 'missing-timesheets' });
  });

  it('ok=false + error → EMPTY с error из ответа', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'Сервис недоступен' });
    const res = await fetchReminders();
    expect(res.ok).toBe(false);
    expect(res.rows).toEqual([]);
    expect(res.error).toBe('Сервис недоступен');
  });

  it('ok=false без error → дефолтное сообщение', async () => {
    mockPost.mockResolvedValueOnce({ ok: false });
    const res = await fetchReminders();
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('resp=null → EMPTY', async () => {
    mockPost.mockResolvedValueOnce(null);
    const res = await fetchReminders();
    expect(res.ok).toBe(false);
    expect(res.total).toBe(0);
  });

  it('throw Error → EMPTY с message', async () => {
    mockPost.mockRejectedValueOnce(new Error('network'));
    const res = await fetchReminders();
    expect(res.ok).toBe(false);
    expect(res.error).toBe('network');
  });

  it('throw не-Error → EMPTY с дефолтом', async () => {
    mockPost.mockRejectedValueOnce('timeout');
    const res = await fetchReminders();
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });
});
