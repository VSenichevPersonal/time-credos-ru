import { RestApiClient } from 'twenty-client-sdk/rest';

// WI-47 «Вручную по месяцам»: клиент к контракту Dev2 (`credos-time-plan-slot`).
// Слот = {project(rel), periodMonth TEXT 'YYYY-MM', plannedHours NUMBER, (опц)
// department}. Доступ из песочницы виджета (Web Worker Remote DOM) через /s/ route.
//   GET   /s/plan-slots?projectId=  → {ok, slots:[{periodMonth, plannedHours, departmentId?}]}
//   POST  /s/plan-slots {projectId, periodMonth, plannedHours, departmentId?}  → upsert одного месяца
// Имена полей согласованы; если Dev2 уточнит в SIGNALS — поправить здесь (один файл).

const client = () => new RestApiClient();

export type PlanSlotInput = {
  periodMonth: string; // 'YYYY-MM'
  plannedHours: number;
  departmentId?: string | null;
};

type RawSlot = {
  periodMonth?: string | null;
  plannedHours?: number | null;
  departmentId?: string | null;
};
type ListResp = { ok?: boolean; slots?: RawSlot[]; error?: string };

// Список слотов проекта (для префилла панели при открытии).
export const fetchPlanSlots = async (projectId: string): Promise<PlanSlotInput[]> => {
  const resp = await client().get<ListResp>('/s/plan-slots', {
    query: { projectId },
  });
  if (!resp?.ok) throw new Error(resp?.error ?? 'Сервис слотов плана недоступен');
  return (resp.slots ?? [])
    .filter((s): s is RawSlot & { periodMonth: string } => !!s.periodMonth)
    .map((s) => ({
      periodMonth: s.periodMonth,
      plannedHours: s.plannedHours ?? 0,
      departmentId: s.departmentId ?? null,
    }));
};

type UpsertResp = { ok?: boolean; error?: string };

// Upsert одного месяца. Сохранение панели вызывает по месяцу (MVP — без батча;
// если Dev2 даст батч-route, заменить на один вызов).
export const upsertPlanSlot = async (
  projectId: string,
  slot: PlanSlotInput,
): Promise<void> => {
  const resp = await client().post<UpsertResp>('/s/plan-slots', {
    projectId,
    periodMonth: slot.periodMonth,
    plannedHours: slot.plannedHours,
    departmentId: slot.departmentId ?? undefined,
  });
  if (!resp?.ok) throw new Error(resp?.error ?? `Не сохранён месяц ${slot.periodMonth}`);
};

// Сохранить весь ручной раскид: upsert каждого месяца. Возвращает true при успехе
// всех. Последовательно (порядок месяцев) — объёмы малые (десятки месяцев max).
export const savePlanSlots = async (
  projectId: string,
  slots: PlanSlotInput[],
): Promise<boolean> => {
  for (const slot of slots) {
    await upsertPlanSlot(projectId, slot);
  }
  return true;
};
