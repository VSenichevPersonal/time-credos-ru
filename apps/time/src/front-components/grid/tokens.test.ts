import { describe, expect, it } from 'vitest';

import { T, cellFill } from './tokens';

describe('T (design tokens)', () => {
  it('accent — hex, не пустой', () => {
    expect(T.accent).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('over и ok — разные цвета (не перепутаны)', () => {
    expect(T.over).not.toBe(T.ok);
  });

  it('все токены строки', () => {
    for (const [k, v] of Object.entries(T)) {
      expect(typeof v, `token ${k}`).toBe('string');
      expect(v, `token ${k} пуст`).toBeTruthy();
    }
  });
});

describe('cellFill — заливка ячейки', () => {
  it('0 часов → transparent', () => {
    expect(cellFill(0)).toBe('transparent');
  });

  it('отрицательные часы → transparent', () => {
    expect(cellFill(-1)).toBe('transparent');
  });

  it('> 0 → rgba(46, 71, 215, ...) — бренд-индиго ACCENT_RGB', () => {
    const result = cellFill(4);
    expect(result).toMatch(/^rgba\(46, 71, 215, 0\.\d+\)$/);
  });

  it('8 часов → насыщеннее 4 часов (больший alpha)', () => {
    const a4 = parseAlpha(cellFill(4));
    const a8 = parseAlpha(cellFill(8));
    expect(a8).toBeGreaterThan(a4);
  });

  it('8 часов → alpha ≤ 0.14 (потолок)', () => {
    expect(parseAlpha(cellFill(8))).toBeLessThanOrEqual(0.14);
  });

  it('100 часов (сверхурочно) → alpha ≤ 0.14 (потолок не превышен)', () => {
    expect(parseAlpha(cellFill(100))).toBeLessThanOrEqual(0.14);
  });

  it('1 час → alpha > 0 (хоть немного видно)', () => {
    expect(parseAlpha(cellFill(1))).toBeGreaterThan(0);
  });
});

function parseAlpha(rgba: string): number {
  const m = rgba.match(/rgba\(\d+, \d+, \d+, ([\d.]+)\)/);
  if (!m) throw new Error(`не rgba: ${rgba}`);
  return Number(m[1]);
}
