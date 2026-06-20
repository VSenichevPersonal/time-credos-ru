import { definePostInstallLogicFunction } from 'twenty-sdk/define';
import type { InstallPayload } from 'twenty-sdk/define';

import { BACKFILL_PROJECT_DEPARTMENTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

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

type RawProject = { id: string; departmentId: string | null; plannedEffort: number | null };
type RawShare = { projectId: string | null; departmentId: string | null };

const handler = async (_payload: InstallPayload): Promise<{ ok: boolean; created: number; skipped: number; errors: number }> => {
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
  return { ok: errors === 0, created, skipped, errors };
};

export default definePostInstallLogicFunction({
  universalIdentifier: BACKFILL_PROJECT_DEPARTMENTS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'backfill-project-departments',
  description:
    'REQ-0013 13a: бэкфилл project.departmentId → доля credosTimeProjectDepartment (100%), идемпотентно',
  timeoutSeconds: 60,
  // Существующий инстанс Credos уже установлен — без этого флага бэкфилл не
  // выполнится на апгрейде и старые проекты никогда не получат доли.
  shouldRunOnVersionUpgrade: true,
  // Синхронно: доска планирования читает корректные доли сразу после деплоя.
  shouldRunSynchronously: true,
  handler,
});
