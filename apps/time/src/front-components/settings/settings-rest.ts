import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  DeptSettings,
  GlobalSettings,
  Headcounts,
} from 'src/front-components/settings/types';

// Чтение/правка настроек отделов. Бэк готов (Dev 2): поля на credosTimeDepartment,
// PATCH /rest/credosTimeDepartments/{id} под app-ролью без 400.

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

type RawDept = {
  id: string;
  name: string;
  code?: string | null;
  approvalRequired?: boolean | null;
  capacityFactor?: number | null;
};

export const fetchDeptSettings = async (): Promise<DeptSettings[]> => {
  const resp = await client().get<ListResp<RawDept>>('/rest/credosTimeDepartments', {
    query: { limit: '50', orderBy: 'name[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeDepartments').map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code ?? null,
    approvalRequired: d.approvalRequired ?? false,
    capacityFactor: d.capacityFactor ?? 0.8,
  }));
};

type RawEmployee = { departmentId?: string | null };

// Численность отдела = count активных сотрудников (вычисляется, не заносится).
// Группируем активных сотрудников по departmentId.
export const fetchHeadcounts = async (): Promise<Headcounts> => {
  const resp = await client().get<ListResp<RawEmployee>>('/rest/credosTimeEmployees', {
    query: { filter: 'active[eq]:true', limit: '500' },
  });
  const counts: Headcounts = {};
  for (const e of pickList(resp, 'credosTimeEmployees')) {
    if (e.departmentId) counts[e.departmentId] = (counts[e.departmentId] ?? 0) + 1;
  }
  return counts;
};

export type DeptPatch = Partial<Pick<DeptSettings, 'approvalRequired' | 'capacityFactor'>>;

export const patchDept = async (id: string, patch: DeptPatch): Promise<void> => {
  await client().patch(`/rest/credosTimeDepartments/${id}`, patch);
};

// --- REQ-0019: глобальный singleton credosTimeSettings (1 запись) ---

type RawGlobal = Partial<Omit<GlobalSettings, 'id'>> & { id: string };

// Дефолты — те же, что в объекте (defaultValue) и select-options (*_DEFAULT без
// кавычек). Подстраховка, если поле придёт null до сида.
const GLOBAL_FALLBACK: Omit<GlobalSettings, 'id'> = {
  normHoursPerDay: 8,
  fillTemplateHours: 8,
  overtimeWarnHours: 12,
  weekStartsOn: 'MONDAY',
  planningHorizonWeeks: 16,
  defaultCapacityFactor: 0.8,
  tentativeBookingEnabled: true,
  defaultApprovalRequired: false,
  approvalPeriod: 'WEEK',
  reminderEnabled: false,
  reminderDayOfWeek: 'FRIDAY',
  revealEmployeeNames: false,
};

const num = (v: number | null | undefined, d: number): number =>
  typeof v === 'number' ? v : d;
const bool = (v: boolean | null | undefined, d: boolean): boolean =>
  typeof v === 'boolean' ? v : d;
const str = (v: string | null | undefined, d: string): string => v ?? d;

// GET singleton (первая запись). Возвращает null, если записи ещё нет (сид не
// прошёл) — UI покажет сообщение вместо формы.
export const fetchGlobalSettings = async (): Promise<GlobalSettings | null> => {
  const resp = await client().get<ListResp<RawGlobal>>('/rest/credosTimeSettings', {
    query: { limit: '1' },
  });
  const row = pickList(resp, 'credosTimeSettings')[0];
  if (!row) return null;
  const f = GLOBAL_FALLBACK;
  return {
    id: row.id,
    normHoursPerDay: num(row.normHoursPerDay, f.normHoursPerDay),
    fillTemplateHours: num(row.fillTemplateHours, f.fillTemplateHours),
    overtimeWarnHours: num(row.overtimeWarnHours, f.overtimeWarnHours),
    weekStartsOn: str(row.weekStartsOn, f.weekStartsOn),
    planningHorizonWeeks: num(row.planningHorizonWeeks, f.planningHorizonWeeks),
    defaultCapacityFactor: num(row.defaultCapacityFactor, f.defaultCapacityFactor),
    tentativeBookingEnabled: bool(row.tentativeBookingEnabled, f.tentativeBookingEnabled),
    defaultApprovalRequired: bool(row.defaultApprovalRequired, f.defaultApprovalRequired),
    approvalPeriod: str(row.approvalPeriod, f.approvalPeriod),
    reminderEnabled: bool(row.reminderEnabled, f.reminderEnabled),
    reminderDayOfWeek: str(row.reminderDayOfWeek, f.reminderDayOfWeek),
    revealEmployeeNames: bool(row.revealEmployeeNames, f.revealEmployeeNames),
  };
};

export type GlobalPatch = Partial<Omit<GlobalSettings, 'id'>>;

export const patchGlobalSettings = async (
  id: string,
  patch: GlobalPatch,
): Promise<void> => {
  await client().patch(`/rest/credosTimeSettings/${id}`, patch);
};
