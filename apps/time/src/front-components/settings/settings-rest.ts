import { RestApiClient } from 'twenty-client-sdk/rest';

import type { DeptSettings, Headcounts } from 'src/front-components/settings/types';

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
