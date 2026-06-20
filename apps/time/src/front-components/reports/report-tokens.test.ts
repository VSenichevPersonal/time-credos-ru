import { describe, expect, it } from 'vitest';

import { T } from 'src/front-components/grid/tokens';

import { fmtHrs, fmtUnder, fmtUtil, underTone, utilTone } from './report-tokens';

// ─── fmtUtil ────────────────────────────────────────────────────────────────

describe('fmtUtil', () => {
  it('null → "—"', () => {
    expect(fmtUtil(null)).toBe('—');
  });

  it('0 → "0%"', () => {
    expect(fmtUtil(0)).toBe('0%');
  });

  it('1 (100%) → "100%"', () => {
    expect(fmtUtil(1)).toBe('100%');
  });

  it('0.7 → "70%"', () => {
    expect(fmtUtil(0.7)).toBe('70%');
  });

  it('0.333 → "33%" (округление вниз)', () => {
    expect(fmtUtil(0.333)).toBe('33%');
  });

  it('0.666 → "67%" (округление вверх)', () => {
    expect(fmtUtil(0.666)).toBe('67%');
  });
});

// ─── fmtHrs ─────────────────────────────────────────────────────────────────

describe('fmtHrs', () => {
  it('0 → "0"', () => {
    expect(fmtHrs(0)).toBe('0');
  });

  it('8 → "8"', () => {
    expect(fmtHrs(8)).toBe('8');
  });

  it('1337 → тысячи через пробел', () => {
    const r = fmtHrs(1337);
    // ru-RU разделитель тысяч — пробел (узкий или обычный)
    expect(r).toMatch(/^1[\s ]337$/);
  });

  it('дробное — округляется до целого', () => {
    expect(fmtHrs(4.7)).toBe('5');
    expect(fmtHrs(4.3)).toBe('4');
  });
});

// ─── fmtUnder ───────────────────────────────────────────────────────────────

describe('fmtUnder', () => {
  it('null → "—"', () => {
    expect(fmtUnder(null)).toBe('—');
  });

  it('0 → "0"', () => {
    expect(fmtUnder(0)).toBe('0');
  });

  it('НЕДОБОР > 0 → "−N" (минус, не дефис)', () => {
    expect(fmtUnder(100)).toBe('−100');
  });

  it('ПЕРЕГРУЗ < 0 → "+N"', () => {
    expect(fmtUnder(-40)).toBe('+40');
  });

  it('дробное округляется: 0.6 → "−1" (недобор)', () => {
    expect(fmtUnder(0.6)).toBe('−1');
  });

  it('дробное округляется: -0.6 → "+1" (перегруз)', () => {
    expect(fmtUnder(-0.6)).toBe('+1');
  });

  it('знак «−» в недоборе — Unicode MINUS (U+2212), не ASCII «-»', () => {
    const r = fmtUnder(10);
    expect(r.charCodeAt(0)).toBe(0x2212); // −
  });
});

// ─── underTone ──────────────────────────────────────────────────────────────

describe('underTone', () => {
  it('null → textFaint, прозрачный фон', () => {
    expect(underTone(null)).toEqual({ fg: T.textFaint, bg: 'transparent' });
  });

  it('перегруз under < -0.5 → over+overSoft (красный тон)', () => {
    const t = underTone(-1);
    expect(t.fg).toBe(T.over);
    expect(t.bg).toBe(T.overSoft);
  });

  it('небольшой перегруз: -0.4 → ok (в рамках погрешности)', () => {
    // under > -0.5 (не перегруз по порогу) + under <= 0.5 → ровно норма (ok)
    expect(underTone(-0.4)).toEqual({ fg: T.ok, bg: 'transparent' });
  });

  it('ровно норма: under = 0 → ok', () => {
    expect(underTone(0)).toEqual({ fg: T.ok, bg: 'transparent' });
  });

  it('ровно норма: under = 0.5 → ok (граница включительно не входит в недобор)', () => {
    expect(underTone(0.5)).toEqual({ fg: T.ok, bg: 'transparent' });
  });

  it('недобор under > 0.5 → under (нейтральный), прозрачный фон', () => {
    const t = underTone(1);
    expect(t.fg).toBe(T.under);
    expect(t.bg).toBe('transparent');
  });

  it('большой недобор 100 → under (нейтральный)', () => {
    expect(underTone(100).fg).toBe(T.under);
  });

  it('перегруз-100 → over+overSoft', () => {
    const t = underTone(-100);
    expect(t.fg).toBe(T.over);
    expect(t.bg).toBe(T.overSoft);
  });
});

// ─── utilTone ───────────────────────────────────────────────────────────────

describe('utilTone', () => {
  it('null → textFaint', () => {
    expect(utilTone(null)).toBe(T.textFaint);
  });

  it('0.7 (≥0.7) → ok (зелёный)', () => {
    expect(utilTone(0.7)).toBe(T.ok);
  });

  it('1.0 → ok', () => {
    expect(utilTone(1.0)).toBe(T.ok);
  });

  it('0.69 (< 0.7, ≥ 0.4) → text (нейтральный)', () => {
    expect(utilTone(0.69)).toBe(T.text);
  });

  it('0.4 (ровно порог) → text', () => {
    expect(utilTone(0.4)).toBe(T.text);
  });

  it('0.39 (< 0.4) → textMuted', () => {
    expect(utilTone(0.39)).toBe(T.textMuted);
  });

  it('0 → textMuted', () => {
    expect(utilTone(0)).toBe(T.textMuted);
  });
});
