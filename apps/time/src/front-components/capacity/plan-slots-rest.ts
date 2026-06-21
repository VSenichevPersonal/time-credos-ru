import { RestApiClient } from 'twenty-client-sdk/rest';

import type { PlanSlot } from 'src/front-components/capacity/types';

// WI-47 «Вручную по месяцам»: клиент к контракту Dev2 (`credos-time-plan-slot`).
// Слот = {project(rel), periodMonth TEXT 'YYYY-MM', plannedHours NUMBER, (опц)
// department}. Доступ из песочницы виджета (Web Worker Remote DOM) через /s/ route.
// КОНТРАКТ Dev2 (POST /s/plan-slots, isAuthRequired, mode-based):
//   read:   { mode:'read', projectId }            → {ok, slots:[{id,projectId,departmentId,employeeId,periodMonth,plannedHours}]}
//   upsert: { mode:'upsert', projectId, slots:[{periodMonth,plannedHours,departmentId?,employeeId?}] }
//           plannedHours<=0 → слот удаляется. → {ok, created,updated,deleted, slots}
//           дедуп по ключу (project, department|null, employee|null, periodMonth).
// Планирование до СОТРУДНИКА (PLANNING_EMPLOYEE_LEVEL §3.1): employeeId задан →
// персональный слот (≠ отдельский слот того же месяца+отдела, не схлопывается).
// ВАЖНО: роут зарегистрирован ТОЛЬКО как POST — GET даёт 404 (была ошибка контракта).

const client = () => new RestApiClient();

export type PlanSlotInput = {
  periodMonth: string; // 'YYYY-MM'
  plannedHours: number;
  departmentId?: string | null;
  employeeId?: string | null; // задан = персональный слот (план на человека)
};

type RawSlot = {
  periodMonth?: string | null;
  plannedHours?: number | null;
  departmentId?: string | null;
  employeeId?: string | null;
};
type ListResp = { ok?: boolean; slots?: RawSlot[]; error?: string };

// Список слотов проекта (для префилла панели при открытии). POST mode:read.
export const fetchPlanSlots = async (projectId: string): Promise<PlanSlotInput[]> => {
  const resp = await client().post<ListResp>('/s/plan-slots', {
    mode: 'read',
    projectId,
  });
  if (!resp?.ok) throw new Error(resp?.error ?? 'Сервис слотов плана недоступен');
  return (resp.slots ?? [])
    .filter((s): s is RawSlot & { periodMonth: string } => !!s.periodMonth)
    .map((s) => ({
      periodMonth: s.periodMonth,
      plannedHours: s.plannedHours ?? 0,
      departmentId: s.departmentId ?? null,
      employeeId: s.employeeId ?? null,
    }));
};

// Планирование до СОТРУДНИКА — визуализация на доске (§7 SSOT, замыкание звена
// фетч→calc-load). Контракт /s/plan-slots read ОБЯЗАТЕЛЬНО требует projectId и НЕ
// поддерживает массовый read / by-period (см. plan-slots.logic.ts: «projectId is
// required»). Чтобы доска показывала персональный/детальный план, фетчим слоты по
// списку видимых проектов параллельно (N запросов) и склеиваем в ПЛОСКИЙ
// PlanSlot[] (projectId проставлен) → calc-load.buildSlotsByProject. Пустой список
// проектов → []. Ошибка отдельного проекта НЕ валит всю доску (тот проект просто
// без слотов). keep-it-simple; для read-all/by-period — follow-up Dev2 (флаг в
// SIGNALS), тогда заменим N вызовов одним.
export const fetchAllPlanSlots = async (projectIds: string[]): Promise<PlanSlot[]> => {
  const uniq = [...new Set(projectIds.filter(Boolean))];
  if (uniq.length === 0) return [];
  const perProject = await Promise.all(
    uniq.map(async (projectId) => {
      try {
        const resp = await client().post<ListResp>('/s/plan-slots', { mode: 'read', projectId });
        if (!resp?.ok) return [] as PlanSlot[];
        return (resp.slots ?? [])
          .filter((s): s is RawSlot & { periodMonth: string } => !!s.periodMonth)
          .map(
            (s): PlanSlot => ({
              projectId,
              departmentId: s.departmentId ?? null,
              employeeId: s.employeeId ?? null,
              periodMonth: s.periodMonth,
              plannedHours: s.plannedHours ?? null,
            }),
          );
      } catch {
        return [] as PlanSlot[];
      }
    }),
  );
  return perProject.flat();
};

type UpsertResp = { ok?: boolean; error?: string };

// Сохранить весь ручной раскид одним батч-вызовом (POST mode:upsert).
// plannedHours<=0 → слот удаляется на бэке (дедуп по project×dept×month).
export const savePlanSlots = async (
  projectId: string,
  slots: PlanSlotInput[],
): Promise<boolean> => {
  const resp = await client().post<UpsertResp>('/s/plan-slots', {
    mode: 'upsert',
    projectId,
    slots: slots.map((s) => ({
      periodMonth: s.periodMonth,
      plannedHours: s.plannedHours,
      departmentId: s.departmentId ?? undefined,
      employeeId: s.employeeId ?? undefined,
    })),
  });
  if (!resp?.ok) throw new Error(resp?.error ?? 'Не удалось сохранить раскид по месяцам');
  return true;
};
