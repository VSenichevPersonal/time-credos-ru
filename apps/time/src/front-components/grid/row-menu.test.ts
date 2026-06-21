import { describe, expect, it } from 'vitest';

import { commentTargets } from 'src/front-components/grid/row-menu';
import type { CommentDay } from 'src/front-components/grid/row-menu';

// WI-01: «Комментарий к записи…» перенесён из ячейки в меню строки ⋯. Цели
// комментария — только дни с проставленными часами (без часов записи нет).

const day = (over: Partial<CommentDay>): CommentDay => ({
  dayIso: '2026-06-15',
  label: 'Пн 15',
  hours: 0,
  description: null,
  ...over,
});

describe('commentTargets (WI-01)', () => {
  it('оставляет только дни с часами > 0', () => {
    const days = [
      day({ dayIso: '2026-06-15', hours: 8 }),
      day({ dayIso: '2026-06-16', hours: 0 }),
      day({ dayIso: '2026-06-17', hours: 4 }),
    ];
    expect(commentTargets(days).map((d) => d.dayIso)).toEqual(['2026-06-15', '2026-06-17']);
  });

  it('пустой результат, если ни в одном дне нет часов', () => {
    const days = [day({ hours: 0 }), day({ dayIso: '2026-06-16', hours: 0 })];
    expect(commentTargets(days)).toEqual([]);
  });

  it('undefined вход → пустой массив (строка без данных)', () => {
    expect(commentTargets(undefined)).toEqual([]);
  });

  it('сохраняет описание и lock-статус целевого дня', () => {
    const days = [day({ hours: 8, description: 'код-ревью', locked: true })];
    const [t] = commentTargets(days);
    expect(t.description).toBe('код-ревью');
    expect(t.locked).toBe(true);
  });

  it('дробные часы тоже валидная цель', () => {
    expect(commentTargets([day({ hours: 0.5 })])).toHaveLength(1);
  });
});
