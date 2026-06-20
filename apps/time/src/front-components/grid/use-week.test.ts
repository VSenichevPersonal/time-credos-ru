import { describe, expect, it } from 'vitest';

import { mondayOf, toIso, WEEKDAY_LABELS } from './use-week';

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe('WEEKDAY_LABELS', () => {
  it('7 меток, первая — Пн', () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(WEEKDAY_LABELS[0]).toBe('Пн');
    expect(WEEKDAY_LABELS[6]).toBe('Вс');
  });
});

describe('toIso', () => {
  it('Date → YYYY-MM-DD', () => {
    expect(toIso(new Date('2026-06-22T00:00:00Z'))).toBe('2026-06-22');
  });
});

describe('mondayOf', () => {
  it('понедельник → он же', () => {
    expect(toIso(mondayOf(d('2026-06-22')))).toBe('2026-06-22');
  });

  it('вторник → прошлый понедельник', () => {
    expect(toIso(mondayOf(d('2026-06-23')))).toBe('2026-06-22');
  });

  it('воскресенье → Пн текущей недели', () => {
    expect(toIso(mondayOf(d('2026-06-28')))).toBe('2026-06-22');
  });

  it('суббота → Пн текущей недели', () => {
    expect(toIso(mondayOf(d('2026-06-27')))).toBe('2026-06-22');
  });

  it('пятница → Пн текущей недели', () => {
    expect(toIso(mondayOf(d('2026-06-26')))).toBe('2026-06-22');
  });

  it('переход через месяц (1 июля = среда → 29 июня)', () => {
    expect(toIso(mondayOf(d('2026-07-01')))).toBe('2026-06-29');
  });

  it('переход через год (1 января 2026 = четверг → 29 декабря 2025)', () => {
    expect(toIso(mondayOf(d('2026-01-01')))).toBe('2025-12-29');
  });

  it('всегда возвращает UTC дату (не сдвигает на локальный timezone)', () => {
    const mon = mondayOf(d('2026-06-22'));
    expect(mon.getUTCDay()).toBe(1); // 1 = понедельник
  });
});
