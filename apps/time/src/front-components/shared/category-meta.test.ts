import { describe, expect, it } from 'vitest';

import { WORK_CATEGORY_OPTIONS } from 'src/constants/select-options';

import { CATEGORY_ORDER, categoryMeta } from './category-meta';

describe('CATEGORY_ORDER', () => {
  it('совпадает с порядком WORK_CATEGORY_OPTIONS', () => {
    expect(CATEGORY_ORDER).toEqual(WORK_CATEGORY_OPTIONS.map((o) => o.value));
  });

  it('не пустой', () => {
    expect(CATEGORY_ORDER.length).toBeGreaterThan(0);
  });
});

describe('categoryMeta — известные коды', () => {
  it('все SSOT-коды резолвятся без fallback', () => {
    for (const o of WORK_CATEGORY_OPTIONS) {
      const m = categoryMeta(o.value);
      expect(m.value).toBe(o.value);
      expect(m.label).toBe(o.label);
      // порядок = position из справочника
      expect(m.order).toBe(o.position);
      // цвета — hex строки
      expect(m.solid).toMatch(/^#[0-9a-f]{6}$/i);
      expect(m.tint).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('каждый код уникален в CATEGORY_ORDER', () => {
    const set = new Set(CATEGORY_ORDER);
    expect(set.size).toBe(CATEGORY_ORDER.length);
  });
});

describe('categoryMeta — неизвестные коды (fallback)', () => {
  it('"OTHER" → label "Прочее", order 999', () => {
    const m = categoryMeta('OTHER');
    expect(m.label).toBe('Прочее');
    expect(m.order).toBe(999);
    expect(m.value).toBe('OTHER');
  });

  it('произвольный код → label = code, order 999', () => {
    const m = categoryMeta('UNKNOWN_XYZ');
    expect(m.label).toBe('UNKNOWN_XYZ');
    expect(m.order).toBe(999);
  });

  it('fallback цвета — нейтральный серый (#9a9ea8)', () => {
    const m = categoryMeta('NONEXISTENT');
    expect(m.solid).toBe('#9a9ea8'); // tagColorHex(null).solid
  });
});
