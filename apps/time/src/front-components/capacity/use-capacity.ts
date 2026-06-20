import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchCalendar,
  fetchDepartments,
  fetchEmployees,
  fetchProjects,
  resolveSelfIsManager,
} from 'src/front-components/capacity/capacity-rest';
import { buildPeriods } from 'src/front-components/capacity/calc-load';
import type {
  CalendarDay,
  CapProject,
  DeptRef,
  EmployeeRef,
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
  isManager: boolean;
  departments: DeptRef[];
  employees: EmployeeRef[];
  projects: CapProject[];
  calendar: CalendarDay[];
};

// Загрузка данных доски + расчёт колонок горизонта. reloadProjects() — точечный
// рефетч проектов после правки плана (пересчёт загрузки на лету, без всей доски).
export const useCapacity = (granularity: Granularity) => {
  const anchor = useMemo(() => new Date(), []);
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    isManager: false,
    departments: [],
    employees: [],
    projects: [],
    calendar: [],
  });

  useEffect(() => {
    let alive = true;
    const range = horizonRange(anchor, granularity);
    Promise.all([
      fetchDepartments(),
      fetchEmployees(),
      fetchProjects(),
      fetchCalendar(range.from, range.to),
      resolveSelfIsManager(null),
    ])
      .then(([departments, employees, projects, calendar, isManagerInWorkspace]) => {
        if (!alive) return;
        // TODO(rbac): RBAC-гейт «Планировать» отложен в RBAC-волну. В песочнице
        // front-component текущего пользователя надёжно получить нельзя (токен =
        // роль приложения, SDK не отдаёт currentWorkspaceMember), поэтому кнопку
        // показываем ВСЕМ. isManagerInWorkspace оставляем для будущего гейта.
        void isManagerInWorkspace;
        setState({
          loading: false,
          error: null,
          isManager: true,
          departments,
          employees,
          projects,
          calendar,
        });
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

  const reloadProjects = useCallback(async () => {
    const projects = await fetchProjects();
    setState((s) => ({ ...s, projects }));
  }, []);

  const periods: Period[] = useMemo(
    () => buildPeriods(anchor, state.calendar, granularity, HORIZON[granularity]),
    [anchor, state.calendar, granularity],
  );

  return { ...state, periods, anchor, reloadProjects };
};
