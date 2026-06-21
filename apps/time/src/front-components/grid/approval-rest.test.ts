import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPost = vi.fn();
const mockPatch = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ post: mockPost, patch: mockPatch })),
}));

import { resolveEntries, submitEntries } from './approval-rest';

beforeEach(() => { mockPost.mockReset(); mockPatch.mockReset(); });

// ─── submitEntries ────────────────────────────────────────────────────────

describe('submitEntries — /s/approval ok', () => {
  it('route ok=true → не вызывает fallback PATCH', async () => {
    mockPost.mockResolvedValueOnce({ ok: true, updated: 3 });
    await submitEntries('2026-06-01', '2026-06-30', 'emp-1', ['id1', 'id2']);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('POST body содержит op=submit + from/to/employeeId', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await submitEntries('2026-06-01', '2026-06-30', 'emp-1', []);
    expect(mockPost).toHaveBeenCalledWith('/s/approval', {
      op: 'submit', from: '2026-06-01', to: '2026-06-30', employeeId: 'emp-1',
    });
  });
});

describe('submitEntries — /s/approval недоступна (fallback)', () => {
  it('route throw → PATCH каждой записи в SUBMITTED', async () => {
    mockPost.mockRejectedValueOnce(new Error('500'));
    mockPatch.mockResolvedValue({});
    await submitEntries('2026-06-01', '2026-06-30', 'emp-1', ['a', 'b', 'c']);
    expect(mockPatch).toHaveBeenCalledTimes(3);
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeEntries/a',
      expect.objectContaining({ status: 'SUBMITTED' }),
    );
  });

  it('route ok=false → PATCH fallback', async () => {
    mockPost.mockResolvedValueOnce({ ok: false });
    mockPatch.mockResolvedValue({});
    await submitEntries('2026-06-01', '2026-06-30', 'emp-1', ['x']);
    expect(mockPatch).toHaveBeenCalledTimes(1);
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeEntries/x',
      expect.objectContaining({ status: 'SUBMITTED' }),
    );
  });
});

// ─── resolveEntries ───────────────────────────────────────────────────────

describe('resolveEntries — approve', () => {
  it('route ok → не вызывает fallback', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await resolveEntries(['id1'], true);
    expect(mockPatch).not.toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledWith('/s/approval', expect.objectContaining({ op: 'approve' }));
  });

  it('route fail → PATCH APPROVED + approvedAt', async () => {
    mockPost.mockRejectedValueOnce(new Error('x'));
    mockPatch.mockResolvedValue({});
    await resolveEntries(['id1', 'id2'], true);
    expect(mockPatch).toHaveBeenCalledTimes(2);
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeEntries/id1',
      expect.objectContaining({ status: 'APPROVED', approvedAt: expect.any(String) }),
    );
  });
});

describe('resolveEntries — reject', () => {
  it('route ok → PATCH не вызывается', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await resolveEntries(['id3'], false);
    expect(mockPatch).not.toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledWith('/s/approval', expect.objectContaining({ op: 'reject' }));
  });

  it('route fail → PATCH REJECTED + approvedAt', async () => {
    mockPost.mockRejectedValueOnce(new Error('x'));
    mockPatch.mockResolvedValue({});
    await resolveEntries(['id4'], false);
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeEntries/id4',
      expect.objectContaining({ status: 'REJECTED', approvedAt: expect.any(String) }),
    );
  });

  it('ids передаются как comma-joined строка в route', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await resolveEntries(['a', 'b', 'c'], false);
    expect(mockPost).toHaveBeenCalledWith('/s/approval', expect.objectContaining({ ids: 'a,b,c' }));
  });

  // UC-APR-04: причина отклонения должна доходить до бэка (rejectComment).
  it('comment передаётся в route как поле comment', async () => {
    mockPost.mockResolvedValueOnce({ ok: true });
    await resolveEntries(['id5'], false, 'нет описания работ');
    expect(mockPost).toHaveBeenCalledWith(
      '/s/approval',
      expect.objectContaining({ op: 'reject', comment: 'нет описания работ' }),
    );
  });

  it('comment пишется в rejectComment при fallback PATCH', async () => {
    mockPost.mockRejectedValueOnce(new Error('x'));
    mockPatch.mockResolvedValue({});
    await resolveEntries(['id6'], false, 'переделать');
    expect(mockPatch).toHaveBeenCalledWith(
      '/rest/credosTimeEntries/id6',
      expect.objectContaining({ status: 'REJECTED', rejectComment: 'переделать' }),
    );
  });

  it('approve не отправляет comment и очищает rejectComment в fallback', async () => {
    mockPost.mockRejectedValueOnce(new Error('x'));
    mockPatch.mockResolvedValue({});
    await resolveEntries(['id7'], true, 'не должно попасть');
    const [, body] = mockPatch.mock.calls[0];
    expect(body).toMatchObject({ status: 'APPROVED', rejectComment: null });
  });
});
