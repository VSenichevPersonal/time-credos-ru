import { describe, expect, it } from 'vitest';

import {
  DEFAULT_VIEW_STATE,
  deserializeViewState,
  serializeViewState,
  type ReportViewState,
} from './view-state';

const sample: ReportViewState = {
  view: 'summary',
  gran: 'quarter',
  offset: -2,
  groupBy: 'employee',
  utilPreset: true,
  catFilter: ['DEV', 'OPS'],
  drill: [
    { dim: 'dept', value: 'd1' },
    { dim: 'project', value: 'p9' },
  ],
};

describe('serialize/deserialize — round-trip', () => {
  it('восстанавливает идентичное состояние', () => {
    const back = deserializeViewState(serializeViewState(sample));
    expect(back).toEqual(sample);
  });

  it('дефолт прогоняется без потерь', () => {
    const back = deserializeViewState(serializeViewState(DEFAULT_VIEW_STATE));
    expect(back).toEqual(DEFAULT_VIEW_STATE);
  });
});

describe('serializeViewState — детерминизм', () => {
  it('catFilter сортируется (стабильная строка независимо от порядка)', () => {
    const a = serializeViewState({ ...sample, catFilter: ['OPS', 'DEV'] });
    const b = serializeViewState({ ...sample, catFilter: ['DEV', 'OPS'] });
    expect(a).toBe(b);
  });

  it('catFilter дедуплицируется', () => {
    const back = deserializeViewState(
      serializeViewState({ ...sample, catFilter: ['DEV', 'DEV', 'OPS'] }),
    );
    expect(back.catFilter).toEqual(['DEV', 'OPS']);
  });

  it('положительный offset обнуляется (нет периода в будущем)', () => {
    const back = deserializeViewState(serializeViewState({ ...sample, offset: 5 }));
    expect(back.offset).toBe(0);
  });

  it('дробный offset усекается', () => {
    const back = deserializeViewState(serializeViewState({ ...sample, offset: -1.9 }));
    expect(back.offset).toBe(-1);
  });
});

describe('deserializeViewState — устойчивость к мусору', () => {
  it('не-строка → дефолт', () => {
    expect(deserializeViewState(null)).toEqual(DEFAULT_VIEW_STATE);
    expect(deserializeViewState(undefined)).toEqual(DEFAULT_VIEW_STATE);
    expect(deserializeViewState(42)).toEqual(DEFAULT_VIEW_STATE);
    expect(deserializeViewState('')).toEqual(DEFAULT_VIEW_STATE);
  });

  it('битый JSON → дефолт (без исключения)', () => {
    expect(deserializeViewState('{not json')).toEqual(DEFAULT_VIEW_STATE);
  });

  it('чужая версия схемы → дефолт', () => {
    expect(deserializeViewState(JSON.stringify({ v: 99, view: 'trend' }))).toEqual(
      DEFAULT_VIEW_STATE,
    );
  });

  it('неизвестные значения enum → дефолт по полю', () => {
    const back = deserializeViewState(
      JSON.stringify({
        v: 1,
        view: 'hacker',
        gran: 'decade',
        groupBy: 'alien',
        util: 'yes',
        offset: 'x',
        cats: 'nope',
        drill: 'nope',
      }),
    );
    expect(back).toEqual(DEFAULT_VIEW_STATE);
  });

  it('фильтрует битые drill-уровни, оставляя валидные', () => {
    const back = deserializeViewState(
      JSON.stringify({
        v: 1,
        drill: [
          { dim: 'dept', value: 'ok' },
          { dim: 'project' }, // нет value
          { value: 'x' }, // нет dim
          'garbage',
          { dim: 'employee', value: 'e1' },
        ],
      }),
    );
    expect(back.drill).toEqual([
      { dim: 'dept', value: 'ok' },
      { dim: 'employee', value: 'e1' },
    ]);
  });

  it('ограничивает глубину drill (≤8)', () => {
    const deep = Array.from({ length: 20 }, (_, i) => ({ dim: 'dept', value: `v${i}` }));
    const back = deserializeViewState(JSON.stringify({ v: 1, drill: deep }));
    expect(back.drill.length).toBe(8);
  });

  it('отбрасывает чрезмерно длинные значения (анти-раздувание)', () => {
    const huge = 'x'.repeat(300);
    const back = deserializeViewState(
      JSON.stringify({ v: 1, cats: [huge, 'OK'], drill: [{ dim: 'dept', value: huge }] }),
    );
    expect(back.catFilter).toEqual(['OK']);
    expect(back.drill).toEqual([]);
  });
});
