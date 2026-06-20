import { RestApiClient } from 'twenty-client-sdk/rest';

import type { CalDay, DayType } from 'src/front-components/calendar/types';

// Дни производственного календаря за год (credosTimeWorkdayCalendar).

const client = () => new RestApiClient();

type ListResp<T> = { data: Record<string, T[]> };
const pickList = <T>(resp: ListResp<T>, key: string): T[] => resp.data?.[key] ?? [];

type RawDay = { date?: string | null; dayType?: string | null; hours?: number | null };

export const fetchCalendarYear = async (year: number): Promise<CalDay[]> => {
  const resp = await client().get<ListResp<RawDay>>('/rest/credosTimeWorkdayCalendars', {
    query: {
      filter: `date[gte]:${year}-01-01,date[lte]:${year}-12-31`,
      limit: '400',
      orderBy: 'date[AscNullsFirst]',
    },
  });
  return pickList(resp, 'credosTimeWorkdayCalendars').map((d) => ({
    date: String(d.date).slice(0, 10),
    dayType: (d.dayType ?? 'WORKDAY') as DayType,
    hours: d.hours ?? 0,
  }));
};
