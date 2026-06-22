import { beforeEach, describe, expect, it, vi } from 'vitest';

import { actorLabel, buildActorLabelMap, fetchActorNames } from './actor-names';
import type { ActorEmployee } from './actor-names';

// WI-56: аудит-подписи — резолв userWorkspaceId → читаемое имя/код.
// reveal=true → ФИО; reveal=false → CISO-007 код без ПДн.

const emp = (over: Partial<ActorEmployee> = {}): ActorEmployee => ({
  id: 'aabbccdd-1122-4000-8000-112233445566',
  firstName: 'Иван',
  lastName: 'Иванов',
  departmentId: 'd1',
  userWorkspaceRef: 'ww000001-0000-4000-8000-000000000001',
  ...over,
});

describe('actorLabel', () => {
  it('reveal=true → Фамилия Имя', () => {
    expect(actorLabel(emp(), true)).toBe('Иванов Иван');
  });

  it('reveal=true, нет Имя → только Фамилия', () => {
    expect(actorLabel(emp({ firstName: null }), true)).toBe('Иванов');
  });

  it('reveal=true, нет ФИО → fallback на код', () => {
    const e = emp({ firstName: null, lastName: null });
    expect(actorLabel(e, true)).toMatch(/^Сотрудник·[0-9A-F]{4}$/);
  });

  it('reveal=false → КОД без ПДн (Сотрудник·XXXX)', () => {
    const label = actorLabel(emp(), false);
    expect(label).toMatch(/^Сотрудник·[0-9A-F]{4}$/);
    expect(label).not.toContain('Иванов');
  });

  it('код = последние 4 hex-символа id (CISO-007 стабильность)', () => {
    const e = emp({ id: 'aabbccdd-1122-4000-8000-112233445566' });
    const code = actorLabel(e, false);
    expect(code).toBe('Сотрудник·5566');
  });
});

describe('buildActorLabelMap', () => {
  it('пустой вход → пустая Map', () => {
    expect(buildActorLabelMap([], false)).toEqual(new Map());
  });

  it('сотрудник без userWorkspaceRef не попадает в карту', () => {
    const e = emp({ userWorkspaceRef: null });
    expect(buildActorLabelMap([e], true).size).toBe(0);
  });

  it('карта: userWorkspaceRef → подпись', () => {
    const e = emp();
    const map = buildActorLabelMap([e], true);
    expect(map.get(e.userWorkspaceRef!)).toBe('Иванов Иван');
  });

  it('reveal=false → код в карте', () => {
    const e = emp();
    const map = buildActorLabelMap([e], false);
    expect(map.get(e.userWorkspaceRef!)).toMatch(/^Сотрудник·/);
  });

  it('несколько сотрудников → все в карте', () => {
    const e1 = emp({ userWorkspaceRef: 'ww1', id: 'aabb0001-0000-4000-8000-000000001111' });
    const e2 = emp({ userWorkspaceRef: 'ww2', id: 'aabb0002-0000-4000-8000-000000002222' });
    const map = buildActorLabelMap([e1, e2], false);
    expect(map.size).toBe(2);
    expect(map.has('ww1')).toBe(true);
    expect(map.has('ww2')).toBe(true);
  });
});

const mockGet = vi.fn();
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: vi.fn().mockImplementation(() => ({ get: mockGet })),
}));

beforeEach(() => vi.clearAllMocks());

describe('fetchActorNames', () => {
  const VALID_UUID = 'aaaaaaaa-bbbb-4000-8000-cccccccccccc';

  it('пустой вход → пустая Map, GET не вызван', async () => {
    const result = await fetchActorNames([], true);
    expect(result).toEqual(new Map());
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('null/undefined фильтруются — не шлём запрос', async () => {
    const result = await fetchActorNames([null, undefined], true);
    expect(result).toEqual(new Map());
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('невалидный UUID (CISO-006 guard) → не шлём запрос', async () => {
    const result = await fetchActorNames(['not-a-uuid', 'injected; DROP'], true);
    expect(result).toEqual(new Map());
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('валидный UUID → GET /rest/credosTimeEmployees с filter', async () => {
    mockGet.mockResolvedValueOnce({
      data: { credosTimeEmployees: [emp({ userWorkspaceRef: VALID_UUID })] },
    });
    await fetchActorNames([VALID_UUID], true);
    expect(mockGet).toHaveBeenCalledWith('/rest/credosTimeEmployees', {
      query: { filter: `userWorkspaceRef[eq]:${VALID_UUID}`, limit: '1' },
    });
  });

  it('сотрудник найден → подпись в карте', async () => {
    const e = emp({ userWorkspaceRef: VALID_UUID });
    mockGet.mockResolvedValueOnce({ data: { credosTimeEmployees: [e] } });
    const map = await fetchActorNames([VALID_UUID], true);
    expect(map.get(VALID_UUID)).toBe('Иванов Иван');
  });

  it('сотрудник не найден → нет в карте (не падает)', async () => {
    mockGet.mockResolvedValueOnce({ data: { credosTimeEmployees: [] } });
    const map = await fetchActorNames([VALID_UUID], true);
    expect(map.size).toBe(0);
  });

  it('ошибка сети → нет в карте (не бросает)', async () => {
    mockGet.mockRejectedValueOnce(new Error('network'));
    const map = await fetchActorNames([VALID_UUID], true);
    expect(map.size).toBe(0);
  });

  it('дедуп — одинаковый UUID шлётся один раз', async () => {
    mockGet.mockResolvedValue({ data: { credosTimeEmployees: [] } });
    await fetchActorNames([VALID_UUID, VALID_UUID], true);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
