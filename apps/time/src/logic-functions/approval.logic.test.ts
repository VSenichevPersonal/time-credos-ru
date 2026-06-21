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
