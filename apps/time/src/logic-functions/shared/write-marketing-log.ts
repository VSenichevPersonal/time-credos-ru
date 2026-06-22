// ─────────────────────────────────────────────────────────────────────────────
// MARKETING-LOG: SSOT-запись строки per-field журнала изменений маркетинг-полей
// проекта в credosTimeMarketingLog. Дёргается database-event триггером
// credosTimeProject.updated по каждому изменённому маркетинг-полю.
//
// КОНТРАКТ ПОБОЧНОСТИ: лог НИКОГДА не валит основную операцию (UPDATE проекта уже
// зафиксирован ядром к моменту события). Любая ошибка записи глотается (try/catch);
// функция всегда резолвится, возвращая boolean «удалось ли».
//
// actor — server-truth по event.userWorkspaceId → employee (resolveMarketingActor).
// Маркетинг-поля правят через грид/UI Twenty → событие несёт userWorkspaceId
// (server-identity). Деградация actor=null лог пишется с пустым actor (изменение
// важнее «кто»).
// ─────────────────────────────────────────────────────────────────────────────

import { isUuid } from '../params-validate';

export type MarketingLogInput = {
  projectId: string | null;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  // actor — employeeId (server-truth) или null (деградация).
  actor?: string | null;
};

const apiBase = () => (process.env.TWENTY_API_URL ?? '').replace(/\/$/, '');
const authHeaders = () => ({
  Authorization: `Bearer ${process.env.TWENTY_APP_ACCESS_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
});

// Server-truth резолв актора: event.userWorkspaceId → employee по userWorkspaceRef[eq].
// Узкий вариант (без TOFU/деградации на client-ref): у database-event нет client-supplied
// workspaceMemberRef, доверяемся ТОЛЬКО серверной личности. Нет userWorkspaceId / не
// найден сотрудник → null (лог пишется с пустым actor). Ошибка fetch → null (не валит).
export const resolveMarketingActor = async (
  userWorkspaceId: string | null | undefined,
): Promise<string | null> => {
  if (!userWorkspaceId || !isUuid(userWorkspaceId)) return null;
  try {
    const res = await fetch(
      `${apiBase()}/rest/credosTimeEmployees?filter=userWorkspaceRef[eq]:${userWorkspaceId}&limit=1`,
      { headers: authHeaders() },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { credosTimeEmployees?: Array<{ id: string }> };
    };
    return json.data?.credosTimeEmployees?.[0]?.id ?? null;
  } catch {
    return null;
  }
};

// Записать строку marketing-лога. Возвращает true при успехе, false при любой ошибке
// (сетевой/REST/прочей) — БЕЗ throw, чтобы основная мутация (UPDATE проекта) не пострадала.
export const writeMarketingLog = async (
  input: MarketingLogInput,
): Promise<boolean> => {
  try {
    const body: Record<string, unknown> = {
      fieldName: input.fieldName,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      actor: input.actor ?? null,
      changedAt: new Date().toISOString(),
      // project — relation join-column (CASCADE при удалении проекта).
      projectId: input.projectId ?? null,
    };
    const res = await fetch(`${apiBase()}/rest/credosTimeMarketingLogs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        '[write-marketing-log] лог не записан (%s) — операция НЕ прервана',
        res.status,
      );
      return false;
    }
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      '[write-marketing-log] лог не записан (%s) — операция НЕ прервана',
      e instanceof Error ? e.message : String(e),
    );
    return false;
  }
};
