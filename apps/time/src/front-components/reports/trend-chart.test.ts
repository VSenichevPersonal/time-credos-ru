import { describe, expect, it } from 'vitest';

import { utilSegments } from './trend-chart';
import type { TimeseriesPoint } from './trend-types';

const pt = (month: string, util: number | null): TimeseriesPoint => ({
  month,
  fact: 0,
  client: 0,
  norm: 0,
  util,
  under: 0,
});

describe('utilSegments', () => {
  it('пусто → []', () => {
    expect(utilSegments([])).toEqual([]);
  });

  it('все точки util≠null → один сегмент, x центрирован по бакету', () => {
    const segs = utilSegments([pt('2026-01', 0.5), pt('2026-02', 1)]);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual([
      { x: 0.25, y: 0.5 },
      { x: 0.75, y: 1 },
    ]);
  });

  it('util=null рвёт линию на сегменты (без провала в 0)', () => {
    const segs = utilSegments([pt('2026-01', 0.4), pt('2026-02', null), pt('2026-03', 0.6)]);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toEqual([{ x: 1 / 6, y: 0.4 }]);
    expect(segs[1]).toEqual([{ x: 5 / 6, y: 0.6 }]);
  });

  it('util>1 клампится к 1 (потолок графика)', () => {
    const segs = utilSegments([pt('2026-01', 1.4)]);
    expect(segs[0][0].y).toBe(1);
  });

  it('ведущий/замыкающий null не создаёт пустых сегментов', () => {
    const segs = utilSegments([pt('2026-01', null), pt('2026-02', 0.5), pt('2026-03', null)]);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toHaveLength(1);
  });
});
