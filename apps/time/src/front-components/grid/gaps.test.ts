import { describe, expect, it } from 'vitest';

import { calcWeekGaps, gapsSummary } from './gaps';
import type { WeekDay } from './use-week';

// Пн–Вс: будни 0..4, выходные 5..6
const day = (iso: string, isWeekend = false): WeekDay => ({
  iso,
  dayLabel: iso.slice(8, 10),
  fullLabel: iso,
  dateLabel: iso.slice(8),
  isWeekend,
  isToday: false,
});

const WEEK: WeekDay[] = [
  day('2026-06-22'),       // Пн
  day('2026-06-23'),       // Вт
  day('2026-06-24'),       // Ср
  day('2026-06-25'),       // Чт
  day('2026-06-26'),       // Пт
  day('2026-06-27', true), // Сб
  day('2026-06-28', true), // Вс
];

describe('calcWeekGaps', () => {
  it('все будни по 8ч → нет пробелов', () => {
    const g = calcWeekGaps(WEEK, [8, 8, 8, 8, 8, 0, 0]);
    expect(g.gaps).toHaveLength(0);
    expect(g.emptyCount).toBe(0);
    expect(g.underCount).toBe(0);
    expect(g.missingHours).toBe(0);
  });

  it('пустая неделя → 5 пустых будней, недобор 40ч', () => {
    const g = calcWeekGaps(WEEK, [0, 0, 0, 0, 0, 0, 0]);
    expect(g.emptyCount).toBe(5);
    expect(g.underCount).toBe(0);
    expect(g.missingHours).toBe(40);
    expect(g.gaps.every((x) => x.kind === 'empty')).toBe(true);
  });

  it('день ниже нормы → under, корректный недобор', () => {
    const g = calcWeekGaps(WEEK, [8, 4, 8, 8, 8, 0, 0]);
    expect(g.emptyCount).toBe(0);
    expect(g.underCount).toBe(1);
    expect(g.missingHours).toBe(4);
    expect(g.gaps[0].kind).toBe('under');
    expect(g.gaps[0].total).toBe(4);
  });

  it('переработка (>8) пробелом не считается', () => {
    const g = calcWeekGaps(WEEK, [10, 8, 8, 8, 8, 0, 0]);
    expect(g.gaps).toHaveLength(0);
  });

  it('часы в выходной игнорируются (выходной не норма)', () => {
    const g = calcWeekGaps(WEEK, [8, 8, 8, 8, 8, 5, 5]);
    expect(g.gaps).toHaveLength(0);
  });

  it('смесь: пусто + ниже нормы', () => {
    const g = calcWeekGaps(WEEK, [0, 6, 8, 8, 8, 0, 0]);
    expect(g.emptyCount).toBe(1);
    expect(g.underCount).toBe(1);
    expect(g.missingHours).toBe(8 + 2);
  });
});

describe('gapsSummary', () => {
  it('нет пробелов → пустая строка', () => {
    const g = calcWeekGaps(WEEK, [8, 8, 8, 8, 8, 0, 0]);
    expect(gapsSummary(g)).toBe('');
  });

  it('склонение «день» (1 день)', () => {
    const g = calcWeekGaps(WEEK, [0, 8, 8, 8, 8, 0, 0]);
    expect(gapsSummary(g)).toContain('1 день не заполнено');
    expect(gapsSummary(g)).toContain('недобор 8 ч');
  });

  it('склонение «дня» (2 дня)', () => {
    const g = calcWeekGaps(WEEK, [0, 0, 8, 8, 8, 0, 0]);
    expect(gapsSummary(g)).toContain('2 дня не заполнено');
  });

  it('склонение «дней» (5 дней)', () => {
    const g = calcWeekGaps(WEEK, [0, 0, 0, 0, 0, 0, 0]);
    expect(gapsSummary(g)).toContain('5 дней не заполнено');
  });

  it('смешанное: пусто + ниже нормы', () => {
    const g = calcWeekGaps(WEEK, [0, 6, 8, 8, 8, 0, 0]);
    const s = gapsSummary(g);
    expect(s).toContain('1 день не заполнено');
    expect(s).toContain('1 ниже нормы');
  });
});
