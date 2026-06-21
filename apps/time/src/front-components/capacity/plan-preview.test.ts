import { describe, expect, it } from 'vitest';

import {
  computePreview,
  previewBuckets,
  previewGranularity,
  validateRange,
} from 'src/front-components/capacity/plan-preview';
import type { DeptRef } from 'src/front-components/capacity/types';

// Производственный календарь: будни (Пн–Пт) по 8 ч, выходные отсутствуют (=0 ч).
const buildWeekdayCalendar = (startKey: string, days: number): Map<string, number> => {
  const m = new Map<string, number>();
  const base = Date.parse(`${startKey}T00:00:00.000Z`);
  for (let i = 0; i < days; i++) {
    const d = new Date(base + i * 86400000);
    const dow = d.getUTCDay(); // 0=вс 6=сб
    if (dow !== 0 && dow !== 6) m.set(d.toISOString().slice(0, 10), 8);
  }
  return m;
};

const dept: DeptRef = {
  id: 'd1',
  name: 'ОПИБ',
  code: null,
  headcount: 2,
  capacityFactor: 1,
};

describe('validateRange', () => {
  it('требует дату начала', () => {
    expect(validateRange('', '2026-07-31')).toBe('укажите дату начала «С»');
  });

  it('обязывает дату ПО (иначе раскид неоднозначен)', () => {
    expect(validateRange('2026-07-01', '')).toBe(
      'укажите дату «ПО» — иначе план не попадёт на доску',
    );
  });

  it('запрещает ПО раньше С', () => {
    expect(validateRange('2026-07-10', '2026-07-01')).toBe('дата «ПО» раньше «С»');
  });

  it('валидный диапазон → null', () => {
    expect(validateRange('2026-07-01', '2026-09-13')).toBeNull();
  });
});

describe('previewGranularity', () => {
  it('короткий диапазон (≤70 дн) → недели', () => {
    expect(previewGranularity('2026-07-01', '2026-07-31')).toBe('week');
  });

  it('длинный диапазон → месяцы', () => {
    expect(previewGranularity('2026-07-01', '2026-10-31')).toBe('month');
  });
});

describe('previewBuckets', () => {
  it('невалидный/пустой диапазон → []', () => {
    expect(previewBuckets('', '2026-07-31', new Map(), 'month')).toEqual([]);
    expect(previewBuckets('2026-08-01', '2026-07-01', new Map(), 'month')).toEqual([]);
  });

  it('месяцы покрывают весь диапазон С..ПО', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const buckets = previewBuckets('2026-07-01', '2026-09-13', cal, 'month');
    expect(buckets.map((b) => b.label)).toEqual(['июл 26', 'авг 26', 'сен 26']);
    // у каждого месяца workHours > 0 (есть будни)
    expect(buckets.every((b) => b.workHours > 0)).toBe(true);
  });
});

describe('computePreview', () => {
  it('Σ раскида ≈ plannedEffort (инвариант WI-05)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const res = computePreview(480, '2026-07-01', '2026-09-13', cal);
    expect(res.rows.length).toBe(3); // 3 месяца
    expect(res.total).toBeCloseTo(480, 5);
  });

  it('раскид по РАБОЧИМ дням: месяц с большим числом будней получает больше часов', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 120);
    const res = computePreview(480, '2026-07-01', '2026-09-13', cal);
    const jul = res.rows.find((r) => r.label === 'июл 26')!;
    const sep = res.rows.find((r) => r.label === 'сен 26')!;
    // июль — полный месяц, сентябрь — обрезан по 13-е → июль > сентября
    expect(jul.hours).toBeGreaterThan(sep.hours);
  });

  it('овербукинг: план периода > ёмкости отдела → over=true', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 60);
    // огромный объём на короткий период точно превысит ёмкость 2 чел
    const res = computePreview(2000, '2026-07-01', '2026-07-31', cal, dept);
    expect(res.rows.some((r) => r.over)).toBe(true);
    expect(res.rows.every((r) => r.capacity !== null)).toBe(true);
  });

  it('без отдела овербукинг не считается (capacity=null, over=false)', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 60);
    const res = computePreview(2000, '2026-07-01', '2026-07-31', cal);
    expect(res.rows.every((r) => r.capacity === null && r.over === false)).toBe(true);
  });

  it('нулевой/пустой объём → раскид 0', () => {
    const cal = buildWeekdayCalendar('2026-07-01', 60);
    const res = computePreview(null, '2026-07-01', '2026-07-31', cal);
    expect(res.total).toBe(0);
  });
});
