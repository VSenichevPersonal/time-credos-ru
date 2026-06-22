import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveMarketingActor, writeMarketingLog } from './write-marketing-log';

// MARKETING-LOG: контракт write-marketing-log.
// writeMarketingLog НИКОГДА не бросает — сбой лога не валит UPDATE проекта.
// resolveMarketingActor — server-truth по userWorkspaceId, мягкая деградация в null.

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('TWENTY_API_URL', 'http://test');
  vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
});
afterEach(() => vi.unstubAllEnvs());

const ok = (status = 200) =>
  Promise.resolve({ ok: status < 400, status } as Response);

const okJson = (data: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as unknown as Response);

const UW = 'ffffffff-1111-4fff-8fff-ffffffffffff';
const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROJ = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('writeMarketingLog — контракт безопасности (не роняет UPDATE проекта)', () => {
  it('успех → true', async () => {
    mockFetch.mockReturnValueOnce(ok(200));
    const r = await writeMarketingLog({ projectId: PROJ, fieldName: 'ndaLevel', oldValue: 'A', newValue: 'B', actor: EMP });
    expect(r).toBe(true);
  });

  it('res.ok=false → false (не throw)', async () => {
    mockFetch.mockReturnValueOnce(ok(500));
    const r = await writeMarketingLog({ projectId: PROJ, fieldName: 'isPublished', newValue: 'true' });
    expect(r).toBe(false);
  });

  it('fetch throws → false (не throw)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const r = await writeMarketingLog({ projectId: null, fieldName: 'canPublishOnSite' });
    expect(r).toBe(false);
  });

  it('body: fieldName/oldValue/newValue/actor/projectId/changedAt', async () => {
    mockFetch.mockReturnValueOnce(ok());
    await writeMarketingLog({ projectId: PROJ, fieldName: 'ndaLevel', oldValue: 'NDA_FULL', newValue: 'NONE', actor: EMP });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.fieldName).toBe('ndaLevel');
    expect(body.oldValue).toBe('NDA_FULL');
    expect(body.newValue).toBe('NONE');
    expect(body.actor).toBe(EMP);
    expect(body.projectId).toBe(PROJ);
    expect(typeof body.changedAt).toBe('string');
  });

  it('отсутствующие old/new/actor → null в body (не undefined)', async () => {
    mockFetch.mockReturnValueOnce(ok());
    await writeMarketingLog({ projectId: PROJ, fieldName: 'isPublished' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.oldValue).toBeNull();
    expect(body.newValue).toBeNull();
    expect(body.actor).toBeNull();
  });

  it('POST на /rest/credosTimeMarketingLogs', async () => {
    mockFetch.mockReturnValueOnce(ok());
    await writeMarketingLog({ projectId: PROJ, fieldName: 'ndaLevel' });
    expect(String(mockFetch.mock.calls[0][0])).toContain('/rest/credosTimeMarketingLogs');
    expect((mockFetch.mock.calls[0][1] as { method: string }).method).toBe('POST');
  });
});

describe('resolveMarketingActor — server-truth по userWorkspaceId', () => {
  it('userWorkspaceId замаплен → employeeId', async () => {
    mockFetch.mockReturnValueOnce(okJson({ data: { credosTimeEmployees: [{ id: EMP }] } }));
    const r = await resolveMarketingActor(UW);
    expect(r).toBe(EMP);
    // фильтр по userWorkspaceRef[eq]
    expect(String(mockFetch.mock.calls[0][0])).toContain(`userWorkspaceRef[eq]:${UW}`);
  });

  it('userWorkspaceId пуст → null БЕЗ fetch', async () => {
    const r = await resolveMarketingActor(null);
    expect(r).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('userWorkspaceId не UUID → null БЕЗ fetch', async () => {
    const r = await resolveMarketingActor('not-a-uuid');
    expect(r).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('сотрудник не найден → null', async () => {
    mockFetch.mockReturnValueOnce(okJson({ data: { credosTimeEmployees: [] } }));
    const r = await resolveMarketingActor(UW);
    expect(r).toBeNull();
  });

  it('fetch throws → null (не валит)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const r = await resolveMarketingActor(UW);
    expect(r).toBeNull();
  });
});
