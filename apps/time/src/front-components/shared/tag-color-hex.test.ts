import { describe, expect, it } from 'vitest';

import { TAG_COLOR_HEX, tagColorHex } from './tag-color-hex';

describe('TAG_COLOR_HEX', () => {
  it('все 10 цветов присутствуют', () => {
    const names = ['red','orange','yellow','green','blue','sky','turquoise','purple','pink','gray'];
    for (const n of names) {
      expect(TAG_COLOR_HEX, `${n} отсутствует`).toHaveProperty(n);
    }
  });

  it('каждый цвет имеет solid и tint в формате #hex', () => {
    for (const [name, col] of Object.entries(TAG_COLOR_HEX)) {
      expect(col.solid, `${name}.solid`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(col.tint, `${name}.tint`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('solid и tint различаются (tint светлее)', () => {
    for (const [name, col] of Object.entries(TAG_COLOR_HEX)) {
      expect(col.solid, `${name}: solid == tint`).not.toBe(col.tint);
    }
  });
});

describe('tagColorHex', () => {
  it('знакомый цвет → правильный hex', () => {
    expect(tagColorHex('green')).toEqual({ solid: '#2f9e57', tint: '#e6f4ec' });
    expect(tagColorHex('blue')).toEqual({ solid: '#3b6fe0', tint: '#eaf0fd' });
  });

  it('null → fallback', () => {
    const f = tagColorHex(null);
    expect(f.solid).toBe('#9a9ea8');
    expect(f.tint).toBe('#f0f1f3');
  });

  it('undefined → fallback', () => {
    expect(tagColorHex(undefined)).toEqual(tagColorHex(null));
  });

  it('неизвестное имя → fallback', () => {
    expect(tagColorHex('chartreuse')).toEqual(tagColorHex(null));
  });

  it('пустая строка → fallback', () => {
    expect(tagColorHex('')).toEqual(tagColorHex(null));
  });
});
