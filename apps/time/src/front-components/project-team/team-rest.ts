import { RestApiClient } from 'twenty-client-sdk/rest';

// Доступ к Core REST из песочницы виджета. Записи проекта + справочник сотрудников.

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

export type RawEntry = {
  hours?: number | null;
  date?: string | null;
  employeeId?: string | null;
};

// Все записи трудозатрат проекта (для агрегата по сотрудникам).
export const fetchProjectEntries = async (projectId: string): Promise<RawEntry[]> => {
  const resp = await client().get<ListResp<RawEntry>>('/rest/credosTimeEntries', {
    query: {
      filter: `projectId[eq]:${projectId}`,
      limit: '500',
      orderBy: 'date[DescNullsLast]',
    },
  });
  return pickList(resp, 'credosTimeEntries');
};

export type RawEmployee = { id: string; name: string };

export const fetchEmployees = async (): Promise<RawEmployee[]> => {
  const resp = await client().get<ListResp<RawEmployee>>('/rest/credosTimeEmployees', {
    query: { limit: '300', orderBy: 'name[AscNullsFirst]' },
  });
  return pickList(resp, 'credosTimeEmployees');
};
