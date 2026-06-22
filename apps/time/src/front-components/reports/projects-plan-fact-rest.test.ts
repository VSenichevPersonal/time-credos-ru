import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchProjectsPlanFact } from './projects-plan-fact-rest';

const mockPost = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost })),
}));

beforeEach(() => vi.clearAllMocks());

// «Проекты — план/факт/остаток» POST /s/reports groupBy=projects-plan-fact.

const OK_RESP = {
  ok: true,
  period: { from: '2026-01-01', to: '2026-03-31' },
  totals: { planned: 400, fact: 360, remaining: 40, overrunCount: 1 },
  count: 2,
  rows: [
    { projectId: 'p1', planned: 200, fact: 210, remaining: -10, overrun: true },
    { projectId: 'p2', planned: 200, fact: 150, remaining: 50, overrun: false },
  ],
};

describe('fetchProjectsPlanFact — успешный ответ', () => {
  it('возвращает rows и totals из ответа', async () => {
    mockPost.mockResolvedValueOnce(OK_RESP);
    const result = await fetchProjectsPlanFact('2026-01-01', '2026-03-31');
    expect(result.ok).toBe(true);
    expect(result.rows).toHaveLength(2);
    expect(result.totals.planned).toBe(400);
  });

  it('POST body: groupBy=projects-plan-fact + from/to', async () => {
    mockPost.mockResolvedValueOnce(OK_RESP);
    await fetchProjectsPlanFact('2026-01-01', '2026-03-31');
    expect(mockPost).toHaveBeenCalledWith('/s/reports', expect.objectContaining({
      groupBy: 'projects-plan-fact',
      from: '2026-01-01',
      to: '2026-03-31',
    }));
  });

  it('фильтр status передаётся в body', async () => {
    mockPost.mockResolvedValueOnce(OK_RESP);
    await fetchProjectsPlanFact('2026-01-01', '2026-03-31', { status: 'IN_PROGRESS' });
    expect(mockPost).toHaveBeenCalledWith('/s/reports', expect.objectContaining({ status: 'IN_PROGRESS' }));
  });

  it('null status → не попадает в body', async () => {
    mockPost.mockResolvedValueOnce(OK_RESP);
    await fetchProjectsPlanFact('2026-01-01', '2026-03-31', { status: null });
    const body = mockPost.mock.calls[0][1];
    expect(body).not.toHaveProperty('status');
  });

  it('departmentId передаётся в body', async () => {
    mockPost.mockResolvedValueOnce(OK_RESP);
    await fetchProjectsPlanFact('2026-01-01', '2026-03-31', { departmentId: 'd1' });
    expect(mockPost).toHaveBeenCalledWith('/s/reports', expect.objectContaining({ departmentId: 'd1' }));
  });

  it('ответ без rows → rows = []', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, period: { from: '2026-01-01', to: '2026-03-31' } });
    const result = await fetchProjectsPlanFact('2026-01-01', '2026-03-31');
    expect(result.rows).toEqual([]);
  });

  it('ответ без totals → нулевые totals', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, period: { from: '2026-01-01', to: '2026-03-31' }, rows: [] });
    const result = await fetchProjectsPlanFact('2026-01-01', '2026-03-31');
    expect(result.totals).toEqual({ planned: 0, fact: 0, remaining: 0, overrunCount: 0 });
  });
});

describe('fetchProjectsPlanFact — ошибки', () => {
  it('ok:false → ok=false + error из ответа', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'нет данных' });
    const result = await fetchProjectsPlanFact('2026-01-01', '2026-03-31');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('нет данных');
    expect(result.rows).toEqual([]);
  });

  it('ok:false без error → дефолтное сообщение', async () => {
    mockPost.mockResolvedValueOnce({ ok: false });
    const result = await fetchProjectsPlanFact('2026-01-01', '2026-03-31');
    expect(result.error).toBeTruthy();
    expect(result.ok).toBe(false);
  });

  it('исключение сети → ok=false + error', async () => {
    mockPost.mockRejectedValueOnce(new Error('timeout'));
    const result = await fetchProjectsPlanFact('2026-01-01', '2026-03-31');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('timeout');
  });
});
