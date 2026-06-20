import { describe, expect, it } from 'vitest';

import { loadTone, formatPct, formatCell } from './cap-tokens';
import type { LoadCell } from './types';

const cell = (capacity: number, load: number): LoadCell => ({
  capacity,
  load,
  free: capacity - load,
  ratio: capacity > 0 ? load / capacity : null,
});

// ─── loadTone ─────────────────────────────────────────────────────────────

describe('loadTone', () => {
  it('null ratio → нейтральный (нет ёмкости)', () => {
    const t = loadTone(null);
    // T.textFaint = '#9a9ea8' (hex из tokens)
    expect(t.fg).toBe('#9a9ea8');
    expect(t.bg).toBeTruthy();
  });

  it('ratio > 1 → тревога (терракот)', () => {
    const t = loadTone(1.1);
    expect(t.bg).toBe('#fbe4dd');
    expect(t.fg).toBe('#b3401a');
  });

  it('ratio = 1.0 (ровно полная загрузка) → НЕ тревога', () => {
    const t = loadTone(1.0);
    expect(t.bg).not.toBe('#fbe4dd');
  });

  it('ratio ≈ 1 (free ≤ 0.02) → прозрачный нейтрал', () => {
    const t = loadTone(0.99); // free = 0.01 ≤ 0.02
    expect(t.bg).toBe('transparent');
  });

  it('ratio = 0.5 → зелёный фон (свободно 50%)', () => {
    const t = loadTone(0.5);
    expect(t.bg).toMatch(/^rgba\(21, 128, 61,/);
    expect(t.fg).toBeTruthy();
  });

  it('ratio = 0 → максимальная прозрачность зелёного (свободно 100%)', () => {
    const t0 = loadTone(0);   // free=1 → a=0.25
    const t5 = loadTone(0.5); // free=0.5 → a=0.15
    // alpha ratio=0 должен быть больше чем ratio=0.5
    const alphaOf = (bg: string): number => parseFloat(bg.match(/[\d.]+\)$/)![0]);
    expect(alphaOf(t0.bg)).toBeGreaterThan(alphaOf(t5.bg));
  });
});

// ─── formatPct ────────────────────────────────────────────────────────────

describe('formatPct', () => {
  it('null → ""', () => expect(formatPct(null)).toBe(''));
  it('0% при ratio=0', () => expect(formatPct(0)).toBe('0%'));
  it('65% округляет', () => expect(formatPct(0.654)).toBe('65%'));
  it('100% при ratio=1', () => expect(formatPct(1)).toBe('100%'));
  it('>100 не обрезает (это задача loadTone)', () => expect(formatPct(1.5)).toBe('150%'));
});

// ─── formatCell ───────────────────────────────────────────────────────────

describe('formatCell', () => {
  it('capacity=0 → "" (нет ёмкости, не рисуем)', () => {
    expect(formatCell('pct', cell(0, 0))).toBe('');
    expect(formatCell('free', cell(0, 0))).toBe('');
    expect(formatCell('plan', cell(0, 0))).toBe('');
  });

  it('метрика pct → процент', () => {
    expect(formatCell('pct', cell(160, 80))).toBe('50%');
  });

  it('метрика plan → плановые часы (0 → "")', () => {
    expect(formatCell('plan', cell(160, 80))).toBe('80');
    expect(formatCell('plan', cell(160, 0))).toBe('');
  });

  it('метрика free → свободные часы со знаком', () => {
    expect(formatCell('free', cell(160, 80))).toBe('+80');  // свободно
    expect(formatCell('free', cell(160, 200))).toBe('-40'); // перегруз
    expect(formatCell('free', cell(160, 160))).toBe('0');   // точно ноль
  });
});
