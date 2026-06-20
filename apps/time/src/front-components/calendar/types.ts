// Помесячный агрегат производственного календаря РФ (график 5/2).
// Источник — credosTimeWorkdayCalendar (по дням: dayType + часы).

export type DayType = 'WORKDAY' | 'WEEKEND' | 'HOLIDAY' | 'SHORT';

export type CalDay = {
  date: string; // YYYY-MM-DD
  dayType: DayType;
  hours: number;
};

// Агрегат месяца (как в производственном календаре consultant.ru).
export type MonthAgg = {
  month: number; // 0..11
  calendarDays: number; // всего дней в месяце (с данными)
  workDays: number; // рабочие = WORKDAY + SHORT
  offDays: number; // нерабочие = WEEKEND + HOLIDAY
  shortDays: number; // из рабочих — предпраздничные короткие (SHORT)
  workHours: number; // Σ часов рабочих дней
};
