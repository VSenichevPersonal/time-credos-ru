import { definePostInstallLogicFunction } from 'twenty-sdk/define';
import type { InstallPayload } from 'twenty-sdk/define';

import { BACKFILL_PROJECT_DEPARTMENTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { computeProjectRollup } from './project-fact-rollup';

// REQ-0013 13a — миграция/бэкфилл: каждый проект со старой жёсткой связью
// project.departmentId получает одну долю credosTimeProjectDepartment на этот
// отдел с plannedEffortShare = plannedEffort (доля 100%). Так смешанные данные
// (часть мигрирована, часть нет) работают, а capacity-раскид по долям видит
// существующие проекты. departmentId не трогаем — остаётся «основной отдел».
//
// ИДЕМПОТЕНТНОСТЬ: читаем существующие доли и пропускаем пары (project,
// department), которые уже есть. Повторный install/upgrade не дублирует.
//
// ЕДИНСТВЕННАЯ post-install функция приложения (SDK берёт E[0]). Будущие
// миграции добавлять В ЭТОТ ЖЕ handler последовательными блоками.

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

// Core REST отдаёт max 60 записей/страницу — без курсор-пагинации бэкфилл
// пропустит проекты/доли свыше 60. Идём по starting_after до hasNextPage=false.
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

const restPost = async (path: string, body: unknown): Promise<void> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`);
};

const restPatch = async (path: string, body: unknown): Promise<void> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status} ${await res.text()}`);
};

type RawProject = { id: string; departmentId: string | null; plannedEffort: number | null };
type RawShare = { projectId: string | null; departmentId: string | null };
type RawEntry = { projectId: string | null; hours: number | null };

// Бэкфилл factHours/budgetRemaining (баг «пустые Факт/Остаток»): приводит хранимые
// rollup-поля ВСЕХ проектов к Σ часов их записей (computeProjectRollup — тот же
// SSOT, что в триггерах и /s/time-entry). Без него существующие проекты с дрейфом
// (или без значения вовсе) останутся пустыми до первой новой мутации записи.
// Идемпотентно: полный пересчёт из источника, повтор install/upgrade безопасен.
const backfillProjectFactHours = async (
  projects: RawProject[],
): Promise<{ updated: number; errors: number }> => {
  // Σ часов по проекту одним проходом всех записей (вместо запроса на проект).
  const entries = await restGetAll<RawEntry>('credosTimeEntries', {});
  const hoursByProject = new Map<string, number[]>();
  for (const e of entries) {
    if (!e.projectId) continue;
    const arr = hoursByProject.get(e.projectId) ?? [];
    arr.push(e.hours ?? 0);
    hoursByProject.set(e.projectId, arr);
  }
  let updated = 0;
  let errors = 0;
  for (const p of projects) {
    const hours = hoursByProject.get(p.id) ?? [];
    const rollup = computeProjectRollup(
      hours.map((h) => ({ hours: h })),
      p.plannedEffort,
    );
    try {
      await restPatch(`/rest/credosTimeProjects/${p.id}`, rollup);
      updated += 1;
    } catch (e) {
      errors += 1;
      // eslint-disable-next-line no-console
      console.error('[backfill-fact-hours] проект %s: %s', p.id, e instanceof Error ? e.message : String(e));
    }
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[backfill-fact-hours] готово: обновлено %d проектов, ошибок %d (записей всего %d)',
    updated,
    errors,
    entries.length,
  );
  return { updated, errors };
};

type RawSettings = { id: string; revealEmployeeNames?: boolean | null };

// REQ-0019 — сид глобального singleton credosTimeSettings. Создаёт ровно 1 запись
// с дефолтами, если её ещё нет. Идемпотентно: при наличии любой записи — НЕ плодит
// (повторный install/upgrade безопасен). SELECT-значения — bare UPPER_CASE (формат
// хранения REST; не путать с defaultValue объекта "'VALUE'"). Значения дефолтов =
// REQ-0019 spec; должны совпадать с object defaultValue (SSOT — спека).
const seedSettings = async (): Promise<{ created: boolean; skipped: boolean; error: boolean }> => {
  const existing = await restGetAll<RawSettings>('credosTimeSettings', {});
  if (existing.length > 0) {
    // Миграция (user-direct 2026-06-22 ‼️): ФИО в отчётах ВКЛ по умолчанию. Существующий
    // singleton засеян revealEmployeeNames=false (CISO-007) → разворачиваем в true (иначе
    // на проде остаются коды вместо ФИО). Флипаем ТОЛЬКО false→true; админ-off на след.
    // апгрейде перепишется (приемлемо для «ВКЛ по умолчанию»; field-level — RBAC-волна).
    if (existing[0].revealEmployeeNames === false) {
      try {
        await restPatch(`/rest/credosTimeSettings/${existing[0].id}`, { revealEmployeeNames: true });
        // eslint-disable-next-line no-console
        console.warn('[seed-settings] миграция: revealEmployeeNames false→true (user-direct)');
        return { created: false, skipped: false, error: false };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[seed-settings] миграция revealEmployeeNames: %s', e instanceof Error ? e.message : String(e));
        return { created: false, skipped: false, error: true };
      }
    }
    return { created: false, skipped: true, error: false }; // singleton есть, ФИО уже on
  }
  try {
    await restPost('/rest/credosTimeSettings', {
      normHoursPerDay: 8,
      weekStartsOn: 'MONDAY',
      planningHorizonWeeks: 16,
      defaultCapacityFactor: 0.8,
      defaultApprovalRequired: false,
      approvalPeriod: 'WEEK',
      overtimeWarnHours: 12,
      fillTemplateHours: 8,
      reminderEnabled: false,
      reminderDayOfWeek: 'FRIDAY',
      // user-direct: ФИО ВКЛ по умолчанию (152-ФЗ внутр.учёт). Разворот CISO-007.
      revealEmployeeNames: true,
      tentativeBookingEnabled: true,
    });
    // eslint-disable-next-line no-console
    console.warn('[seed-settings] создан singleton credosTimeSettings с дефолтами');
    return { created: true, skipped: false, error: false };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[seed-settings] ошибка создания singleton: %s', e instanceof Error ? e.message : String(e));
    return { created: false, skipped: false, error: true };
  }
};

const handler = async (
  _payload: InstallPayload,
): Promise<{
  ok: boolean;
  created: number;
  skipped: number;
  errors: number;
  factHoursUpdated: number;
  settingsSeeded: boolean;
}> => {
  // Проекты (со старым departmentId) + уже существующие доли (для идемпотентности).
  const [projects, existingShares] = await Promise.all([
    restGetAll<RawProject>('credosTimeProjects', {}),
    restGetAll<RawShare>('credosTimeProjectDepartments', {}),
  ]);

  const seen = new Set(existingShares.map((s) => `${s.projectId}|${s.departmentId}`));

  let created = 0;
  let skipped = 0;
  let errors = 0;
  for (const p of projects) {
    if (!p.departmentId) {
      skipped += 1; // проект без отдела — мигрировать нечего
      continue;
    }
    const key = `${p.id}|${p.departmentId}`;
    if (seen.has(key)) {
      skipped += 1; // доля уже есть — идемпотентный повтор
      continue;
    }
    try {
      await restPost('/rest/credosTimeProjectDepartments', {
        projectId: p.id,
        departmentId: p.departmentId,
        plannedEffortShare: p.plannedEffort ?? null,
      });
      seen.add(key);
      created += 1;
    } catch (e) {
      // Не валим весь бэкфилл из-за одного проекта — лог + продолжаем. Fallback
      // на departmentId в расчётах прикроет непролившиеся доли до следующего прогона.
      errors += 1;
      // eslint-disable-next-line no-console
      console.error('[backfill-project-departments] проект %s: %s', p.id, e instanceof Error ? e.message : String(e));
    }
  }

  // eslint-disable-next-line no-console
  console.warn(
    '[backfill-project-departments] готово: создано %d, пропущено %d, ошибок %d (всего проектов %d)',
    created,
    skipped,
    errors,
    projects.length,
  );

  // Миграция 2: бэкфилл factHours/budgetRemaining (баг «пустые Факт/Остаток»).
  const fact = await backfillProjectFactHours(projects);

  // Миграция 3: REQ-0019 — сид singleton credosTimeSettings (1 запись дефолтов).
  const settings = await seedSettings();

  return {
    ok: errors === 0 && fact.errors === 0 && !settings.error,
    created,
    skipped,
    errors: errors + fact.errors + (settings.error ? 1 : 0),
    factHoursUpdated: fact.updated,
    settingsSeeded: settings.created,
  };
};

export default definePostInstallLogicFunction({
  universalIdentifier: BACKFILL_PROJECT_DEPARTMENTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'backfill-project-departments',
  description:
    'Бэкфилл: (1) REQ-0013 13a project.departmentId → доля credosTimeProjectDepartment (100%); (2) factHours/budgetRemaining проектов = Σ часов записей; (3) REQ-0019 сид singleton credosTimeSettings (1 запись дефолтов). Идемпотентно.',
  timeoutSeconds: 60,
  // Существующий инстанс Credos уже установлен — без этого флага бэкфилл не
  // выполнится на апгрейде и старые проекты никогда не получат доли.
  shouldRunOnVersionUpgrade: true,
  // Синхронно: доска планирования читает корректные доли сразу после деплоя.
  shouldRunSynchronously: true,
  handler,
});
