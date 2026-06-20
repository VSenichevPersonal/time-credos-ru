import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import reportsDef from './reports.logic';

const handler = (
  reportsDef as unknown as { config: { handler: (event: unknown) => Promise<unknown> } }
).config.handler;

const event = (body: Record<string, unknown> = {}, qs: Record<string, string> = {}) => ({
  headers: {},
  queryStringParameters: qs,
  pathParameters: {},
  body,
  isBase64Encoded: false,
  requestContext: { http: { method: 'POST', path: '/reports' } },
  userWorkspaceId: null,
});

// Возвращает n одинаковых fetch-ответов для restGetAll (пустые данные).
const emptyPage = (plural: string) => ({
  data: { [plural]: [] },
  pageInfo: { hasNextPage: false, endCursor: null },
});

// 7 параллельных restGetAll в run(): entries, projects, employees, departments, calendar, absences, workTypes
const ALL_PLURALS = [
  'credosTimeEntries',
  'credosTimeProjects',
  'credosTimeEmployees',
  'credosTimeDepartments',
  'credosTimeWorkdayCalendars',
  'credosTimeAbsences',
  'credosTimeWorkTypes',
  'credosTimeEmployeeDepartments', // REQ-0011 FTE-назначения
];

const mockFetch = (responses: unknown[]) => {
  let i = 0;
  return vi.fn().mockImplementation(() => {
    const data = responses[i++] ?? {};
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(''),
    });
  });
};

const allEmpty = () => ALL_PLURALS.map((p) => emptyPage(p));

beforeEach(() => {
  vi.stubEnv('TWENTY_API_URL', 'http://test');
  vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('reports.logic — базовый handler (computeReports)', () => {
  it('пустые данные → ok:true, byDept/byProject/byEmployee пустые', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event()) as Record<string, unknown>;
    expect(result).toMatchObject({
      ok: true,
      byDept: [],
      byProject: [],
      byEmployee: [],
    });
  });

  it('возвращает period.from/period.to по умолчанию', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event()) as Record<string, unknown>;
    const period = result.period as { from: string; to: string };
    expect(period.from).toBe('1970-01-01T00:00:00.000Z');
    expect(period.to).toBe('2999-12-31T23:59:59.999Z');
  });

  it('from/to из body передаются в period', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ from: '2026-06-01', to: '2026-06-30' })) as Record<string, unknown>;
    const period = result.period as { from: string; to: string };
    expect(period.from).toBe('2026-06-01');
    expect(period.to).toBe('2026-06-30');
  });

  it('groupBy пробрасывается в ответ без OLAP', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ groupBy: 'dept' })) as Record<string, unknown>;
    expect(result).toMatchObject({ groupBy: 'dept' });
    // без mode=olap → старый 3-срезовый (byDept присутствует)
    expect(result).toHaveProperty('byDept');
  });

  it('totals — объект с fact/client/norm/util/under', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event()) as Record<string, unknown>;
    expect(result.totals).toMatchObject({
      fact: expect.any(Number),
      client: expect.any(Number),
    });
  });
});

describe('reports.logic — CISO-006: validDateParam', () => {
  it('невалидная from → ok:false, error invalid date parameter', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty())); // fetch не должен дойти
    const result = await handler(event({ from: 'date[gte]:x', to: '2026-06-30' }));
    expect(result).toMatchObject({ ok: false, error: 'invalid date parameter' });
  });

  it('невалидная to → ok:false', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ from: '2026-06-01', to: 'evil,string' }));
    expect(result).toMatchObject({ ok: false, error: 'invalid date parameter' });
  });

  it('пустая from → дефолт (нет ошибки)', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ from: '', to: '2026-06-30' })) as Record<string, unknown>;
    expect(result).toMatchObject({ ok: true });
    const period = result.period as { from: string };
    expect(period.from).toBe('1970-01-01T00:00:00.000Z');
  });

  it('from/to отсутствуют → ok:true (дефолты)', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event());
    expect(result).toMatchObject({ ok: true });
  });
});

describe('reports.logic — mode=olap', () => {
  it('mode=olap + groupBy=dept → computeOlap (нет byDept/byProject/byEmployee)', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ mode: 'olap', groupBy: 'dept' })) as Record<string, unknown>;
    // computeOlap возвращает rows, availableDims — не byDept/byProject/byEmployee
    expect(result).not.toHaveProperty('byDept');
    expect(result).toHaveProperty('rows');
  });

  it('mode=olap + groupBy=employee → rows', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ mode: 'olap', groupBy: 'employee' })) as Record<string, unknown>;
    expect(result).toHaveProperty('rows');
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it('mode=olap + groupBy=project → rows', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ mode: 'olap', groupBy: 'project' })) as Record<string, unknown>;
    expect(result).toHaveProperty('rows');
  });

  it('mode=olap без groupBy → computeReports (byDept присутствует)', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ mode: 'olap' })) as Record<string, unknown>;
    // groupBy отсутствует/невалиден → readOlap возвращает null → старый режим
    expect(result).toHaveProperty('byDept');
  });

  it('mode=olap + невалидный groupBy → computeReports', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({ mode: 'olap', groupBy: 'evil' })) as Record<string, unknown>;
    expect(result).toHaveProperty('byDept');
  });

  it('mode=olap + filters в body → rows (фильтры не ломают парсинг)', async () => {
    vi.stubGlobal('fetch', mockFetch(allEmpty()));
    const result = await handler(event({
      mode: 'olap',
      groupBy: 'dept',
      filters: [{ dim: 'dept', value: 'some-dept-id' }],
    })) as Record<string, unknown>;
    expect(result).toHaveProperty('rows');
  });
});

describe('reports.logic — restGetAll пагинация', () => {
  it('одна страница (hasNextPage=false) → все записи за 1 запрос', async () => {
    const page1 = {
      data: { credosTimeEntries: [{ id: 'e1', date: '2026-06-01', hours: 8, projectId: null, employeeId: null, workTypeId: null, tags: [] }] },
      pageInfo: { hasNextPage: false, endCursor: null },
    };
    // projects, employees, departments, calendar, absences, workTypes — пустые
    const emptyRest = ALL_PLURALS.slice(1).map((p) => emptyPage(p));
    const fetchMock = mockFetch([page1, ...emptyRest]);
    vi.stubGlobal('fetch', fetchMock);
    const result = await handler(event({ from: '2026-06-01', to: '2026-06-30' })) as Record<string, unknown>;
    expect(result).toMatchObject({ ok: true });
    // 1 запрос на entries (1 страница) + 7 на остальные = 8 fetch (REQ-0011 +empDept)
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it('две страницы entries → fetch вызывается 8 раз (2 для entries + 6 остальных)', async () => {
    const page1 = {
      data: { credosTimeEntries: [{ id: 'e1', date: '2026-06-01', hours: 8, projectId: null, employeeId: null, workTypeId: null, tags: [] }] },
      pageInfo: { hasNextPage: true, endCursor: 'cursor-abc' },
    };
    const page2 = {
      data: { credosTimeEntries: [{ id: 'e2', date: '2026-06-02', hours: 4, projectId: null, employeeId: null, workTypeId: null, tags: [] }] },
      pageInfo: { hasNextPage: false, endCursor: null },
    };
    const emptyRest = ALL_PLURALS.slice(1).map((p) => emptyPage(p));
    const fetchMock = mockFetch([page1, page2, ...emptyRest]);
    vi.stubGlobal('fetch', fetchMock);
    const result = await handler(event({ from: '2026-06-01', to: '2026-06-30' })) as Record<string, unknown>;
    expect(result).toMatchObject({ ok: true });
    // 2 страницы entries + 7 остальных = 9 (REQ-0011 +empDept)
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });

  it('cursor передаётся на 2-й запрос (starting_after)', async () => {
    const page1 = {
      data: { credosTimeEntries: [] },
      pageInfo: { hasNextPage: true, endCursor: 'cur-xyz' },
    };
    const page2 = { data: { credosTimeEntries: [] }, pageInfo: { hasNextPage: false, endCursor: null } };
    // page1 пустой → recs.length === 0 → break (не пойдёт на 2-ю страницу)
    const emptyRest = ALL_PLURALS.slice(1).map((p) => emptyPage(p));
    const fetchMock = mockFetch([page1, ...emptyRest]);
    vi.stubGlobal('fetch', fetchMock);
    await handler(event());
    // recs пустые → цикл прерван, starting_after не используется
    expect(fetchMock).toHaveBeenCalledTimes(8); // REQ-0011 +empDept
    void page2; // не используется — пагинация не продолжилась
  });
});

describe('reports.logic — ошибки fetch', () => {
  it('fetch бросает Error → ok:false + error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const result = await handler(event());
    expect(result).toMatchObject({ ok: false, error: 'network error' });
  });

  it('fetch возвращает !ok (400) → ok:false (через throw)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    }));
    const result = await handler(event());
    expect(result).toMatchObject({ ok: false });
    expect((result as Record<string, string>).error).toContain('400');
  });
});
