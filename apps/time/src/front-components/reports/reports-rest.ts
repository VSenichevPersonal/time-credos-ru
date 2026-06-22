import { RestApiClient } from 'twenty-client-sdk/rest';

import type {
  GroupBy,
  ReportsResponse,
} from 'src/front-components/reports/report-types';

// Вызов агрегатной аналитики /s/reports из песочницы виджета (POST, как /s/approval).
// Сервер считает все три среза (byDept/byProject/byEmployee); groupBy — подсказка.

const client = () => new RestApiClient();

const EMPTY = (
  from: string,
  to: string,
  error?: string,
): ReportsResponse => ({
  ok: false,
  period: { from, to },
  groupBy: null,
  totals: { key: 'total', name: '', fact: 0, client: 0, norm: null, util: null, under: null, byCategory: [] },
  byDept: [],
  byProject: [],
  byEmployee: [],
  error,
});

// Период [from, to] — ISO-границы (inclusive). groupBy — приоритетный срез.
export const fetchReports = async (
  from: string,
  to: string,
  groupBy: GroupBy,
): Promise<ReportsResponse> => {
  try {
    const resp = await client().post<ReportsResponse>('/s/reports', {
      from,
      to,
      groupBy,
    });
    if (!resp?.ok) return EMPTY(from, to, resp?.error ?? 'Сервис отчётов недоступен');
    return resp;
  } catch (e) {
    return EMPTY(from, to, e instanceof Error ? e.message : 'Ошибка загрузки отчёта');
  }
};

// F-F (REQ-0006): экспорт detail-отчёта в CSV. Контракт Dev2: /s/reports
// {groupBy:'detail', format:'csv', from, to, deptId?/projectId?/employeeId?} →
// {ok, csv, mimeType, filename}. CSV уже с BOM и разделителем `;` (1С/RU-Excel).
// drill-фильтры опциональны (для экспорта текущего среза drill-down).
export type DetailFilters = {
  deptId?: string | null;
  projectId?: string | null;
  employeeId?: string | null;
};

export type CsvExport = {
  ok: boolean;
  csv: string;
  mimeType: string;
  filename: string;
  error?: string;
};

type RawCsvResp = {
  ok?: boolean;
  csv?: string;
  mimeType?: string;
  filename?: string;
  error?: string;
};

// --- Drill-до-записей (REQ-0006 п.3): лист отдельных записей (НЕ CSV) ---
// Контракт бэка (reports.logic groupBy=detail без format): { ok, groupBy:'detail',
// period, count, rows: DetailRow[] }. 7 колонок MVP по каждой записи. Фильтры
// deptId/projectId/employeeId — для drill-down с агрегатного среза в лист.
// CISO-007 (152-ФЗ): ФИО НЕ отдаётся по умолчанию (revealNames=false на бэке →
// employeeName = код сотрудника, не ПДн). reveal ПДн — отдельным контуром (TODO).
export type DetailRow = {
  date: string;
  employeeName: string;
  deptName: string;
  projectName: string;
  workTypeName: string;
  hours: number;
  status: string;
};

export type DetailRowsResult = {
  ok: boolean;
  count: number;
  rows: DetailRow[];
  error?: string;
};

type RawDetailResp = {
  ok?: boolean;
  count?: number;
  rows?: DetailRow[];
  error?: string;
};

export const fetchDetailRows = async (
  from: string,
  to: string,
  filters: DetailFilters = {},
): Promise<DetailRowsResult> => {
  const fail = (error: string): DetailRowsResult => ({ ok: false, count: 0, rows: [], error });
  try {
    const resp = await client().post<RawDetailResp>('/s/reports', {
      from,
      to,
      groupBy: 'detail',
      ...(filters.deptId ? { deptId: filters.deptId } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    });
    if (!resp?.ok) return fail(resp?.error ?? 'Сервис отчётов недоступен');
    const rows = resp.rows ?? [];
    return { ok: true, count: resp.count ?? rows.length, rows };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Ошибка загрузки записей');
  }
};

export const fetchDetailCsv = async (
  from: string,
  to: string,
  filters: DetailFilters = {},
): Promise<CsvExport> => {
  const fail = (error: string): CsvExport => ({
    ok: false,
    csv: '',
    mimeType: 'text/csv;charset=utf-8',
    filename: '',
    error,
  });
  try {
    const resp = await client().post<RawCsvResp>('/s/reports', {
      from,
      to,
      groupBy: 'detail',
      format: 'csv',
      ...(filters.deptId ? { deptId: filters.deptId } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    });
    if (!resp?.ok || typeof resp.csv !== 'string') {
      return fail(resp?.error ?? 'Сервис отчётов недоступен');
    }
    return {
      ok: true,
      csv: resp.csv,
      mimeType: resp.mimeType ?? 'text/csv;charset=utf-8',
      filename: resp.filename ?? `timesheet-detail_${from.slice(0, 10)}_${to.slice(0, 10)}.csv`,
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Ошибка экспорта');
  }
};
