import type { DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { resolveMarketingActor, writeMarketingLog } from './shared/write-marketing-log';

// MARKETING-LOG: хендлер database-event триггера credosTimeProject.updated. Для
// КАЖДОГО изменённого МАРКЕТИНГ-поля пишет строку per-field журнала (fieldName,
// oldValue→newValue, actor, changedAt). Вынесено сюда (а не в .logic.ts) ради
// юнит-тестов без живого сервера.
//
// Фильтр updatedFields на уровне триггера (databaseEventTriggerSettings) гарантирует,
// что функция дёрнется ТОЛЬКО при изменении маркетинг-поля. Доп.фильтр здесь —
// защита: пересекаем updatedFields с MARKETING_FIELDS, чтобы не залогировать
// не-маркетинг-поле, если ядро прислало расширенный набор.

// МАРКЕТИНГ-поля проекта, изменения которых аудируем (узкий лог — [[keep-it-simple]]).
export const MARKETING_FIELDS = [
  'ndaLevel',
  'canPublishOnSite',
  'isPublished',
  'publishedUrl',
  'reviewPublished',
  'reviewUrl',
  'canUseInProposals',
  'canUseLogo',
  'referenceReady',
  'clientIndustry',
  'clientMarketingConsent',
  'clientUnsubscribed',
  'marketingActualOn',
] as const;

const MARKETING_FIELD_SET = new Set<string>(MARKETING_FIELDS);

type ProjectRecord = Record<string, unknown> & { id?: string | null };

// Привести значение поля к строке-снимку для лога (boolean/число/дата → строка),
// null/undefined → null.
const toSnapshot = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  return String(v);
};

export const onProjectMarketingUpdated = async (
  event: DatabaseEventPayload,
): Promise<{ ok: boolean; logged: number }> => {
  const props = event.properties as {
    updatedFields?: string[];
    before?: ProjectRecord;
    after?: ProjectRecord;
  };
  const updated = props.updatedFields ?? [];
  // Только изменённые МАРКЕТИНГ-поля (пересечение).
  const changed = updated.filter((f) => MARKETING_FIELD_SET.has(f));
  if (changed.length === 0) return { ok: true, logged: 0 };

  const before = props.before ?? {};
  const after = props.after ?? {};
  // projectId — recordId события (или after.id).
  const projectId = event.recordId ?? after.id ?? null;

  // actor — server-truth по event.userWorkspaceId (один резолв на всё событие).
  const actor = await resolveMarketingActor(event.userWorkspaceId);

  let logged = 0;
  for (const fieldName of changed) {
    const ok = await writeMarketingLog({
      projectId,
      fieldName,
      oldValue: toSnapshot(before[fieldName]),
      newValue: toSnapshot(after[fieldName]),
      actor,
    });
    if (ok) logged += 1;
  }
  return { ok: true, logged };
};

// Обёртка: ошибка обработки события не валит обработку (лог + ok:false).
export const wrapMarketingEvent =
  (
    fn: (e: DatabaseEventPayload) => Promise<{ ok: boolean; logged: number }>,
  ) =>
  async (event: DatabaseEventPayload): Promise<object> => {
    try {
      return await fn(event);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        '[project-marketing-log] запись журнала маркетинга: %s',
        e instanceof Error ? e.message : String(e),
      );
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };
