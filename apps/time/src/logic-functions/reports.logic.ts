import { defineLogicFunction } from 'twenty-sdk/define';
import type { RoutePayload } from 'twenty-sdk/logic-function';

import { REPORTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { validDateParam } from './params-validate';
import { computeDetail, detailToCsv } from './reports-detail';
import { buildTimesheetGrid, gridToCsv } from './reports-timesheet-grid';
import {
  computeOlap,
  computeReports,
  computeTimeseries,
  employeeCode,
  type OlapDimension,
  type OlapFilter,
  type OlapSort,
  type RawAbsence,
  type RawCalendarDay,
  type RawDepartment,
  type RawEmpDeptAssignment,
  type RawEmployee,
  type RawEntry,
  type RawProject,
  type RawWorkType,
} from './reports-calc';

/**
 * /s/reports — агрегатная аналитика трудозатрат (утилизация + загрузка/недогруз).
 *
 * КОНТРАКТ ДЛЯ Dev 1 (UI «Отчёты» + UX-2 группировка «по людям»).
 * Полная версия — docs/data-model/REPORTS_CONTRACT.md.
 *
 * ЗАПРОС (POST /s/reports, isAuthRequired):
 *   { from: ISO, to: ISO, groupBy?: 'dept' | 'project' | 'employee' }
 *   - from/to — границы периода (по полю credosTimeEntry.date, inclusive).
 *     Если не заданы — берётся весь диапазон.
 *   - groupBy — какую группировку считать. По умолчанию считаются ВСЕ три
 *     (byDept/byProject/byEmployee), поле лишь подсказка для UI о приоритете.
 *
 * ОТВЕТ:
 *   {
 *     ok: true,
 *     period: { from, to },
 *     totals: { fact, client, norm, util, under },
 *     byDept:     [{ key, name, fact, client, norm, util, under }],
 *     byProject:  [{ key, name, code, category, fact, client, norm: null, util, under: null }],
 *     byEmployee: [{ key, name, dept, fact, client, norm, util, under }],
 *   }
 *
 * МЕТРИКИ (на строку группы):
 *   - fact   — Σ часов всех записей группы за период (факт).
 *   - client — Σ часов записей, чей проект категории CLIENT.
 *   - util   — утилизация = client / fact (0..1, null если fact == 0).
 *   - norm   — нормо-часы периода из credosTimeWorkdayCalendar:
 *              базовая норма = Σ hours рабочих дней периода (dayType WORKDAY|SHORT).
 *              · employee: личная норма = базовая норма × capacityFactor отдела.
 *              · dept:     Σ норм сотрудников отдела (база × headcount × capacityFactor),
 *                          где headcount = число АКТИВНЫХ сотрудников отдела (вычисляется,
 *                          не ручное поле credosTimeDepartment.headcount).
 *              · project:  норма не определена (norm = null, under = null).
 *   - under  — недогруз = norm − fact (положит. = недозагрузка, отриц. = перегруз;
 *              null где norm == null).
 *
 * ИСТОЧНИКИ (Core REST воркспейса): credosTimeEntries, credosTimeProjects,
 * credosTimeEmployees, credosTimeDepartments, credosTimeWorkdayCalendars.
 * Категория CLIENT и тип дня WORKDAY/SHORT — UPPER_CASE значения SELECT на сервере.
 */

// Типы Raw* и чистый расчёт — в ./reports-calc (тестируется отдельно).

const apiBase = () => (process.env.TWENTY_API_URL ?? '').replace(/\/$/, '');
const authHeaders = () => ({
  Authorization: `Bearer ${process.env.TWENTY_APP_ACCESS_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
});

const restGet = async <T>(path: string, query: Record<string, string>): Promise<T> => {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${apiBase()}${path}?${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
};

// Core REST отдаёт max 60 записей/страницу (openapi: limit default/max=60) — без
// пагинации reports недосчитает (≈420 записей → 60, календарь 180 дней → 60, норма врёт).
// Идём по курсору starting_after, пока pageInfo.hasNextPage.
const restGetAll = async <T>(plural: string, baseQuery: Record<string, string>): Promise<T[]> => {
  const out: T[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 500; i++) {
    const query: Record<string, string> = { ...baseQuery, limit: '60' };
    if (cursor) query.starting_after = cursor;
    const json = await restGet<{
      data?: Record<string, T[]> & { pageInfo?: { hasNextPage?: boolean; endCursor?: string } };
      pageInfo?: { hasNextPage?: boolean; endCursor?: string };
    }>(`/rest/${plural}`, query);
    const data = json.data ?? (json as Record<string, unknown>);
    const recs = ((data as Record<string, T[]>)[plural] ?? []) as T[];
    out.push(...recs);
    const pi = json.pageInfo ?? json.data?.pageInfo;
    if (!pi?.hasNextPage || recs.length === 0 || !pi.endCursor) break;
    cursor = pi.endCursor;
  }
  return out;
};

const readParams = (event: RoutePayload): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(event.queryStringParameters ?? {}))
    if (v != null) out[k] = v;
  for (const [k, v] of Object.entries((event.body ?? {}) as Record<string, unknown>))
    if (v != null) out[k] = String(v);
  return out;
};

// OLAP-параметры из body (массивы/объекты — НЕ через readParams, тот стрингифицирует).
const OLAP_DIMS = new Set([
  'dept',
  'employee',
  'project',
  'workType',
  'category',
  'stage',
  'workTypeGroup',
]);
const readOlap = (
  event: RoutePayload,
  params: Record<string, string>,
): { groupBy: OlapDimension; filters: OlapFilter[]; limit?: number; cursor?: string | null; sort?: OlapSort } | null => {
  // OLAP — ТОЛЬКО по явному mode=olap. Легаси-дашборд шлёт groupBy=dept|project|
  // employee (все ∈ OLAP_DIMS) для 3-срезового ответа — без этого флага он попадал
  // бы в computeOlap и получал ответ без byDept/byProject/byEmployee → крэш rows.map.
  if (params.mode !== 'olap') return null;
  const gb = params.groupBy;
  if (!gb || !OLAP_DIMS.has(gb)) return null; // нет/невалиден groupBy → старый 3-срезовый режим
  const body = (event.body ?? {}) as Record<string, unknown>;
  const rawFilters = Array.isArray(body.filters) ? body.filters : [];
  const filters: OlapFilter[] = rawFilters
    .filter((f): f is { dim: string; value: string } => !!f && typeof f === 'object')
    .filter((f) => OLAP_DIMS.has((f as { dim?: string }).dim ?? '') && (f as { value?: unknown }).value != null)
    .map((f) => ({ dim: f.dim as OlapDimension, value: String((f as { value: unknown }).value) }));
  const sort = (body.sort && typeof body.sort === 'object' ? body.sort : undefined) as OlapSort | undefined;
  const limit = params.limit ? Number(params.limit) : undefined;
  const cursor = params.cursor ?? null;
  return { groupBy: gb as OlapDimension, filters, limit, cursor, sort };
};

// CISO-007 (152-ФЗ, минимизация ПДн): ФИО сотрудника — персональные данные.
// /s/reports доступен любому аутентифицированному юзеру, а logic-function ходит под
// сервис-токеном (per-user RBAC обходится на уровне функции). ФИО утекают в трёх
// срезах: detail/CSV (employeeName), byEmployee[].name, OLAP employee (name/label).
//
// Server-actor по HTTP-роуту НЕДОСТИЖИМ: RoutePayload.userWorkspaceId НЕ маппится на
// workspaceMember/employee через Core REST (A1_CURRENT_USER_RESEARCH §3). Роль из
// client-supplied params.workspaceMemberRef — НЕ доверенный источник (A1 R2: клиент
// может подставить чужой валидный UUID руководителя и пройти isManager-guard); к тому
// же ref заполнен лишь у 1/43 → подход и небезопасен, и нерабочий.
//
// БЕЗОПАСНЫЙ ДЕФОЛТ: НЕ раскрывать ФИО ни в одном срезе (reveal=false). Ключи
// (employeeId) сохраняем — «Мои часы» фильтрует свою строку по key и name не
// использует (my-hours.tsx). TODO(CISO-005): когда появится доверенный
// server-identity (userWorkspaceId→workspaceMember), резолвить актора и отдавать ФИО
// руководителю со scope по его подчинённым (RBAC_MODEL: менеджер видит свою команду).
//
// REQ-0019: флаг больше не хардкод-константа — читается из singleton
// credosTimeSettings.revealEmployeeNames (админ-тоггл, CISO-007). Fallback false
// (безопасный дефолт) при отсутствии записи/поля/ошибке чтения.
type RawSettings = { revealEmployeeNames?: boolean | null };
const readRevealEmployeeNames = async (): Promise<boolean> => {
  try {
    const settings = await restGetAll<RawSettings>('credosTimeSettings', {});
    return settings[0]?.revealEmployeeNames === true; // singleton; fallback false
  } catch {
    return false; // безопасный дефолт при ошибке чтения настроек
  }
};

// Резолвер стабильного КОДа сотрудника по его id (employeeId = key/value во всех
// срезах). Строит карты отдел→код и сотрудник→отдел из загруженных коллекций.
// При reveal=false КОД ЗАМЕНЯЕТ ФИО — читаемый, стабильный, НЕ ПДн, НЕ сырой UUID.
const makeEmployeeCodeResolver = (
  employees: RawEmployee[],
  departments: RawDepartment[],
): ((employeeId: string) => string) => {
  const deptCodeById = new Map(departments.map((d) => [d.id, d.code ?? null]));
  const deptOfEmp = new Map(employees.map((e) => [e.id, e.departmentId]));
  return (id: string) =>
    employeeCode({ id, departmentId: deptOfEmp.get(id) ?? null }, deptCodeById);
};

// byEmployee: при reveal=false ФИО (name) → стабильный КОД (не пусто/UUID).
const redactByEmployee = <T extends { key: string; name: string }>(
  rows: T[],
  reveal: boolean,
  codeOf: (id: string) => string,
): T[] => (reveal ? rows : rows.map((r) => ({ ...r, name: codeOf(r.key) })));

// OLAP: ось/фильтр employee несёт ФИО в name/label. При reveal=false → стабильный
// КОД (key/value = employeeId), а не пусто/UUID. Прочие оси не трогаем.
const redactOlap = (
  result: ReturnType<typeof computeOlap>,
  reveal: boolean,
  codeOf: (id: string) => string,
): ReturnType<typeof computeOlap> => {
  if (reveal) return result;
  return {
    ...result,
    rows:
      result.groupBy === 'employee'
        ? result.rows.map((r) => ({ ...r, name: codeOf(r.key) }))
        : result.rows,
    appliedFilters: result.appliedFilters.map((f) =>
      f.dim === 'employee' ? { ...f, label: codeOf(f.value) } : f,
    ),
  };
};

const run = async (event: RoutePayload) => {
  const params = readParams(event);
  // CISO-006: from/to валидируем как ISO-date перед интерполяцией в filter-строку.
  const from = validDateParam(params.from, '1970-01-01T00:00:00.000Z');
  const to = validDateParam(params.to, '2999-12-31T23:59:59.999Z');
  const olap = readOlap(event, params);

  const [
    entries,
    projects,
    employees,
    departments,
    calendar,
    absences,
    workTypes,
    assignments,
    reveal,
  ] = await Promise.all([
    restGetAll<RawEntry>('credosTimeEntries', { filter: `date[gte]:${from},date[lte]:${to}` }),
    restGetAll<RawProject>('credosTimeProjects', {}),
    // ФИО-РЕЗОЛВ (фикс «сырой UUID в OLAP employee»): грузим ВСЕХ сотрудников, не
    // только active=true. Записи времени могут принадлежать ДЕАКТИВИРОВАННОМУ
    // сотруднику — без него в коллекции empById.get(id) пуст → dimLabel падал в
    // сырой UUID (ось/крошка/пилюля). Норма/headcount считаются по active!==false
    // (см. isActiveEmployee в reports-calc) → расчёт нормы не меняется.
    restGetAll<RawEmployee>('credosTimeEmployees', {}),
    restGetAll<RawDepartment>('credosTimeDepartments', {}),
    restGetAll<RawCalendarDay>('credosTimeWorkdayCalendars', {
      filter: `date[gte]:${from},date[lte]:${to}`,
    }),
    // F-D phase2: отсутствия, пересекающие период (startDate <= to AND endDate >= from).
    // Вычитают рабочие часы своих дней из НОРМЫ сотрудника/отдела (см. reports-calc).
    restGetAll<RawAbsence>('credosTimeAbsences', {
      filter: `startDate[lte]:${to},endDate[gte]:${from}`,
    }),
    // W4-1 OLAP: справочник видов работ (оси workType/workTypeGroup).
    restGetAll<RawWorkType>('credosTimeWorkTypes', {}),
    // REQ-0011: FTE-назначения сотрудников на отделы. Численность отдела для нормы =
    // Σ FTE активных в периоде назначений (fallback по сотрудникам без записей = 100%).
    restGetAll<RawEmpDeptAssignment>('credosTimeEmployeeDepartments', {}),
    // REQ-0019: показ ФИО — из настроек (singleton), а не хардкод-флага.
    readRevealEmployeeNames(),
  ]);

  const input = {
    entries,
    projects,
    employees,
    departments,
    calendar,
    absences,
    workTypes,
    assignments,
  };

  // C4: тренд утилизации по месяцам. mode=timeseries (или groupBy=month) →
  // массив точек [{month, fact, client, norm, util, under}] за период, опц. фильтр отдела.
  if (params.mode === 'timeseries' || params.groupBy === 'month') {
    return computeTimeseries(input, { from, to }, { departmentId: params.departmentId ?? null });
  }

  // reports MVP: groupBy=detail → лист отдельных записей (7 колонок) + опц. CSV.
  // Фильтры deptId/projectId/employeeId сравниваются в памяти (не идут в REST-
  // filter) → инъекции нет. format=csv → CSV-строка в ответе (content-type не
  // поддержан песочницей; фронт делает Blob-download).
  if (params.groupBy === 'detail') {
    // CISO-007: ФИО (employeeName) затираем по настройке revealEmployeeNames
    // (REQ-0019; дефолт false). Остальные поля (дата/проект/часы/статус) не ПДн.
    // Фильтры deptId/projectId/employeeId работают для drill-down.
    const rows = computeDetail(
      input,
      {
        deptId: params.deptId ?? null,
        projectId: params.projectId ?? null,
        employeeId: params.employeeId ?? null,
      },
      reveal,
    );
    // F-F (REQ-0006): экспорт под 1С:ЗУП / RU-локаль Excel — разделитель `;`,
    // UTF-8 BOM (кириллица). content-type песочница не проставляет на ответе,
    // поэтому отдаём CSV + mimeType/filename как контракт фронту (Blob-download
    // 'text/csv;charset=utf-8'). BOM уже в строке csv → фронт пишет её как есть.
    if (params.format === 'csv') {
      const csv = detailToCsv(rows, { withBom: true });
      return {
        ok: true,
        format: 'csv',
        count: rows.length,
        csv,
        mimeType: 'text/csv;charset=utf-8',
        filename: `timesheet-detail_${from.slice(0, 10)}_${to.slice(0, 10)}.csv`,
      };
    }
    return { ok: true, groupBy: 'detail', period: { from, to }, count: rows.length, rows };
  }

  // REQ-0006 п.4: табель сотрудник×день (форма ближе к Т-13) для кадров/1С:ЗУП.
  // groupBy=timesheet-grid → сетка строки=сотрудники, колонки=дни периода (месяц),
  // ячейка=Σ часов за день + Итого. format=csv → CSV (BOM+`;`, как detail). Фильтры
  // deptId/projectId — как в /s/reports. codes=true → буквенные коды Т-13 (Я/ОТ/Б/…).
  // CISO-007: ФИО при reveal, иначе КОД сотрудника.
  if (params.groupBy === 'timesheet-grid') {
    const grid = buildTimesheetGrid(
      input,
      { from, to },
      { deptId: params.deptId ?? null, projectId: params.projectId ?? null },
      reveal,
      { withCodes: params.codes === 'true' },
    );
    if (params.format === 'csv') {
      const csv = gridToCsv(grid, { withBom: true });
      return {
        ok: true,
        format: 'csv',
        count: grid.rows.length,
        csv,
        mimeType: 'text/csv;charset=utf-8',
        filename: `timesheet-grid_${from.slice(0, 10)}_${to.slice(0, 10)}.csv`,
      };
    }
    return {
      ok: true,
      groupBy: 'timesheet-grid',
      period: grid.period,
      dates: grid.dates,
      withCodes: grid.withCodes,
      count: grid.rows.length,
      rows: grid.rows,
    };
  }

  // W4-1: параметрический OLAP при наличии groupBy; иначе — старый 3-срезовый ответ.
  // CISO-007: затираем ФИО в OLAP employee-срезе/фильтре.
  const codeOf = makeEmployeeCodeResolver(employees, departments);
  if (olap) {
    return redactOlap(computeOlap(input, { from, to }, olap), reveal, codeOf);
  }
  // CISO-007: при reveal=false ФИО в byEmployee → стабильный КОД (не пусто/UUID).
  const result = computeReports(input, { from, to });
  return {
    ...result,
    byEmployee: redactByEmployee(result.byEmployee, reveal, codeOf),
    groupBy: params.groupBy ?? null,
  };
};

// Обёртка: ошибки -> ok:false + диагностика (роут не падает 500).
const handler = async (event: RoutePayload) => {
  try {
    return await run(event);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      apiBase: apiBase(),
      hasToken: Boolean(process.env.TWENTY_APP_ACCESS_TOKEN),
    };
  }
};

export default defineLogicFunction({
  universalIdentifier: REPORTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'reports',
  description: 'Агрегатная аналитика: утилизация + загрузка/недогруз (dept/project/employee)',
  timeoutSeconds: 20,
  handler,
  httpRouteTriggerSettings: {
    path: '/reports',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
