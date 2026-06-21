import { describe, expect, it } from 'vitest';

import { HORIZON, clampHorizonWeeks, horizonRange } from './use-capacity';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

describe('HORIZON', () => {
  it('week = 16 колонок', () => {
    expect(HORIZON.week).toBe(16);
  });

  it('month = 6 колонок', () => {
    expect(HORIZON.month).toBe(6);
  });
});

describe('clampHorizonWeeks (REQ-0019 planningHorizonWeeks)', () => {
  it('валидное значение — округление', () => {
    expect(clampHorizonWeeks(24)).toBe(24);
    expect(clampHorizonWeeks(12.4)).toBe(12);
  });
  it('null/невалид/слишком мало → дефолт 16', () => {
    expect(clampHorizonWeeks(null)).toBe(16);
    expect(clampHorizonWeeks(undefined)).toBe(16);
    expect(clampHorizonWeeks(0)).toBe(16);
    expect(clampHorizonWeeks(Number.NaN)).toBe(16);
  });
  it('верхняя граница 52', () => {
    expect(clampHorizonWeeks(100)).toBe(52);
  });
});

describe('horizonRange — настраиваемый горизонт недель', () => {
  it('дефолт 16 нед → окно 5 мес (back-compat)', () => {
    const { to } = horizonRange(utc(2026, 0, 15), 'week');
    expect(to).toBe('2026-05-31'); // янв + 5 мес
  });
  it('расширенный горизонт (24 нед) → окно ceil(24/4)+1=7 мес', () => {
    const { to } = horizonRange(utc(2026, 0, 15), 'week', 24);
    expect(to).toBe('2026-07-31'); // янв + 7 мес
  });
  it('weekCount не влияет на granularity=month', () => {
    const { to } = horizonRange(utc(2026, 0, 15), 'month', 24);
    expect(to).toBe('2026-07-31'); // HORIZON.month+1 = 7 мес независимо
  });
});

describe('horizonRange', () => {
  describe('granularity = month', () => {
    it('from = первое число месяца якоря', () => {
      const { from } = horizonRange(utc(2026, 0, 15), 'month');
      expect(from).toBe('2026-01-01');
    });

    it('to = конец 7-го месяца от якоря (HORIZON.month+1=7)', () => {
      // янв(0) + 7 = авг(7), Date.UTC(2026, 7, 0) = 31 июля
      const { to } = horizonRange(utc(2026, 0, 15), 'month');
      expect(to).toBe('2026-07-31');
    });

    it('anchored середина месяца — from всё равно 1-е', () => {
      const { from } = horizonRange(utc(2026, 5, 20), 'month');
      expect(from).toBe('2026-06-01');
    });

    it('переход через год-границу (октябрь → апрель+1)', () => {
      // окт(9) + 7 = май(16→4) следующего года → 30 апреля 2027
      const { from, to } = horizonRange(utc(2026, 9, 1), 'month');
      expect(from).toBe('2026-10-01');
      expect(to).toBe('2027-04-30');
    });
  });

  describe('granularity = week', () => {
    it('from = первое число месяца якоря', () => {
      const { from } = horizonRange(utc(2026, 0, 15), 'week');
      expect(from).toBe('2026-01-01');
    });

    it('to = конец 5-го месяца от якоря (данные на ~16 нед = 4 мес)', () => {
      // янв(0) + 5 = июн(5), Date.UTC(2026, 5, 0) = 31 мая
      const { to } = horizonRange(utc(2026, 0, 15), 'week');
      expect(to).toBe('2026-05-31');
    });

    it('переход через год-границу (ноябрь → март+1)', () => {
      // ноя(10) + 5 = апр(15→3) следующего года → 31 марта 2027
      const { from, to } = horizonRange(utc(2026, 10, 1), 'week');
      expect(from).toBe('2026-11-01');
      expect(to).toBe('2027-03-31');
    });
  });

  describe('крайние случаи', () => {
    it('январь якоря (нет перехода через год назад)', () => {
      const { from } = horizonRange(utc(2026, 0, 1), 'month');
      expect(from).toBe('2026-01-01');
    });

    it('декабрь якоря + week → to = апрель следующего года', () => {
      // дек(11) + 5 = май(16→4) след. года → 30 апреля 2027
      const { to } = horizonRange(utc(2026, 11, 1), 'week');
      expect(to).toBe('2027-04-30');
    });
  });
});
