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
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('from/to/employeeId') });
  });

  it('submit с полными params + пустой approvalMap → ok:true, updated:0', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        emptyEmployees, // resolveActor (workspaceMemberRef пуст → первый fetch? нет)
        { data: { credosTimeProjects: [] } }, // buildApprovalMap projects
        { data: { credosTimeDepartments: [] } }, // buildApprovalMap depts
        emptyEntries, // entries
      ]),
    );
    const result = await handler(
      event({ op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: 'e1' }),
    );
    expect(result).toMatchObject({ ok: true, updated: 0 });
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
    // resolveActor: workspaceMemberRef='ref1' → employee isManager:false
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: 'ref1' }],
      },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(employeeRes),
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await handler(
      event({ op: 'approve', ids: 'entry-1', workspaceMemberRef: 'ref1' }),
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
        credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: 'ref1' }],
      },
    };
    const entryRes = {
      data: {
        credosTimeEntries: [{ id: 'entry-1', status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }],
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
      event({ op: 'approve', ids: 'entry-1', workspaceMemberRef: 'ref1' }),
    ) as Record<string, unknown>;
    // Запись принадлежит actor (e1 == e1) → SoD skip
    expect(result).toMatchObject({ ok: true, updated: 0, skippedOwn: 1 });
  });

  it('actor isManager=true, чужая запись → approved (updated:1)', async () => {
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: 'ref1' }],
      },
    };
    const entryRes = {
      data: {
        // employeeId='e2' — чужая запись
        credosTimeEntries: [{ id: 'entry-1', status: 'SUBMITTED', employeeId: 'e2', projectId: 'p1' }],
      },
    };
    // PATCH setStatus вернёт ок
    const patchRes = { data: { updateCredosTimeEntry: { id: 'entry-1' } } };
    vi.stubGlobal('fetch', mockFetch([employeeRes, entryRes, patchRes]));

    const result = await handler(
      event({ op: 'approve', ids: 'entry-1', workspaceMemberRef: 'ref1' }),
    );
    expect(result).toMatchObject({ ok: true, updated: 1, skippedOwn: 0 });
  });

  it('actor null (dev-bypass): нет workspaceMemberRef → approve пропускает guard, updated:1', async () => {
    // resolveActor(!workspaceMemberRef) → ранний return null, fetch НЕ вызывается
    const entryRes = {
      data: {
        credosTimeEntries: [{ id: 'entry-1', status: 'SUBMITTED', employeeId: 'e1', projectId: 'p1' }],
      },
    };
    const patchRes = { data: { updateCredosTimeEntry: { id: 'entry-1' } } };
    vi.stubGlobal('fetch', mockFetch([entryRes, patchRes]));

    const result = await handler(event({ op: 'approve', ids: 'entry-1' }));
    // actor=null → guard пропущен (dev-режим), запись одобрена
    expect(result).toMatchObject({ ok: true, updated: 1 });
  });

  it('запись не SUBMITTED → пропускается (updated:0)', async () => {
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: 'ref1' }],
      },
    };
    const entryRes = {
      data: {
        // status = DRAFT, не SUBMITTED
        credosTimeEntries: [{ id: 'entry-1', status: 'DRAFT', employeeId: 'e2', projectId: 'p1' }],
      },
    };
    vi.stubGlobal('fetch', mockFetch([employeeRes, entryRes]));

    const result = await handler(
      event({ op: 'approve', ids: 'entry-1', workspaceMemberRef: 'ref1' }),
    );
    expect(result).toMatchObject({ ok: true, updated: 0, skippedOwn: 0 });
  });

  it('reject: те же правила RBAC (isManager guard)', async () => {
    const employeeRes = {
      data: {
        credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: 'ref1' }],
      },
    };
    vi.stubGlobal('fetch', mockFetch([employeeRes]));

    const result = await handler(
      event({ op: 'reject', ids: 'entry-1', workspaceMemberRef: 'ref1' }),
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('руководитель') });
  });
});
