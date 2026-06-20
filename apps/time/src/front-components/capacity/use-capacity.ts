import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchAbsences,
  fetchCalendar,
  fetchDepartments,
  fetchDeptPlans,
  fetchEmployees,
  fetchProjectDeptShares,
  fetchProjects,
} from 'src/front-components/capacity/capacity-rest';
import { useSelfEmployee } from 'src/front-components/shared/use-self-employee';
import {
  buildAbsenceCtx,
  buildPeriods,
  buildSharesByProject,
} from 'src/front-components/capacity/calc-load';
import type { AbsenceCtx } from 'src/front-components/capacity/calc-load';
import type {
  Absence,
  CalendarDay,
  CapProject,
  DeptPlan,
  DeptRef,
  EmployeeRef,
  Period,
  ProjectDeptShare,
} from 'src/front-components/capacity/types';

export type Granularity = 'week' | 'month';

// Горизонт: недели = 16 (~4 мес), месяцы = 6. Якорь — текущая дата (UTC).
export const HORIZON: Record<Granularity, number> = { week: 16, month: 6 };

// Чистая функция: диапазон дат для загрузки данных доски (REST-запросы).
// from = начало месяца anchor; to = конец (months) месяцев включительно.
export const horizonRange = (anchor: Date, g: Granularity): { from: string; to: string } => {
  const from = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const months = g === 'month' ? HORIZON.month + 1 : 5;
  const to = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + months, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
};

type State = {
  loading: boolean;
  error: string | null;
  departments: DeptRef[];
  employees: EmployeeRef[];
  projects: CapProject[];
  deptPlans: DeptPlan[];
  calendar: CalendarDay[];
  absences: Absence[]; // W3-1: отсутствия для вычета из ёмкости доски
  shares: ProjectDeptShare[]; // REQ-0013 13b: доли отделов в проектах
};

// Загрузка данных доски + расчёт колонок горизонта. reloadProjects() — точечный
// рефетч проектов после правки плана (пересчёт загрузки на лету, без всей доски).
export const useCapacity = (granularity: Granularity) => {
  const anchor = useMemo(() => new Date(), []);
  // A2: единый источник роли (useUserId → workspaceMember → employee.isManager).
  // Заменяет прежний форс isManager:true всем (TODO(rbac) снят). Гейт «Планировать»
  // теперь по реальной роли. TODO(ciso-005): UX-гейт, защита — на сервере.
  const { isManager } = useSelfEmployee();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    departments: [],
    employees: [],
    projects: [],
    deptPlans: [],
    calendar: [],
    absences: [],
    shares: [],
  });
  // reload() — полный повтор загрузки доски (кнопка «Повторить» при ошибке).
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    const range = horizonRange(anchor, granularity);
    Promise.all([
      fetchDepartments(),
      fetchEmployees(),
      fetchProjects(),
      fetchDeptPlans(),
      fetchCalendar(range.from, range.to),
      fetchAbsences(range.from, range.to),
      fetchProjectDeptShares(),
    ])
      .then(([departments, employees, projects, deptPlans, calendar, absences, shares]) => {
        if (!alive) return;
        setState({
          loading: false,
          error: null,
          departments,
          employees,
          projects,
          deptPlans,
          calendar,
          absences,
          shares,
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
  }, [anchor, granularity, nonce]);

  const reloadProjects = useCallback(async () => {
    const projects = await fetchProjects();
    setState((s) => ({ ...s, projects }));
  }, []);

  // REQ-0012: точечный рефетч плановых загрузок отдела (после правки в планировании).
  const reloadDeptPlans = useCallback(async () => {
    const deptPlans = await fetchDeptPlans();
    setState((s) => ({ ...s, deptPlans }));
  }, []);

  // REQ-0013 13b: точечный рефетч долей отделов (после правки мульти-отдел раскида).
  const reloadShares = useCallback(async () => {
    const shares = await fetchProjectDeptShares();
    setState((s) => ({ ...s, shares }));
  }, []);

  const periods: Period[] = useMemo(
    () => buildPeriods(anchor, state.calendar, granularity, HORIZON[granularity]),
    [anchor, state.calendar, granularity],
  );

  // W3-1: контекст вычета отсутствий из ёмкости — собирается один раз, передаётся
  // в deptLoadCells/employeeLoadCells на доске (UI). Без него ёмкость = прежняя.
  const absenceCtx: AbsenceCtx = useMemo(
    () => buildAbsenceCtx(state.absences, state.employees, state.calendar),
    [state.absences, state.employees, state.calendar],
  );

  return { ...state, isManager, periods, absenceCtx, anchor, reload, reloadProjects, reloadDeptPlans };
};
