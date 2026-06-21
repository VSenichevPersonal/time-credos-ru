import { describe, expect, it } from 'vitest';

import { calcWeekGaps, gapsSummary, weekUnderfillNotice } from './gaps';
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

describe('calcWeekGaps + норма из произв. календаря (T2 SSOT)', () => {
  // Имитация normFor из useDailyNorm: праздник=0, короткий предпраздничный=7, обычный=8.
  // Праздник 24-го (норма 0), короткий день 23-го (норма 7).
  const cal: Record<string, number> = {
    '2026-06-22': 8,
    '2026-06-23': 7, // короткий день
    '2026-06-24': 0, // праздник (рабочий по дню недели, но нерабочий по календарю)
    '2026-06-25': 8,
    '2026-06-26': 8,
  };
  const normFor = (iso: string, isWeekend: boolean): number =>
    cal[iso] ?? (isWeekend ? 0 : 8);

  it('праздник (норма 0) пробелом не считается даже при 0 часов', () => {
    const g = calcWeekGaps(WEEK, [8, 7, 0, 8, 8, 0, 0], normFor);
    expect(g.gaps).toHaveLength(0);
    expect(g.missingHours).toBe(0);
  });

  it('короткий день: 7ч = норма (не пробел), 5ч = недобор 2ч', () => {
    const full = calcWeekGaps(WEEK, [8, 7, 0, 8, 8, 0, 0], normFor);
    expect(full.gaps).toHaveLength(0);
    const short = calcWeekGaps(WEEK, [8, 5, 0, 8, 8, 0, 0], normFor);
    expect(short.underCount).toBe(1);
    expect(short.missingHours).toBe(2); // 7 − 5, а не 8 − 5
  });

  it('недельная норма (Σ календаря) = 8+7+0+8+8 = 31, а не плоские 40', () => {
    const weekNorm = WEEK.reduce((s, d) => s + normFor(d.iso, d.isWeekend), 0);
    expect(weekNorm).toBe(31);
  });

  it('пустая неделя по календарю: недобор = Σ норм рабочих дней (31), праздник исключён', () => {
    const g = calcWeekGaps(WEEK, [0, 0, 0, 0, 0, 0, 0], normFor);
    expect(g.emptyCount).toBe(4); // праздник не пустой день
    expect(g.missingHours).toBe(31);
  });

  it('без normFor — деградация на DAILY_NORM_HOURS×будни (back-compat)', () => {
    const g = calcWeekGaps(WEEK, [0, 0, 0, 0, 0, 0, 0]);
    expect(g.emptyCount).toBe(5);
    expect(g.missingHours).toBe(40);
  });
});

describe('normHours/factHours (UC-VAL-03: Σ нормы и Σ факта недели)', () => {
  it('полная неделя: норма 40, факт 40', () => {
    const g = calcWeekGaps(WEEK, [8, 8, 8, 8, 8, 0, 0]);
    expect(g.normHours).toBe(40);
    expect(g.factHours).toBe(40);
  });

  it('часы выходного НЕ входят в факт недели (нерабочий день)', () => {
    const g = calcWeekGaps(WEEK, [8, 8, 8, 8, 8, 5, 5]);
    expect(g.normHours).toBe(40);
    expect(g.factHours).toBe(40); // 5+5 в Сб/Вс не учитываются
  });

  it('недобор: факт 36 из нормы 40', () => {
    const g = calcWeekGaps(WEEK, [8, 4, 8, 8, 8, 0, 0]);
    expect(g.normHours).toBe(40);
    expect(g.factHours).toBe(36);
  });
});

describe('weekUnderfillNotice (UC-VAL-03: подтверждение при submit)', () => {
  it('факт = норма → нет недобора → пустая строка (поповер не нужен)', () => {
    const g = calcWeekGaps(WEEK, [8, 8, 8, 8, 8, 0, 0]);
    expect(weekUnderfillNotice(g)).toBe('');
  });

  it('факт > норма (переработка) → не недобор → пустая строка', () => {
    const g = calcWeekGaps(WEEK, [10, 8, 8, 8, 8, 0, 0]);
    expect(weekUnderfillNotice(g)).toBe('');
  });

  it('факт < норма → текст «N из M ч. Всё равно отправить?»', () => {
    const g = calcWeekGaps(WEEK, [8, 4, 8, 8, 8, 0, 0]);
    const notice = weekUnderfillNotice(g);
    expect(notice).toContain('Неделя недозаполнена');
    expect(notice).toContain('36 из 40 ч');
    expect(notice).toContain('Всё равно отправить?');
  });

  it('норма недели 0 (вся неделя праздники/выходные) → нет недобора', () => {
    const allHoliday = (_iso: string, _isWeekend: boolean): number => 0;
    const g = calcWeekGaps(WEEK, [0, 0, 0, 0, 0, 0, 0], allHoliday);
    expect(g.normHours).toBe(0);
    expect(weekUnderfillNotice(g)).toBe('');
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
