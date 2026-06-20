import { describe, expect, it } from 'vitest';

import { drillReducer, type DrillLevel, type DrillState } from './use-drill';

const lvl = (value: string): DrillLevel => ({ dim: 'dept', value, label: `Отдел: ${value}` });
const root: DrillState = { stack: [] };

describe('drillReducer', () => {
  it('into кладёт уровень в стек', () => {
    const s = drillReducer(root, { type: 'into', level: lvl('ОПИБ') });
    expect(s.stack).toHaveLength(1);
    expect(s.stack[0].value).toBe('ОПИБ');
  });

  it('into накапливает несколько уровней', () => {
    let s = drillReducer(root, { type: 'into', level: lvl('A') });
    s = drillReducer(s, { type: 'into', level: lvl('B') });
    expect(s.stack.map((l) => l.value)).toEqual(['A', 'B']);
  });

  it('goTo обрезает стек до индекса (крошка)', () => {
    let s = drillReducer(root, { type: 'into', level: lvl('A') });
    s = drillReducer(s, { type: 'into', level: lvl('B') });
    s = drillReducer(s, { type: 'goTo', index: 1 });
    expect(s.stack.map((l) => l.value)).toEqual(['A']);
  });

  it('reset очищает стек', () => {
    let s = drillReducer(root, { type: 'into', level: lvl('A') });
    s = drillReducer(s, { type: 'reset' });
    expect(s.stack).toEqual([]);
  });

  it('не мутирует исходное состояние', () => {
    const s = drillReducer(root, { type: 'into', level: lvl('A') });
    expect(root.stack).toHaveLength(0);
    expect(s).not.toBe(root);
  });
});
