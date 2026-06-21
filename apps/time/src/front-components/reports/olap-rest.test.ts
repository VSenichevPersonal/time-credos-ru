import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPost = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost })),
}));

import { fetchOlap } from './olap-rest';
import type { OlapResponse } from './olap-types';

const FROM = '2026-06-01';
const TO = '2026-06-30';

const okResp = (over: Partial<OlapResponse> = {}): OlapResponse => ({
  ok: true,
  period: { from: FROM, to: TO },
  groupBy: 'dept',
  appliedFilters: [],
  totals: { key: 'total', name: 'Итого', fact: 100, client: 80, norm: 160, util: 0.5, under: 60, byCategory: [] },
  rows: [{ key: 'd1', name: 'ОПИБ', fact: 100, client: 80, norm: 160, util: 0.5, under: 60, byCategory: [], drillable: ['project'] }],
  pageInfo: { hasNextPage: false, endCursor: null },
  availableDims: ['dept', 'project', 'employee'],
  ...over,
});

beforeEach(() => mockPost.mockReset());

describe('fetchOlap — ok', () => {
  it('успешный ответ → возвращает данные', async () => {
    mockPost.mockResolvedValueOnce(okResp());
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.ok).toBe(true);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].drillable).toEqual(['project']);
  });

  it('POST с правильным телом (mode=olap)', async () => {
    mockPost.mockResolvedValueOnce(okResp());
    await fetchOlap(FROM, TO, 'employee', [{ dim: 'dept', value: 'd1' }]);
    expect(mockPost).toHaveBeenCalledWith('/s/reports', {
      from: FROM, to: TO, mode: 'olap', groupBy: 'employee',
      filters: [{ dim: 'dept', value: 'd1' }],
    });
  });

  it('rows без drillable → нормализуется в []', async () => {
    mockPost.mockResolvedValueOnce(okResp({
      rows: [{ key: 'r1', name: 'X', fact: 0, client: 0, norm: null, util: null, under: null, byCategory: [] } as any],
    }));
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.rows[0].drillable).toEqual([]);
  });

  it('appliedFilters/availableDims отсутствуют в resp → нормализуются в []', async () => {
    const partial = { ...okResp() };
    delete (partial as any).appliedFilters;
    delete (partial as any).availableDims;
    mockPost.mockResolvedValueOnce(partial);
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.appliedFilters).toEqual([]);
    expect(res.availableDims).toEqual([]);
  });
});

describe('fetchOlap — ошибки', () => {
  it('ok=false → EMPTY с error из ответа', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'доступ запрещён' });
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('доступ запрещён');
    expect(res.rows).toEqual([]);
  });

  it('ok=false без error → дефолт сообщение', async () => {
    mockPost.mockResolvedValueOnce({ ok: false });
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('resp=null → EMPTY', async () => {
    mockPost.mockResolvedValueOnce(null);
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.ok).toBe(false);
  });

  it('throw Error → EMPTY с message', async () => {
    mockPost.mockRejectedValueOnce(new Error('timeout'));
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('timeout');
  });

  it('throw не-Error → generic message', async () => {
    mockPost.mockRejectedValueOnce('boom');
    const res = await fetchOlap(FROM, TO, 'dept', []);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Ошибка загрузки отчёта');
  });
});
