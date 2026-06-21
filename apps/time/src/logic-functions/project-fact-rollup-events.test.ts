import { beforeEach, describe, expect, it, vi } from 'vitest';

import { onEntryCreated, onEntryDeleted, onEntryUpdated, wrapEvent } from './project-fact-rollup-events';

const mockRecalcProjects = vi.fn();
vi.mock('./project-fact-rollup', () => ({
  recalcProjects: (...args: unknown[]) => mockRecalcProjects(...args),
}));

const event = (before?: object | null, after?: object | null) => ({
  properties: { before, after },
}) as any;

beforeEach(() => {
  mockRecalcProjects.mockResolvedValue(1);
  vi.clearAllMocks();
});

describe('onEntryCreated', () => {
  it('вызывает recalcProjects с projectId из after', async () => {
    const res = await onEntryCreated(event(null, { projectId: 'p1' }));
    expect(mockRecalcProjects).toHaveBeenCalledWith(['p1']);
    expect(res).toEqual({ ok: true, recalced: 1 });
  });

  it('after без projectId → recalcProjects с [null]', async () => {
    mockRecalcProjects.mockResolvedValue(0);
    const res = await onEntryCreated(event(null, {}));
    expect(mockRecalcProjects).toHaveBeenCalledWith([null]);
    expect(res.recalced).toBe(0);
  });

  it('after = undefined → recalcProjects с [null]', async () => {
    mockRecalcProjects.mockResolvedValue(0);
    await onEntryCreated(event());
    expect(mockRecalcProjects).toHaveBeenCalledWith([null]);
  });
});

describe('onEntryUpdated', () => {
  it('передаёт оба projectId (before + after)', async () => {
    await onEntryUpdated(event({ projectId: 'p-old' }, { projectId: 'p-new' }));
    expect(mockRecalcProjects).toHaveBeenCalledWith(['p-old', 'p-new']);
  });

  it('смена проекта → два id', async () => {
    mockRecalcProjects.mockResolvedValue(2);
    const res = await onEntryUpdated(event({ projectId: 'p1' }, { projectId: 'p2' }));
    expect(res).toEqual({ ok: true, recalced: 2 });
  });

  it('проект не менялся → оба id одинаковы (dedup делает recalcProjects)', async () => {
    mockRecalcProjects.mockResolvedValue(1);
    const res = await onEntryUpdated(event({ projectId: 'p1' }, { projectId: 'p1' }));
    expect(mockRecalcProjects).toHaveBeenCalledWith(['p1', 'p1']);
    expect(res.recalced).toBe(1);
  });
});

describe('onEntryDeleted', () => {
  it('вызывает recalcProjects с projectId из before', async () => {
    const res = await onEntryDeleted(event({ projectId: 'p1' }));
    expect(mockRecalcProjects).toHaveBeenCalledWith(['p1']);
    expect(res).toEqual({ ok: true, recalced: 1 });
  });

  it('before = undefined → recalcProjects с [null]', async () => {
    mockRecalcProjects.mockResolvedValue(0);
    await onEntryDeleted(event());
    expect(mockRecalcProjects).toHaveBeenCalledWith([null]);
  });
});

describe('wrapEvent', () => {
  it('успех → результат fn без изменений', async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, recalced: 3 });
    const wrapped = wrapEvent(fn);
    const res = await wrapped(event(null, { projectId: 'p1' }));
    expect(res).toEqual({ ok: true, recalced: 3 });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('fn бросает Error → ok:false + error message', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('timeout'));
    const wrapped = wrapEvent(fn);
    const res = await wrapped(event()) as any;
    expect(res.ok).toBe(false);
    expect(res.error).toBe('timeout');
  });

  it('fn бросает не-Error → ok:false + string', async () => {
    const fn = vi.fn().mockRejectedValue('boom');
    const wrapped = wrapEvent(fn);
    const res = await wrapped(event()) as any;
    expect(res.ok).toBe(false);
    expect(res.error).toBe('boom');
  });
});
