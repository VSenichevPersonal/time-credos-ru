import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPost = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost })),
}));

import { fetchReports, fetchDetailCsv } from './reports-rest';

const FROM = '2026-06-01T00:00:00.000Z';
const TO = '2026-06-30T23:59:59.999Z';

const okResp = (overrides = {}) => ({
  ok: true,
  period: { from: FROM, to: TO },
  groupBy: 'dept',
  totals: { key: 'total', name: '', fact: 100, client: 60, norm: 160, util: 0.6, under: 60, byCategory: [] },
  byDept: [], byProject: [], byEmployee: [],
  ...overrides,
});

beforeEach(() => mockPost.mockReset());

describe('fetchReports — ok', () => {
  it('успешный ответ → возвращает как есть', async () => {
    const resp = okResp();
    mockPost.mockResolvedValueOnce(resp);
    const result = await fetchReports(FROM, TO, 'dept');
    expect(result.ok).toBe(true);
    expect(result.totals.fact).toBe(100);
  });

  it('POST с правильными параметрами', async () => {
    mockPost.mockResolvedValueOnce(okResp());
    await fetchReports(FROM, TO, 'employee');
    expect(mockPost).toHaveBeenCalledWith('/s/reports', {
      from: FROM, to: TO, groupBy: 'employee',
    });
  });
});

describe('fetchReports — ошибка сервера (ok=false)', () => {
  it('resp.ok=false → EMPTY с error из ответа', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'Нет данных' });
    const result = await fetchReports(FROM, TO, 'dept');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Нет данных');
    expect(result.period).toEqual({ from: FROM, to: TO });
  });

  it('resp.ok=false без error → дефолтное сообщение', async () => {
    mockPost.mockResolvedValueOnce({ ok: false });
    const result = await fetchReports(FROM, TO, 'dept');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Сервис отчётов недоступен');
  });

  it('resp=null → EMPTY с дефолтным сообщением', async () => {
    mockPost.mockResolvedValueOnce(null);
    const result = await fetchReports(FROM, TO, 'dept');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Сервис отчётов недоступен');
  });
});

describe('fetchReports — исключение (сеть)', () => {
  it('throw Error → EMPTY с message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network timeout'));
    const result = await fetchReports(FROM, TO, 'project');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network timeout');
    expect(result.groupBy).toBeNull();
    expect(result.byDept).toEqual([]);
  });

  it('throw не-Error → EMPTY с generic', async () => {
    mockPost.mockRejectedValueOnce('строка-ошибки');
    const result = await fetchReports(FROM, TO, 'project');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Ошибка загрузки отчёта');
  });
});

describe('fetchReports — EMPTY структура', () => {
  it('EMPTY содержит totals с нулями и пустые массивы', async () => {
    mockPost.mockRejectedValueOnce(new Error('x'));
    const result = await fetchReports(FROM, TO, 'dept');
    expect(result.totals.fact).toBe(0);
    expect(result.totals.byCategory).toEqual([]);
    expect(result.byDept).toEqual([]);
    expect(result.byProject).toEqual([]);
    expect(result.byEmployee).toEqual([]);
  });
});

// F-F (REQ-0006): экспорт detail-CSV.
describe('fetchDetailCsv', () => {
  const csvResp = (overrides = {}) => ({
    ok: true,
    csv: '﻿Дата;Часы\r\n2026-06-01;8',
    mimeType: 'text/csv;charset=utf-8',
    filename: 'timesheet-detail_2026-06-01_2026-06-30.csv',
    ...overrides,
  });

  it('POST groupBy=detail + format=csv, без пустых фильтров', async () => {
    mockPost.mockResolvedValueOnce(csvResp());
    await fetchDetailCsv(FROM, TO);
    expect(mockPost).toHaveBeenCalledWith('/s/reports', {
      from: FROM,
      to: TO,
      groupBy: 'detail',
      format: 'csv',
    });
  });

  it('добавляет drill-фильтры (только заданные)', async () => {
    mockPost.mockResolvedValueOnce(csvResp());
    await fetchDetailCsv(FROM, TO, { deptId: 'd1', projectId: null, employeeId: 'e9' });
    expect(mockPost).toHaveBeenCalledWith('/s/reports', {
      from: FROM,
      to: TO,
      groupBy: 'detail',
      format: 'csv',
      deptId: 'd1',
      employeeId: 'e9',
    });
  });

  it('успешный ответ → ok + csv/mimeType/filename', async () => {
    mockPost.mockResolvedValueOnce(csvResp());
    const res = await fetchDetailCsv(FROM, TO);
    expect(res.ok).toBe(true);
    expect(res.csv.startsWith('﻿')).toBe(true);
    expect(res.filename).toContain('.csv');
  });

  it('ответ без csv-строки → ошибка', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    const res = await fetchDetailCsv(FROM, TO);
    expect(res.ok).toBe(false);
    expect(res.csv).toBe('');
  });

  it('ok=false → ошибка с сообщением сервера', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'Нет записей' });
    const res = await fetchDetailCsv(FROM, TO);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Нет записей');
  });

  it('исключение сети → ошибка', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network'));
    const res = await fetchDetailCsv(FROM, TO);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Network');
  });

  it('filename fallback при отсутствии в ответе', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, csv: 'a;b' });
    const res = await fetchDetailCsv('2026-06-01', '2026-06-30');
    expect(res.ok).toBe(true);
    expect(res.filename).toBe('timesheet-detail_2026-06-01_2026-06-30.csv');
  });
});
