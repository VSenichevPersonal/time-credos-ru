import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// AUDIT-LOG (MVP-гибрид): журнал изменений трудозатрат credosTimeEntryLog.
// Проверяем: лог пишется на create/update/delete; actor берётся из resolveActor
// (server-truth); сбой записи лога НЕ валит основную CRUD-операцию.
// Разведка: AUDIT_LOG_PERIOD_LOCKDOWN.md §3 (гибрид: create — native+лог, diff —
// лог), shared/write-entry-log.ts (побочность через try/catch).

import { writeEntryLog } from './shared/write-entry-log';
import timeDef from './time-entry-api.logic';

const handler = (
  timeDef as unknown as { config: { handler: (event: unknown) => Promise<unknown> } }
).config.handler;

const event = (body: Record<string, unknown>, userWorkspaceId: string | null = null) => ({
  headers: {},
  queryStringParameters: {},
  pathParameters: {},
  body,
  isBase64Encoded: false,
  requestContext: { http: { method: 'POST', path: '/time-entry' } },
  userWorkspaceId,
});

// mockFetch с записью всех вызовов; ответы по очереди (как в time-entry-api.logic.test).
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

const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VALID_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const empRes = { data: { credosTimeEmployees: [{ id: EMP, name: 'Test' }] } };
const settingsRes = { data: { credosTimeSettings: [] } };
const emptyEntries = { data: { credosTimeEntries: [] } };

// Вызовы записи лога — POST на /rest/credosTimeEntryLogs.
const logPosts = (mockFn: ReturnType<typeof vi.fn>) =>
  mockFn.mock.calls.filter(
    (c) =>
      (c[1] as { method?: string })?.method === 'POST' &&
      String(c[0]).includes('credosTimeEntryLogs'),
  );

const logBody = (call: unknown[]): Record<string, unknown> =>
  JSON.parse(String((call[1] as { body?: string })?.body ?? '{}'));

describe('audit-log: запись журнала на мутациях трудозатрат', () => {
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('create (POST) → пишется строка лога action=CREATE с newHours', async () => {
    // uwId=null + нет workspaceMemberRef → resolveActor возвращает null БЕЗ fetch
    // (контракт деградации). Очередь начинается с resolveEmployeeId.
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      settingsRes,
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-1' } } }, // POST entry
      {}, // POST log
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: true });
    const logs = logPosts(mockFn);
    expect(logs).toHaveLength(1);
    const body = logBody(logs[0]);
    expect(body).toMatchObject({ action: 'CREATE', newHours: 8, oldHours: null });
    expect(body.entryId).toBe('new-1');
  });

  it('update (PATCH) с реальным изменением часов → лог action=UPDATE с old→new', async () => {
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'DRAFT', projectId: null, hours: 4 }] } }, // pre-read
      settingsRes,
      { data: { updateCredosTimeEntry: { id: VALID_ID } } }, // PATCH entry
      {}, // POST log
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', id: VALID_ID, hours: '6', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: true });
    const logs = logPosts(mockFn);
    expect(logs).toHaveLength(1);
    expect(logBody(logs[0])).toMatchObject({ action: 'UPDATE', oldHours: 4, newHours: 6 });
  });

  it('update без изменения часов (те же 4ч) → лог UPDATE НЕ пишется (не diff часов)', async () => {
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'DRAFT', projectId: null, hours: 4 }] } }, // pre-read
      settingsRes,
      { data: { updateCredosTimeEntry: { id: VALID_ID } } }, // PATCH
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', id: VALID_ID, hours: '4', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: true });
    expect(logPosts(mockFn)).toHaveLength(0);
  });

  it('delete → лог action=DELETE с oldHours, после реального DELETE', async () => {
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'DRAFT', projectId: null, hours: 8, date: '2026-06-10T00:00:00.000Z' }] } }, // pre-read
      {}, // DELETE
      {}, // POST log
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'delete', id: VALID_ID }));
    expect(result).toMatchObject({ ok: true });
    const logs = logPosts(mockFn);
    expect(logs).toHaveLength(1);
    expect(logBody(logs[0])).toMatchObject({ action: 'DELETE', oldHours: 8, newHours: null });
  });

  it('APPROVED-запись (delete заблокирован CISO-011) → лог НЕ пишется', async () => {
    const mockFn = mockFetch([
      empRes, // resolveEmployeeId
      { data: { credosTimeEntries: [{ id: VALID_ID, status: 'APPROVED', projectId: null, hours: 8 }] } }, // pre-read
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'delete', id: VALID_ID }));
    expect(result).toMatchObject({ ok: false, error: 'cannot_modify_approved' });
    expect(logPosts(mockFn)).toHaveLength(0);
  });

  it('actor = resolveActor (server-truth): trusted-актор → его employeeId в логе', async () => {
    const UW = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    const TRUSTED_EMP = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const mockFn = mockFetch([
      // resolveActor ветка 1: userWorkspaceId задан → employee по userWorkspaceRef[eq]
      { data: { credosTimeEmployees: [{ id: TRUSTED_EMP, isManager: false, userWorkspaceRef: UW, workspaceMemberRef: null }] } },
      empRes, // resolveEmployeeId (по-прежнему отдельно)
      settingsRes,
      emptyEntries, // findExistingEntryIdByKey
      { data: { createCredosTimeEntry: { id: 'new-tr' } } }, // POST entry
      {}, // POST log
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }, UW));
    expect(result).toMatchObject({ ok: true });
    const logs = logPosts(mockFn);
    expect(logs).toHaveLength(1);
    // actor в логе = server-truth employeeId, НЕ client.
    expect(logBody(logs[0]).actor).toBe(TRUSTED_EMP);
  });

  it('сбой записи лога НЕ валит основную операцию (create всё равно ok)', async () => {
    // POST лога вернёт ok:false → writeEntryLog глотает, операция остаётся ok.
    let i = 0;
    const responses: unknown[] = [
      empRes, settingsRes, emptyEntries,
      { data: { createCredosTimeEntry: { id: 'new-x' } } },
    ];
    const mockFn = vi.fn().mockImplementation((url: string) => {
      const isLog = String(url).includes('credosTimeEntryLogs');
      if (isLog) {
        // Лог падает: ok:false (REST-ошибка). writeEntryLog НЕ должен бросать.
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}), text: () => Promise.resolve('boom') });
      }
      const data = responses[i++] ?? {};
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data), text: () => Promise.resolve('') });
    });
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({ op: 'upsert', hours: '8', date: '2026-06-10' }));
    expect(result).toMatchObject({ ok: true, entry: { id: 'new-x' } });
  });
});

describe('writeEntryLog: побочность (никогда не бросает)', () => {
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fetch бросает исключение → writeEntryLog возвращает false, не пробрасывает', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const ok = await writeEntryLog(
      { employeeId: EMP, isManager: false, trusted: true },
      { entryId: VALID_ID, action: 'UPDATE', oldHours: 4, newHours: 6 },
    );
    expect(ok).toBe(false);
  });

  it('REST вернул не-2xx → false, не бросает', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 403, json: () => Promise.resolve({}), text: () => Promise.resolve('forbidden'),
    }));
    const ok = await writeEntryLog(null, { entryId: VALID_ID, action: 'DELETE', oldHours: 8 });
    expect(ok).toBe(false);
  });

  it('actor=null (деградация) → actor в body null, лог всё равно отправляется', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 201, json: () => Promise.resolve({}), text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', fetchMock);
    const ok = await writeEntryLog(null, { entryId: VALID_ID, action: 'CREATE', newHours: 8 });
    expect(ok).toBe(true);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.actor).toBeNull();
    expect(body.action).toBe('CREATE');
  });
});
