import { RestApiClient } from 'twenty-client-sdk/rest';

import type { CalDay, DayType } from 'src/front-components/calendar/types';

// Дни производственного календаря за год (credosTimeWorkdayCalendar).

const client = () => new RestApiClient();

type PageInfo = { hasNextPage?: boolean; endCursor?: string | null };
type ListResp<T> = { data: Record<string, T[]>; pageInfo?: PageInfo };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

type RawDay = { date?: string | null; dayType?: string | null; hours?: number | null };

const KEY = 'credosTimeWorkdayCalendars';
const PAGE = 60; // REST режет страницу (~200 max) → пагинируем курсором, иначе год обрезается

// Все дни года: курсорная пагинация (365 > лимита страницы).
export const fetchCalendarYear = async (year: number): Promise<CalDay[]> => {
  const all: RawDay[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 12; page++) {
    const resp = await client().get<ListResp<RawDay>>(`/rest/${KEY}`, {
      query: {
        filter: `date[gte]:${year}-01-01,date[lte]:${year}-12-31`,
        limit: String(PAGE),
        orderBy: 'date[AscNullsFirst]',
        ...(cursor ? { starting_after: cursor } : {}),
      },
    });
    const rows = pickList(resp, KEY);
    all.push(...rows);
    const next = resp.pageInfo?.endCursor;
    if (!resp.pageInfo?.hasNextPage || rows.length < PAGE || !next) break;
    cursor = next;
  }
  return all.map((d) => ({
    date: String(d.date).slice(0, 10),
    dayType: (d.dayType ?? 'WORKDAY') as DayType,
    hours: d.hours ?? 0,
  }));
};
