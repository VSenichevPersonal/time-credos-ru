import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchAbsences,
  fetchBookings,
  fetchCalendar,
  fetchDepartments,
  fetchDeptPlans,
  fetchEmployeeDepartments,
  fetchEmployees,
  fetchProjectDeptShares,
  fetchProjects,
} from 'src/front-components/capacity/capacity-rest';
import { fetchAllPlanSlots } from 'src/front-components/capacity/plan-slots-rest';
import { useSelfEmployee } from 'src/front-components/shared/use-self-employee';
import { useGlobalSettings } from 'src/front-components/shared/use-global-settings';
import {
  buildAbsenceCtx,
  buildBookingCtx,
  buildHoursByDay,
  buildPeriods,
  buildSharesByProject,
  buildSlotsByProject,
} from 'src/front-components/capacity/calc-load';
import type {
  AbsenceCtx,
  BookingCtx,
  PlanRollupCtx,
  PlanSpread,
} from 'src/front-components/capacity/calc-load';
import type {
  Absence,
  Booking,
  CalendarDay,
  CapProject,
  DeptPlan,
  DeptRef,
  EmpDeptAssignment,
  EmployeeRef,
  Period,
  PlanSlot,
  ProjectDeptShare,
} from 'src/front-components/capacity/types';

export type Granularity = 'week' | 'month';

// Горизонт ПО УМОЛЧАНИЮ: недели = 16 (~4 мес), месяцы = 6. Якорь — текущая дата (UTC).
// REQ-0019: реальное число недель — из credosTimeSettings.planningHorizonWeeks
// (хук читает и передаёт в horizonRange/buildPeriods, fallback HORIZON.week).
export const HORIZON: Record<Granularity, number> = { week: 16, month: 6 };

// Кол-во недель горизонта в разумных границах (≥1, ≤52). null/невалид → дефолт 16.
export const clampHorizonWeeks = (weeks: number | null | undefined): number => {
  if (typeof weeks !== 'number' || !Number.isFinite(weeks) || weeks < 1) return HORIZON.week;
  return Math.min(Math.round(weeks), 52);
};

// Чистая функция: диапазон дат для загрузки данных доски (REST-запросы).
// from = начало месяца anchor; to = конец (months) месяцев включительно.
// weekCount — настраиваемое число недель горизонта (REQ-0019); окно расширяем до
// ceil(weeks/4)+1 месяцев, чтобы покрыть все колонки. Дефолт 16 → months=5 как
// раньше (back-compat date-range).
export const horizonRange = (
  anchor: Date,
  g: Granularity,
  weekCount: number = HORIZON.week,
): { from: string; to: string } => {
  const from = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const months = g === 'month' ? HORIZON.month + 1 : Math.ceil(weekCount / 4) + 1;
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
  bookings: Booking[]; // REQ-0004 C: брони ресурса (HARD/SOFT) для слоя Demand
  assignments: EmpDeptAssignment[]; // §7.2 rollupCtx: назначения emp×отдел (FTE+даты)
  planSlots: PlanSlot[]; // §7 SSOT: помесячные слоты плана (персональные + отдельские)
};

// Загрузка данных доски + расчёт колонок горизонта. reloadProjects() — точечный
// рефетч проектов после правки плана (пересчёт загрузки на лету, без всей доски).
export const useCapacity = (granularity: Granularity) => {
  const anchor = useMemo(() => new Date(), []);
  // A2: единый источник роли (useUserId → workspaceMember → employee.isManager).
  // Заменяет прежний форс isManager:true всем (TODO(rbac) снят). Гейт «Планировать»
  // теперь по реальной роли. TODO(ciso-005): UX-гейт, защита — на сервере.
  const { isManager } = useSelfEmployee();
  // REQ-0019: горизонт недель — из глобальных настроек (fallback HORIZON.week=16).
  // Месяцы оставлены фиксированными (HORIZON.month) — отдельной настройки нет.
  const settings = useGlobalSettings();
  const weekCount = clampHorizonWeeks(settings?.planningHorizonWeeks);
  // REQ-0004 C: тумблер показа SOFT-броней. fallback false до загрузки настроек
  // (SOFT-слой консервативно скрыт, пока не подтверждено настройкой).
  const includeSoft = settings?.tentativeBookingEnabled ?? false;
  const periodCount = granularity === 'week' ? weekCount : HORIZON.month;
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
    bookings: [],
    assignments: [],
    planSlots: [],
  });
  // reload() — полный повтор загрузки доски (кнопка «Повторить» при ошибке).
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    const range = horizonRange(anchor, granularity, weekCount);
    Promise.all([
      fetchDepartments(),
      fetchEmployees(),
      fetchProjects(),
      fetchDeptPlans(),
      fetchCalendar(range.from, range.to),
      fetchAbsences(range.from, range.to),
      fetchProjectDeptShares(),
      fetchBookings(range.from, range.to),
      fetchEmployeeDepartments(),
    ])
      .then(
        ([departments, employees, projects, deptPlans, calendar, absences, shares, bookings, assignments]) => {
          if (!alive) return;
          // planSlots грузятся отдельным эффектом (зависят от списка проектов) —
          // на первой отрисовке доска без слотов = прежнее EVEN/dept-поведение,
          // затем дозагружаются и пересчитывают персональный/детальный план.
          setState((s) => ({
            ...s,
            loading: false,
            error: null,
            departments,
            employees,
            projects,
            deptPlans,
            calendar,
            absences,
            shares,
            bookings,
            assignments,
          }));
        },
      )
      .catch((e: unknown) => {
        if (!alive) return;
        const message = e instanceof Error ? e.message : 'неизвестная ошибка';
        setState((s) => ({ ...s, loading: false, error: message }));
      });
    return () => {
      alive = false;
    };
  }, [anchor, granularity, nonce, weekCount]);

  // §7 SSOT: ключ списка проектов (сорт+join) — стабильная зависимость для
  // дозагрузки слотов (массив projects меняет ссылку каждый рендер, id-ключ — нет).
  const projectIdsKey = useMemo(
    () => [...state.projects.map((p) => p.id)].sort().join(','),
    [state.projects],
  );

  // §7 SSOT (замыкание фетч→calc-load): дозагрузка ПЛАНОВЫХ СЛОТОВ по видимым
  // проектам. Отдельный эффект — слоты зависят от уже загруженного списка проектов;
  // не блокирует первичную отрисовку доски. fetchAllPlanSlots = N read-запросов
  // (контракт /s/plan-slots без массового read — см. plan-slots-rest). nonce →
  // рефетч после правки персонального плана (onSavedPlan доски).
  useEffect(() => {
    let alive = true;
    const ids = projectIdsKey ? projectIdsKey.split(',') : [];
    if (ids.length === 0) {
      setState((s) => (s.planSlots.length === 0 ? s : { ...s, planSlots: [] }));
      return;
    }
    fetchAllPlanSlots(ids)
      .then((planSlots) => {
        if (!alive) return;
        setState((s) => ({ ...s, planSlots }));
      })
      .catch(() => {
        // Слоты — обогащение доски: сбой не должен ронять весь экран. Без слотов
        // доска показывает прежнее EVEN/dept-распределение (fallback сохранён).
        if (!alive) return;
        setState((s) => (s.planSlots.length === 0 ? s : { ...s, planSlots: [] }));
      });
    return () => {
      alive = false;
    };
  }, [projectIdsKey, nonce]);

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

  // REQ-0004 C: точечный рефетч броней (после правки/добавления резерва).
  const reloadBookings = useCallback(async () => {
    const range = horizonRange(anchor, granularity, weekCount);
    const bookings = await fetchBookings(range.from, range.to);
    setState((s) => ({ ...s, bookings }));
  }, [anchor, granularity, weekCount]);

  const periods: Period[] = useMemo(
    () => buildPeriods(anchor, state.calendar, granularity, periodCount),
    [anchor, state.calendar, granularity, periodCount],
  );

  // W3-1: контекст вычета отсутствий из ёмкости — собирается один раз, передаётся
  // в deptLoadCells/employeeLoadCells на доске (UI). Без него ёмкость = прежняя.
  const absenceCtx: AbsenceCtx = useMemo(
    () => buildAbsenceCtx(state.absences, state.employees, state.calendar),
    [state.absences, state.employees, state.calendar],
  );

  // REQ-0013 13b: карта projectId → доли отделов, передаётся в deptLoadCells/
  // employeeLoadCells/deptProjectLoads. Пусто → расчёт fallback на plannedEffort.
  const sharesByProject = useMemo(
    () => buildSharesByProject(state.shares),
    [state.shares],
  );

  // §7 SSOT: карта projectId → его слоты (персональные + отдельские). Передаётся
  // в deptLoadCells/employeeLoadCells. Пусто → расчёт прежний (EVEN/dept без слотов).
  const slotsByProject = useMemo(
    () => buildSlotsByProject(state.planSlots),
    [state.planSlots],
  );

  // §7.2 rollupCtx: распределение нераспределённого остатка отдела ПО FTE
  // (assignments + состав employees). Без него остаток делится поровну (1/headcount).
  const rollupCtx: PlanRollupCtx = useMemo(
    () => ({ assignments: state.assignments, employees: state.employees }),
    [state.assignments, state.employees],
  );

  // REQ-0004 C: контекст броней (группировка по сотруднику + тумблер SOFT).
  // Передаётся в deptLoadCells/employeeLoadCells. includeSoft = настройка
  // tentativeBookingEnabled (SOFT-слой рисуется только когда включён).
  const bookingCtx: BookingCtx = useMemo(
    () => buildBookingCtx(state.bookings, state.employees, includeSoft),
    [state.bookings, state.employees, includeSoft],
  );

  // WI-05: контекст раскида плана по РАБОЧИМ дням производственного календаря.
  //   hoursByDay — карта YYYY-MM-DD → рабочих часов дня (план «капает» только на
  //     будни → бьётся с ёмкостью, которая тоже считается по рабочим часам).
  //   horizonEnd — последний день последней колонки: проект без endDate тянется
  //     до конца горизонта доски (иначе его план = 0 и он невидим).
  // Передаётся в deptLoadCells/employeeLoadCells/deptProjectLoads/... на доске.
  const spread: PlanSpread = useMemo(() => {
    const last = periods[periods.length - 1];
    return {
      hoursByDay: buildHoursByDay(state.calendar),
      horizonEnd: last ? last.to.toISOString().slice(0, 10) : undefined,
    };
  }, [state.calendar, periods]);

  return {
    ...state,
    isManager,
    periods,
    absenceCtx,
    sharesByProject,
    slotsByProject,
    rollupCtx,
    bookingCtx,
    spread,
    includeSoft,
    anchor,
    reload,
    reloadProjects,
    reloadDeptPlans,
    reloadShares,
    reloadBookings,
  };
};
