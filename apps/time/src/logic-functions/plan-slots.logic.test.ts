import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import planDef, { parseInputSlots } from './plan-slots.logic';

// B3-гард мусорных слотов: parseInputSlots — единственный фильтр входа upsert.
// periodMonth строго 'YYYY-MM'; plannedHours обязателен и конечен. Слоты, не
// проходящие гард, ОТБРАСЫВАЮТСЯ молча (не блокируют валидные в той же пачке).

const DEPT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EMP = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('parseInputSlots — B3-гард мусорных слотов', () => {
  it('валидный слот проходит', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: 40 }]);
    expect(out).toEqual([
      { periodMonth: '2026-06', plannedHours: 40, departmentId: null, employeeId: null },
    ]);
  });

  it('пустой periodMonth → слот отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '', plannedHours: 40 }])).toEqual([]);
  });

  it('отсутствует periodMonth → слот отброшен', () => {
    expect(parseInputSlots([{ plannedHours: 40 }])).toEqual([]);
  });

  it('невалидный формат месяца (не YYYY-MM) → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026/06', plannedHours: 40 }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: '2026-6', plannedHours: 40 }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: 'июнь', plannedHours: 40 }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: '2026-06-01', plannedHours: 40 }])).toEqual([]);
  });

  it('plannedHours null → слот отброшен (B3, не коэрсится в 0/удаление)', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: null }])).toEqual([]);
  });

  it('plannedHours отсутствует → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06' }])).toEqual([]);
  });

  it('plannedHours пустая строка → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: '' }])).toEqual([]);
  });

  it('plannedHours NaN/нечисло → отброшен', () => {
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: 'abc' }])).toEqual([]);
    expect(parseInputSlots([{ periodMonth: '2026-06', plannedHours: Number.NaN }])).toEqual([]);
  });

  it('plannedHours=0 — ВАЛИДНЫЙ вход (семантика «удалить по ключу»), проходит', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: 0 }]);
    expect(out).toHaveLength(1);
    expect(out[0].plannedHours).toBe(0);
  });

  it('строковое число часов приводится к number', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: '40' }]);
    expect(out[0].plannedHours).toBe(40);
  });

  it('departmentId/employeeId UUID сохраняются', () => {
    const out = parseInputSlots([
      { periodMonth: '2026-06', plannedHours: 8, departmentId: DEPT, employeeId: EMP },
    ]);
    expect(out[0].departmentId).toBe(DEPT);
    expect(out[0].employeeId).toBe(EMP);
  });

  it('departmentId/employeeId пусто → null', () => {
    const out = parseInputSlots([{ periodMonth: '2026-06', plannedHours: 8 }]);
    expect(out[0].departmentId).toBeNull();
    expect(out[0].employeeId).toBeNull();
  });

  // validUuidParam БРОСАЕТ на невалидном UUID (CISO-006 защита от инъекции) —
  // handler ловит в try/catch и отдаёт ok:false. Не молчаливый null.
  it('мусорный departmentId (не UUID) → бросает (handler вернёт ok:false)', () => {
    expect(() =>
      parseInputSlots([{ periodMonth: '2026-06', plannedHours: 8, departmentId: 'not-a-uuid' }]),
    ).toThrow();
  });

  it('мусорный слот не блокирует валидный в той же пачке', () => {
    const out = parseInputSlots([
      { periodMonth: '', plannedHours: 40 }, // отброшен
      { periodMonth: '2026-07', plannedHours: 20 }, // проходит
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].periodMonth).toBe('2026-07');
  });

  it('дубли по ключу схлопываются (последний выигрывает)', () => {
    const out = parseInputSlots([
      { periodMonth: '2026-06', plannedHours: 10 },
      { periodMonth: '2026-06', plannedHours: 30 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].plannedHours).toBe(30);
  });

  it('JSON-строка (queryString-режим) парсится', () => {
    const out = parseInputSlots(JSON.stringify([{ periodMonth: '2026-06', plannedHours: 8 }]));
    expect(out).toHaveLength(1);
  });

  it('битый JSON / не-массив → пусто', () => {
    expect(parseInputSlots('{not json')).toEqual([]);
    expect(parseInputSlots({ periodMonth: '2026-06' })).toEqual([]);
    expect(parseInputSlots(null)).toEqual([]);
  });
});

// PERIOD-LOCKDOWN: план прошлых периодов тоже не править (тот же guard, что в
// time-entry, SSOT). Закрытый месяц → LOCKED_PERIOD, КРОМЕ руководителя (override).
describe('plan-slots: lockdown прошлых периодов', () => {
  const handler = (
    planDef as unknown as { config: { handler: (event: unknown) => Promise<unknown> } }
  ).config.handler;
  const PROJECT = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const WM = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const workerEmp = { data: { credosTimeEmployees: [{ id: 'w1', name: 'W', isManager: false }] } };
  const managerEmp = { data: { credosTimeEmployees: [{ id: 'm1', name: 'M', isManager: true }] } };
  const lockedSettings = { data: { credosTimeSettings: [{ lockdownDate: '2026-05-31T00:00:00.000Z', lockdownGraceDays: 0 }] } };
  const emptySlots = { data: { credosTimePlanSlots: [], pageInfo: { hasNextPage: false } } };

  const event = (body: Record<string, unknown>) => ({
    headers: {}, queryStringParameters: {}, pathParameters: {}, body,
    isBase64Encoded: false,
    requestContext: { http: { method: 'POST', path: '/plan-slots' } },
    userWorkspaceId: null,
  });

  const mockFetch = (responses: unknown[]) => {
    let i = 0;
    return vi.fn().mockImplementation(() => {
      const data = responses[i++] ?? {};
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data), text: () => Promise.resolve('') });
    });
  };

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('upsert плана на ЗАКРЫТЫЙ месяц (рядовой) → LOCKED_PERIOD, без мутаций', async () => {
    const mockFn = mockFetch([
      workerEmp, // resolveActor
      lockedSettings, // readLockdownConfig
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      mode: 'upsert', projectId: PROJECT, workspaceMemberRef: WM,
      slots: JSON.stringify([{ periodMonth: '2026-04', plannedHours: 40 }]),
    }));
    expect(result).toMatchObject({ ok: false, error: 'LOCKED_PERIOD', periodMonth: '2026-04' });
    const mutations = mockFn.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH' || m === 'DELETE';
    });
    expect(mutations).toHaveLength(0);
  });

  it('upsert плана на ОТКРЫТЫЙ месяц → проходит', async () => {
    const mockFn = mockFetch([
      workerEmp, // resolveActor
      lockedSettings, // readLockdownConfig
      emptySlots, // restGetAllSlots (existing)
      { data: { createCredosTimePlanSlot: { id: 's1' } } }, // POST
      emptySlots, // restGetAllSlots (final)
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      mode: 'upsert', projectId: PROJECT, workspaceMemberRef: WM,
      slots: JSON.stringify([{ periodMonth: '2026-07', plannedHours: 40 }]),
    }));
    expect(result).toMatchObject({ ok: true, mode: 'upsert' });
  });

  it('upsert плана на закрытый месяц РУКОВОДИТЕЛЕМ → проходит (overridden=true)', async () => {
    const mockFn = mockFetch([
      managerEmp, // resolveActor (isManager)
      lockedSettings, // readLockdownConfig
      emptySlots, // existing
      { data: { createCredosTimePlanSlot: { id: 's2' } } }, // POST
      emptySlots, // final
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(event({
      mode: 'upsert', projectId: PROJECT, workspaceMemberRef: WM,
      slots: JSON.stringify([{ periodMonth: '2026-04', plannedHours: 40 }]),
    }));
    expect(result).toMatchObject({ ok: true, overridden: true });
  });
});

// ON-BEHALF server-gate plan-slots (MANAGER_ENTRY_ON_BEHALF §3.1): персональный слот
// ЗА другого сотрудника → canWriteFor (head/PM/admin), иначе FORBIDDEN_ON_BEHALF.
// Отдельский/проектный слот — планирование руководителя/PM. NULL/untrusted → деградация.
describe('plan-slots: on-behalf gate (canWriteFor)', () => {
  const handler = (
    planDef as unknown as { config: { handler: (event: unknown) => Promise<unknown> } }
  ).config.handler;
  const PROJECT = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const ACTOR = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const TARGET = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const DEPT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const UW = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

  const offSettings = { data: { credosTimeSettings: [{ lockdownDate: null }] } };
  const emptySlots = { data: { credosTimePlanSlots: [], pageInfo: { hasNextPage: false } } };
  const headedDepts = { data: { credosTimeDepartments: [{ id: DEPT }] } };
  const targetInDept = { data: { credosTimeEmployees: [{ departmentId: DEPT }] } };
  const targetNoDept = { data: { credosTimeEmployees: [{ departmentId: null }] } };
  const noEmployeeDepts = { data: { credosTimeEmployeeDepartments: [] } };
  const trustedManager = {
    data: { credosTimeEmployees: [{ id: ACTOR, isManager: true, workspaceMemberRef: 'wm-a', userWorkspaceRef: UW }] },
  };
  const trustedWorker = {
    data: { credosTimeEmployees: [{ id: ACTOR, isManager: false, workspaceMemberRef: 'wm-a', userWorkspaceRef: UW }] },
  };

  const trustedEvent = (body: Record<string, unknown>) => ({
    headers: {}, queryStringParameters: {}, pathParameters: {}, body,
    isBase64Encoded: false,
    requestContext: { http: { method: 'POST', path: '/plan-slots' } },
    userWorkspaceId: UW,
  });
  const nullEvent = (body: Record<string, unknown>) => ({
    headers: {}, queryStringParameters: {}, pathParameters: {}, body,
    isBase64Encoded: false,
    requestContext: { http: { method: 'POST', path: '/plan-slots' } },
    userWorkspaceId: null,
  });

  const mockFetch = (responses: unknown[]) => {
    let i = 0;
    return vi.fn().mockImplementation(() => {
      const data = responses[i++] ?? {};
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data), text: () => Promise.resolve('') });
    });
  };

  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('руководитель отдела пишет персональный слот ЗА подчинённого → ok', async () => {
    const mockFn = mockFetch([
      trustedManager, // resolveActor
      offSettings, // readLockdownConfig
      headedDepts, // canWriteFor head: отделы actor
      targetInDept, // target.primaryDept == DEPT → true
      emptySlots, // existing
      { data: { createCredosTimePlanSlot: { id: 'p1' } } }, // POST
      emptySlots, // final
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({
      mode: 'upsert', projectId: PROJECT,
      slots: JSON.stringify([{ periodMonth: '2026-07', plannedHours: 40, employeeId: TARGET }]),
    }));
    expect(result).toMatchObject({ ok: true, mode: 'upsert' });
  });

  it('НЕ-руководитель пишет персональный слот за чужого → FORBIDDEN_ON_BEHALF, без мутаций', async () => {
    const mockFn = mockFetch([
      trustedWorker, // resolveActor (isManager=false)
      offSettings, // readLockdownConfig
      headedDepts, // canWriteFor head: отделы actor
      targetNoDept, // target.primaryDept null → не совпал
      noEmployeeDepts, // FTE пусто → не head → false; PM нет projectId-моста → false
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({
      mode: 'upsert', projectId: PROJECT,
      slots: JSON.stringify([{ periodMonth: '2026-07', plannedHours: 40, employeeId: TARGET }]),
    }));
    expect(result).toMatchObject({ ok: false, error: 'FORBIDDEN_ON_BEHALF', employeeId: TARGET });
    const mutations = mockFn.mock.calls.filter((c) => {
      const m = (c[1] as { method?: string })?.method;
      return m === 'POST' || m === 'PATCH' || m === 'DELETE';
    });
    expect(mutations).toHaveLength(0);
  });

  it('руководитель пишет ОТДЕЛЬСКИЙ слот (без сотрудника) → ok (планирование)', async () => {
    const mockFn = mockFetch([
      trustedManager, // resolveActor (isManager=true)
      offSettings, // readLockdownConfig
      // отдельский слот: actor.isManager → разрешено без сетевой PM-проверки
      emptySlots, // existing
      { data: { createCredosTimePlanSlot: { id: 'p2' } } }, // POST
      emptySlots, // final
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({
      mode: 'upsert', projectId: PROJECT,
      slots: JSON.stringify([{ periodMonth: '2026-07', plannedHours: 40, departmentId: DEPT }]),
    }));
    expect(result).toMatchObject({ ok: true });
  });

  it('свой персональный слот (employeeId == actor) → ok без gate', async () => {
    const mockFn = mockFetch([
      trustedWorker, // resolveActor (employeeId = ACTOR)
      offSettings, // readLockdownConfig
      emptySlots, // existing (gate не вызывал сетевых проверок)
      { data: { createCredosTimePlanSlot: { id: 'p3' } } }, // POST
      emptySlots, // final
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(trustedEvent({
      mode: 'upsert', projectId: PROJECT,
      slots: JSON.stringify([{ periodMonth: '2026-07', plannedHours: 8, employeeId: ACTOR }]),
    }));
    expect(result).toMatchObject({ ok: true });
  });

  it('NULL-actor (untrusted) → деградация: gate выкл, план пишется', async () => {
    // uwId null + ref не передан → resolveActor вернёт null БЕЗ fetch (деградация).
    const mockFn = mockFetch([
      offSettings, // readLockdownConfig
      emptySlots, // existing
      { data: { createCredosTimePlanSlot: { id: 'p4' } } }, // POST
      emptySlots, // final
    ]);
    vi.stubGlobal('fetch', mockFn);
    const result = await handler(nullEvent({
      mode: 'upsert', projectId: PROJECT,
      slots: JSON.stringify([{ periodMonth: '2026-07', plannedHours: 40, employeeId: TARGET }]),
    }));
    expect((result as { error?: string }).error).not.toBe('FORBIDDEN_ON_BEHALF');
  });
});
