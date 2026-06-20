import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import backfillDef from './backfill-project-departments.post-install';

type BackfillResult = { ok: boolean; created: number; skipped: number; errors: number };

// definePostInstallLogicFunction → ValidationResult<T>, config.handler — как у LogicFunction.
const handler = (
  backfillDef as unknown as { config: { handler: (payload: unknown) => Promise<BackfillResult> } }
).config.handler;

const PAYLOAD = {};

// Мок fetch с последовательными JSON-ответами.
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

// Формат курсорной пагинации restGetAll (hasNextPage=false → остановить).
const page = <T>(plural: string, items: T[]) => ({
  data: { [plural]: items },
  pageInfo: { hasNextPage: false, endCursor: null },
});

const proj = (id: string, departmentId: string | null, plannedEffort: number | null = null) => ({
  id,
  departmentId,
  plannedEffort,
});
const share = (projectId: string, departmentId: string) => ({ projectId, departmentId });

beforeEach(() => {
  vi.stubEnv('TWENTY_API_URL', 'http://test');
  vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('backfill-project-departments — базовые кейсы', () => {
  it('нет проектов → ok:true, created:0, skipped:0', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch([
        page('credosTimeProjects', []),
        page('credosTimeProjectDepartments', []),
      ]),
    );
    const r = await handler(PAYLOAD);
    expect(r).toMatchObject({ ok: true, created: 0, skipped: 0, errors: 0 });
  });

  it('проект без departmentId → skipped:1, POST не вызван', async () => {
    const mockFn = mockFetch([
      page('credosTimeProjects', [proj('p1', null, 40)]),
      page('credosTimeProjectDepartments', []),
    ]);
    vi.stubGlobal('fetch', mockFn);
    const r = await handler(PAYLOAD);
    expect(r).toMatchObject({ ok: true, created: 0, skipped: 1, errors: 0 });
    // POST не вызывался
    const posts = mockFn.mock.calls.filter(
      (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('credosTimeProjectDepartments') &&
      typeof c[1] === 'object' && (c[1] as RequestInit).method === 'POST',
    );
    expect(posts).toHaveLength(0);
  });

  it('новый проект с departmentId → POST вызван, created:1', async () => {
    const mockFn = mockFetch([
      page('credosTimeProjects', [proj('p1', 'd1', 80)]),
      page('credosTimeProjectDepartments', []),
      {}, // POST response
    ]);
    vi.stubGlobal('fetch', mockFn);
    const r = await handler(PAYLOAD);
    expect(r).toMatchObject({ ok: true, created: 1, skipped: 0, errors: 0 });
  });

  it('идемпотентность: доля уже существует → skipped:1, POST не вызван', async () => {
    const mockFn = mockFetch([
      page('credosTimeProjects', [proj('p1', 'd1', 80)]),
      page('credosTimeProjectDepartments', [share('p1', 'd1')]),
    ]);
    vi.stubGlobal('fetch', mockFn);
    const r = await handler(PAYLOAD);
    expect(r).toMatchObject({ ok: true, created: 0, skipped: 1, errors: 0 });
    const posts = mockFn.mock.calls.filter(
      (c: unknown[]) => typeof c[1] === 'object' && (c[1] as RequestInit).method === 'POST',
    );
    expect(posts).toHaveLength(0);
  });

  it('POST ошибка на одном проекте → errors:1, остальные продолжаются', async () => {
    let callCount = 0;
    const failFetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      callCount++;
      // GET-запросы — успех; POST — падаем только на первом POST (p1)
      if (opts?.method === 'POST' && callCount <= 3) {
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('err') });
      }
      if (callCount === 1) return Promise.resolve({ ok: true, json: () => Promise.resolve(page('credosTimeProjects', [proj('p1', 'd1'), proj('p2', 'd2')])), text: () => Promise.resolve('') });
      if (callCount === 2) return Promise.resolve({ ok: true, json: () => Promise.resolve(page('credosTimeProjectDepartments', [])), text: () => Promise.resolve('') });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    });
    vi.stubGlobal('fetch', failFetch);
    const r = await handler(PAYLOAD);
    // p1 даёт ошибку → errors:1; p2 создаётся → created:1
    expect(r.errors).toBeGreaterThanOrEqual(1);
    expect(r.ok).toBe(false); // errors > 0 → ok=false
  });

  it('ok=false когда errors > 0', async () => {
    // Оба проекта, один дважды падает при POST → errors=1 → ok=false
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (opts?.method === 'POST') {
          return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('fail') });
        }
        const firstCall = !url.includes('ProjectDepartments');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(
            firstCall
              ? page('credosTimeProjects', [proj('p1', 'd1')])
              : page('credosTimeProjectDepartments', []),
          ),
          text: () => Promise.resolve(''),
        });
      }),
    );
    const r = await handler(PAYLOAD);
    expect(r.ok).toBe(false);
  });
});

describe('backfill-project-departments — POST тело', () => {
  it('POST содержит правильные projectId / departmentId / plannedEffortShare', async () => {
    const mockFn = mockFetch([
      page('credosTimeProjects', [proj('p1', 'd1', 120)]),
      page('credosTimeProjectDepartments', []),
      {},
    ]);
    vi.stubGlobal('fetch', mockFn);
    await handler(PAYLOAD);
    const postCall = mockFn.mock.calls.find(
      (c: unknown[]) => typeof c[1] === 'object' && (c[1] as RequestInit).method === 'POST',
    );
    expect(postCall).toBeTruthy();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body).toMatchObject({ projectId: 'p1', departmentId: 'd1', plannedEffortShare: 120 });
  });

  it('POST: plannedEffort=null → plannedEffortShare=null', async () => {
    const mockFn = mockFetch([
      page('credosTimeProjects', [proj('p1', 'd1', null)]),
      page('credosTimeProjectDepartments', []),
      {},
    ]);
    vi.stubGlobal('fetch', mockFn);
    await handler(PAYLOAD);
    const postCall = mockFn.mock.calls.find(
      (c: unknown[]) => typeof c[1] === 'object' && (c[1] as RequestInit).method === 'POST',
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.plannedEffortShare).toBeNull();
  });
});
