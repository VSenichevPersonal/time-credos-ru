// SSOT-ядро rollup-поля credosTimeProject.factHours (+ budgetRemaining).
//
// ПРОБЛЕМА (баг заказчика «пустые Факт/Остаток»): factHours/budgetRemaining —
// derived-stored поля (Σ часов записей проекта). Они показываются КОЛОНКАМИ в
// index-view проектов (credos-time-project.view.ts), поэтому ДОЛЖНЫ быть
// хранимыми (Twenty список сортирует/фильтрует/показывает хранимые колонки;
// rollup-on-read в списке невозможен). Хранимое поле без полного жизненного
// цикла → дрейф: пустые/устаревшие значения.
//
// РЕШЕНИЕ (Вариант A — хранимое + полный ЖЦ):
//   1) единая формула пересчёта здесь (этот модуль = SSOT);
//   2) инкрементальное сопровождение на ВСЕХ путях мутации записей:
//      - /s/time-entry (upsert/delete/смена проекта) — вызывает recalcProjectFactHours;
//      - database-event триггеры credosTimeEntry created/updated/deleted
//        (project-fact-rollup.logic.ts) — закрывают пути МИМО /s/time-entry:
//        CSV-импорт, прямое редактирование в гриде Twenty, REST-вызовы;
//   3) backfill существующих данных (post-install) — приводит дрейф к нулю.
//
// Та же Σ часов, что в reports-calc.ts byProject[].fact — отчёты остаются
// согласованными с хранимым полем by construction.

const apiBase = (): string => (process.env.TWENTY_API_URL ?? '').replace(/\/$/, '');
const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${process.env.TWENTY_APP_ACCESS_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
});

const restGet = async <T>(path: string, query: Record<string, string>): Promise<T> => {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${apiBase()}${path}?${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
};

const restPatch = async (path: string, body: unknown): Promise<void> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status} ${await res.text()}`);
};

// ---------------------------------------------------------------------------
// Чистое ядро (без сети) — единственный источник формулы. Покрыто unit-тестом.
// ---------------------------------------------------------------------------

export type RollupEntry = { hours: number | null };

// Факт = Σ часов записей (NaN/null → 0). Округление до 2 знаков (как decimals поля).
export const computeFactHours = (entries: RollupEntry[]): number =>
  Number(entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0).toFixed(2));

// Остаток/перерасход = план − факт. null если план не задан (нечего считать).
// Отрицательное = перерасход (как описано в объекте/UI).
export const computeBudgetRemaining = (
  plannedEffort: number | null | undefined,
  factHours: number,
): number | null =>
  plannedEffort === null || plannedEffort === undefined
    ? null
    : Number((plannedEffort - factHours).toFixed(2));

// Итог пересчёта проекта (что записать в хранимые поля).
export type ProjectRollup = { factHours: number; budgetRemaining: number | null };

export const computeProjectRollup = (
  entries: RollupEntry[],
  plannedEffort: number | null | undefined,
): ProjectRollup => {
  const factHours = computeFactHours(entries);
  return { factHours, budgetRemaining: computeBudgetRemaining(plannedEffort, factHours) };
};

// UUID v4-форма — guard перед интерполяцией id в REST-путь/filter (CISO-006).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuidLike = (v: string | null | undefined): v is string =>
  typeof v === 'string' && UUID_RE.test(v);

// ---------------------------------------------------------------------------
// REST-обёртка: пересчитать и записать factHours/budgetRemaining одного проекта.
// Используется и из /s/time-entry, и из database-event триггеров → одно поведение.
// ---------------------------------------------------------------------------

// Core REST отдаёт ограниченную страницу — собираем ВСЕ записи проекта по курсору
// (иначе факт занизится на проектах с >limit записей). limit=200 на страницу.
const fetchAllEntryHours = async (projectId: string): Promise<RollupEntry[]> => {
  const out: RollupEntry[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 1000; i++) {
    const query: Record<string, string> = {
      filter: `projectId[eq]:${projectId}`,
      limit: '200',
    };
    if (cursor) query.starting_after = cursor;
    const json = await restGet<{
      data?: {
        credosTimeEntries?: RollupEntry[];
        pageInfo?: { hasNextPage?: boolean; endCursor?: string };
      };
      pageInfo?: { hasNextPage?: boolean; endCursor?: string };
    }>('/rest/credosTimeEntries', query);
    const recs = json.data?.credosTimeEntries ?? [];
    out.push(...recs);
    const pi = json.pageInfo ?? json.data?.pageInfo;
    if (!pi?.hasNextPage || recs.length === 0 || !pi.endCursor) break;
    cursor = pi.endCursor;
  }
  return out;
};

// Пересчитать factHours+budgetRemaining проекта из Σ часов его записей и записать.
// Идемпотентно (полный пересчёт из источника, а не дельта) → повтор/гонка безопасны.
export const recalcProjectFactHours = async (projectId: string): Promise<ProjectRollup> => {
  const [entries, projRes] = await Promise.all([
    fetchAllEntryHours(projectId),
    restGet<{ data: { credosTimeProjects: Array<{ plannedEffort: number | null }> } }>(
      '/rest/credosTimeProjects',
      { filter: `id[eq]:${projectId}`, limit: '1' },
    ),
  ]);
  const plannedEffort = projRes.data?.credosTimeProjects?.[0]?.plannedEffort ?? null;
  const rollup = computeProjectRollup(entries, plannedEffort);
  await restPatch(`/rest/credosTimeProjects/${projectId}`, rollup);
  return rollup;
};

// Пересчитать набор проектов (для смены проекта записи: старый + новый).
// Пустые/невалидные id отфильтрованы. Возвращает число пересчитанных.
export const recalcProjects = async (
  projectIds: Array<string | null | undefined>,
): Promise<number> => {
  const ids = [...new Set(projectIds.filter(isUuidLike))];
  for (const id of ids) await recalcProjectFactHours(id);
  return ids.length;
};
