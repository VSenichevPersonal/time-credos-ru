import { describe, expect, it } from 'vitest';

import { pctOfNorm } from './bar';

describe('pctOfNorm', () => {
  it('null max → "—"', () => {
    expect(pctOfNorm(120, null)).toBe('—');
  });

  it('max=0 → "—"', () => {
    expect(pctOfNorm(50, 0)).toBe('—');
  });

  it('max<0 → "—"', () => {
    expect(pctOfNorm(10, -5)).toBe('—');
  });

  it('100% загрузки', () => {
    expect(pctOfNorm(160, 160)).toBe('100%');
  });

  it('65% — округляет до целых', () => {
    expect(pctOfNorm(247, 380)).toBe('65%');
  });

  it('0% при value=0', () => {
    expect(pctOfNorm(0, 160)).toBe('0%');
  });

  it('перегрузка >100 (не ограничивает, только pctOfNorm)', () => {
    // Bar компонент кепит fillPct=100, но pctOfNorm честно показывает 150%
    expect(pctOfNorm(240, 160)).toBe('150%');
  });

  it('округление Math.round (0.5 → вверх)', () => {
    // 1 / 160 * 100 ≈ 0.625 → 1%
    expect(pctOfNorm(1, 160)).toBe('1%');
  });
});
