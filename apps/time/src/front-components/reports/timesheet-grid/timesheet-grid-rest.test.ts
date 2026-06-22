import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTimesheetGrid, fetchTimesheetGridCsv } from './timesheet-grid-rest';

const mockPost = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost })),
}));

beforeEach(() => vi.clearAllMocks());

// Табель Т-13: POST /s/reports groupBy=timesheet-grid.
// CISO-007: ФИО только при revealEmployeeNames (бэк-зона), тест проверяет контракт.

const GRID_RESP = {
  ok: true,
  period: { from: '2026-06-01', to: '2026-06-30' },
  dates: ['2026-06-01', '2026-06-02'],
  withCodes: false,
  rows: [{ employeeId: 'e1', values: [8, 8] }],
};

describe('fetchTimesheetGrid — успешный ответ', () => {
  it('возвращает rows и dates', async () => {
    mockPost.mockResolvedValueOnce(GRID_RESP);
    const result = await fetchTimesheetGrid('2026-06-01', '2026-06-30');
    expect(result.ok).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.dates).toHaveLength(2);
  });

  it('POST body: groupBy=timesheet-grid + from/to', async () => {
    mockPost.mockResolvedValueOnce(GRID_RESP);
    await fetchTimesheetGrid('2026-06-01', '2026-06-30');
    expect(mockPost).toHaveBeenCalledWith('/s/reports', expect.objectContaining({
      groupBy: 'timesheet-grid',
      from: '2026-06-01',
      to: '2026-06-30',
    }));
  });

  it('deptId передаётся в body', async () => {
    mockPost.mockResolvedValueOnce(GRID_RESP);
    await fetchTimesheetGrid('2026-06-01', '2026-06-30', { deptId: 'd1' });
    expect(mockPost).toHaveBeenCalledWith('/s/reports', expect.objectContaining({ deptId: 'd1' }));
  });

  it('null deptId → не попадает в body', async () => {
    mockPost.mockResolvedValueOnce(GRID_RESP);
    await fetchTimesheetGrid('2026-06-01', '2026-06-30', { deptId: null });
    const body = mockPost.mock.calls[0][1];
    expect(body).not.toHaveProperty('deptId');
  });

  it('withCodes=true → codes:"true" в body', async () => {
    mockPost.mockResolvedValueOnce({ ...GRID_RESP, withCodes: true });
    await fetchTimesheetGrid('2026-06-01', '2026-06-30', { withCodes: true });
    expect(mockPost).toHaveBeenCalledWith('/s/reports', expect.objectContaining({ codes: 'true' }));
  });

  it('withCodes=false → нет поля codes в body', async () => {
    mockPost.mockResolvedValueOnce(GRID_RESP);
    await fetchTimesheetGrid('2026-06-01', '2026-06-30', { withCodes: false });
    const body = mockPost.mock.calls[0][1];
    expect(body).not.toHaveProperty('codes');
  });
});

describe('fetchTimesheetGrid — ошибки', () => {
  it('ok:false → ok=false + error', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'нет доступа' });
    const result = await fetchTimesheetGrid('2026-06-01', '2026-06-30');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('нет доступа');
    expect(result.rows).toEqual([]);
  });

  it('исключение → ok=false + error сообщение', async () => {
    mockPost.mockRejectedValueOnce(new Error('network'));
    const result = await fetchTimesheetGrid('2026-06-01', '2026-06-30');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('network');
  });
});

describe('fetchTimesheetGridCsv — успешный ответ', () => {
  it('возвращает csv и filename', async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      csv: 'ФИО;01.06;02.06\nИванов;8;8',
      filename: 'timesheet-t13_2026-06-01_2026-06-30.csv',
    });
    const result = await fetchTimesheetGridCsv('2026-06-01', '2026-06-30');
    expect(result.ok).toBe(true);
    expect(result.csv).toContain('ФИО');
    expect(result.filename).toBe('timesheet-t13_2026-06-01_2026-06-30.csv');
  });

  it('POST body: groupBy=timesheet-grid + format=csv', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, csv: 'x', filename: 'f.csv' });
    await fetchTimesheetGridCsv('2026-06-01', '2026-06-30');
    expect(mockPost).toHaveBeenCalledWith('/s/reports', expect.objectContaining({
      groupBy: 'timesheet-grid',
      format: 'csv',
    }));
  });

  it('ответ без filename → дефолтный filename из from/to', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, csv: 'data' });
    const result = await fetchTimesheetGridCsv('2026-06-01', '2026-06-30');
    expect(result.filename).toBe('timesheet-t13_2026-06-01_2026-06-30.csv');
  });

  it('ok:false → ok=false + error', async () => {
    mockPost.mockResolvedValueOnce({ ok: false, error: 'ошибка' });
    const result = await fetchTimesheetGridCsv('2026-06-01', '2026-06-30');
    expect(result.ok).toBe(false);
    expect(result.csv).toBe('');
  });

  it('исключение → ok=false + error', async () => {
    mockPost.mockRejectedValueOnce(new Error('fail'));
    const result = await fetchTimesheetGridCsv('2026-06-01', '2026-06-30');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('fail');
  });
});
