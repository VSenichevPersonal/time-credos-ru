import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPost = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost })),
}));

import { fetchTimeseries } from './trend-rest';

const FROM = '2026-01-01T00:00:00.000Z';
const TO = '2026-12-31T23:59:59.999Z';

const okResp = (overrides = {}) => ({
  ok: true,
  period: { from: FROM, to: TO },
  departmentId: null,
  months: [{ month: '2026-01', fact: 100, client: 60, norm: 160, util: 0.6, under: 60 }],
  ...overrides,
});

beforeEach(() => mockPost.mockReset());

describe('fetchTimeseries — ok', () => {
  it('успешный ответ → как есть', async () => {
    mockPost.mockResolvedValueOnce(okResp());
    const r = await fetchTimeseries(FROM, TO, null);
    expect(r.ok).toBe(true);
    expect(r.months).toHaveLength(1);
    expect(r.months[0].util).toBe(0.6);
  });

  it('POST mode=timeseries без departmentId когда фильтра нет', async () => {
    mockPost.mockResolvedValueOnce(okResp());
    await fetchTimeseries(FROM, TO, null);
    expect(mockPost).toHaveBeenCalledWith('/s/reports', { from: FROM, to: TO, mode: 'timeseries' });
  });

  it('POST добавляет departmentId когда фильтр задан', async () => {
    mockPost.mockResolvedValueOnce(okResp({ departmentId: 'd-1' }));
    await fetchTimeseries(FROM, TO, 'd-1');
    expect(mockPost).toHaveBeenCalledWith('/s/reports', {
      from: FROM,
      to: TO,
      mode: 'timeseries',
      departmentId: 'd-1',
    });
  });

  it('ответ без months → нормализуется в []', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, period: { from: FROM, to: TO }, departmentId: null });
    const r = await fetchTimeseries(FROM, TO, null);
    expect(r.months).toEqual([]);
  });
});

describe('fetchTimeseries — ошибки', () => {
  it('ok=false → EMPTY с error из ответа', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'Нет данных' });
    const r = await fetchTimeseries(FROM, TO, null);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Нет данных');
    expect(r.months).toEqual([]);
  });

  it('ok=false без error → дефолт', async () => {
    mockPost.mockResolvedValueOnce({ ok: false });
    const r = await fetchTimeseries(FROM, TO, null);
    expect(r.error).toBe('Сервис тренда недоступен');
  });

  it('resp=null → EMPTY', async () => {
    mockPost.mockResolvedValueOnce(null);
    const r = await fetchTimeseries(FROM, TO, null);
    expect(r.ok).toBe(false);
  });

  it('throw Error → EMPTY с message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network'));
    const r = await fetchTimeseries(FROM, TO, null);
    expect(r.error).toBe('Network');
  });

  it('throw не-Error → generic', async () => {
    mockPost.mockRejectedValueOnce('строка');
    const r = await fetchTimeseries(FROM, TO, null);
    expect(r.error).toBe('Ошибка загрузки тренда');
  });
});
