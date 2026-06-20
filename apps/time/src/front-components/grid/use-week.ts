import { useMemo, useState } from 'react';

// Хук недели: текущая неделя по умолчанию, навигация ←/→.
// Понедельник — первый день (русская локаль). Возвращает 7 дней + границы ISO.

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

export type WeekDay = {
  iso: string; // YYYY-MM-DD (локальная дата без времени)
  dayLabel: string; // «Пн»
  dateLabel: string; // «17»
  isWeekend: boolean;
};

// Понедельник недели, содержащей dt (00:00 UTC, чтобы ISO-дата была стабильна).
const mondayOf = (dt: Date): Date => {
  const d = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // Пн=0 … Вс=6
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
};

const toIso = (d: Date): string => d.toISOString().slice(0, 10);

export const useWeek = () => {
  const [monday, setMonday] = useState<Date>(() => mondayOf(new Date()));

  const days = useMemo<WeekDay[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      return {
        iso: toIso(d),
        dayLabel: WEEKDAY_LABELS[i],
        dateLabel: String(d.getUTCDate()),
        isWeekend: i >= 5,
      };
    });
  }, [monday]);

  const range = useMemo(() => {
    const first = days[0];
    const last = days[6];
    return {
      from: `${first.iso}T00:00:00.000Z`,
      to: `${last.iso}T23:59:59.999Z`,
    };
  }, [days]);

  const title = useMemo(() => {
    const a = new Date(`${days[0].iso}T00:00:00Z`);
    const b = new Date(`${days[6].iso}T00:00:00Z`);
    const fmt = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
    return `${fmt(a)} — ${fmt(b)} ${b.getUTCFullYear()}`;
  }, [days]);

  const shift = (weeks: number) => {
    setMonday((prev) => {
      const next = new Date(prev);
      next.setUTCDate(next.getUTCDate() + weeks * 7);
      return next;
    });
  };

  const reset = () => setMonday(mondayOf(new Date()));

  return { days, range, title, prev: () => shift(-1), next: () => shift(1), reset };
};
