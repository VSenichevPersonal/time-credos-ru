import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Кросс-матрица CRUD × статус записи.
// APPROVED — единственный блокирующий статус (CISO-011 / cannot_modify_approved).
// DRAFT / SUBMITTED / REJECTED — мутабельны (можно редактировать и удалять).
//
// Матрица (op × status):
//   delete:       DRAFT✓  SUBMITTED✓  APPROVED✗  REJECTED✓
//   upsert(edit): DRAFT✓  SUBMITTED✓  APPROVED✗  REJECTED✓
//   upsert(key):  DRAFT✓  SUBMITTED✓  APPROVED✗  REJECTED✓
//   upsert(new):  n/a (статус не задан до создания)
//   list:         OK (чтение, без guard)
//
// Rollup:
//   delete     → recalc projectId удалённой записи
//   upsert(edit) → recalc prev + new projectId (если сменился проект)
//   upsert(new)  → recalc нового projectId

import timeDef from './time-entry-api.logic';

const handler = (
  timeDef as unknown as { config: { handler: (event: unknown) => Promise<unknown> } }
).config.handler;

const event = (body: Record<string, unknown>) => ({
  headers: {},
  queryStringParameters: {},
  pathParameters: {},
  body,
  isBase64Encoded: false,
  requestContext: { http: { method: 'POST', path: '/time-entry' } },
  userWorkspaceId: null,
});

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

const EMP_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const ENTRY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROJ_OLD = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJ_NEW = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ACTOR_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const OTHER_EMP = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const empRes = { data: { credosTimeEmployees: [{ id: EMP_ID, name: 'Тест' }] } };
const emptyEmployees = { data: { credosTimeEmployees: [] } };
const emptyEntries = { data: { credosTimeEntries: [] } };
const settingsRes = { data: { credosTimeSettings: [{ maxHoursPerDay: 24, overtimeWarnHours: 12, warnOnScheduleDeviation: true }] } };
const lockedSettingsRes = { data: { credosTimeSettings: [{ maxHoursPerDay: 24, overtimeWarnHours: 12, warnOnScheduleDeviation: true, lockdownDate: '2026-05-31', lockdownGraceDays: 0 }] } };

const preRead = (status: string, projectId: string | null = null, employeeId: string | null = null) => ({
  data: { credosTimeEntries: [{ id: ENTRY_ID, status, projectId, employeeId, hours: 8, date: '2026-06-01' }] },
});

// Trusted actor (server-identity via userWorkspaceId). НЕ менеджер → canWriteFor может отказать.
const UW_ID = 'cccccccc-0000-4000-8000-000000000001';
const actorTrustedRes = { data: { credosTimeEmployees: [{ id: ACTOR_ID, isManager: false, workspaceMemberRef: null, userWorkspaceRef: UW_ID }] } };
const noDepts = { data: { credosTimeDepartments: [] } };

const eventTrusted = (body: Record<string, unknown>) => ({
  headers: {},
  queryStringParameters: {},
  pathParameters: {},
  body,
  isBase64Encoded: false,
  requestContext: { http: { method: 'POST', path: '/time-entry' } },
  userWorkspaceId: UW_ID,
});

beforeEach(() => {
  vi.stubEnv('TWENTY_API_URL', 'http://test');
  vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

// ─── DELETE × статус ──────────────────────────────────────────────────────

describe('delete × статус: матрица разрешений', () => {
  it('DRAFT → DELETE успешен (guard не блокирует)', async () => {
    const mock = mockFetch([emptyEmployees, preRead('DRAFT'), {}, {}]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: true });
    const dels = mock.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(dels).toHaveLength(1);
  });

  it('SUBMITTED → DELETE успешен (только APPROVED блокируется)', async () => {
    const mock = mockFetch([emptyEmployees, preRead('SUBMITTED'), {}, {}]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: true });
    expect(r).not.toMatchObject({ error: 'cannot_modify_approved' });
  });

  it('APPROVED → DELETE заблокирован (cannot_modify_approved)', async () => {
    const mock = mockFetch([emptyEmployees, preRead('APPROVED')]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: false, error: 'cannot_modify_approved' });
    const dels = mock.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(dels).toHaveLength(0);
  });

  it('REJECTED → DELETE успешен (отклонённую запись можно удалить)', async () => {
    const mock = mockFetch([emptyEmployees, preRead('REJECTED'), {}, {}]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: true });
    const dels = mock.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(dels).toHaveLength(1);
  });
});

// ─── UPSERT (edit by id) × статус ────────────────────────────────────────

describe('upsert edit (с id) × статус: матрица разрешений', () => {
  it('DRAFT → PATCH успешен', async () => {
    const mock = mockFetch([
      empRes,
      preRead('DRAFT', PROJ_OLD),
      settingsRes,
      { data: { updateCredosTimeEntry: { id: ENTRY_ID } } },
      {}, // rollup
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', id: ENTRY_ID, hours: '4', date: '2026-06-10', projectId: PROJ_OLD }));
    expect(r).toMatchObject({ ok: true });
    const patches = mock.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'PATCH');
    expect(patches.length).toBeGreaterThan(0);
  });

  it('SUBMITTED → PATCH успешен (можно редактировать до решения руководителя)', async () => {
    const mock = mockFetch([
      empRes,
      preRead('SUBMITTED', PROJ_OLD),
      settingsRes,
      { data: { updateCredosTimeEntry: { id: ENTRY_ID } } },
      {}, // rollup
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', id: ENTRY_ID, hours: '6', date: '2026-06-10', projectId: PROJ_OLD }));
    expect(r).toMatchObject({ ok: true });
    expect(r).not.toMatchObject({ error: 'cannot_modify_approved' });
  });

  it('APPROVED → PATCH заблокирован', async () => {
    const mock = mockFetch([empRes, preRead('APPROVED', PROJ_OLD), settingsRes]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', id: ENTRY_ID, hours: '4', date: '2026-06-10' }));
    expect(r).toMatchObject({ ok: false, error: 'cannot_modify_approved' });
    const patches = mock.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'PATCH');
    expect(patches).toHaveLength(0);
  });

  it('REJECTED → PATCH успешен (отклонённую запись можно исправить)', async () => {
    const mock = mockFetch([
      empRes,
      preRead('REJECTED', PROJ_OLD),
      settingsRes,
      { data: { updateCredosTimeEntry: { id: ENTRY_ID } } },
      {}, // rollup
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', id: ENTRY_ID, hours: '8', date: '2026-06-10', projectId: PROJ_OLD }));
    expect(r).toMatchObject({ ok: true });
  });
});

// ─── UPSERT по ключу (SCOUT-B) × статус ──────────────────────────────────

describe('upsert по ключу (без id) × статус найденной записи', () => {
  const foundKey = { data: { credosTimeEntries: [{ id: ENTRY_ID }] } };

  it('DRAFT найден по ключу → PATCH (обновляет существующую)', async () => {
    const mock = mockFetch([
      empRes, settingsRes, foundKey,
      preRead('DRAFT', PROJ_OLD),
      { data: { updateCredosTimeEntry: { id: ENTRY_ID } } },
      {}, // rollup
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', hours: '4', date: '2026-06-10' }));
    expect(r).toMatchObject({ ok: true });
  });

  it('SUBMITTED найден по ключу → PATCH успешен', async () => {
    const mock = mockFetch([
      empRes, settingsRes, foundKey,
      preRead('SUBMITTED', PROJ_OLD),
      { data: { updateCredosTimeEntry: { id: ENTRY_ID } } },
      {}, // rollup
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', hours: '5', date: '2026-06-10' }));
    expect(r).toMatchObject({ ok: true });
  });

  it('APPROVED найден по ключу → заблокирован (CISO-011, без POST-дубля)', async () => {
    const mock = mockFetch([
      empRes, settingsRes, foundKey,
      preRead('APPROVED', PROJ_OLD),
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }));
    expect(r).toMatchObject({ ok: false, error: 'cannot_modify_approved' });
    const mutations = mock.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH';
    });
    expect(mutations).toHaveLength(0);
  });

  it('REJECTED найден по ключу → PATCH успешен', async () => {
    const mock = mockFetch([
      empRes, settingsRes, foundKey,
      preRead('REJECTED', PROJ_OLD),
      { data: { updateCredosTimeEntry: { id: ENTRY_ID } } },
      {}, // rollup
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }));
    expect(r).toMatchObject({ ok: true });
  });
});

// ─── Rollup-пересчёт factHours проекта ───────────────────────────────────

describe('rollup: recalcProjectFactHours при мутациях', () => {
  it('delete → recalc projectId удалённой записи (GET записей проекта после DELETE)', async () => {
    const mock = mockFetch([
      emptyEmployees,
      preRead('DRAFT', PROJ_OLD),
      {}, // DELETE
      { data: { credosTimeEntries: [] } }, // recalc: GET entries of project
      { data: { updateCredosTimeProject: {} } }, // recalc: PATCH project
    ]);
    vi.stubGlobal('fetch', mock);
    await handler(event({ op: 'delete', id: ENTRY_ID }));
    // Rollup вызывается — после DELETE идут дополнительные fetch-ы для проекта
    const allCalls = mock.mock.calls;
    // Должен быть GET по PROJ_OLD для пересчёта
    const rollupGet = allCalls.some((c) => {
      const url = String(c[0]);
      return url.includes('credosTimeEntries') && url.includes(PROJ_OLD);
    });
    expect(rollupGet).toBe(true);
  });

  it('upsert create → recalc нового projectId', async () => {
    const mock = mockFetch([
      empRes, settingsRes, emptyEntries, // find key → пусто
      { data: { createCredosTimeEntry: { id: 'new-1' } } }, // POST
      { data: { credosTimeEntries: [] } }, // recalc GET entries
      { data: { updateCredosTimeProject: {} } }, // recalc PATCH project
    ]);
    vi.stubGlobal('fetch', mock);
    await handler(event({ op: 'upsert', hours: '8', date: '2026-06-15', projectId: PROJ_NEW }));
    const rollupGet = mock.mock.calls.some((c) => {
      const url = String(c[0]);
      return url.includes('credosTimeEntries') && url.includes(PROJ_NEW);
    });
    expect(rollupGet).toBe(true);
  });

  it('upsert edit смена проекта → recalc ОБОИХ (prev + new)', async () => {
    const mock = mockFetch([
      empRes,
      preRead('DRAFT', PROJ_OLD), // pre-read: prevProjectId = PROJ_OLD
      settingsRes,
      { data: { updateCredosTimeEntry: { id: ENTRY_ID } } }, // PATCH
      { data: { credosTimeEntries: [] } }, // recalc PROJ_OLD
      { data: { updateCredosTimeProject: {} } },
      { data: { credosTimeEntries: [] } }, // recalc PROJ_NEW
      { data: { updateCredosTimeProject: {} } },
    ]);
    vi.stubGlobal('fetch', mock);
    await handler(event({
      op: 'upsert', id: ENTRY_ID, hours: '8', date: '2026-06-15',
      projectId: PROJ_NEW, // новый проект, отличается от PROJ_OLD
    }));
    const rollupOld = mock.mock.calls.some((c) => String(c[0]).includes(PROJ_OLD));
    const rollupNew = mock.mock.calls.some((c) => String(c[0]).includes(PROJ_NEW));
    expect(rollupOld).toBe(true);
    expect(rollupNew).toBe(true);
  });
});

// ─── op=list ──────────────────────────────────────────────────────────────

describe('op=list: чтение записей + справочники', () => {
  it('list → ok=true, возвращает entries/projects/workTypes', async () => {
    const mock = mockFetch([
      empRes, // resolveEmployeeId
      { data: { credosTimeEntries: [
        { id: 'e1', hours: 8, date: '2026-06-01', status: 'DRAFT', projectId: PROJ_OLD },
      ]}},
      { data: { credosTimeProjects: [{ id: PROJ_OLD, name: 'Проект А', code: 'А-001' }] }},
      { data: { credosTimeWorkTypes: [{ id: 'wt1', name: 'Разработка' }] }},
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ op: 'list', from: '2026-06-01T00:00:00.000Z', to: '2026-06-07T23:59:59.999Z' }));
    expect(r).toMatchObject({ ok: true });
    expect((r as { entries: unknown[] }).entries).toHaveLength(1);
    expect((r as { projects: unknown[] }).projects).toHaveLength(1);
    expect((r as { workTypes: unknown[] }).workTypes).toHaveLength(1);
  });

  it('list без employeeId (DEV-fallback) → фильтр без employeeId', async () => {
    const mock = mockFetch([
      { data: { credosTimeEmployees: [] } }, // resolveEmployeeId → null (нет сотрудника)
      { data: { credosTimeEntries: [] }},
      { data: { credosTimeProjects: [] }},
      { data: { credosTimeWorkTypes: [] }},
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ from: '2026-06-01T00:00:00.000Z', to: '2026-06-07T23:59:59.999Z' }));
    expect(r).toMatchObject({ ok: true });
    // Фильтр не содержит employeeId (первый GET entries — calls[1])
    const entriesCall = String(mock.mock.calls[1]?.[0] ?? '');
    expect(entriesCall).not.toContain('employeeId');
  });

  it('проект с code → name отображается как есть (без дублирования кода)', async () => {
    const mock = mockFetch([
      empRes,
      { data: { credosTimeEntries: [] }},
      { data: { credosTimeProjects: [{ id: PROJ_OLD, name: 'А-001 — Авторизация', code: 'А-001' }] }},
      { data: { credosTimeWorkTypes: [] }},
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(event({ from: '2026-06-01T00:00:00.000Z', to: '2026-06-07T23:59:59.999Z' }));
    const projects = (r as { projects: Array<{ name: string }> }).projects;
    // Имя берётся как есть (без повторного добавления code — иначе дубль «А-001 — А-001 — …»)
    expect(projects[0].name).toBe('А-001 — Авторизация');
    expect(projects[0].name).not.toMatch(/А-001.*А-001/);
  });
});

// ─── ON-BEHALF gate (FORBIDDEN_ON_BEHALF) ────────────────────────────────────

describe('FORBIDDEN_ON_BEHALF (on-behalf gate, trusted actor)', () => {
  it('delete чужой записи, актор не руководитель → FORBIDDEN_ON_BEHALF', async () => {
    // resolveActor (trusted) → preRead (owner=OTHER_EMP) → canWriteFor → noDepts → denied
    const mock = mockFetch([
      actorTrustedRes,            // resolveActor: GET employees by userWorkspaceRef → trusted actor
      preRead('DRAFT', null, OTHER_EMP),  // preRead: entry принадлежит OTHER_EMP
      noDepts,                    // canWriteFor → isHeadOfEmployeeDept: GET departments → пусто
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(eventTrusted({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: false, error: 'FORBIDDEN_ON_BEHALF' });
  });

  it('delete своей записи (actor === owner) → gate не применяется, ok', async () => {
    // actor === owner → canWriteFor возвращает true (свой ввод)
    const mock = mockFetch([
      actorTrustedRes,                    // resolveActor
      preRead('DRAFT', null, ACTOR_ID),   // preRead: owner = actor сам
      settingsRes,                        // readSettings (lockdown off)
      { ok: true, status: 200 } as unknown, // DELETE /rest/credosTimeEntries/:id
      { ok: true, status: 200 } as unknown, // writeEntryLog POST
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(eventTrusted({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: true });
  });
});

// ─── LOCKED_PERIOD gate ───────────────────────────────────────────────────────

describe('LOCKED_PERIOD (lockdown gate, trusted actor)', () => {
  it('delete своей записи в закрытом периоде → LOCKED_PERIOD', async () => {
    // actor trusted, запись в мае 2026, lockdownDate='2026-05-31' → locked
    const mock = mockFetch([
      actorTrustedRes,             // resolveActor
      {                            // preRead: запись в закрытом периоде, owner = actor
        data: { credosTimeEntries: [{ id: ENTRY_ID, status: 'DRAFT', employeeId: ACTOR_ID, projectId: null, hours: 8, date: '2026-05-15' }] },
      },
      lockedSettingsRes,           // readSettings: lockdownDate='2026-05-31' (май закрыт)
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(eventTrusted({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: false, error: 'LOCKED_PERIOD' });
  });

  it('delete записи ПОСЛЕ lockdownDate → не заблокирован', async () => {
    // Запись в июне (после lockdown мая) → ok
    const mock = mockFetch([
      actorTrustedRes,
      preRead('DRAFT', null, ACTOR_ID),  // date='2026-06-01' (по умолчанию в preRead)
      lockedSettingsRes,                 // lockdownDate='2026-05-31' → июнь открыт
      { ok: true, status: 200 } as unknown, // DELETE
      { ok: true, status: 200 } as unknown, // writeEntryLog
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(eventTrusted({ op: 'delete', id: ENTRY_ID }));
    expect(r).toMatchObject({ ok: true });
  });
});

// ─── upsert: on-behalf gate + lockdown ───────────────────────────────────────

describe('upsert: FORBIDDEN_ON_BEHALF (trusted actor пишет за чужого без прав)', () => {
  it('upsert чужой записи, актор не руководитель → FORBIDDEN_ON_BEHALF', async () => {
    // employeeId=OTHER_EMP ≠ ACTOR_ID → isOnBehalf=true → canWriteFor → noDepts → denied
    const mock = mockFetch([
      actorTrustedRes,  // resolveActor
      settingsRes,      // readSettings (unlocked)
      noDepts,          // canWriteFor → isHeadOfEmployeeDept: нет подведомственных отделов
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(eventTrusted({
      op: 'upsert',
      employeeId: OTHER_EMP,
      date: '2026-06-10T00:00:00.000Z',
      hours: 8,
    }));
    expect(r).toMatchObject({ ok: false, error: 'FORBIDDEN_ON_BEHALF' });
  });
});

describe('upsert: LOCKED_PERIOD (trusted actor, запись в закрытом периоде)', () => {
  it('upsert на закрытую дату → LOCKED_PERIOD (lockdown guard до мутаций)', async () => {
    // date=май, lockdownDate=31 мая → period locked
    const mock = mockFetch([
      actorTrustedRes,     // resolveActor
      lockedSettingsRes,   // readSettings (lockdown active)
    ]);
    vi.stubGlobal('fetch', mock);
    const r = await handler(eventTrusted({
      op: 'upsert',
      date: '2026-05-15T00:00:00.000Z',
      hours: 8,
    }));
    expect(r).toMatchObject({ ok: false, error: 'LOCKED_PERIOD' });
  });
});
