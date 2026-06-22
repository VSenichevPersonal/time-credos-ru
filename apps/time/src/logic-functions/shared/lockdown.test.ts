import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canMutateInPeriod,
  canMutatePlanMonth,
  isPeriodLocked,
  isPlanMonthLocked,
  readLockdownConfig,
} from './lockdown';
import type { Actor } from './resolve-actor';

// PERIOD-LOCKDOWN (AUDIT_LOG_PERIOD_LOCKDOWN.md §3.Б): защита прошлых периодов по
// дате. Чистые функции — детерминированный расчёт границы + грейс + роль-override.

const manager: Actor = { employeeId: 'm1', isManager: true, trusted: true };
const worker: Actor = { employeeId: 'w1', isManager: false, trusted: true };

describe('isPeriodLocked — дата-граница + грейс', () => {
  it('lockdown выкл (lockdownDate=null) → ничего не закрыто', () => {
    expect(isPeriodLocked('2020-01-01', { lockdownDate: null, graceDays: 0 })).toBe(false);
  });

  it('дата записи РАНЬШЕ границы → закрыта', () => {
    expect(
      isPeriodLocked('2026-05-15', { lockdownDate: '2026-05-31', graceDays: 0 }),
    ).toBe(true);
  });

  it('дата записи РАВНА границе → закрыта (включительно)', () => {
    expect(
      isPeriodLocked('2026-05-31', { lockdownDate: '2026-05-31', graceDays: 0 }),
    ).toBe(true);
  });

  it('дата записи ПОЗЖЕ границы → открыта', () => {
    expect(
      isPeriodLocked('2026-06-01', { lockdownDate: '2026-05-31', graceDays: 0 }),
    ).toBe(false);
  });

  it('грейс сдвигает границу назад: graceDays=5 → 2026-05-31 закрывает только ≤ 2026-05-26', () => {
    const cfg = { lockdownDate: '2026-05-31', graceDays: 5 };
    expect(isPeriodLocked('2026-05-26', cfg)).toBe(true); // ровно граница−грейс
    expect(isPeriodLocked('2026-05-27', cfg)).toBe(false); // в грейс-окне — ещё открыто
    expect(isPeriodLocked('2026-05-31', cfg)).toBe(false); // в грейс-окне
  });

  it('сравнение по календарному дню (время игнорируется)', () => {
    expect(
      isPeriodLocked('2026-05-31T23:59:00.000Z', { lockdownDate: '2026-05-31T00:00:00.000Z', graceDays: 0 }),
    ).toBe(true);
  });

  it('нет даты записи → не закрыто (не можем судить)', () => {
    expect(isPeriodLocked(null, { lockdownDate: '2026-05-31', graceDays: 0 })).toBe(false);
    expect(isPeriodLocked(undefined, { lockdownDate: '2026-05-31', graceDays: 0 })).toBe(false);
  });

  it('мусорная дата записи → не закрыто (fail-open для самой даты)', () => {
    expect(isPeriodLocked('abc', { lockdownDate: '2026-05-31', graceDays: 0 })).toBe(false);
  });
});

describe('canMutateInPeriod — роль-override', () => {
  const lockedCfg = { lockdownDate: '2026-05-31', graceDays: 0 };

  it('открытый период → любой может, без override', () => {
    expect(canMutateInPeriod('2026-06-10', lockedCfg, worker)).toEqual({
      allowed: true,
      isOverride: false,
    });
  });

  it('закрытый период + рядовой сотрудник → REJECT', () => {
    expect(canMutateInPeriod('2026-05-10', lockedCfg, worker)).toEqual({
      allowed: false,
      isOverride: false,
    });
  });

  it('закрытый период + руководитель → разрешено как override', () => {
    expect(canMutateInPeriod('2026-05-10', lockedCfg, manager)).toEqual({
      allowed: true,
      isOverride: true,
    });
  });

  it('закрытый период + actor=null (деградация identity) → REJECT (нет доверенной роли)', () => {
    expect(canMutateInPeriod('2026-05-10', lockedCfg, null)).toEqual({
      allowed: false,
      isOverride: false,
    });
  });
});

describe('isPlanMonthLocked / canMutatePlanMonth — план по месяцу', () => {
  const cfg = { lockdownDate: '2026-05-31', graceDays: 0 };

  it('месяц целиком в прошлом (последний день ≤ границы) → закрыт', () => {
    expect(isPlanMonthLocked('2026-05', cfg)).toBe(true);
    expect(isPlanMonthLocked('2026-04', cfg)).toBe(true);
  });

  it('текущий/будущий месяц → открыт', () => {
    expect(isPlanMonthLocked('2026-06', cfg)).toBe(false);
    expect(isPlanMonthLocked('2026-07', cfg)).toBe(false);
  });

  it('граница в середине месяца: месяц НЕ закрыт целиком → открыт', () => {
    // lockdownDate=2026-05-15 → май закрыт лишь частично (последний день 31 > 15) → открыт
    expect(isPlanMonthLocked('2026-05', { lockdownDate: '2026-05-15', graceDays: 0 })).toBe(false);
    expect(isPlanMonthLocked('2026-04', { lockdownDate: '2026-05-15', graceDays: 0 })).toBe(true);
  });

  it('невалидный месяц → не закрыт', () => {
    expect(isPlanMonthLocked('2026/05', cfg)).toBe(false);
    expect(isPlanMonthLocked(null, cfg)).toBe(false);
  });

  it('canMutatePlanMonth: закрытый месяц — worker REJECT, manager override', () => {
    expect(canMutatePlanMonth('2026-05', cfg, worker)).toEqual({ allowed: false, isOverride: false });
    expect(canMutatePlanMonth('2026-05', cfg, manager)).toEqual({ allowed: true, isOverride: true });
    expect(canMutatePlanMonth('2026-06', cfg, worker)).toEqual({ allowed: true, isOverride: false });
  });
});

describe('readLockdownConfig — чтение singleton-настроек', () => {
  beforeEach(() => {
    vi.stubEnv('TWENTY_API_URL', 'http://test');
    vi.stubEnv('TWENTY_APP_ACCESS_TOKEN', 'test-token');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const mockOnce = (data: unknown, ok = true) =>
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(''),
    });

  it('читает lockdownDate + lockdownGraceDays', async () => {
    vi.stubGlobal(
      'fetch',
      mockOnce({ data: { credosTimeSettings: [{ lockdownDate: '2026-05-31', lockdownGraceDays: 5 }] } }),
    );
    expect(await readLockdownConfig()).toEqual({ lockdownDate: '2026-05-31', graceDays: 5 });
  });

  it('пустые настройки → выключен (lockdownDate=null)', async () => {
    vi.stubGlobal('fetch', mockOnce({ data: { credosTimeSettings: [] } }));
    expect(await readLockdownConfig()).toEqual({ lockdownDate: null, graceDays: 0 });
  });

  it('lockdownDate отсутствует → выключен', async () => {
    vi.stubGlobal('fetch', mockOnce({ data: { credosTimeSettings: [{ lockdownGraceDays: 3 }] } }));
    expect(await readLockdownConfig()).toEqual({ lockdownDate: null, graceDays: 3 });
  });

  it('ошибка чтения (res not ok) → fail-open выключен (не запираем ввод)', async () => {
    vi.stubGlobal('fetch', mockOnce({}, false));
    expect(await readLockdownConfig()).toEqual({ lockdownDate: null, graceDays: 0 });
  });

  it('fetch бросает → fail-open выключен', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect(await readLockdownConfig()).toEqual({ lockdownDate: null, graceDays: 0 });
  });
});
