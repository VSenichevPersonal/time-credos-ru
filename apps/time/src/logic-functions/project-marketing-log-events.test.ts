import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  onProjectMarketingUpdated,
  wrapMarketingEvent,
} from './project-marketing-log-events';

// MARKETING-LOG: триггер credosTimeProject.updated.
// Проверяем: лог пишется на изменение МАРКЕТИНГ-поля (по строке на поле);
// не-маркетинг-изменение НЕ логируется; actor server-truth по userWorkspaceId;
// сбой записи лога НЕ валит обработку события.

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('TWENTY_API_URL', 'http://test');
  vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
});
afterEach(() => vi.unstubAllEnvs());

const UW = 'ffffffff-1111-4fff-8fff-ffffffffffff';
const EMP = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROJ = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const okJson = (data: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) } as unknown as Response);
const okEmpty = () => Promise.resolve({ ok: true, status: 200 } as Response);

// database-event payload (credosTimeProject.updated).
const event = (
  updatedFields: string[],
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  userWorkspaceId: string | null = null,
) =>
  ({
    name: 'credosTimeProject.updated',
    workspaceId: 'ws',
    objectMetadata: {} as never,
    recordId: PROJ,
    userWorkspaceId: userWorkspaceId ?? undefined,
    properties: { updatedFields, before, after, diff: {} },
  }) as never;

// POST-вызовы записи лога.
const logPosts = () =>
  mockFetch.mock.calls.filter(
    (c) =>
      (c[1] as { method?: string })?.method === 'POST' &&
      String(c[0]).includes('credosTimeMarketingLogs'),
  );
const logBody = (call: unknown[]): Record<string, unknown> =>
  JSON.parse(String((call[1] as { body?: string })?.body ?? '{}'));

describe('marketing-log: триггер на изменение маркетинг-полей проекта', () => {
  it('изменение маркетинг-поля → пишется строка лога с old→new', async () => {
    // нет userWorkspaceId → resolveMarketingActor вернёт null БЕЗ fetch; затем POST лога.
    mockFetch.mockReturnValueOnce(okEmpty());
    const r = await onProjectMarketingUpdated(
      event(['ndaLevel'], { ndaLevel: 'NDA_FULL' }, { ndaLevel: 'NONE' }),
    );
    expect(r.logged).toBe(1);
    const posts = logPosts();
    expect(posts.length).toBe(1);
    const body = logBody(posts[0]);
    expect(body.fieldName).toBe('ndaLevel');
    expect(body.oldValue).toBe('NDA_FULL');
    expect(body.newValue).toBe('NONE');
    expect(body.projectId).toBe(PROJ);
  });

  it('несколько маркетинг-полей → строка на каждое', async () => {
    mockFetch.mockReturnValue(okEmpty());
    const r = await onProjectMarketingUpdated(
      event(
        ['canPublishOnSite', 'isPublished'],
        { canPublishOnSite: false, isPublished: false },
        { canPublishOnSite: true, isPublished: true },
      ),
    );
    expect(r.logged).toBe(2);
    const names = logPosts().map((c) => logBody(c).fieldName).sort();
    expect(names).toEqual(['canPublishOnSite', 'isPublished']);
    // boolean приведён к строке-снимку
    const pub = logPosts().find((c) => logBody(c).fieldName === 'isPublished');
    expect(logBody(pub as unknown[]).oldValue).toBe('false');
    expect(logBody(pub as unknown[]).newValue).toBe('true');
  });

  it('НЕ-маркетинг-изменение НЕ логируется', async () => {
    const r = await onProjectMarketingUpdated(
      event(['status', 'plannedEffort'], { status: 'A' }, { status: 'B' }),
    );
    expect(r.logged).toBe(0);
    expect(logPosts().length).toBe(0);
  });

  it('смешанный набор: логируется только маркетинг-поле', async () => {
    mockFetch.mockReturnValue(okEmpty());
    const r = await onProjectMarketingUpdated(
      event(['status', 'isPublished'], { isPublished: false }, { isPublished: true }),
    );
    expect(r.logged).toBe(1);
    expect(logPosts().map((c) => logBody(c).fieldName)).toEqual(['isPublished']);
  });

  it('actor server-truth: userWorkspaceId → employeeId в логе', async () => {
    // 1-й fetch — resolveMarketingActor (employee lookup), 2-й — POST лога.
    mockFetch
      .mockReturnValueOnce(okJson({ data: { credosTimeEmployees: [{ id: EMP }] } }))
      .mockReturnValueOnce(okEmpty());
    await onProjectMarketingUpdated(
      event(['publishedUrl'], { publishedUrl: null }, { publishedUrl: 'https://x' }, UW),
    );
    const posts = logPosts();
    expect(posts.length).toBe(1);
    expect(logBody(posts[0]).actor).toBe(EMP);
  });

  it('actor недоступен (нет userWorkspaceId) → лог с actor=null', async () => {
    mockFetch.mockReturnValueOnce(okEmpty());
    await onProjectMarketingUpdated(
      event(['canUseLogo'], { canUseLogo: false }, { canUseLogo: true }),
    );
    expect(logBody(logPosts()[0]).actor).toBeNull();
  });

  it('сбой записи лога НЕ валит обработку (ok:true, не throw)', async () => {
    mockFetch.mockRejectedValue(new Error('network'));
    const r = await onProjectMarketingUpdated(
      event(['isPublished'], { isPublished: false }, { isPublished: true }),
    );
    expect(r.ok).toBe(true);
    expect(r.logged).toBe(0);
  });
});

describe('wrapMarketingEvent: ошибка хендлера не валит обработку события', () => {
  it('throw в хендлере → ok:false (не throw наружу)', async () => {
    const boom = wrapMarketingEvent(async () => {
      throw new Error('boom');
    });
    const r = (await boom(event(['ndaLevel'], {}, {}))) as { ok: boolean };
    expect(r.ok).toBe(false);
  });
});
