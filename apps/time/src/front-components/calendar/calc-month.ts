import type { CalDay, MonthAgg } from 'src/front-components/calendar/types';

// Агрегация дней по месяцам (график 5/2). Рабочие = WORKDAY + SHORT (короткий
// предпраздничный — тоже рабочий, но меньше часов). Нерабочие = WEEKEND + HOLIDAY.

const monthIndex = (date: string): number => Number(date.slice(5, 7)) - 1;

export const aggregateByMonth = (days: CalDay[]): MonthAgg[] => {
  const months: MonthAgg[] = Array.from({ length: 12 }, (_, month) => ({
    month,
    calendarDays: 0,
    workDays: 0,
    offDays: 0,
    shortDays: 0,
    workHours: 0,
  }));
  for (const d of days) {
    const m = monthIndex(d.date);
    if (Number.isNaN(m) || m < 0 || m > 11) continue; // битая дата → skip, не краш
    const agg = months[m];
    agg.calendarDays += 1;
    if (d.dayType === 'WORKDAY' || d.dayType === 'SHORT') {
      agg.workDays += 1;
      agg.workHours += d.hours;
      if (d.dayType === 'SHORT') agg.shortDays += 1;
    } else {
      agg.offDays += 1;
    }
  }
  return months;
};

// Суммирование агрегатов (для квартала / года).
export const sumAgg = (list: MonthAgg[]): Omit<MonthAgg, 'month'> =>
  list.reduce(
    (acc, a) => ({
      calendarDays: acc.calendarDays + a.calendarDays,
      workDays: acc.workDays + a.workDays,
      offDays: acc.offDays + a.offDays,
      shortDays: acc.shortDays + a.shortDays,
      workHours: acc.workHours + a.workHours,
    }),
    { calendarDays: 0, workDays: 0, offDays: 0, shortDays: 0, workHours: 0 },
  );
