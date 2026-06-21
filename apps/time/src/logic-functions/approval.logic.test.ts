import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import approvalDef from './approval.logic';

// defineLogicFunction returns { config, errors } — handler via .config.handler
const handler = (
  approvalDef as unknown as { config: { handler: (event: unknown) => Promise<unknown> } }
).config.handler;

// RoutePayload-минимум для тестов.
const event = (
  body: Record<string, unknown>,
  opts: { userWorkspaceId?: string } = {},
) => ({
  headers: {},
  queryStringParameters: {},
  pathParameters: {},
  body,
  isBase64Encoded: false,
  requestContext: { http: { method: 'POST', path: '/approval' } },
  userWorkspaceId: opts.userWorkspaceId ?? null,
});

// Мок fetch-ответа (одноразовый JSON).
const mockFetch = (responses: unknown[]) => {
  let i = 0;
  return vi.fn().mockImplementation(() => {
    const data = responses[i++];
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(''),
    });
  });
};

const emptyEmployees = { data: { credosTimeEmployees: [] } };
const emptyEntries = { data: { credosTimeEntries: [] } };

describe('approval.logic — валидация op', () => {
  it('unknown op → ok:false + error', async () => {
    const result = await handler(event({ op: 'unknown' }));
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('unknown op') });
  });

  it('нет op → ok:false', async () => {
    const result = await handler(event({}));
    expect(result).toMatchObject({ ok: false });
  });
});

describe('approval.logic — runSubmit', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch([emptyEmployees]));
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('нет from/to/employeeId → ok:false, error без fetch', async () => {
    const result = await handler(event({ op: 'submit' }));
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('from/to/employeeId') });
  });

  it('нет from → ok:false без fetch', async () => {
    const result = await handler(event({ op: 'submit', to: '2026-06-30', employeeId: 'e1' }));
    // нет from → отсекается ещё на required-проверке (до isUuid/isIsoDate)
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('from/to/employeeId') });
  });

  // UUID-заглушки для CISO-006 isUuid validation
  const EMP_UUID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  // CISO-006 вектор A: filter-инъекция в employeeId/from/to должна отклоняться.
  it('submit: не-UUID employeeId → ok:false invalid employeeId (инъекция отклонена)', async () => {
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: 'id,status[neq]:DRAFT' }),
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('invalid employeeId') });
  });

  it('submit: не-ISO from → ok:false invalid from/to (инъекция отклонена)', async () => {
    const result = await handler(
      event({ op: 'submit', from: 'date[gte]:x', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('invalid from/to') });
  });

  it('submit с полными params + пустой approvalMap → ok:true, updated:0', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        { data: { credosTimeProjects: [] } }, // buildApprovalMap projects
        { data: { credosTimeDepartments: [] } }, // buildApprovalMap depts
        emptyEntries, // entries
      ]),
    );
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: true, updated: 0 });
  });

  const PROJ_UUID = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa';
  const DEPT_UUID = 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb';
  const ENTRY_UUID = 'cccccccc-3333-4ccc-8ccc-cccccccccccc';

  it('submit: запись в approvalRequired=true проекте → PATCH вызван, updated:1', async () => {
    const mockFn = mockFetch([
      { data: { credosTimeProjects: [{ id: PROJ_UUID, approvalRequired: true, departmentId: null }] } },
      { data: { credosTimeDepartments: [] } },
      { data: { credosTimeEntries: [{ id: ENTRY_UUID, status: 'DRAFT', projectId: PROJ_UUID, employeeId: EMP_UUID }] } },
      {}, // PATCH response (setStatus)
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1 });
    // PATCH должен был быть вызван
    const calls = mockFn.mock.calls;
    const patchCall = calls.find((c: unknown[]) =>
      typeof c[0] === 'string' && c[0].includes(`/rest/credosTimeEntries/${ENTRY_UUID}`),
    );
    expect(patchCall).toBeTruthy();
  });

  it('submit: запись в approvalRequired=false проекте → не PATCH, updated:0', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        { data: { credosTimeProjects: [{ id: PROJ_UUID, approvalRequired: false, departmentId: null }] } },
        { data: { credosTimeDepartments: [] } },
        { data: { credosTimeEntries: [{ id: ENTRY_UUID, status: 'DRAFT', projectId: PROJ_UUID, employeeId: EMP_UUID }] } },
      ]),
    );
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: true, updated: 0 });
  });

  // BUG-1 (W5A.6/W5A.30): submit переотправляет REJECTED-записи (исправленный
  // отклонённый таймшит). Без фикса REJECTED не попадал в submit → сотрудник застревал.
  it('submit: REJECTED-запись переотправляется → SUBMITTED, updated:1', async () => {
    const mockFn = mockFetch([
      { data: { credosTimeProjects: [{ id: PROJ_UUID, approvalRequired: true, departmentId: null }] } },
      { data: { credosTimeDepartments: [] } },
      { data: { credosTimeEntries: [{ id: ENTRY_UUID, status: 'REJECTED', projectId: PROJ_UUID, employeeId: EMP_UUID }] } },
      {}, // PATCH
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1 });
    const patchCall = mockFn.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string' && c[0].includes(`/rest/credosTimeEntries/${ENTRY_UUID}`),
    );
    expect(patchCall).toBeTruthy();
    const body = JSON.parse((patchCall![1] as { body: string }).body);
    expect(body.status).toBe('SUBMITTED');
  });

  // BUG-1: при переотправке REJECTED→SUBMITTED rejectComment очищается (новая попытка).
  it('submit: переотправка REJECTED очищает rejectComment + аудит-поля', async () => {
    const mockFn = mockFetch([
      { data: { credosTimeProjects: [{ id: PROJ_UUID, approvalRequired: true, departmentId: null }] } },
      { data: { credosTimeDepartments: [] } },
      { data: { credosTimeEntries: [{ id: ENTRY_UUID, status: 'REJECTED', projectId: PROJ_UUID, employeeId: EMP_UUID }] } },
      {}, // PATCH
    ]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }));
    const patchCall = mockFn.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string' && c[0].includes(`/rest/credosTimeEntries/${ENTRY_UUID}`),
    );
    const body = JSON.parse((patchCall![1] as { body: string }).body);
    expect(body.rejectComment).toBeNull();
    expect(body.approvedBy).toBeNull();
    expect(body.approvedAt).toBeNull();
  });

  // BUG-1: APPROVED/SUBMITTED НЕ переотправляются (только DRAFT|REJECTED submittable).
  it('submit: APPROVED-запись НЕ переотправляется → updated:0', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        { data: { credosTimeProjects: [{ id: PROJ_UUID, approvalRequired: true, departmentId: null }] } },
        { data: { credosTimeDepartments: [] } },
        { data: { credosTimeEntries: [{ id: ENTRY_UUID, status: 'APPROVED', projectId: PROJ_UUID, employeeId: EMP_UUID }] } },
      ]),
    );
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: true, updated: 0 });
  });

  // BUG-1: смешанный период (DRAFT+REJECTED+APPROVED) → submit берёт оба submittable.
  it('submit: DRAFT+REJECTED+APPROVED → updated:2 (только DRAFT и REJECTED)', async () => {
    const ID_DRAFT = 'cccccccc-3333-4ccc-8ccc-cccccccccc01';
    const ID_REJ = 'cccccccc-3333-4ccc-8ccc-cccccccccc02';
    const ID_APP = 'cccccccc-3333-4ccc-8ccc-cccccccccc03';
    vi.stubGlobal(
      'fetch',
      mockFetch([
        { data: { credosTimeProjects: [{ id: PROJ_UUID, approvalRequired: true, departmentId: null }] } },
        { data: { credosTimeDepartments: [] } },
        { data: { credosTimeEntries: [
          { id: ID_DRAFT, status: 'DRAFT', projectId: PROJ_UUID, employeeId: EMP_UUID },
          { id: ID_REJ, status: 'REJECTED', projectId: PROJ_UUID, employeeId: EMP_UUID },
          { id: ID_APP, status: 'APPROVED', projectId: PROJ_UUID, employeeId: EMP_UUID },
        ] } },
        {}, // PATCH draft
        {}, // PATCH rejected
      ]),
    );
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: true, updated: 2 });
  });

  it('submit: approvalMap через отдел (project=null, dept=true) → updated:1', async () => {
    const mockFn = mockFetch([
      { data: { credosTimeProjects: [{ id: PROJ_UUID, approvalRequired: null, departmentId: DEPT_UUID }] } },
      { data: { credosTimeDepartments: [{ id: DEPT_UUID, approvalRequired: true }] } },
      { data: { credosTimeEntries: [{ id: ENTRY_UUID, status: 'DRAFT', projectId: PROJ_UUID, employeeId: EMP_UUID }] } },
      {}, // PATCH
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: EMP_UUID }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });
});

describe('approval.logic — runResolve: RBAC (CISO-002)', () => {
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('ids пуст → ok:false, error ids required (без fetch)', async () => {
    vi.stubGlobal('fetch', mockFetch([emptyEmployees]));
    const result = await handler(event({ op: 'approve', ids: '' }));
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('ids required') });
  });

  it('actor не менеджер → forbidden, fetch на entry НЕ вызывается', async () => {
    // resolveActor: workspaceMemberRef='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' → employee isManager:false
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }],
      },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(employeeRes),
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await handler(
      event({ op: 'approve', ids: '00000000-0000-4000-8000-000000000001', workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }),
    );
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining('руководитель'),
    });
    // После guard возврата fetch должен вызваться только 1 раз (resolveActor), НЕ 2 (нет entry fetch)
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('actor isManager=true, своя запись → пропущена (separation of duties)', async () => {
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }],
      },
    };
    const entryRes = {
      data: {
        credosTimeEntries: [{ id: '00000000-0000-4000-8000-000000000001', status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }],
      },
    };
    vi.stubGlobal(
      'fetch',
      mockFetch([
        employeeRes, // resolveActor
        entryRes,    // fetch entry by id
      ]),
    );

    const result = await handler(
      event({ op: 'approve', ids: '00000000-0000-4000-8000-000000000001', workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }),
    ) as Record<string, unknown>;
    // Запись принадлежит actor (e1 == e1) → SoD skip
    expect(result).toMatchObject({ ok: true, updated: 0, skippedOwn: 1 });
  });

  it('actor isManager=true, чужая запись → approved (updated:1)', async () => {
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }],
      },
    };
    const entryRes = {
      data: {
        // employeeId='e2' — чужая запись
        credosTimeEntries: [{ id: '00000000-0000-4000-8000-000000000001', status: 'SUBMITTED', employeeId: 'e2', projectId: 'p1' }],
      },
    };
    // PATCH setStatus вернёт ок
    const patchRes = { data: { updateCredosTimeEntry: { id: '00000000-0000-4000-8000-000000000001' } } };
    vi.stubGlobal('fetch', mockFetch([employeeRes, entryRes, patchRes]));

    const result = await handler(
      event({ op: 'approve', ids: '00000000-0000-4000-8000-000000000001', workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1, skippedOwn: 0 });
  });

  it('actor null (dev-bypass): нет workspaceMemberRef → approve пропускает guard, updated:1', async () => {
    // resolveActor(!workspaceMemberRef) → ранний return null, fetch НЕ вызывается
    const entryRes = {
      data: {
        credosTimeEntries: [{ id: '00000000-0000-4000-8000-000000000001', status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }],
      },
    };
    const patchRes = { data: { updateCredosTimeEntry: { id: '00000000-0000-4000-8000-000000000001' } } };
    vi.stubGlobal('fetch', mockFetch([entryRes, patchRes]));

    const result = await handler(event({ op: 'approve', ids: '00000000-0000-4000-8000-000000000001' }));
    // actor=null → guard пропущен (dev-режим), запись одобрена
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });

  it('запись не SUBMITTED → пропускается (updated:0)', async () => {
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }],
      },
    };
    const entryRes = {
      data: {
        // status = DRAFT, не SUBMITTED
        credosTimeEntries: [{ id: '00000000-0000-4000-8000-000000000001', status: 'DRAFT', employeeId: 'e2', projectId: 'p1' }],
      },
    };
    vi.stubGlobal('fetch', mockFetch([employeeRes, entryRes]));

    const result = await handler(
      event({ op: 'approve', ids: '00000000-0000-4000-8000-000000000001', workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }),
    );
    expect(result).toMatchObject({ ok: true, updated: 0, skippedOwn: 0 });
  });

  it('reject: те же правила RBAC (isManager guard)', async () => {
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }],
      },
    };
    vi.stubGlobal('fetch', mockFetch([employeeRes]));

    const result = await handler(
      event({ op: 'reject', ids: '00000000-0000-4000-8000-000000000001', workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }),
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('руководитель') });
  });

  it('ids с не-UUID → isUuid фильтрует, только валидные обрабатываются', async () => {
    // actor=null (dev-bypass, нет workspaceMemberRef) → guard пропущен
    const entryRes = {
      data: {
        credosTimeEntries: [{ id: '00000000-0000-4000-8000-000000000001', status: 'SUBMITTED', employeeId: 'e2', projectId: 'p1' }],
      },
    };
    const patchRes = { data: { updateCredosTimeEntry: { id: '00000000-0000-4000-8000-000000000001' } } };
    vi.stubGlobal('fetch', mockFetch([entryRes, patchRes]));

    // ids: один UUID + один не-UUID (инъекция отфильтрована)
    const result = await handler(
      event({ op: 'approve', ids: '00000000-0000-4000-8000-000000000001,not-a-uuid' }),
    );
    // не-UUID отброшен → 1 valid id → 1 approved
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });

  it('batch approve: два uuid, оба чужие → updated:2', async () => {
    const actorRes = {
      data: {
        credosTimeEmployees: [{ id: 'e-manager', isManager: true, workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }],
      },
    };
    const entry1Res = {
      data: { credosTimeEntries: [{ id: '00000000-0000-4000-8000-000000000001', status: 'SUBMITTED', employeeId: 'e-other1', projectId: 'p1' }] },
    };
    const entry2Res = {
      data: { credosTimeEntries: [{ id: '00000000-0000-4000-8000-000000000002', status: 'SUBMITTED', employeeId: 'e-other2', projectId: 'p1' }] },
    };
    const patch1 = { data: { updateCredosTimeEntry: { id: '00000000-0000-4000-8000-000000000001' } } };
    const patch2 = { data: { updateCredosTimeEntry: { id: '00000000-0000-4000-8000-000000000002' } } };
    vi.stubGlobal('fetch', mockFetch([actorRes, entry1Res, patch1, entry2Res, patch2]));

    const result = await handler(
      event({
        op: 'approve',
        ids: '00000000-0000-4000-8000-000000000001,00000000-0000-4000-8000-000000000002',
        workspaceMemberRef: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      }),
    );
    expect(result).toMatchObject({ ok: true, updated: 2, skippedOwn: 0 });
  });
});

describe('approval.logic — rejectComment (UX-gap, op=reject хранит причину)', () => {
  const REF = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const ID = '00000000-0000-4000-8000-000000000001';
  const manager = {
    data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF }] },
  };
  const submittedOther = {
    data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e-other', projectId: 'p1' }] },
  };
  const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };

  // Body PATCH-запроса (setStatus) из записанных вызовов fetch.
  const patchBody = (mockFn: ReturnType<typeof mockFetch>): Record<string, unknown> => {
    const call = mockFn.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'PATCH');
    if (!call) throw new Error('PATCH-вызов не найден');
    return JSON.parse((call[1] as { body: string }).body);
  };

  it('reject с comment → PATCH status=REJECTED + rejectComment сохранён', async () => {
    const mockFn = mockFetch([manager, submittedOther, patchOk]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(
      event({ op: 'reject', ids: ID, workspaceMemberRef: REF, comment: 'Уточните состав работ по проекту' }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1 });
    const body = patchBody(mockFn);
    expect(body.status).toBe('REJECTED');
    expect(body.rejectComment).toBe('Уточните состав работ по проекту');
  });

  it('reject без comment → rejectComment=null (backend не требует, min-длину валидирует UI)', async () => {
    const mockFn = mockFetch([manager, submittedOther, patchOk]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'reject', ids: ID, workspaceMemberRef: REF }));
    expect(patchBody(mockFn).rejectComment).toBeNull();
  });

  it('approve → rejectComment очищается (null), даже если comment передан (запись «ожила»)', async () => {
    const mockFn = mockFetch([manager, submittedOther, patchOk]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'approve', ids: ID, workspaceMemberRef: REF, comment: 'игнор' }));
    const body = patchBody(mockFn);
    expect(body.status).toBe('APPROVED');
    expect(body.rejectComment).toBeNull();
  });
});

// WI-10 (A4.3/A4.4): сотрудник отзывает СВОЮ отправку SUBMITTED → DRAFT.
describe('approval.logic — runRecall (A4.3/A4.4): SUBMITTED → DRAFT', () => {
  const REF = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const ID = '00000000-0000-4000-8000-000000000001';
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  // PATCH-body из записанных вызовов.
  const patchBody = (mockFn: ReturnType<typeof mockFetch>): Record<string, unknown> => {
    const call = mockFn.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'PATCH');
    if (!call) throw new Error('PATCH-вызов не найден');
    return JSON.parse((call[1] as { body: string }).body);
  };

  it('ids пуст → ok:false ids required (без fetch)', async () => {
    vi.stubGlobal('fetch', mockFetch([emptyEmployees]));
    const result = await handler(event({ op: 'recall', ids: '' }));
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('ids required') });
  });

  it('сотрудник отзывает СВОЮ SUBMITTED → DRAFT (updated:1, approvedBy обнулён)', async () => {
    const owner = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF }] },
    };
    const ownEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    const mockFn = mockFetch([owner, ownEntry, patchOk]);
    vi.stubGlobal('fetch', mockFn);

    const result = await handler(event({ op: 'recall', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: true, updated: 1, skippedForeign: 0 });
    const body = patchBody(mockFn);
    expect(body.status).toBe('DRAFT');
    expect(body.approvedBy).toBeNull();
    expect(body.approvedAt).toBeNull();
    expect(body.rejectComment).toBeNull();
  });

  it('сотрудник пытается отозвать ЧУЖУЮ запись → пропущена (skippedForeign:1)', async () => {
    const owner = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF }] },
    };
    const foreignEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e2', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([owner, foreignEntry]));

    const result = await handler(event({ op: 'recall', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: true, updated: 0, skippedForeign: 1 });
  });

  it('запись не SUBMITTED (APPROVED) → recall пропускает (updated:0)', async () => {
    const owner = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF }] },
    };
    const approvedEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'APPROVED', employeeId: 'e1', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([owner, approvedEntry]));

    const result = await handler(event({ op: 'recall', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: true, updated: 0, skippedForeign: 0 });
  });

  it('actor null (dev-bypass): нет workspaceMemberRef → ownership-guard пропущен, updated:1', async () => {
    const ownEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    vi.stubGlobal('fetch', mockFetch([ownEntry, patchOk]));

    const result = await handler(event({ op: 'recall', ids: ID }));
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });
});

// WI-10 (A4.25/A4.26): руководитель отзывает согласование APPROVED → SUBMITTED (Reopen).
describe('approval.logic — runRevoke (A4.25/A4.26): APPROVED → SUBMITTED', () => {
  const REF = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const ID = '00000000-0000-4000-8000-000000000001';
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  const patchBody = (mockFn: ReturnType<typeof mockFetch>): Record<string, unknown> => {
    const call = mockFn.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'PATCH');
    if (!call) throw new Error('PATCH-вызов не найден');
    return JSON.parse((call[1] as { body: string }).body);
  };

  it('ids пуст → ok:false ids required', async () => {
    vi.stubGlobal('fetch', mockFetch([emptyEmployees]));
    const result = await handler(event({ op: 'revoke', ids: '' }));
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('ids required') });
  });

  it('actor НЕ менеджер → forbidden, fetch на entry НЕ вызывается', async () => {
    const employeeRes = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF }] },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(employeeRes),
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await handler(event({ op: 'revoke', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('руководитель') });
    expect(fetchMock).toHaveBeenCalledTimes(1); // только resolveActor, без entry-fetch
  });

  it('руководитель отзывает ЧУЖОЕ согласование → APPROVED → SUBMITTED (updated:1, аудит обнулён)', async () => {
    const manager = {
      data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF }] },
    };
    const approvedOther = {
      data: { credosTimeEntries: [{ id: ID, status: 'APPROVED', employeeId: 'e-other', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    const mockFn = mockFetch([manager, approvedOther, patchOk]);
    vi.stubGlobal('fetch', mockFn);

    const result = await handler(event({ op: 'revoke', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: true, updated: 1, skippedOwn: 0 });
    const body = patchBody(mockFn);
    expect(body.status).toBe('SUBMITTED');
    expect(body.approvedBy).toBeNull();
    expect(body.approvedAt).toBeNull();
  });

  it('руководитель отзывает СВОЮ запись → SoD skip (skippedOwn:1)', async () => {
    const manager = {
      data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF }] },
    };
    const approvedOwn = {
      data: { credosTimeEntries: [{ id: ID, status: 'APPROVED', employeeId: 'e-mgr', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([manager, approvedOwn]));

    const result = await handler(event({ op: 'revoke', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: true, updated: 0, skippedOwn: 1 });
  });

  it('запись не APPROVED (SUBMITTED) → revoke пропускает (updated:0)', async () => {
    const manager = {
      data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF }] },
    };
    const submittedEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e-other', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([manager, submittedEntry]));

    const result = await handler(event({ op: 'revoke', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: true, updated: 0, skippedOwn: 0 });
  });

  it('actor null (dev-bypass): нет workspaceMemberRef → RBAC-guard пропущен, updated:1', async () => {
    const approvedEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'APPROVED', employeeId: 'e-other', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    vi.stubGlobal('fetch', mockFetch([approvedEntry, patchOk]));

    const result = await handler(event({ op: 'revoke', ids: ID }));
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });
});

// CISO-005: server-truth актора по event.userWorkspaceId + TOFU-привязка + деградация.
describe('approval.logic — CISO-005 server-identity actor', () => {
  const REF = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const UW = 'ffffffff-1111-4fff-8fff-ffffffffffff'; // event.userWorkspaceId (server-truth)
  const ID = '00000000-0000-4000-8000-000000000001';
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  // Server-truth: userWorkspaceId уже замаплен на руководителя → actor резолвится
  // по userWorkspaceRef, client workspaceMemberRef ИГНОРИРУЕТСЯ (даже если чужой).
  it('замапленный userWorkspaceId → trusted actor, чужой client-ref не влияет (approve чужой → updated:1)', async () => {
    const byUw = {
      data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: UW }] },
    };
    const entryOther = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e-other', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    // client прислал ЧУЖОЙ workspaceMemberRef — он должен быть проигнорирован.
    const mockFn = mockFetch([byUw, entryOther, patchOk]);
    vi.stubGlobal('fetch', mockFn);

    const result = await handler(
      event({ op: 'approve', ids: ID, workspaceMemberRef: 'cccccccc-dddd-4eee-8fff-aaaaaaaaaaaa' }, { userWorkspaceId: UW }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1 });
    // resolveActor ходил ТОЛЬКО по userWorkspaceRef[eq] (1 employee-fetch), не по client-ref.
    const empCalls = mockFn.mock.calls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('/rest/credosTimeEmployees?'),
    );
    expect(empCalls.length).toBe(1);
    expect((empCalls[0][0] as string)).toContain(`userWorkspaceRef%5Beq%5D%3A${UW}`);
  });

  // Server-truth: чужой actor отклонён. userWorkspaceId замаплен на НЕ-менеджера →
  // approve forbidden, даже если client-ref указывает на менеджера.
  it('замапленный userWorkspaceId на НЕ-менеджера → approve forbidden (подмена client-ref не помогает)', async () => {
    const byUw = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF, userWorkspaceRef: UW }] },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true, json: () => Promise.resolve(byUw), text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await handler(
      event({ op: 'approve', ids: ID, workspaceMemberRef: REF }, { userWorkspaceId: UW }),
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('руководитель') });
    expect(fetchMock).toHaveBeenCalledTimes(1); // только resolveActor
  });

  // recall: владелец (по server-truth) отзывает свою запись → ок.
  it('recall: владелец по server-truth (userWorkspaceRef) → SUBMITTED→DRAFT updated:1', async () => {
    const byUw = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF, userWorkspaceRef: UW }] },
    };
    const ownEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    vi.stubGlobal('fetch', mockFetch([byUw, ownEntry, patchOk]));

    const result = await handler(event({ op: 'recall', ids: ID }, { userWorkspaceId: UW }));
    expect(result).toMatchObject({ ok: true, updated: 1, skippedForeign: 0 });
  });

  // recall: чужой actor (server-truth) → чужая запись пропущена (skippedForeign).
  it('recall: чужая запись по server-truth → skippedForeign:1 (не отзывает чужое)', async () => {
    const byUw = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF, userWorkspaceRef: UW }] },
    };
    const foreignEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e2', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([byUw, foreignEntry]));

    const result = await handler(event({ op: 'recall', ids: ID }, { userWorkspaceId: UW }));
    expect(result).toMatchObject({ ok: true, updated: 0, skippedForeign: 1 });
  });

  // SoD revoke: руководитель НЕ отзывает СВОЮ запись (server-truth владелец==actor).
  it('revoke: автор-руководитель (server-truth) не отзывает свою → skippedOwn:1', async () => {
    const byUw = {
      data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: UW }] },
    };
    const ownApproved = {
      data: { credosTimeEntries: [{ id: ID, status: 'APPROVED', employeeId: 'e-mgr', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([byUw, ownApproved]));

    const result = await handler(event({ op: 'revoke', ids: ID }, { userWorkspaceId: UW }));
    expect(result).toMatchObject({ ok: true, updated: 0, skippedOwn: 1 });
  });

  // TOFU: userWorkspaceId не замаплен, но client дал workspaceMemberRef, у employee
  // userWorkspaceRef пуст → привязка (PATCH userWorkspaceRef + userMapPending) + действие.
  it('TOFU: незамапленный userWorkspaceId привязывается к employee (PATCH userWorkspaceRef+pending) и actor работает', async () => {
    const byUwEmpty = { data: { credosTimeEmployees: [] } }; // нет по userWorkspaceRef
    const byRef = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF, userWorkspaceRef: null }] },
    };
    const tofuPatchOk = {}; // PATCH привязки
    const ownEntry = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] },
    };
    const recallPatchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    const mockFn = mockFetch([byUwEmpty, byRef, tofuPatchOk, ownEntry, recallPatchOk]);
    vi.stubGlobal('fetch', mockFn);

    const result = await handler(
      event({ op: 'recall', ids: ID, workspaceMemberRef: REF }, { userWorkspaceId: UW }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1 });
    // TOFU-PATCH на employee с userWorkspaceRef + userMapPending=true.
    const tofuCall = mockFn.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string'
        && c[0].includes('/rest/credosTimeEmployees/e1')
        && (c[1] as { method?: string })?.method === 'PATCH',
    );
    expect(tofuCall).toBeTruthy();
    const body = JSON.parse((tofuCall![1] as { body: string }).body);
    expect(body.userWorkspaceRef).toBe(UW);
    expect(body.userMapPending).toBe(true);
  });

  // TOFU-коллизия: employee по client-ref уже имеет ДРУГОЙ userWorkspaceRef → не
  // перезаписываем, actor=null → approve без actor идёт по dev-bypass? Нет: actor=null
  // при наличии userWorkspaceId означает «не смогли резолвить» → guard пропускается
  // только при actor=null (как было). Проверяем что привязка НЕ перезаписана.
  it('TOFU-коллизия: employee уже замаплен другим userWorkspaceId → НЕ перезаписываем (нет PATCH привязки)', async () => {
    const OTHER_UW = '99999999-2222-4999-8999-999999999999';
    const byUwEmpty = { data: { credosTimeEmployees: [] } };
    const byRef = {
      data: { credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: OTHER_UW }] },
    };
    // actor=null → guard пропущен (как dev), entry fetch + patch для approve.
    const entryOther = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e-other', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    const mockFn = mockFetch([byUwEmpty, byRef, entryOther, patchOk]);
    vi.stubGlobal('fetch', mockFn);

    await handler(event({ op: 'approve', ids: ID, workspaceMemberRef: REF }, { userWorkspaceId: UW }));
    // Привязки-PATCH на employee/e1 быть НЕ должно (коллизия).
    const tofuCall = mockFn.mock.calls.find(
      (c: unknown[]) => typeof c[0] === 'string'
        && c[0].includes('/rest/credosTimeEmployees/e1')
        && (c[1] as { method?: string })?.method === 'PATCH',
    );
    expect(tofuCall).toBeFalsy();
  });

  // NULL-деградация: event.userWorkspaceId пуст → старый путь по workspaceMemberRef,
  // dev-flow не падает (RBAC/SoD по client-ref, trusted=false).
  it('NULL userWorkspaceId → деградация на workspaceMemberRef, не падает (approve чужой менеджером → updated:1)', async () => {
    const byRef = {
      data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: null }] },
    };
    const entryOther = {
      data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e-other', projectId: 'p1' }] },
    };
    const patchOk = { data: { updateCredosTimeEntry: { id: ID } } };
    // userWorkspaceId не передаём (null) → ветка 3, один employee-fetch по workspaceMemberRef.
    vi.stubGlobal('fetch', mockFetch([byRef, entryOther, patchOk]));

    const result = await handler(event({ op: 'approve', ids: ID, workspaceMemberRef: REF }));
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });
});

// WI-55 (W5A.7/29): optimistic CAS-skip устаревших + collect-errors (батч не падает).
describe('approval.logic — WI-55 CAS + collect-errors', () => {
  const ID1 = '00000000-0000-4000-8000-000000000001';
  const ID2 = '00000000-0000-4000-8000-000000000002';
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  // CAS: запись уже не SUBMITTED (кто-то согласовал раньше) → skip, не затираем.
  it('approve: статус уже сменился (APPROVED) между read/write → skipped:1, updated:0', async () => {
    // dev-bypass (нет workspaceMemberRef) → guard пропущен, идём в CAS.
    const alreadyApproved = {
      data: { credosTimeEntries: [{ id: ID1, status: 'APPROVED', employeeId: 'e2', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([alreadyApproved]));
    const result = await handler(event({ op: 'approve', ids: ID1 }));
    expect(result).toMatchObject({ ok: true, updated: 0, skipped: 1, failed: [] });
  });

  // collect-errors: первый PATCH падает (500) — батч НЕ бросает, идёт ко второму.
  it('approve батч: PATCH id1 падает → failed[id1], id2 проходит → updated:1', async () => {
    const entry1 = { data: { credosTimeEntries: [{ id: ID1, status: 'SUBMITTED', employeeId: 'e2', projectId: 'p1' }] } };
    const entry2 = { data: { credosTimeEntries: [{ id: ID2, status: 'SUBMITTED', employeeId: 'e3', projectId: 'p1' }] } };
    let call = 0;
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: { method?: string }) => {
      call += 1;
      // 1: GET entry1, 2: PATCH entry1 (FAIL 500), 3: GET entry2, 4: PATCH entry2 (OK)
      if (opts?.method === 'PATCH' && typeof url === 'string' && url.includes(ID1)) {
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('boom'), json: () => Promise.resolve({}) });
      }
      const data = call === 1 ? entry1 : entry2;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data), text: () => Promise.resolve('') });
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await handler(event({ op: 'approve', ids: `${ID1},${ID2}` })) as Record<string, unknown>;
    expect(result).toMatchObject({ ok: true, updated: 1 });
    expect((result.failed as unknown[]).length).toBe(1);
    expect((result.failed as { id: string }[])[0].id).toBe(ID1);
  });

  // revoke CAS: запись уже SUBMITTED (revoke кем-то выполнен) → skipped, не падает.
  it('revoke: запись уже SUBMITTED (не APPROVED) → skipped:1, updated:0', async () => {
    const already = {
      data: { credosTimeEntries: [{ id: ID1, status: 'SUBMITTED', employeeId: 'e2', projectId: 'p1' }] },
    };
    vi.stubGlobal('fetch', mockFetch([already]));
    const result = await handler(event({ op: 'revoke', ids: ID1 }));
    expect(result).toMatchObject({ ok: true, updated: 0, skipped: 1, failed: [] });
  });
});

// WI-56 (W5A.11/12/24): аудит resolvedBy/At (resolver) + revokedBy/At (кто отозвал).
describe('approval.logic — WI-56 аудит resolver/revoke', () => {
  const REF = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const UW = 'ffffffff-1111-4fff-8fff-ffffffffffff';
  const ID = '00000000-0000-4000-8000-000000000001';
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  const patchBody = (mockFn: ReturnType<typeof mockFetch>): Record<string, unknown> => {
    const call = mockFn.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'PATCH');
    if (!call) throw new Error('PATCH-вызов не найден');
    return JSON.parse((call[1] as { body: string }).body);
  };

  // approve: approvedBy + resolvedBy = server-actor (userWorkspaceId), revoked-поля null.
  it('approve: approvedBy+resolvedBy=actor (server-truth), revokedBy=null', async () => {
    const byUw = { data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: UW }] } };
    const entryOther = { data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e-other', projectId: 'p1' }] } };
    const mockFn = mockFetch([byUw, entryOther, {}]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'approve', ids: ID }, { userWorkspaceId: UW }));
    const body = patchBody(mockFn);
    expect(body.status).toBe('APPROVED');
    expect(body.approvedBy).toBe(UW);
    expect(body.resolvedBy).toBe(UW);
    expect(body.revokedBy).toBeNull();
  });

  // reject: approvedBy НЕ ставится (разведена семантика), resolvedBy=actor, rejectComment.
  it('reject: approvedBy=null, resolvedBy=actor, rejectComment сохранён (семантика разведена)', async () => {
    const byUw = { data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: UW }] } };
    const entryOther = { data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e-other', projectId: 'p1' }] } };
    const mockFn = mockFetch([byUw, entryOther, {}]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'reject', ids: ID, comment: 'Уточните состав' }, { userWorkspaceId: UW }));
    const body = patchBody(mockFn);
    expect(body.status).toBe('REJECTED');
    expect(body.approvedBy).toBeNull();
    expect(body.resolvedBy).toBe(UW);
    expect(body.resolvedAt).toEqual(expect.any(String));
    expect(body.rejectComment).toBe('Уточните состав');
  });

  // revoke: revokedBy=server-actor записан, approve/resolve-аудит обнулён (W5A.24).
  it('revoke: revokedBy=actor (server-truth), approvedBy+resolvedBy обнулены, без REVOKED-статуса', async () => {
    const byUw = { data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: UW }] } };
    const approvedOther = { data: { credosTimeEntries: [{ id: ID, status: 'APPROVED', employeeId: 'e-other', projectId: 'p1' }] } };
    const mockFn = mockFetch([byUw, approvedOther, {}]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'revoke', ids: ID }, { userWorkspaceId: UW }));
    const body = patchBody(mockFn);
    expect(body.status).toBe('SUBMITTED'); // не REVOKED — 4 статуса сохранены
    expect(body.revokedBy).toBe(UW);
    expect(body.revokedAt).toEqual(expect.any(String));
    expect(body.approvedBy).toBeNull();
    expect(body.approvedAt).toBeNull();
    expect(body.resolvedBy).toBeNull();
  });

  // recall: revokedBy=server-actor (сотрудник сам отозвал отправку).
  it('recall: revokedBy=actor (сотрудник отозвал свою отправку), resolver-аудит null', async () => {
    const byUw = { data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF, userWorkspaceRef: UW }] } };
    const ownEntry = { data: { credosTimeEntries: [{ id: ID, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] } };
    const mockFn = mockFetch([byUw, ownEntry, {}]);
    vi.stubGlobal('fetch', mockFn);
    await handler(event({ op: 'recall', ids: ID }, { userWorkspaceId: UW }));
    const body = patchBody(mockFn);
    expect(body.status).toBe('DRAFT');
    expect(body.revokedBy).toBe(UW);
    expect(body.resolvedBy).toBeNull();
    expect(body.approvedBy).toBeNull();
  });
});

// WI-57 (W5A.5): reject-defense — backend валидирует полноту submit сотрудника.
describe('approval.logic — WI-57 reject-defense (полнота submit)', () => {
  const ID1 = '00000000-0000-4000-8000-000000000001';
  const ID2 = '00000000-0000-4000-8000-000000000002';
  const FROM = '2026-06-01';
  const TO = '2026-06-30';
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  // Неполная выборка: сотрудник e1 имеет 2 SUBMITTED, в reject передан только 1 → отказ.
  it('reject c периодом: передан не весь submit сотрудника → ok:false, incompleteEmployees', async () => {
    // dev-bypass actor=null. Порядок fetch defense: GET id1 (employeeId) → GET все SUBMITTED e1.
    const entry1 = { data: { credosTimeEntries: [{ id: ID1, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] } };
    const allOfE1 = { data: { credosTimeEntries: [
      { id: ID1, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' },
      { id: ID2, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }, // НЕ в ids
    ] } };
    vi.stubGlobal('fetch', mockFetch([entry1, allOfE1]));
    const result = await handler(event({ op: 'reject', ids: ID1, from: FROM, to: TO })) as Record<string, unknown>;
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('весь submit') });
    expect(result.incompleteEmployees).toEqual(['e1']);
  });

  // Полная выборка: все SUBMITTED-записи сотрудника переданы → reject проходит.
  it('reject c периодом: передан весь submit → проходит (updated:1)', async () => {
    const entry1 = { data: { credosTimeEntries: [{ id: ID1, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] } };
    const allOfE1 = { data: { credosTimeEntries: [
      { id: ID1, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' },
    ] } };
    // defense ok → далее CAS-цикл: GET id1 + PATCH.
    const casEntry1 = { data: { credosTimeEntries: [{ id: ID1, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] } };
    vi.stubGlobal('fetch', mockFetch([entry1, allOfE1, casEntry1, {}]));
    const result = await handler(event({ op: 'reject', ids: ID1, from: FROM, to: TO }));
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });

  // Без периода (from/to) defense неприменима — reject как раньше (обратная совместимость).
  it('reject без from/to: defense пропущена, reject работает по ids (updated:1)', async () => {
    const casEntry1 = { data: { credosTimeEntries: [{ id: ID1, status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }] } };
    vi.stubGlobal('fetch', mockFetch([casEntry1, {}]));
    const result = await handler(event({ op: 'reject', ids: ID1 }));
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });
});
