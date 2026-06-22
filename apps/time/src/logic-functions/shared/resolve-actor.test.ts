import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveActor } from './resolve-actor';

// RoutePayload-минимум.
const event = (userWorkspaceId: string | null = null) =>
  ({
    headers: {},
    queryStringParameters: {},
    pathParameters: {},
    body: {},
    isBase64Encoded: false,
    requestContext: { http: { method: 'POST', path: '/x' } },
    userWorkspaceId,
  }) as never;

const mockFetch = (responses: unknown[]) => {
  let i = 0;
  return vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responses[i++]),
      text: () => Promise.resolve(''),
    }),
  );
};

const REF = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const UW = 'ffffffff-1111-4fff-8fff-ffffffffffff';
const emptyEmp = { data: { credosTimeEmployees: [] } };

describe('resolve-actor (SSOT серверного actor)', () => {
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'tok');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('ветка-1 server-truth: userWorkspaceId замаплен → trusted actor по userWorkspaceRef', async () => {
    const fetchMock = mockFetch([
      { data: { credosTimeEmployees: [{ id: 'e-mgr', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: UW }] } },
    ]);
    vi.stubGlobal('fetch', fetchMock);
    // client прислал ЧУЖОЙ ref — должен игнорироваться (server-truth приоритетнее).
    const actor = await resolveActor(event(UW), 'cccccccc-dddd-4eee-8fff-aaaaaaaaaaaa');
    expect(actor).toEqual({ employeeId: 'e-mgr', isManager: true, trusted: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain(`userWorkspaceRef%5Beq%5D%3A${UW}`);
  });

  it('ветка-2 TOFU: uwId не замаплен, ref свободен → привязка (PATCH) + trusted actor', async () => {
    const fetchMock = mockFetch([
      emptyEmp, // userWorkspaceRef[eq] — не найден
      { data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF, userWorkspaceRef: null }] } },
      {}, // PATCH привязки
    ]);
    vi.stubGlobal('fetch', fetchMock);
    const actor = await resolveActor(event(UW), REF);
    expect(actor).toEqual({ employeeId: 'e1', isManager: false, trusted: true });
    const patch = fetchMock.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'PATCH');
    expect(patch).toBeDefined();
    expect(String((patch![1] as { body: string }).body)).toContain('userMapPending');
  });

  it('ветка-2 коллизия: ref занят ДРУГИМ uwId → actor=null, без PATCH', async () => {
    const fetchMock = mockFetch([
      emptyEmp,
      { data: { credosTimeEmployees: [{ id: 'e1', isManager: true, workspaceMemberRef: REF, userWorkspaceRef: 'other-uw' }] } },
    ]);
    vi.stubGlobal('fetch', fetchMock);
    const actor = await resolveActor(event(UW), REF);
    expect(actor).toBeNull();
    expect(fetchMock.mock.calls.some((c) => (c[1] as { method?: string })?.method === 'PATCH')).toBe(false);
  });

  it('ветка-3 деградация: uwId NULL + валидный ref → untrusted actor', async () => {
    const fetchMock = mockFetch([
      { data: { credosTimeEmployees: [{ id: 'e1', isManager: false, workspaceMemberRef: REF, userWorkspaceRef: null }] } },
    ]);
    vi.stubGlobal('fetch', fetchMock);
    const actor = await resolveActor(event(null), REF);
    expect(actor).toEqual({ employeeId: 'e1', isManager: false, trusted: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('деградация без fetch: uwId NULL + ref отсутствует → null, fetch НЕ вызывается (CRUD не ломается)', async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal('fetch', fetchMock);
    const actor = await resolveActor(event(null), undefined);
    expect(actor).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('деградация без fetch: uwId NULL + невалидный ref (инъекция) → null, fetch НЕ вызывается', async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal('fetch', fetchMock);
    const actor = await resolveActor(event(null), 'not-a-uuid,active[eq]:false');
    expect(actor).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
