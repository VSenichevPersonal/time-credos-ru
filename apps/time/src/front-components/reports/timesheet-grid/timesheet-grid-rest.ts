import { RestApiClient } from 'twenty-client-sdk/rest';

import type { T13Grid } from 'src/front-components/reports/timesheet-grid/types';

// Вызов табеля Т-13 из песочницы: /s/reports groupBy=timesheet-grid (POST, как
// остальная аналитика). Сервер отдаёт сетку сотрудник×день + Итого; codes=true →
// буквенные коды Т-13. CISO-007: ФИО при revealEmployeeNames, иначе КОД.

const client = () => new RestApiClient();

const EMPTY = (from: string, to: string, error?: string): T13Grid => ({
  ok: false,
  period: { from, to },
  dates: [],
  withCodes: false,
  rows: [],
  error,
});

export const fetchTimesheetGrid = async (
  from: string,
  to: string,
  opts: { deptId?: string | null; withCodes?: boolean } = {},
): Promise<T13Grid> => {
  try {
    const resp = await client().post<T13Grid>('/s/reports', {
      groupBy: 'timesheet-grid',
      from,
      to,
      ...(opts.deptId ? { deptId: opts.deptId } : {}),
      ...(opts.withCodes ? { codes: 'true' } : {}),
    });
    if (!resp?.ok) return EMPTY(from, to, resp?.error ?? 'Сервис табеля недоступен');
    return resp;
  } catch (e) {
    return EMPTY(from, to, e instanceof Error ? e.message : 'Ошибка загрузки табеля');
  }
};

export type T13Csv = { ok: boolean; csv: string; filename: string; error?: string };

// CSV табеля (BOM+`;`, форма Т-13 для кадров/1С:ЗУП). Песочница не качает файл
// (нет host-DOM) — отдаём текст для копирования, как detail-экспорт.
export const fetchTimesheetGridCsv = async (
  from: string,
  to: string,
  opts: { deptId?: string | null; withCodes?: boolean } = {},
): Promise<T13Csv> => {
  try {
    const resp = await client().post<{ ok?: boolean; csv?: string; filename?: string; error?: string }>(
      '/s/reports',
      {
        groupBy: 'timesheet-grid',
        format: 'csv',
        from,
        to,
        ...(opts.deptId ? { deptId: opts.deptId } : {}),
        ...(opts.withCodes ? { codes: 'true' } : {}),
      },
    );
    if (!resp?.ok || !resp.csv) {
      return { ok: false, csv: '', filename: '', error: resp?.error ?? 'Не удалось выгрузить CSV' };
    }
    return { ok: true, csv: resp.csv, filename: resp.filename ?? `timesheet-t13_${from}_${to}.csv` };
  } catch (e) {
    return { ok: false, csv: '', filename: '', error: e instanceof Error ? e.message : 'Ошибка CSV' };
  }
};
