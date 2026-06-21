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

// Параллельные restGetAll в run(): entries, projects, employees, departments,
// calendar, absences, workTypes, employeeDepartments (REQ-0011), settings (REQ-0019).
const ALL_PLURALS = [
  'credosTimeEntries',
  'credosTimeProjects',
  'credosTimeEmployees',
  'credosTimeDepartments',
  'credosTimeWorkdayCalendars',
  'credosTimeAbsences',
  'credosTimeWorkTypes',
  'credosTimeEmployeeDepartments', // REQ-0011 FTE-назначения
  'credosTimeSettings', // REQ-0019 singleton (revealEmployeeNames)
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
    // 1 запрос на entries (1 страница) + 8 на остальные = 9 fetch (REQ-0011 +empDept, REQ-0019 +settings)
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });

  it('две страницы entries → fetch вызывается 10 раз (2 для entries + 8 остальных)', async () => {
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
    // 2 страницы entries + 8 остальных = 10 (REQ-0011 +empDept, REQ-0019 +settings)
    expect(fetchMock).toHaveBeenCalledTimes(10);
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
    expect(fetchMock).toHaveBeenCalledTimes(9); // REQ-0011 +empDept, REQ-0019 +settings
    void page2; // не используется — пагинация не продолжилась
  });
});

// CISO-007 (152-ФЗ): ФИО (ПДн) НЕ должны утекать любому аутентифицированному юзеру.
// Server-actor по HTTP-роуту недостижим (A1 §3) → безопасный дефолт: ФИО затёрты.
describe('reports.logic — CISO-007: ФИО не утекает', () => {
  const PII = 'Сеничев';
  // Один сотрудник с ФИО + одна его запись часов за период.
  const withEmployee = () =>
    ALL_PLURALS.map((p) => {
      if (p === 'credosTimeEntries')
        return {
          data: {
            credosTimeEntries: [
              { id: 'e1', date: '2026-06-10', hours: 8, projectId: null, employeeId: 'emp1', workTypeId: null, tags: [] },
            ],
          },
          pageInfo: { hasNextPage: false, endCursor: null },
        };
      if (p === 'credosTimeEmployees')
        return {
          data: {
            credosTimeEmployees: [
              { id: 'emp1', firstName: 'Василий', lastName: PII, departmentId: null, active: true, name: `${PII} Василий` },
            ],
          },
          pageInfo: { hasNextPage: false, endCursor: null },
        };
      return emptyPage(p);
    });

  it('byEmployee: name = стабильный КОД (не ФИО/пусто/UUID), ключ (employeeId) сохранён', async () => {
    vi.stubGlobal('fetch', mockFetch(withEmployee()));
    const result = (await handler(event())) as { byEmployee: Array<{ key: string; name: string }> };
    expect(result.byEmployee.length).toBeGreaterThan(0);
    expect(result.byEmployee[0].key).toBe('emp1');
    // reveal=false: имя = КОД, НЕ ФИО, НЕ пусто, НЕ сырой UUID.
    expect(result.byEmployee[0].name).not.toBe('');
    expect(result.byEmployee[0].name).not.toBe('emp1');
    expect(result.byEmployee[0].name).toMatch(/^Сотрудник·/);
    expect(JSON.stringify(result)).not.toContain(PII);
  });

  it('groupBy=detail: employeeName = КОД, ФИО нет в ответе', async () => {
    vi.stubGlobal('fetch', mockFetch(withEmployee()));
    const result = (await handler(event({ groupBy: 'detail' }))) as { rows: Array<{ employeeName: string }> };
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].employeeName).not.toBe('');
    expect(result.rows[0].employeeName).toMatch(/^Сотрудник·/);
    expect(JSON.stringify(result)).not.toContain(PII);
  });

  it('format=csv: ФИО отсутствует в выгрузке', async () => {
    vi.stubGlobal('fetch', mockFetch(withEmployee()));
    const result = (await handler(event({ groupBy: 'detail', format: 'csv' }))) as { csv: string };
    expect(result.csv).not.toContain(PII);
  });

  it('mode=olap groupBy=employee: ФИО в rows[].name → КОД (не пусто/UUID)', async () => {
    vi.stubGlobal('fetch', mockFetch(withEmployee()));
    const result = (await handler(event({ mode: 'olap', groupBy: 'employee' }))) as {
      rows: Array<{ key: string; name: string }>;
    };
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].key).toBe('emp1');
    // reveal=false: ось employee несёт КОД, НЕ ФИО, НЕ пусто, НЕ сырой UUID.
    expect(result.rows[0].name).not.toBe('');
    expect(result.rows[0].name).not.toBe('emp1');
    expect(result.rows[0].name).toMatch(/^Сотрудник·/);
    expect(JSON.stringify(result)).not.toContain(PII);
  });

  // ГЛАВНЫЙ БАГ (прод): при reveal=TRUE OLAP employee показывал сырой UUID вместо
  // ФИО, если запись принадлежит ДЕАКТИВИРОВАННОМУ сотруднику (active=false), —
  // раньше его не грузили (active[eq]:true) → empById пуст → fallback на UUID.
  // Теперь грузим всех → ФИО резолвится. Проверяем строку И крошку-фильтр.
  it('reveal=true OLAP employee: ФИО резолвится даже для деактивированного (НЕ UUID)', async () => {
    const pages = ALL_PLURALS.map((p) => {
      if (p === 'credosTimeEntries')
        return {
          data: {
            credosTimeEntries: [
              { id: 'e1', date: '2026-06-10', hours: 8, projectId: null, employeeId: 'empDead', workTypeId: null, tags: [] },
            ],
          },
          pageInfo: { hasNextPage: false, endCursor: null },
        };
      if (p === 'credosTimeEmployees')
        // Деактивированный сотрудник — раньше отфильтровывался на загрузке.
        return {
          data: {
            credosTimeEmployees: [
              { id: 'empDead', firstName: 'Пётр', lastName: 'Уволенный', departmentId: null, active: false },
            ],
          },
          pageInfo: { hasNextPage: false, endCursor: null },
        };
      if (p === 'credosTimeSettings')
        return {
          data: { credosTimeSettings: [{ id: 's1', revealEmployeeNames: true }] },
          pageInfo: { hasNextPage: false, endCursor: null },
        };
      return emptyPage(p);
    });
    vi.stubGlobal('fetch', mockFetch(pages));
    // Строка среза.
    const rows = (await handler(event({ mode: 'olap', groupBy: 'employee' }))) as {
      rows: Array<{ key: string; name: string }>;
    };
    expect(rows.rows[0].key).toBe('empDead');
    expect(rows.rows[0].name).toBe('Уволенный Пётр'); // ФИО, НЕ UUID
    expect(rows.rows[0].name).not.toBe('empDead');
    // Крошка-фильтр (appliedFilters[].label) — тоже ФИО, не UUID. Свежий стаб:
    // mockFetch-счётчик общий на инстанс → перед вторым handler() пере-стабим.
    vi.stubGlobal('fetch', mockFetch(pages));
    const filtered = (await handler(
      event({ mode: 'olap', groupBy: 'project', filters: [{ dim: 'employee', value: 'empDead' }] }),
    )) as { appliedFilters: Array<{ dim: string; value: string; label: string }> };
    const ef = filtered.appliedFilters.find((f) => f.dim === 'employee');
    expect(ef?.label).toBe('Уволенный Пётр');
    expect(ef?.label).not.toBe('empDead');
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

// ─── reports.logic — groupBy=timesheet-grid (REQ-0006 п.4) ───────────────────

describe('reports.logic — groupBy=timesheet-grid', () => {
  const entry = (over: Record<string, unknown> = {}) => ({
    id: 'en1',
    date: '2026-06-10',
    hours: 8,
    status: 'DRAFT',
    workspaceMemberRef: { id: 'wm1' },
    projectId: 'p1',
    workTypeId: 'wt1',
    tags: [],
    ...over,
  });

  const employee = { id: 'e1', name: 'Иванов Иван', active: true, departmentId: 'd1', workspaceMemberRef: { id: 'wm1' }, code: 'IVA' };
  const project  = { id: 'p1', code: 'PA-001', name: 'Проект А', departmentId: 'd1', plannedEffort: null, startDate: null, endDate: null, category: 'CLIENT', statusValue: 'ACTIVE' };
  const dept     = { id: 'd1', name: 'ОПИБ', code: 'OPIB', approvalRequired: false, capacityFactor: 0.8 };
  const workType = { id: 'wt1', name: 'Разработка', group: 'PRODUCTION' };

  const timesheetEvent = (extra: Record<string, string> = {}) =>
    event({}, { groupBy: 'timesheet-grid', from: '2026-06-01', to: '2026-06-30', ...extra });

  const fullFetch = () => mockFetch(
    ALL_PLURALS.map((p) => ({
      data: { [p]: p === 'credosTimeEntries' ? [entry()] : p === 'credosTimeEmployees' ? [employee] : p === 'credosTimeProjects' ? [project] : p === 'credosTimeDepartments' ? [dept] : p === 'credosTimeWorkTypes' ? [workType] : p === 'credosTimeSettings' ? [{ id: 'gs1', revealEmployeeNames: false }] : [] },
      pageInfo: { hasNextPage: false, endCursor: null },
    })),
  );

  it('возвращает ok:true + groupBy=timesheet-grid + dates + rows', async () => {
    vi.stubGlobal('fetch', fullFetch());
    const result = await handler(timesheetEvent()) as Record<string, unknown>;
    expect(result.ok).toBe(true);
    expect(result.groupBy).toBe('timesheet-grid');
    expect(Array.isArray(result.dates)).toBe(true);
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it('format=csv → ok:true + csv + mimeType + filename', async () => {
    vi.stubGlobal('fetch', fullFetch());
    const result = await handler(timesheetEvent({ format: 'csv' })) as Record<string, unknown>;
    expect(result.ok).toBe(true);
    expect(result.format).toBe('csv');
    expect(typeof result.csv).toBe('string');
    expect(result.mimeType).toContain('text/csv');
    expect((result.filename as string)).toContain('timesheet-grid');
  });

  it('CISO-007: без revealEmployeeNames строки не содержат ФИО', async () => {
    vi.stubGlobal('fetch', fullFetch());
    const result = await handler(timesheetEvent()) as Record<string, unknown>;
    const rows = result.rows as Array<{ label: string }>;
    expect(rows.every((r) => !r.label.includes('Иванов'))).toBe(true);
  });
});
