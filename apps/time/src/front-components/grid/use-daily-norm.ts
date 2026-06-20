import { useEffect, useState } from 'react';

import { fetchCalendarYear } from 'src/front-components/calendar/calendar-rest';
import { DAILY_NORM_HOURS } from 'src/front-components/grid/format';

// T2: SSOT нормы дня. Норма = рабочие часы дня из ПРОИЗВОДСТВЕННОГО календаря
// (тот же источник, что у дашборда/сервера reports-calc), а НЕ плоская
// DAILY_NORM_HOURS×будни. Иначе на праздничных/коротких неделях сетка показывает
// ложный «недобор», расходясь с дашбордом. Календарь не загружен → деградация на
// DAILY_NORM_HOURS (будни) / 0 (выходные) — прежнее поведение.

export type NormForDay = (iso: string, isWeekend: boolean) => number;

export const useDailyNorm = (isos: string[]): NormForDay => {
  const [byDate, setByDate] = useState<Map<string, number>>(new Map());

  // Годы видимого диапазона (обычно 1; неделя на стыке лет → 2).
  const years = Array.from(new Set(isos.map((d) => d.slice(0, 4)))).sort().join(',');

  useEffect(() => {
    if (!years) return;
    let alive = true;
    const yrs = years.split(',').map(Number).filter((y) => Number.isFinite(y));
    void Promise.all(yrs.map((y) => fetchCalendarYear(y)))
      .then((lists) => {
        if (!alive) return;
        const m = new Map<string, number>();
        for (const list of lists) for (const d of list) m.set(d.date, d.hours);
        setByDate(m);
      })
      .catch(() => {
        /* деградация: остаёмся на fallback DAILY_NORM_HOURS */
      });
    return () => {
      alive = false;
    };
  }, [years]);

  return (iso, isWeekend) => {
    const h = byDate.get(iso);
    if (h !== undefined) return h; // календарь = SSOT (праздник/короткий день = его часы)
    return isWeekend ? 0 : DAILY_NORM_HOURS; // fallback пока не загружен
  };
};
