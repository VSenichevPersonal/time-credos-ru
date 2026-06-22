import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Security-регресс-спека для CISO-005 (broken access control / IDOR / impersonation)
// и связанного CISO-002 (separation of duties в approval).
// Детали: docs/security/findings/CISO-005-time-entry-idor.md.
//
// Сейчас identity берётся из client-supplied `params.workspaceMemberRef`, а не из
// аутентифицированного `event.userWorkspaceId` → любой юзер может действовать от
// чужого имени. Тесты — `it.todo`: НЕ падают, фиксируют контракт, который QA
// проверит, как только Dev 2 введёт server-side резолв userWorkspace→employee
// (корень фикса). Тогда `todo` → реальные тесты с мок-`fetch`.

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

const emptyEmployees = { data: { credosTimeEmployees: [] } };
const emptyEntries = { data: { credosTimeEntries: [] } };
const emptyProjects = { data: { credosTimeProjects: [] } };
const emptyWorkTypes = { data: { credosTimeWorkTypes: [] } };
// gap-аудит v3 #4: upsert читает пороги валидации из singleton credosTimeSettings
// (после возможного pre-read записи, перед поиском по ключу). Этот мок-ответ
// занимает свою позицию в последовательности fetch. Пусто → дефолты (лимит 24).
const settingsRes = (over: Record<string, unknown> = {}) => ({
  data: { credosTimeSettings: [{ maxHoursPerDay: 24, overtimeWarnHours: 12, warnOnScheduleDeviation: true, ...over }] },
});

describe('time-entry-api: ownership / anti-impersonation (CISO-005)', () => {
  it.todo('identity сотрудника берётся из event.userWorkspaceId, НЕ из params.workspaceMemberRef');
  it.todo('op=upsert create: employeeId = резолв актора, нельзя создать запись от чужого имени');
  it.todo('op=upsert patch: нельзя править чужую запись по id (ownership-guard)');
  it.todo('op=delete: нельзя удалить чужую запись (ownership-guard), кроме роли «Руководитель»');
  it.todo('op=list: возвращает только записи актора (или скоуп по роли), не любого employeeId');
  it.todo('DEV-fallback «первый активный» отсутствует в прод-пути (TODO(prod) L93)');
});

describe('approval: separation of duties (CISO-002)', () => {
  it.todo('runResolve: актор не может approve/reject СВОИ записи (actor != owner)');
  it.todo('runResolve: approve/reject доступны только роли «Руководитель» (canApprove)');
});

// CISO-006 (P2): REST filter injection — client params интерполируются в filter-строки
// без валидации; запятая в значении = инъекция AND-условия. Детали:
// docs/security/findings/CISO-006-filter-injection.md.
describe('REST filter injection (CISO-006)', () => {
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('невалидный workspaceMemberRef (не UUID) → не идёт в filter (DEV-fallback)', async () => {
    // 'ref-with-comma,active[eq]:false' → isUuid=false → не идёт в REST-filter,
    // уходит в DEV-fallback (первый активный). Нет запроса with malicious value.
    const fetchMock = mockFetch([
      emptyEmployees, // DEV-fallback: активные сотрудники
      emptyEntries, emptyProjects, emptyWorkTypes, // op=list
    ]);
    vi.stubGlobal('fetch', fetchMock);
    await handler(event({
      op: 'list',
      from: '2026-06-01',
      to: '2026-06-30',
      workspaceMemberRef: 'not-a-uuid,active[eq]:false',
    }));
    // Ни один вызов fetch не должен содержать инъекцию
    const calls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calls.every((url) => !url.includes('not-a-uuid'))).toBe(true);
  });

  it('op=delete, невалидный id → error invalid id, fetch НЕ вызывается для DELETE', async () => {
    const fetchMock = mockFetch([emptyEmployees]); // только resolveEmployeeId
    vi.stubGlobal('fetch', fetchMock);
    const result = await handler(event({ op: 'delete', id: '../../../etc/passwd' }));
    expect(result).toMatchObject({ ok: false, error: 'invalid id' });
    // DELETE-запрос НЕ должен был отправиться (fetchMock — только resolveEmployeeId)
    const deleteCalls = fetchMock.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(deleteCalls).toHaveLength(0);
  });

  it('op=delete, id с запятой (инъекция filter) → error invalid id', async () => {
    const fetchMock = mockFetch([emptyEmployees]);
    vi.stubGlobal('fetch', fetchMock);
    const result = await handler(event({ op: 'delete', id: 'uuid-1,id[neq]:uuid-1' }));
    expect(result).toMatchObject({ ok: false, error: 'invalid id' });
  });

  it('op=upsert patch, невалидный id → error invalid id', async () => {
    // resolveEmployeeId вызывается до isUuid(id) — нужен мок с employee
    const empRes = { data: { credosTimeEmployees: [{ id: 'e-fallback', name: 'Test' }] } };
    vi.stubGlobal('fetch', mockFetch([empRes]));
    const result = await handler(event({
      op: 'upsert',
      id: 'not-uuid',
      hours: '8',
      date: '2026-06-01',
    }));
    expect(result).toMatchObject({ ok: false, error: 'invalid id' });
  });

  it('op=list, from с инъекцией → error invalid from/to', async () => {
    const fetchMock = mockFetch([emptyEmployees]);
    vi.stubGlobal('fetch', fetchMock);
    const result = await handler(event({
      op: 'list',
      from: '2026-06-01,employeeId[eq]:VICTIM',
      to: '2026-06-30',
    }));
    expect(result).toMatchObject({ ok: false, error: 'invalid from/to' });
  });

  it('op=list, to невалидная дата → error invalid from/to', async () => {
    const fetchMock = mockFetch([emptyEmployees]);
    vi.stubGlobal('fetch', fetchMock);
    const result = await handler(event({
      op: 'list',
      from: '2026-06-01',
      to: 'not-a-date',
    }));
    expect(result).toMatchObject({ ok: false, error: 'invalid from/to' });
  });

  it('op=list, валидные from/to → ok=true (гарнитура)', async () => {
    vi.stubGlobal('fetch', mockFetch([
      emptyEmployees, // resolveEmployeeId DEV-fallback
      emptyEntries, emptyProjects, emptyWorkTypes, // op=list 3 параллельных
    ]));
    const result = await handler(event({
      op: 'list',
      from: '2026-06-01',
      to: '2026-06-30',
    }));
    expect(result).toMatchObject({ ok: true });
  });
});

// CISO-011: целостность табеля/1С — нельзя удалять или изменять согласованные записи.
describe('integrity guard (CISO-011)', () => {
  const VALID_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('op=delete, запись со статусом APPROVED → cannot_modify_approved (нет DELETE-запроса)', async () => {
    const mockFn = mockFetch([
      emptyEmployees, // resolveEmployeeId DEV-fallback
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'APPROVED', projectId: null }] } }, // pre-read
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'delete', id: VALID_ID }));
    expect(result).toMatchObject({ ok: false, error: 'cannot_modify_approved' });
    // DELETE-запрос не должен был отправиться
    const deletes = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(deletes).toHaveLength(0);
  });

  it('op=upsert (patch), запись со статусом APPROVED → cannot_modify_approved (нет PATCH-запроса)', async () => {
    // DEV-fallback должен вернуть сотрудника — иначе 'employee not resolved' раньше CISO-011
    const mockFn = mockFetch([
      { data: { credosTimeEmployees: [{ id: 'emp-fallback', name: 'Test' }] } }, // resolveEmployeeId DEV-fallback
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'APPROVED', projectId: null }] } }, // pre-read
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', id: VALID_ID, hours: '4', date: '2026-06-01' }));
    expect(result).toMatchObject({ ok: false, error: 'cannot_modify_approved' });
    const patches = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'PATCH');
    expect(patches).toHaveLength(0);
  });

  it('op=delete, запись со статусом SUBMITTED → можно удалять (guard не срабатывает)', async () => {
    const mockFn = mockFetch([
      emptyEmployees,
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'SUBMITTED', projectId: null, date: '2026-06-01T00:00:00.000Z' }] } }, // pre-read
      settingsRes(), // readSettings (lockdown-guard): lockdownDate пуст → не закрыто
      {}, // DELETE response
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'delete', id: VALID_ID }));
    expect(result).not.toMatchObject({ error: 'cannot_modify_approved' });
    const deletes = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(deletes).toHaveLength(1);
  });
});

// PERIOD-LOCKDOWN (AUDIT_LOG_PERIOD_LOCKDOWN.md §3.Б): закрытие прошлых периодов по
// дате. 2-е правило guard поверх CISO-011 (SSOT). Мутация записи с entryDate ≤
// lockdownDate (с учётом грейса) → LOCKED_PERIOD, КРОМЕ руководителя (override,
// логируется в audit-log override=true). lockdown читается тем же settings-GET.
describe('PERIOD-LOCKDOWN: закрытие прошлых периодов по дате', () => {
  const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const WM = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const VALID_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  // resolveActor (ветка деградации, userWorkspaceId=null) ищет employee по
  // workspaceMemberRef → возвращает isManager-флаг. Рядовой / руководитель.
  const workerEmp = { data: { credosTimeEmployees: [{ id: EMP, name: 'W', isManager: false }] } };
  const managerEmp = { data: { credosTimeEmployees: [{ id: EMP, name: 'M', isManager: true }] } };
  const lockedSettings = settingsRes({ lockdownDate: '2026-05-31T00:00:00.000Z', lockdownGraceDays: 0 });

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('upsert create в ЗАКРЫТОМ периоде (рядовой) → LOCKED_PERIOD, без мутаций', async () => {
    const mockFn = mockFetch([
      workerEmp, // resolveActor (деградация по workspaceMemberRef)
      workerEmp, // resolveEmployeeId
      lockedSettings, // readSettings (lockdown активен)
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2026-05-10', workspaceMemberRef: WM,
    }));
    expect(result).toMatchObject({ ok: false, error: 'LOCKED_PERIOD' });
    const mutations = mockFn.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH';
    });
    expect(mutations).toHaveLength(0);
  });

  it('upsert create в ОТКРЫТОМ периоде (после границы) → проходит, без LOCKED_PERIOD', async () => {
    const mockFn = mockFetch([
      workerEmp, // resolveActor
      workerEmp, // resolveEmployeeId
      lockedSettings, // readSettings
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-open' } } }, // POST
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2026-06-10', workspaceMemberRef: WM,
    }));
    expect(result).toMatchObject({ ok: true });
  });

  it('upsert create в закрытом периоде РУКОВОДИТЕЛЕМ → проходит (override) + лог override=true', async () => {
    const mockFn = mockFetch([
      managerEmp, // resolveActor (isManager=true)
      managerEmp, // resolveEmployeeId
      lockedSettings, // readSettings
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-ovr' } } }, // POST
      {}, // writeEntryLog POST
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2026-05-10', workspaceMemberRef: WM,
    }));
    expect(result).toMatchObject({ ok: true });
    // Лог записан с override=true (reopen-аудит).
    const logCall = mockFn.mock.calls.find((c) => String(c[0]).includes('credosTimeEntryLogs'));
    expect(logCall).toBeDefined();
    const logBody = JSON.parse(String((logCall?.[1] as { body?: string })?.body ?? '{}'));
    expect(logBody.override).toBe(true);
    expect(logBody.action).toBe('CREATE');
  });

  it('грейс: graceDays=5, lockdownDate=2026-05-31 → запись 2026-05-28 ещё в грейсе, проходит', async () => {
    const mockFn = mockFetch([
      workerEmp, // resolveActor
      workerEmp, // resolveEmployeeId
      settingsRes({ lockdownDate: '2026-05-31T00:00:00.000Z', lockdownGraceDays: 5 }), // readSettings
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-grace' } } }, // POST
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2026-05-28', workspaceMemberRef: WM,
    }));
    expect(result).toMatchObject({ ok: true });
  });

  it('delete в ЗАКРЫТОМ периоде (рядовой) → LOCKED_PERIOD, без DELETE', async () => {
    const mockFn = mockFetch([
      workerEmp, // resolveActor
      workerEmp, // resolveEmployeeId
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'DRAFT', projectId: null, hours: 8, date: '2026-05-10T00:00:00.000Z' }] } }, // pre-read
      lockedSettings, // readSettings
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'delete', id: VALID_ID, workspaceMemberRef: WM }));
    expect(result).toMatchObject({ ok: false, error: 'LOCKED_PERIOD' });
    const deletes = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(deletes).toHaveLength(0);
  });

  it('delete в закрытом периоде РУКОВОДИТЕЛЕМ → удаляет (override) + лог override=true', async () => {
    const mockFn = mockFetch([
      managerEmp, // resolveActor
      managerEmp, // resolveEmployeeId
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'DRAFT', projectId: null, hours: 8, date: '2026-05-10T00:00:00.000Z' }] } }, // pre-read
      lockedSettings, // readSettings
      {}, // DELETE
      {}, // writeEntryLog
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'delete', id: VALID_ID, workspaceMemberRef: WM }));
    expect(result).toMatchObject({ ok: true });
    const deletes = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(deletes).toHaveLength(1);
    const logCall = mockFn.mock.calls.find((c) => String(c[0]).includes('credosTimeEntryLogs'));
    const logBody = JSON.parse(String((logCall?.[1] as { body?: string })?.body ?? '{}'));
    expect(logBody.override).toBe(true);
    expect(logBody.action).toBe('DELETE');
  });

  it('lockdown ВЫКЛ (lockdownDate пуст) → старая запись правится свободно (не закрыто)', async () => {
    const mockFn = mockFetch([
      workerEmp, // resolveActor
      workerEmp, // resolveEmployeeId
      settingsRes(), // readSettings — lockdownDate отсутствует → выкл
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-off' } } }, // POST
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2020-01-01', workspaceMemberRef: WM,
    }));
    expect(result).toMatchObject({ ok: true });
  });
});

// ON-BEHALF server-gate (MANAGER_ENTRY_ON_BEHALF §3.1): trusted actor может писать
// ЗА сотрудника, только если canWriteFor (руководитель отдела / PM проекта / админ).
// Чужой actor → FORBIDDEN_ON_BEHALF. Свой ввод — без gate. on-behalf-запись стампит
// enteredByActor = actor.employeeId. NULL/untrusted actor → деградация (gate выкл).
describe('ON-BEHALF server-gate (canWriteFor + enteredByActor)', () => {
  const ACTOR = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; // руководитель/PM
  const TARGET = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; // подчинённый
  const DEPT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const UW = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const PROJ = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const ENTRY = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  // trusted actor (ветка-1 resolveActor: userWorkspaceId задан + замаплен).
  const trustedManager = {
    data: { credosTimeEmployees: [{ id: ACTOR, isManager: true, workspaceMemberRef: 'wm-a', userWorkspaceRef: UW }] },
  };
  // canWriteFor head-ветка: actor — head отдела DEPT, target.primaryDept == DEPT.
  const headedDepts = { data: { credosTimeDepartments: [{ id: DEPT }] } };
  const targetInDept = { data: { credosTimeEmployees: [{ departmentId: DEPT }] } };
  const targetNoDept = { data: { credosTimeEmployees: [{ departmentId: null }] } };
  const noEmployeeDepts = { data: { credosTimeEmployeeDepartments: [] } };

  // event с trusted-идентичностью (userWorkspaceId непуст).
  const trustedEvent = (body: Record<string, unknown>) => ({
    ...event(body),
    userWorkspaceId: UW,
  });

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('руководитель отдела пишет ЗА подчинённого → ok + enteredByActor стамп', async () => {
    const mockFn = mockFetch([
      trustedManager, // resolveActor ветка-1
      settingsRes(), // readSettings (lockdown)
      headedDepts, // canWriteFor: отделы actor (head)
      targetInDept, // canWriteFor: primaryDept target == DEPT → true
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'oh-1' } } }, // POST
      {}, // writeEntryLog
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({
      op: 'upsert', hours: '8', date: '2026-06-10', employeeId: TARGET,
    }));
    expect(result).toMatchObject({ ok: true });
    const post = mockFn.mock.calls.find(
      (c) => (c[1] as { method?: string })?.method === 'POST' && !String(c[0]).includes('credosTimeEntryLogs'),
    );
    const body = JSON.parse(String((post?.[1] as { body?: string })?.body ?? '{}'));
    expect(body.employeeId).toBe(TARGET);
    expect(body.enteredByActor).toBe(ACTOR); // стамп «внёс руководитель»
  });

  it('чужой actor (не head, не PM, не admin) пишет за чужого → FORBIDDEN_ON_BEHALF, без POST', async () => {
    // НЕ-руководитель actor: isManager=false → нет admin-деградации.
    const nonManager = {
      data: { credosTimeEmployees: [{ id: ACTOR, isManager: false, workspaceMemberRef: 'wm-a', userWorkspaceRef: UW }] },
    };
    const mockFn2 = mockFetch([
      nonManager, // resolveActor
      settingsRes(), // readSettings
      headedDepts, // canWriteFor: отделы actor (head) — есть отдел, но...
      targetNoDept, // target.primaryDept = null → не совпал
      noEmployeeDepts, // target FTE-назначения пусты → не head → false
      // PM-ветка: projectId не передан → пропущена → canWriteFor=false
    ]);
    vi.stubGlobal('fetch', mockFn2);
    const result = await handler(trustedEvent({
      op: 'upsert', hours: '8', date: '2026-06-10', employeeId: TARGET,
    }));
    expect(result).toMatchObject({ ok: false, error: 'FORBIDDEN_ON_BEHALF' });
    const mutations = mockFn2.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH';
    });
    expect(mutations).toHaveLength(0);
  });

  it('свой ввод (employeeId == actor) trusted → ok, enteredByActor = null (не on-behalf)', async () => {
    const mockFn = mockFetch([
      trustedManager, // resolveActor → actor.employeeId = ACTOR
      settingsRes(), // readSettings
      // gate НЕ вызывается (employeeId == actor) → сразу findExistingEntryIdByKey
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'self-1' } } }, // POST
      {}, // writeEntryLog
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({
      op: 'upsert', hours: '8', date: '2026-06-10', employeeId: ACTOR,
    }));
    expect(result).toMatchObject({ ok: true });
    const post = mockFn.mock.calls.find(
      (c) => (c[1] as { method?: string })?.method === 'POST' && !String(c[0]).includes('credosTimeEntryLogs'),
    );
    const body = JSON.parse(String((post?.[1] as { body?: string })?.body ?? '{}'));
    expect(body.employeeId).toBe(ACTOR);
    expect(body.enteredByActor).toBeNull(); // свой ввод не стампится
  });

  it('NULL-actor (untrusted, uwId пуст) → деградация: gate выкл, пишет по resolveEmployeeId', async () => {
    // userWorkspaceId=null → resolveActor ветка-3 (untrusted) или null. Без wmRef →
    // actor=null → деградация на resolveEmployeeId (DEV-fallback). gate не применяется.
    const mockFn = mockFetch([
      emptyEmployees, // resolveEmployeeId DEV-fallback → первый активный
      settingsRes(), // readSettings
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'deg-1' } } }, // POST
    ]);
    vi.stubGlobal('fetch', mockFn);
    // employeeId target передан, но actor=null → gate выкл, не FORBIDDEN.
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2026-06-10', employeeId: TARGET,
    }));
    // employee not resolved ИЛИ ok — главное НЕ FORBIDDEN_ON_BEHALF (gate выкл).
    expect((result as { error?: string }).error).not.toBe('FORBIDDEN_ON_BEHALF');
  });

  it('delete чужой записи руководителем отдела → ok (canWriteFor разрешил)', async () => {
    const mockFn = mockFetch([
      trustedManager, // resolveActor
      { data: { credosTimeEntries: [{ id: ENTRY, status: 'DRAFT', projectId: PROJ, hours: 4, date: '2026-06-10T00:00:00.000Z', employeeId: TARGET }] } }, // pre-read (с employeeId владельца)
      // canWriteFor (isManager=true) head-ветка:
      headedDepts, // отделы actor
      targetInDept, // target.primaryDept == DEPT → true
      settingsRes(), // readSettings (lockdown) — после gate
      {}, // DELETE
      {}, // writeEntryLog
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({ op: 'delete', id: ENTRY }));
    expect(result).toMatchObject({ ok: true });
    const deletes = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(deletes).toHaveLength(1);
  });

  it('delete чужой записи НЕ-руководителем → FORBIDDEN_ON_BEHALF, без DELETE', async () => {
    const nonManager = {
      data: { credosTimeEmployees: [{ id: ACTOR, isManager: false, workspaceMemberRef: 'wm-a', userWorkspaceRef: UW }] },
    };
    const mockFn = mockFetch([
      nonManager, // resolveActor
      { data: { credosTimeEntries: [{ id: ENTRY, status: 'DRAFT', projectId: null, hours: 4, date: '2026-06-10T00:00:00.000Z', employeeId: TARGET }] } }, // pre-read
      // canWriteFor (isManager=false) head-ветка не совпала, PM нет → false
      headedDepts, targetNoDept, noEmployeeDepts,
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({ op: 'delete', id: ENTRY }));
    expect(result).toMatchObject({ ok: false, error: 'FORBIDDEN_ON_BEHALF' });
    const deletes = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'DELETE');
    expect(deletes).toHaveLength(0);
  });
});

// CISO-007 (P2): /s/reports отдаёт byEmployee (ФИО+переработки 42 сотрудников)
// любому аутентифицированному юзеру без role-guard. Подтверждено live QA-smoke
// (byEmployee=42 строки, без isManager-проверки). reports.logic.ts run().
describe('reports data disclosure (CISO-007)', () => {
  it.todo('byEmployee пуст для не-менеджера (canSeeAll=actor.isManager)');
  it.todo('byEmployee виден только руководителю; после CISO-005 — scope по отделу actor');
  it.todo('from/to в reports.logic валидируются (DATE_RE) — те же filter-точки CISO-006');
});

// CISO-008 (P3): credosTimeAbsence.note — потенц. мед. ПДн (спецкатегория 152-ФЗ).
describe('absence PII (CISO-008)', () => {
  it.todo('absence.note: help/placeholder предупреждает не вводить диагноз/мед. сведения');
});

// SCOUT-B: защита factHours от дублей — upsert-семантика по ключу
// (employeeId, projectId, workTypeId, date-день). Зеркало уникального индекса
// credos-time-entry-unique. Дубль не создаётся; тот же ключ → update, не create.
describe('SCOUT-B: upsert по ключу (анти-дубль)', () => {
  const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const EXISTING = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const empRes = { data: { credosTimeEmployees: [{ id: EMP, name: 'Test' }] } };

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('upsert без id, ключ НЕ найден → создаётся новая запись (POST)', async () => {
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      settingsRes(), // readValidationThresholds
      emptyEntries, // findExistingEntryIdByKey → пусто
      { data: { createCredosTimeEntry: { id: 'new-1' } } }, // POST
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2026-06-10',
    }));
    expect(result).toMatchObject({ ok: true });
    const posts = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'POST' && !String(c[0]).includes('credosTimeEntryLogs'));
    const patches = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'PATCH');
    expect(posts).toHaveLength(1); // создана
    expect(patches).toHaveLength(0); // не апдейт
  });

  it('upsert без id, ключ НАЙДЕН (DRAFT) → обновляется существующая (PATCH, без POST = без дубля)', async () => {
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      settingsRes(), // readValidationThresholds
      { data: { credosTimeEntries: [{ id: EXISTING }] } }, // findExistingEntryIdByKey → найдено
      { data: { credosTimeEntries: [{ id: EXISTING, status: 'DRAFT', projectId: null }] } }, // status-read
      { data: { updateCredosTimeEntry: { id: EXISTING } } }, // PATCH
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '4', date: '2026-06-10',
    }));
    expect(result).toMatchObject({ ok: true });
    const posts = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'POST' && !String(c[0]).includes('credosTimeEntryLogs'));
    const patches = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'PATCH');
    expect(posts).toHaveLength(0); // дубль НЕ создан
    expect(patches).toHaveLength(1); // обновлена существующая
    // PATCH идёт по найденному id
    expect(patches.some((c) => String(c[0]).includes(EXISTING))).toBe(true);
  });

  it('upsert без id, ключ найден и запись APPROVED → cannot_modify_approved (без мутаций)', async () => {
    const mockFn = mockFetch([
      empRes,
      settingsRes(), // readValidationThresholds
      { data: { credosTimeEntries: [{ id: EXISTING }] } }, // findExistingEntryIdByKey
      { data: { credosTimeEntries: [{ id: EXISTING, status: 'APPROVED', projectId: null }] } }, // status-read
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      op: 'upsert', hours: '8', date: '2026-06-10',
    }));
    expect(result).toMatchObject({ ok: false, error: 'cannot_modify_approved' });
    const mutations = mockFn.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH';
    });
    expect(mutations).toHaveLength(0);
  });

  it('findExistingEntryIdByKey: projectId/workTypeId null → filter использует [is]:NULL (не [eq])', async () => {
    const mockFn = mockFetch([
      empRes,
      settingsRes(), // readValidationThresholds
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-2' } } },
    ]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }));
    // 3-й fetch (calls[2]) — поиск по ключу; filter с projectId[is]:NULL и workTypeId[is]:NULL
    const keyCall = String(mockFn.mock.calls[2]?.[0] ?? '');
    expect(decodeURIComponent(keyCall)).toContain('projectId[is]:NULL');
    expect(decodeURIComponent(keyCall)).toContain('workTypeId[is]:NULL');
  });
});

// gap-аудит v3 #4: правила валидации как данные + уровни Ошибка/Предупреждение.
// Пороги читаются из credosTimeSettings; лимит часов/день = ERROR (блок),
// переработка = WARNING (флаг в ответе, не блок). Сверка: Timetta
// timesheet-validation-rules (Ошибка обязывает устранить, Предупреждение
// позволяет отправить).
describe('валидация: уровни Ошибка/Предупреждение (gap-аудит v3 #4)', () => {
  const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const empRes = { data: { credosTimeEmployees: [{ id: EMP, name: 'Test' }] } };

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('часы > лимита (maxHoursPerDay=24) → ERROR, операция блокируется (нет POST/PATCH)', async () => {
    const mockFn = mockFetch([empRes, settingsRes()]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '25', date: '2026-06-10' }));
    expect(result).toMatchObject({
      ok: false,
      error: 'hours out of range',
      validation: { level: 'error', code: 'max_hours_per_day' },
    });
    const mutations = mockFn.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH';
    });
    expect(mutations).toHaveLength(0);
  });

  it('пользовательский лимит из настроек (maxHoursPerDay=10): 11 ч → ERROR', async () => {
    const mockFn = mockFetch([empRes, settingsRes({ maxHoursPerDay: 10 })]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '11', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: false, validation: { level: 'error' } });
  });

  it('переработка (14 ч > overtimeWarnHours=12, < лимита) → WARNING, запись создаётся', async () => {
    const mockFn = mockFetch([
      empRes,
      settingsRes(),
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-ot' } } }, // POST
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '14', date: '2026-06-10' }));
    expect(result).toMatchObject({
      ok: true,
      warnings: [{ level: 'warning', code: 'overtime_per_day' }],
    });
    const posts = mockFn.mock.calls.filter((c) => (c[1] as { method?: string })?.method === 'POST' && !String(c[0]).includes('credosTimeEntryLogs'));
    expect(posts).toHaveLength(1); // WARNING не блокирует — запись создана
  });

  it('warnOnScheduleDeviation=false → переработка не флагуется (нет warnings)', async () => {
    const mockFn = mockFetch([
      empRes,
      settingsRes({ warnOnScheduleDeviation: false }),
      emptyEntries,
      { data: { createCredosTimeEntry: { id: 'new-now' } } },
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '14', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: true });
    expect(result).not.toHaveProperty('warnings');
  });

  it('настроек нет (fetch settings пуст) → дефолтный лимит 24, 8 ч проходит без warnings', async () => {
    const mockFn = mockFetch([
      empRes,
      { data: { credosTimeSettings: [] } }, // settings пусты → дефолты
      emptyEntries,
      { data: { createCredosTimeEntry: { id: 'new-def' } } },
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: true });
    expect(result).not.toHaveProperty('warnings');
  });
});

// WI-52 / W5C.27: запись с hours<=0 не сохраняется (держала бы уникальный ключ
// (emp,proj,wt,date), блокируя реальную, но в факт не идёт). Сервер = источник
// истины → ERROR positive_hours_required, без мутаций.
describe('валидация: пустая запись 0 часов = ERROR (WI-52 / W5C.27)', () => {
  const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const VALID_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const empRes = { data: { credosTimeEmployees: [{ id: EMP, name: 'Test' }] } };

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('upsert create hours=0 → ERROR positive_hours_required, нет POST/PATCH', async () => {
    // Проверка часов идёт ДО settings-fetch → нужен только resolveEmployeeId.
    const mockFn = mockFetch([empRes]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '0', date: '2026-06-10' }));
    expect(result).toMatchObject({
      ok: false,
      error: 'hours must be positive',
      validation: { level: 'error', code: 'positive_hours_required' },
    });
    const mutations = mockFn.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH';
    });
    expect(mutations).toHaveLength(0);
  });

  it('upsert hours пусто/NaN → ERROR positive_hours_required', async () => {
    vi.stubGlobal('fetch', mockFetch([empRes]));
    const result = await handler(event({ op: 'upsert', hours: '', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: false, validation: { code: 'positive_hours_required' } });
  });

  it('upsert patch hours=0 для существующей DRAFT → ERROR (не зануляем запись)', async () => {
    // id передан → сначала status-read (DRAFT, не approved), затем проверка часов.
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'DRAFT', projectId: null }] } }, // status-read
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', id: VALID_ID, hours: '0', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: false, validation: { code: 'positive_hours_required' } });
    const mutations = mockFn.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH';
    });
    expect(mutations).toHaveLength(0);
  });
});

// WI-51 / W5C.2: сохраняемый date нормализуется к полуночи дня (UTC) → совпадение
// DATE_TIME у всех записей одного дня → БД-индекс ловит дубль (защита от двойного
// счёта factHours при записях с произвольным временем).
describe('нормализация date к дню (WI-51)', () => {
  const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const empRes = { data: { credosTimeEmployees: [{ id: EMP, name: 'Test' }] } };
  const settingsRes = { data: { credosTimeSettings: [] } };
  const emptyEntries = { data: { credosTimeEntries: [] } };

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('POST: date с произвольным временем → сохраняется полночь дня (00:00:00.000Z)', async () => {
    const mockFn = mockFetch([
      empRes, settingsRes, emptyEntries,
      { data: { createCredosTimeEntry: { id: 'n1' } } },
    ]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10T15:30:00.000Z' }));
    const post = mockFn.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'POST' && !String(c[0]).includes('credosTimeEntryLogs'));
    const body = JSON.parse(String((post?.[1] as { body?: string })?.body ?? '{}'));
    expect(body.date).toBe('2026-06-10T00:00:00.000Z');
  });

  it('POST: date-only (без времени) → тоже полночь дня', async () => {
    const mockFn = mockFetch([
      empRes, settingsRes, emptyEntries,
      { data: { createCredosTimeEntry: { id: 'n2' } } },
    ]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }));
    const post = mockFn.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'POST' && !String(c[0]).includes('credosTimeEntryLogs'));
    const body = JSON.parse(String((post?.[1] as { body?: string })?.body ?? '{}'));
    expect(body.date).toBe('2026-06-10T00:00:00.000Z');
  });
});
