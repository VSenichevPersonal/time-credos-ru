import type { Actor } from './resolve-actor';

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT-LOG (MVP-гибрид): SSOT-запись строки журнала изменений трудозатрат в
// credosTimeEntryLog. Один источник формулы записи лога — переиспользуется
// доменами мутации (time-entry-api: create/update/delete; approval: status).
//
// КОНТРАКТ ПОБОЧНОСТИ: лог НИКОГДА не должен ронять основную операцию. Любая
// ошибка записи лога глотается (try/catch внутри) — функция всегда резолвится,
// возвращая boolean «удалось ли». Вызывающий не обязан ждать и не должен падать.
//
// actor (server-truth resolveActor) → TEXT employeeId; деградация (actor=null) →
// лог пишется с пустым actor (действие важнее «кто»).
// ─────────────────────────────────────────────────────────────────────────────

export type EntryLogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS';

export type EntryLogInput = {
  entryId: string | null;
  action: EntryLogAction;
  oldHours?: number | null;
  newHours?: number | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  entryDate?: string | null;
};

const apiBase = () => (process.env.TWENTY_API_URL ?? '').replace(/\/$/, '');
const authHeaders = () => ({
  Authorization: `Bearer ${process.env.TWENTY_APP_ACCESS_TOKEN ?? ''}`,
  'Content-Type': 'application/json',
});

// Записать строку аудит-лога. Возвращает true при успехе, false при любой ошибке
// (сетевой/REST/прочей) — БЕЗ throw, чтобы основная мутация не пострадала.
export const writeEntryLog = async (
  actor: Actor,
  input: EntryLogInput,
): Promise<boolean> => {
  try {
    const body: Record<string, unknown> = {
      action: input.action,
      // actor — employeeId из server-truth resolveActor; null → пустой actor.
      actor: actor?.employeeId ?? null,
      oldHours: input.oldHours ?? null,
      newHours: input.newHours ?? null,
      oldStatus: input.oldStatus ?? null,
      newStatus: input.newStatus ?? null,
      entryDate: input.entryDate ?? null,
      loggedAt: new Date().toISOString(),
      // entry — relation join-column. CASCADE: при delete записи логи снесутся, но
      // на момент записи лога (до фактического REST-delete) entry ещё существует.
      entryId: input.entryId ?? null,
    };
    const res = await fetch(`${apiBase()}/rest/credosTimeEntryLogs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        '[write-entry-log] лог не записан (%s) — операция НЕ прервана',
        res.status,
      );
      return false;
    }
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      '[write-entry-log] лог не записан (%s) — операция НЕ прервана',
      e instanceof Error ? e.message : String(e),
    );
    return false;
  }
};
