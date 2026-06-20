import { describe, expect, it } from 'vitest';

import { ENTRY_TAG_OPTIONS } from 'src/constants/select-options';
import { TAG_ORDER, sortTags, tagMeta } from './tag-meta';
import type { TagMeta } from './tag-meta';

describe('TAG_ORDER', () => {
  it('длина = число опций ENTRY_TAG_OPTIONS', () => {
    expect(TAG_ORDER).toHaveLength(ENTRY_TAG_OPTIONS.length);
  });

  it('порядок совпадает с ENTRY_TAG_OPTIONS.position', () => {
    expect(TAG_ORDER).toEqual(ENTRY_TAG_OPTIONS.map((o) => o.value));
  });
});

describe('tagMeta — известный тег', () => {
  it('возвращает meta для каждого тега из SSOT', () => {
    for (const opt of ENTRY_TAG_OPTIONS) {
      const m = tagMeta(opt.value);
      expect(m.value).toBe(opt.value);
      expect(m.label).toBe(opt.label);
      expect(m.order).toBe(opt.position);
    }
  });

  it('solid и tint — непустые hex-строки (#RRGGBB)', () => {
    for (const opt of ENTRY_TAG_OPTIONS) {
      const m = tagMeta(opt.value);
      expect(m.solid).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(m.tint).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('solid != tint (насыщенный ≠ светлый фон)', () => {
    for (const opt of ENTRY_TAG_OPTIONS) {
      const m = tagMeta(opt.value);
      expect(m.solid).not.toBe(m.tint);
    }
  });

  it('OVERTIME существует (базовый smoke)', () => {
    const m = tagMeta('OVERTIME');
    expect(m).toMatchObject<Partial<TagMeta>>({
      value: 'OVERTIME',
      order: 0,
    });
    expect(m.label.length).toBeGreaterThan(0);
  });
});

describe('tagMeta — неизвестный код (fallback)', () => {
  it('возвращает meta с code=label (нет хардкода)', () => {
    const m = tagMeta('UNKNOWN_FUTURE_TAG');
    expect(m.value).toBe('UNKNOWN_FUTURE_TAG');
    expect(m.label).toBe('UNKNOWN_FUTURE_TAG');
  });

  it('order = 999 (в конец списка)', () => {
    expect(tagMeta('NO_SUCH_TAG').order).toBe(999);
  });

  it('solid/tint — нейтральные hex (#RRGGBB)', () => {
    const m = tagMeta('???');
    expect(m.solid).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(m.tint).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('пустая строка → fallback (не падает)', () => {
    const m = tagMeta('');
    expect(m.order).toBe(999);
  });
});

describe('sortTags', () => {
  it('пустой массив → пустой', () => {
    expect(sortTags([])).toEqual([]);
  });

  it('один тег → тот же', () => {
    expect(sortTags(['OVERTIME'])).toEqual(['OVERTIME']);
  });

  it('сортирует по order из SSOT (OVERTIME < URGENT < REMOTE ...)', () => {
    // ENTRY_TAG_OPTIONS.position определяет порядок
    const allTags = [...TAG_ORDER].reverse(); // перевернули
    const sorted = sortTags(allTags);
    expect(sorted).toEqual(TAG_ORDER);
  });

  it('неизвестный тег идёт в конец (order=999)', () => {
    const input = ['UNKNOWN', 'OVERTIME', 'URGENT'];
    const sorted = sortTags(input);
    expect(sorted[sorted.length - 1]).toBe('UNKNOWN');
    expect(sorted.slice(0, 2)).toEqual(['OVERTIME', 'URGENT']);
  });

  it('не мутирует исходный массив', () => {
    const orig = ['URGENT', 'OVERTIME'];
    const copy = [...orig];
    sortTags(orig);
    expect(orig).toEqual(copy);
  });

  it('несколько неизвестных — относительный порядок стабилен (одинаковый order=999)', () => {
    // обе в конце, порядок между ними ≥0 (stable sort JS)
    const sorted = sortTags(['OVERTIME', 'UNKNOWN_A', 'UNKNOWN_B']);
    expect(sorted[0]).toBe('OVERTIME');
    expect(sorted.slice(1).sort()).toEqual(['UNKNOWN_A', 'UNKNOWN_B'].sort());
  });
});
