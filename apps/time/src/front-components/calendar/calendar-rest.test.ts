import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet })),
}));

import { fetchCalendarYear } from './calendar-rest';

const KEY = 'credosTimeWorkdayCalendars';

const page = (rows: object[], hasNextPage = false, endCursor?: string) => ({
  data: { [KEY]: rows },
  pageInfo: { hasNextPage, endCursor: endCursor ?? null },
});

beforeEach(() => mockGet.mockReset());

describe('fetchCalendarYear — базовый', () => {
  it('возвращает дни с дефолтами (null dayType → WORKDAY, null hours → 0)', async () => {
    mockGet.mockResolvedValueOnce(page([
      { date: '2026-01-01', dayType: null, hours: null },
      { date: '2026-01-02', dayType: 'HOLIDAY', hours: 0 },
    ]));
    const result = await fetchCalendarYear(2026);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-01-01', dayType: 'WORKDAY', hours: 0 });
    expect(result[1]).toEqual({ date: '2026-01-02', dayType: 'HOLIDAY', hours: 0 });
  });

  it('запрашивает с filter на год и orderBy date', async () => {
    mockGet.mockResolvedValueOnce(page([]));
    await fetchCalendarYear(2025);
    expect(mockGet).toHaveBeenCalledWith(
      '/rest/credosTimeWorkdayCalendars',
      expect.objectContaining({
        query: expect.objectContaining({
          filter: 'date[gte]:2025-01-01,date[lte]:2025-12-31',
          orderBy: 'date[AscNullsFirst]',
        }),
      }),
    );
  });

  it('пустой ответ → пустой массив', async () => {
    mockGet.mockResolvedValueOnce(page([]));
    expect(await fetchCalendarYear(2026)).toEqual([]);
  });

  it('date обрезается до 10 символов (ISO slice)', async () => {
    mockGet.mockResolvedValueOnce(page([
      { date: '2026-03-08T00:00:00.000Z', dayType: 'WORKDAY', hours: 8 },
    ]));
    const [d] = await fetchCalendarYear(2026);
    expect(d.date).toBe('2026-03-08');
  });
});

describe('fetchCalendarYear — пагинация', () => {
  it('одна страница без hasNextPage → один запрос', async () => {
    mockGet.mockResolvedValueOnce(page([{ date: '2026-01-01', dayType: 'WORKDAY', hours: 8 }], false));
    await fetchCalendarYear(2026);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('две страницы: второй запрос передаёт cursor', async () => {
    // Страница 1: 60 строк, hasNextPage=true
    const rows60 = Array.from({ length: 60 }, (_, i) => ({
      date: `2026-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
      dayType: 'WORKDAY', hours: 8,
    }));
    mockGet
      .mockResolvedValueOnce(page(rows60, true, 'cursor-abc'))
      .mockResolvedValueOnce(page([{ date: '2026-03-01', dayType: 'HOLIDAY', hours: 0 }], false));

    const result = await fetchCalendarYear(2026);
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenNthCalledWith(
      2,
      '/rest/credosTimeWorkdayCalendars',
      expect.objectContaining({
        query: expect.objectContaining({ starting_after: 'cursor-abc' }),
      }),
    );
    expect(result).toHaveLength(61);
  });

  it('страница без cursor (endCursor=null) → стоп даже если hasNextPage=true', async () => {
    const rows60 = Array.from({ length: 60 }, () => ({ date: '2026-01-01', dayType: 'WORKDAY', hours: 8 }));
    mockGet.mockResolvedValueOnce(page(rows60, true, null));
    await fetchCalendarYear(2026);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
