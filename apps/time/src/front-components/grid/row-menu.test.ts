import { describe, expect, it } from 'vitest';

import { commentTargets, pluralRecords } from 'src/front-components/grid/row-menu';
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

// W3A.11: confirm удаления строки показывает «удалить N записей» — корректное
// русское склонение существительного.
describe('pluralRecords (W3A.11)', () => {
  it('1 → «запись»', () => {
    expect(pluralRecords(1)).toBe('запись');
  });

  it('2–4 → «записи»', () => {
    expect(pluralRecords(2)).toBe('записи');
    expect(pluralRecords(3)).toBe('записи');
    expect(pluralRecords(4)).toBe('записи');
  });

  it('5–20 → «записей»', () => {
    expect(pluralRecords(5)).toBe('записей');
    expect(pluralRecords(11)).toBe('записей');
    expect(pluralRecords(20)).toBe('записей');
  });

  it('исключения 11–14 → «записей» (не «запись/записи»)', () => {
    expect(pluralRecords(11)).toBe('записей');
    expect(pluralRecords(12)).toBe('записей');
    expect(pluralRecords(14)).toBe('записей');
  });

  it('21 → «запись», 22 → «записи»', () => {
    expect(pluralRecords(21)).toBe('запись');
    expect(pluralRecords(22)).toBe('записи');
  });
});
