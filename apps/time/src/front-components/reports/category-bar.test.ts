import { describe, expect, it } from 'vitest';

import { toSegments } from './category-bar';
import type { CategoryShare } from './report-types';

// Маппинг byCategory → сегменты стека (регресс [bug]#4: после DP-0003 стек
// категорий не рисовался). Тестируем чистую логику: порядок, ширины, цвета,
// отбрасывание нулей. Без DOM (env=node).

describe('toSegments', () => {
  it('пустой/[] → нет сегментов', () => {
    expect(toSegments([])).toEqual([]);
    // @ts-expect-error защита от undefined на рантайме
    expect(toSegments(undefined)).toEqual([]);
  });

  it('ширина сегмента = share*100', () => {
    const parts: CategoryShare[] = [{ category: 'CLIENT', hours: 180, share: 0.73 }];
    const seg = toSegments(parts);
    expect(seg).toHaveLength(1);
    expect(seg[0].widthPct).toBeCloseTo(73);
  });

  it('сегменты идут в порядке справочника, не по входному порядку', () => {
    // Подаём вперемешку: INTERNAL, CLIENT, PRESALE
    const parts: CategoryShare[] = [
      { category: 'INTERNAL', hours: 27, share: 0.11 },
      { category: 'CLIENT', hours: 180, share: 0.73 },
      { category: 'PRESALE', hours: 40, share: 0.16 },
    ];
    const seg = toSegments(parts);
    expect(seg.map((s) => s.category)).toEqual(['CLIENT', 'PRESALE', 'INTERNAL']);
  });

  it('цвет сегмента берётся из SSOT категории', () => {
    const seg = toSegments([
      { category: 'CLIENT', hours: 1, share: 0.5 },
      { category: 'INTERNAL', hours: 1, share: 0.5 },
    ]);
    // CLIENT=green #2f9e57, INTERNAL=blue #3b6fe0 (select-options + tag-color-hex)
    const byCat = Object.fromEntries(seg.map((s) => [s.category, s.color]));
    expect(byCat.CLIENT).toBe('#2f9e57');
    expect(byCat.INTERNAL).toBe('#3b6fe0');
  });

  it('share=null или 0 → сегмент отбрасывается', () => {
    const seg = toSegments([
      { category: 'CLIENT', hours: 10, share: 1 },
      { category: 'PRESALE', hours: 0, share: 0 },
      { category: 'INTERNAL', hours: 0, share: null },
    ]);
    expect(seg.map((s) => s.category)).toEqual(['CLIENT']);
  });

  it('неизвестная категория (OTHER) уходит в конец и не падает', () => {
    const seg = toSegments([
      { category: 'OTHER', hours: 5, share: 0.2 },
      { category: 'CLIENT', hours: 20, share: 0.8 },
    ]);
    expect(seg.map((s) => s.category)).toEqual(['CLIENT', 'OTHER']);
    expect(seg.find((s) => s.category === 'OTHER')?.label).toBe('Прочее');
  });

  it('сумма ширин полного микса ≈ 100%', () => {
    const seg = toSegments([
      { category: 'CLIENT', hours: 73, share: 0.73 },
      { category: 'PRESALE', hours: 16, share: 0.16 },
      { category: 'INTERNAL', hours: 11, share: 0.11 },
    ]);
    const sum = seg.reduce((a, s) => a + s.widthPct, 0);
    expect(sum).toBeCloseTo(100);
  });
});
