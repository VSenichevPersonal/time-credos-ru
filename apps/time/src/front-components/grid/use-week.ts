import { useMemo, useState } from 'react';

// Хук периода: неделя (Пн–Вс) + выбранный день внутри неё. Навигация ‹ ›.
// Понедельник — первый день. Даёт ISO-границы, заголовок, «сегодня».

export const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAY_FULL = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
];
const MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

export type WeekDay = {
  iso: string; // YYYY-MM-DD
  dayLabel: string; // «Пн»
  fullLabel: string; // «Понедельник»
  dateLabel: string; // «17»
  isWeekend: boolean;
  isToday: boolean;
};

const todayIso = (): string => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())).toISOString().slice(0, 10);
};

const mondayOf = (dt: Date): Date => {
  const d = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // Пн=0 … Вс=6
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
};

const toIso = (d: Date): string => d.toISOString().slice(0, 10);

export const useWeek = () => {
  const [monday, setMonday] = useState<Date>(() => mondayOf(new Date()));
  // Индекс выбранного дня (0..6) для режима «День». По умолчанию — сегодня или Пн.
  const [dayIndex, setDayIndex] = useState<number>(() => {
    const dow = (new Date().getDay() + 6) % 7;
    return dow <= 6 ? dow : 0;
  });

  const tIso = todayIso();

  const days = useMemo<WeekDay[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      const iso = toIso(d);
      return {
        iso,
        dayLabel: WEEKDAY_LABELS[i],
        fullLabel: WEEKDAY_FULL[i],
        dateLabel: String(d.getUTCDate()),
        isWeekend: i >= 5,
        isToday: iso === tIso,
      };
    });
  }, [monday, tIso]);

  const range = useMemo(
    () => ({ from: `${days[0].iso}T00:00:00.000Z`, to: `${days[6].iso}T23:59:59.999Z` }),
    [days],
  );

  const fmt = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  const weekTitle = useMemo(() => {
    const a = new Date(`${days[0].iso}T00:00:00Z`);
    const b = new Date(`${days[6].iso}T00:00:00Z`);
    return `${fmt(a)} — ${fmt(b)} ${b.getUTCFullYear()}`;
  }, [days]);

  const selectedDay = days[dayIndex] ?? days[0];
  const dayTitle = useMemo(() => {
    const d = new Date(`${selectedDay.iso}T00:00:00Z`);
    return `${selectedDay.fullLabel}, ${fmt(d)} ${d.getUTCFullYear()}`;
  }, [selectedDay]);

  const shiftWeek = (weeks: number) =>
    setMonday((prev) => {
      const next = new Date(prev);
      next.setUTCDate(next.getUTCDate() + weeks * 7);
      return next;
    });

  // Сдвиг дня: переходит на соседнюю неделю при выходе за границы.
  const shiftDay = (delta: number) => {
    setDayIndex((prev) => {
      const next = prev + delta;
      if (next < 0) {
        shiftWeek(-1);
        return 6;
      }
      if (next > 6) {
        shiftWeek(1);
        return 0;
      }
      return next;
    });
  };

  const reset = () => {
    setMonday(mondayOf(new Date()));
    setDayIndex((new Date().getDay() + 6) % 7);
  };

  return {
    days,
    range,
    weekTitle,
    dayTitle,
    selectedDay,
    dayIndex,
    setDayIndex,
    prevWeek: () => shiftWeek(-1),
    nextWeek: () => shiftWeek(1),
    prevDay: () => shiftDay(-1),
    nextDay: () => shiftDay(1),
    reset,
  };
};
