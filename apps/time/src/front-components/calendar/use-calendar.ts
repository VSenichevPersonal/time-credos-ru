import { useEffect, useMemo, useState } from 'react';

import { fetchCalendarYear } from 'src/front-components/calendar/calendar-rest';
import { aggregateByMonth } from 'src/front-components/calendar/calc-month';
import type { MonthAgg } from 'src/front-components/calendar/types';

// Загрузка дней года + помесячный агрегат. Год переключается стрелками.
export const useCalendar = (year: number) => {
  const [state, setState] = useState<{ loading: boolean; error: string | null; months: MonthAgg[] }>(
    { loading: true, error: null, months: [] },
  );

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchCalendarYear(year)
      .then((days) => {
        if (alive) setState({ loading: false, error: null, months: aggregateByMonth(days) });
      })
      .catch((e: unknown) => {
        if (alive) {
          setState({
            loading: false,
            error: e instanceof Error ? e.message : 'Ошибка загрузки',
            months: [],
          });
        }
      });
    return () => {
      alive = false;
    };
  }, [year]);

  const hasData = useMemo(
    () => state.months.some((m) => m.calendarDays > 0),
    [state.months],
  );

  return { ...state, hasData };
};
