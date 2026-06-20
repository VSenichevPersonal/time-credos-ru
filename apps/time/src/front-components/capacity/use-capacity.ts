import { useEffect, useMemo, useState } from 'react';

import {
  fetchCalendar,
  fetchDepartments,
  fetchProjects,
} from 'src/front-components/capacity/capacity-rest';
import { buildPeriods } from 'src/front-components/capacity/calc-load';
import type {
  CalendarDay,
  CapProject,
  DeptRef,
  Period,
} from 'src/front-components/capacity/types';

export type Granularity = 'week' | 'month';

// Горизонт: недели = 16 (~4 мес), месяцы = 6. Якорь — текущая дата (UTC).
const HORIZON: Record<Granularity, number> = { week: 16, month: 6 };

const horizonRange = (anchor: Date, g: Granularity): { from: string; to: string } => {
  const from = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const months = g === 'month' ? HORIZON.month + 1 : 5;
  const to = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + months, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
};

type State = {
  loading: boolean;
  error: string | null;
  departments: DeptRef[];
  projects: CapProject[];
  calendar: CalendarDay[];
};

// Загрузка данных доски + расчёт колонок горизонта.
export const useCapacity = (granularity: Granularity) => {
  const anchor = useMemo(() => new Date(), []);
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    departments: [],
    projects: [],
    calendar: [],
  });

  useEffect(() => {
    let alive = true;
    const range = horizonRange(anchor, granularity);
    Promise.all([fetchDepartments(), fetchProjects(), fetchCalendar(range.from, range.to)])
      .then(([departments, projects, calendar]) => {
        if (!alive) return;
        setState({ loading: false, error: null, departments, projects, calendar });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : 'неизвестная ошибка';
        setState((s) => ({ ...s, loading: false, error: message }));
      });
    return () => {
      alive = false;
    };
  }, [anchor, granularity]);

  const periods: Period[] = useMemo(
    () => buildPeriods(anchor, state.calendar, granularity, HORIZON[granularity]),
    [anchor, state.calendar, granularity],
  );

  return { ...state, periods, anchor };
};
