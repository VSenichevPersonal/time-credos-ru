import { beforeEach, describe, expect, it, vi } from 'vitest';

import { writeEntryLog } from './write-entry-log';
import type { Actor } from './resolve-actor';

// КОНТРАКТ: writeEntryLog никогда не бросает — ошибка лога не роняет основную операцию.
// CISO: actor из server-truth resolveActor; entryId в body (не в filter-строку).

const actor: Actor = { employeeId: 'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee', name: 'Иванов' };

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => vi.clearAllMocks());

const ok = (status = 200) =>
  Promise.resolve({ ok: status < 400, status } as Response);

describe('writeEntryLog — контракт безопасности (не роняет мутацию)', () => {
  it('успех → true (лог записан)', async () => {
    mockFetch.mockReturnValueOnce(ok(200));
    const r = await writeEntryLog(actor, { entryId: 'a1b2c3d4-0000-4000-a000-000000000001', action: 'CREATE', newHours: 8 });
    expect(r).toBe(true);
  });

  it('res.ok=false → false (не throw, операция продолжается)', async () => {
    mockFetch.mockReturnValueOnce(ok(500));
    const r = await writeEntryLog(actor, { entryId: null, action: 'DELETE' });
    expect(r).toBe(false);
  });

  it('fetch throws → false (не throw)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const r = await writeEntryLog(actor, { entryId: null, action: 'UPDATE' });
    expect(r).toBe(false);
  });

  it('actor=null → body.actor=null (деградация без краша)', async () => {
    mockFetch.mockReturnValueOnce(ok());
    await writeEntryLog(null, { entryId: null, action: 'STATUS', oldStatus: 'DRAFT', newStatus: 'SUBMITTED' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.actor).toBeNull();
  });

  it('body содержит action + actor.employeeId', async () => {
    mockFetch.mockReturnValueOnce(ok());
    await writeEntryLog(actor, { entryId: 'a1b2c3d4-0000-4000-a000-000000000002', action: 'UPDATE', oldHours: 6, newHours: 8 });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.action).toBe('UPDATE');
    expect(body.actor).toBe(actor.employeeId);
    expect(body.oldHours).toBe(6);
    expect(body.newHours).toBe(8);
  });

  it('body.entryId передаётся (join-column, не filter)', async () => {
    mockFetch.mockReturnValueOnce(ok());
    const entryId = 'a1b2c3d4-0000-4000-a000-000000000003';
    await writeEntryLog(actor, { entryId, action: 'DELETE' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.entryId).toBe(entryId);
  });

  it('STATUS action: oldStatus/newStatus в body', async () => {
    mockFetch.mockReturnValueOnce(ok());
    await writeEntryLog(actor, { entryId: null, action: 'STATUS', oldStatus: 'SUBMITTED', newStatus: 'APPROVED' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.oldStatus).toBe('SUBMITTED');
    expect(body.newStatus).toBe('APPROVED');
  });

  it('отсутствующие поля → null в body (не undefined)', async () => {
    mockFetch.mockReturnValueOnce(ok());
    await writeEntryLog(actor, { entryId: null, action: 'CREATE' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.oldHours).toBeNull();
    expect(body.newHours).toBeNull();
    expect(body.oldStatus).toBeNull();
    expect(body.newStatus).toBeNull();
  });
});
