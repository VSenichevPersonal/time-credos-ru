import { describe, expect, it } from 'vitest';

import { DEFAULT_CAPACITY_FACTOR, resolveCapacityFactor } from './capacity';

// SSOT capacityFactor (BUG-2): единый fallback вместо трёх разных (?? 1 / ?? 0.8 / настройка).
describe('resolveCapacityFactor — единый fallback', () => {
  it('DEFAULT_CAPACITY_FACTOR совпадает с defaultValue полей department/settings (0.8)', () => {
    expect(DEFAULT_CAPACITY_FACTOR).toBe(0.8);
  });

  it('factor отдела задан → берётся он (приоритет 1)', () => {
    expect(resolveCapacityFactor(0.6)).toBe(0.6);
    expect(resolveCapacityFactor(0.6, 0.9)).toBe(0.6);
    // 0 — валидное значение (не путать с null), не должно проваливаться в fallback
    expect(resolveCapacityFactor(0)).toBe(0);
  });

  it('factor отдела null → настройка defaultCapacityFactor (приоритет 2)', () => {
    expect(resolveCapacityFactor(null, 0.9)).toBe(0.9);
    expect(resolveCapacityFactor(undefined, 0.9)).toBe(0.9);
  });

  it('ни отдел, ни настройка → DEFAULT_CAPACITY_FACTOR (приоритет 3)', () => {
    expect(resolveCapacityFactor(null)).toBe(DEFAULT_CAPACITY_FACTOR);
    expect(resolveCapacityFactor(undefined, null)).toBe(DEFAULT_CAPACITY_FACTOR);
    expect(resolveCapacityFactor(null, undefined)).toBe(0.8);
  });
});
