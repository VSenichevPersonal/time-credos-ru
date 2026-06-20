import { describe, expect, it } from 'vitest';

import { aggregateByMonth, sumAgg } from './calc-month';
import type { CalDay } from './types';

const day = (date: string, dayType: CalDay['dayType'], hours: number): CalDay => ({
  date,
  dayType,
  hours,
});

describe('aggregateByMonth — базовые', () => {
  it('пустой массив → 12 месяцев, все нули', () => {
    const result = aggregateByMonth([]);
    expect(result).toHaveLength(12);
    result.forEach((m, i) => {
      expect(m.month).toBe(i);
      expect(m.calendarDays).toBe(0);
      expect(m.workDays).toBe(0);
      expect(m.offDays).toBe(0);
      expect(m.shortDays).toBe(0);
      expect(m.workHours).toBe(0);
    });
  });

  it('WORKDAY 8ч в январе → month[0]: workDays=1, workHours=8, calendarDays=1', () => {
    const result = aggregateByMonth([day('2026-01-12', 'WORKDAY', 8)]);
    expect(result[0].workDays).toBe(1);
    expect(result[0].workHours).toBe(8);
    expect(result[0].calendarDays).toBe(1);
    expect(result[0].offDays).toBe(0);
    expect(result[0].shortDays).toBe(0);
  });

  it('WEEKEND → offDays=1, workDays=0, workHours=0', () => {
    const result = aggregateByMonth([day('2026-01-10', 'WEEKEND', 0)]);
    expect(result[0].offDays).toBe(1);
    expect(result[0].workDays).toBe(0);
    expect(result[0].workHours).toBe(0);
  });

  it('HOLIDAY → offDays=1 (как WEEKEND, нерабочий)', () => {
    const result = aggregateByMonth([day('2026-01-01', 'HOLIDAY', 0)]);
    expect(result[0].offDays).toBe(1);
    expect(result[0].workDays).toBe(0);
  });

  it('SHORT (7ч) → workDays=1, shortDays=1, workHours=7', () => {
    const result = aggregateByMonth([day('2026-02-20', 'SHORT', 7)]);
    expect(result[1].workDays).toBe(1);
    expect(result[1].shortDays).toBe(1);
    expect(result[1].workHours).toBe(7);
    expect(result[1].offDays).toBe(0);
  });
});

describe('aggregateByMonth — группировка по месяцам', () => {
  it('дни в разных месяцах не смешиваются', () => {
    const days: CalDay[] = [
      day('2026-01-05', 'WORKDAY', 8),
      day('2026-03-10', 'WORKDAY', 8),
      day('2026-03-11', 'WEEKEND', 0),
    ];
    const result = aggregateByMonth(days);
    expect(result[0].workDays).toBe(1); // янв
    expect(result[1].workDays).toBe(0); // фев — пусто
    expect(result[2].workDays).toBe(1); // мар
    expect(result[2].offDays).toBe(1);
    expect(result[2].calendarDays).toBe(2);
  });

  it('Σ calendarDays по всем месяцам = len(days)', () => {
    const days: CalDay[] = [
      day('2026-01-05', 'WORKDAY', 8),
      day('2026-06-10', 'WORKDAY', 8),
      day('2026-12-31', 'WEEKEND', 0),
    ];
    const result = aggregateByMonth(days);
    const total = result.reduce((s, m) => s + m.calendarDays, 0);
    expect(total).toBe(3);
  });

  it('workDays = WORKDAY + SHORT (оба рабочие)', () => {
    const days: CalDay[] = [
      day('2026-05-08', 'WORKDAY', 8),
      day('2026-05-08', 'SHORT', 7), // два дня в одном месяце
    ];
    const result = aggregateByMonth(days);
    expect(result[4].workDays).toBe(2); // май
    expect(result[4].shortDays).toBe(1);
    expect(result[4].workHours).toBe(15);
  });

  // [bug]#2 (P3): monthIndex('invalid') → NaN; guard `NaN < 0 || NaN > 11` = false → months[NaN]
  // = undefined → TypeError. Исправить: добавить `isNaN(m)` в guard или DATE_RE валидацию.
  // Практически не достижимо (все даты из БД YYYY-MM-DD), но делает код хрупким.
  it.todo('invalid date (некорректный месяц) игнорируется без crash — [bug]#2 fix needed');
});

describe('sumAgg', () => {
  it('пустой список → все нули', () => {
    const r = sumAgg([]);
    expect(r.workDays).toBe(0);
    expect(r.workHours).toBe(0);
    expect(r.calendarDays).toBe(0);
    expect(r.offDays).toBe(0);
    expect(r.shortDays).toBe(0);
  });

  it('Σ по двум месяцам: складывает все поля', () => {
    const months = aggregateByMonth([
      day('2026-01-05', 'WORKDAY', 8),
      day('2026-01-06', 'SHORT', 7),
      day('2026-02-09', 'WORKDAY', 8),
      day('2026-02-14', 'WEEKEND', 0),
    ]);
    const quarter = sumAgg(months.slice(0, 3)); // Q1 (янв-мар)
    expect(quarter.workDays).toBe(3);
    expect(quarter.workHours).toBe(23);
    expect(quarter.offDays).toBe(1);
    expect(quarter.shortDays).toBe(1);
    expect(quarter.calendarDays).toBe(4);
  });

  it('нет поля month в результате (Omit<MonthAgg, month>)', () => {
    const r = sumAgg([{ month: 0, calendarDays: 1, workDays: 1, offDays: 0, shortDays: 0, workHours: 8 }]);
    expect('month' in r).toBe(false);
  });

  it('год: Σ workHours по всем 12 месяцам = полная норма', () => {
    const days: CalDay[] = [];
    // 22 рабочих дня × 8ч = 176ч (обычный производственный месяц)
    for (let d = 1; d <= 22; d++) {
      days.push(day(`2026-01-${String(d).padStart(2, '0')}`, 'WORKDAY', 8));
    }
    const months = aggregateByMonth(days);
    const yearAgg = sumAgg(months);
    expect(yearAgg.workHours).toBe(176);
    expect(yearAgg.workDays).toBe(22);
  });
});
