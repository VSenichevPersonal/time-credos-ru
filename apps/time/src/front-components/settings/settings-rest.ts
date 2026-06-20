import { RestApiClient } from 'twenty-client-sdk/rest';

import type { DeptSettings } from 'src/front-components/settings/types';

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
  headcount?: number | null;
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
    headcount: d.headcount ?? 0,
  }));
};

export type DeptPatch = Partial<Pick<DeptSettings, 'approvalRequired' | 'capacityFactor' | 'headcount'>>;

export const patchDept = async (id: string, patch: DeptPatch): Promise<void> => {
  await client().patch(`/rest/credosTimeDepartments/${id}`, patch);
};
