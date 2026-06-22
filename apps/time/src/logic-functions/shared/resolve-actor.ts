import type { RoutePayload } from 'twenty-sdk/logic-function';

import { isUuid } from '../params-validate';

// ─────────────────────────────────────────────────────────────────────────────
// SSOT серверного резолва actor («кто действует достоверно») для logic-functions.
//
// CISO-005 фундамент. Раньше `resolveActor` жил ТОЛЬКО в approval.logic; на это же
// поведение завязаны time-entry-api (CRUD трудозатрат) и plan-slots (plan-write),
// где личность бралась из client-supplied employeeId / DEV-fallback. Вынесено сюда
// одним источником формулы (server-truth + TOFU-привязка + NULL-деградация), чтобы
// все три домена резолвили actor одинаково. Поведение approval НЕ меняется.
//
// ВАЖНО (этап-1 «фундамент», MANAGER_ENTRY_ON_BEHALF §1): этот модуль ТОЛЬКО
// резолвит actor для будущего аудита/гарда. Он НЕ навязывает enforcement-правил
// (canWriteFor / ownership / lockdown — следующие фазы). При недоступной
// server-identity деградирует на текущее поведение, НЕ hard-fail, — чтобы 42/43
// сотрудника без userWorkspaceRef и dev-flow не сломались.
// ─────────────────────────────────────────────────────────────────────────────

// Actor-сотрудник, выполняющий действие. trusted=true → личность резолвлена СЕРВЕРНО
// (event.userWorkspaceId → employee.userWorkspaceRef), клиент её не подделывал.
// trusted=false → деградация (legacy/dev): личность из client-supplied workspaceMemberRef,
// когда server-identity недоступна (event.userWorkspaceId NULL).
export type Actor = { employeeId: string; isManager: boolean; trusted: boolean } | null;

type RawEmployee = {
  id: string;
  isManager: boolean | null;
  workspaceMemberRef: string | null;
  userWorkspaceRef: string | null;
};

// Тонкий REST-клиент к Core API воркспейса (нативный fetch серверного рантайма).
// Локальный (а не общий импорт) — модуль самодостаточен и легко мокается в тестах.
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

const restPatch = async (path: string, body: unknown): Promise<void> => {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} -> ${res.status} ${await res.text()}`);
};

// CISO-005 server-truth резолв actor. Приоритет — серверный event.userWorkspaceId.
//   1) userWorkspaceId → employee по userWorkspaceRef[eq] → trusted actor.
//   2) не замаплен, но клиент дал workspaceMemberRef → TOFU (trust-on-first-use):
//      найдём employee по workspaceMemberRef; если его userWorkspaceRef ПУСТ — захватим
//      (привяжем userWorkspaceId один раз + userMapPending=true для админ-сверки) и далее
//      доверяем серверу. Если userWorkspaceRef уже занят ДРУГИМ значением — коллизия/
//      подмена, привязку НЕ делаем, actor=null (guard откажет).
//   3) event.userWorkspaceId NULL (dev/legacy 42/43 пусты) → мягкая деградация: actor
//      из workspaceMemberRef, trusted=false (не ломаем рабочий dev-flow).
// TOFU выбран прагматично для 15–20 доверенных юзеров: достоверного install-time источника
// userWorkspaceId↔employee нет (разведка CISO-005), а server-side currentWorkspaceMember в
// SDK 2.14 отсутствует. Первое действие при пустом маппинге — единственный момент, где
// userWorkspaceId и заявленный employee совпадают «как есть»; фиксируем связь и помечаем
// на сверку. Риск (чужой workspaceMemberRef в первый раз) ограничен окном до сверки и
// доверенной средой; после привязки подмена закрыта (ветка 1 игнорирует client-ref).
//
// КОНТРАКТ ДЕГРАДАЦИИ (фундамент, не enforcement): когда ни server-identity, ни валидный
// workspaceMemberRef недоступны (типичный dev/legacy путь без uwId), функция возвращает
// null БЕЗ единого fetch — вызывающий домен продолжает на текущем поведении (client
// employeeId / DEV-fallback). Это сохраняет CRUD/plan-write рабочими во время раскатки.
export const resolveActor = async (
  event: RoutePayload,
  workspaceMemberRef: string | undefined,
): Promise<Actor> => {
  const uwId = event.userWorkspaceId ?? null;

  // Ветка 1: серверная личность есть → ищем уже замапленного сотрудника.
  if (uwId) {
    const byUw = await restGet<{ data: { credosTimeEmployees: RawEmployee[] } }>(
      '/rest/credosTimeEmployees',
      { filter: `userWorkspaceRef[eq]:${uwId}`, limit: '1' },
    );
    const mapped = byUw.data?.credosTimeEmployees?.[0];
    if (mapped) {
      return { employeeId: mapped.id, isManager: mapped.isManager === true, trusted: true };
    }
    // Ветка 2 (TOFU): не замаплен. Привязываем по заявленному workspaceMemberRef.
    if (!workspaceMemberRef || !isUuid(workspaceMemberRef)) return null;
    const claimed = await restGet<{ data: { credosTimeEmployees: RawEmployee[] } }>(
      '/rest/credosTimeEmployees',
      { filter: `workspaceMemberRef[eq]:${workspaceMemberRef}`, limit: '1' },
    );
    const e = claimed.data?.credosTimeEmployees?.[0];
    if (!e) return null;
    // userWorkspaceRef уже занят другим userWorkspaceId → коллизия (двойной маппинг/
    // подмена). Не перезаписываем, отказываем (actor=null).
    if (e.userWorkspaceRef && e.userWorkspaceRef !== uwId) return null;
    if (!e.userWorkspaceRef) {
      // eslint-disable-next-line no-console
      console.warn(`[resolve-actor] TOFU: привязка userWorkspaceRef=${uwId} → employee=${e.id} (на сверку)`);
      await restPatch(`/rest/credosTimeEmployees/${e.id}`, {
        userWorkspaceRef: uwId,
        userMapPending: true,
      });
    }
    return { employeeId: e.id, isManager: e.isManager === true, trusted: true };
  }

  // Ветка 3: server-identity недоступна (dev/legacy) → деградация на client-ref.
  // CISO-006: workspaceMemberRef интерполируется в filter — только UUID.
  if (!workspaceMemberRef || !isUuid(workspaceMemberRef)) return null;
  const res = await restGet<{ data: { credosTimeEmployees: RawEmployee[] } }>(
    '/rest/credosTimeEmployees',
    { filter: `workspaceMemberRef[eq]:${workspaceMemberRef}`, limit: '1' },
  );
  const e = res.data?.credosTimeEmployees?.[0];
  if (!e) return null;
  // eslint-disable-next-line no-console
  console.warn('[resolve-actor] actor из client workspaceMemberRef (event.userWorkspaceId пуст) — DEV-деградация, untrusted');
  return { employeeId: e.id, isManager: e.isManager === true, trusted: false };
};
