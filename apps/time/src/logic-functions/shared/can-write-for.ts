import type { Actor } from './resolve-actor';

// ─────────────────────────────────────────────────────────────────────────────
// ON-BEHALF server-gate (MANAGER_ENTRY_ON_BEHALF §3.1.B): «может ли actor писать
// трудозатраты/план ЗА сотрудника target». SSOT-формула authz on-behalf — один
// источник для time-entry-api (CRUD факта) и plan-slots (план).
//
// ПРАВИЛО (MVP, [[keep-it-simple]], [[planning-identity-decisions]]):
//   canWriteFor(actor, target) = true, если выполнено ХОТЯ БЫ одно:
//     1) actor.employeeId == target           — свой ввод (обычный путь);
//     2) actor — РУКОВОДИТЕЛЬ ОТДЕЛА target    — department.head через
//        employee.department + employeeDepartment(FTE, активные) → scope «свой отдел»;
//     3) actor — PM/владелец ПРОЕКТА записи     — project.manager|owner (стандартный
//        WorkspaceMember) → мост на employee по workspaceMemberRef (ctx.projectId);
//     4) actor — АДМИН (глобально)              — выделенной admin-роли в модели НЕТ →
//        ДЕГРАДАЦИЯ на actor.isManager (как override lockdown/approve по всей системе).
//        RBAC follow-up: завести признак admin и сузить ветку 4 до него.
//
// ДЕГРАДАЦИЯ identity: actor==null (server-identity недоступна, dev/legacy) →
// canWriteFor НЕ применяется вызывающим (см. time-entry-api/plan-slots): домен
// продолжает на текущем поведении, чтобы не сломать dev-flow (как resolveActor).
//
// АДМИН-ОГОВОРКА (безопасность): ветка 4 = «любой руководитель пишет за любого» —
// это ШИРЕ scope-отдела, осознанная деградация до RBAC-волны (нет источника admin).
// Параллель: lockdown override и approve тоже деградируют на isManager. Сужение —
// follow-up CISO-012. Untrusted actor (trusted=false) сюда не доходит: вызывающий
// применяет gate только к trusted-актору (иначе client-подделка обходила бы gate).
// ─────────────────────────────────────────────────────────────────────────────

export type CanWriteForContext = {
  // Проект записи (time-entry) — нужен для PM/owner-ветки (3). Для plan-slots —
  // projectId слота. Пусто → ветка PM пропускается.
  projectId?: string | null;
};

// Инъектируемые резолверы (для unit-тестов и чтобы модуль был самодостаточен —
// REST-реализация по умолчанию через нативный fetch серверного рантайма).
export type CanWriteForDeps = {
  // Множество employeeId, для которых actor — руководитель отдела (scope «свой отдел»).
  // Реализация: отделы, где actor — head → сотрудники этих отделов (department +
  // employeeDepartment FTE). Возвращает true, если target в scope actor.
  isHeadOfEmployeeDept: (actorEmployeeId: string, targetEmployeeId: string) => Promise<boolean>;
  // actor — PM (manager) или владелец (owner) проекта projectId. Мост WM→employee
  // по credosTimeEmployee.workspaceMemberRef. Возвращает true, если actor управляет проектом.
  isProjectManager: (actorEmployeeId: string, projectId: string) => Promise<boolean>;
};

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (v: string | null | undefined): v is string => !!v && UUID_RE.test(v);

// REST-резолвер scope «руководитель отдела target».
//   1) Отделы, где actor — head (employee.headedDepartments / department.head[eq]).
//   2) Отделы target: основной employee.department + активные employeeDepartment (FTE).
//   3) Пересечение непусто → actor руководит отделом target.
const defaultIsHeadOfEmployeeDept = async (
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<boolean> => {
  if (!isUuid(actorEmployeeId) || !isUuid(targetEmployeeId)) return false;
  // Отделы, которыми руководит actor.
  const headed = await restGet<{ data: { credosTimeDepartments: Array<{ id: string }> } }>(
    '/rest/credosTimeDepartments',
    { filter: `headId[eq]:${actorEmployeeId}`, limit: '200' },
  );
  const headedIds = new Set(
    (headed.data?.credosTimeDepartments ?? []).map((d) => d.id).filter(isUuid),
  );
  if (headedIds.size === 0) return false;
  // Основной отдел target (employee.departmentId).
  const emp = await restGet<{ data: { credosTimeEmployees: Array<{ departmentId: string | null }> } }>(
    '/rest/credosTimeEmployees',
    { filter: `id[eq]:${targetEmployeeId}`, limit: '1' },
  );
  const primaryDept = emp.data?.credosTimeEmployees?.[0]?.departmentId ?? null;
  if (primaryDept && headedIds.has(primaryDept)) return true;
  // FTE-назначения target (мульти-отдел). Любое назначение в подведомственный отдел.
  const assigns = await restGet<{ data: { credosTimeEmployeeDepartments: Array<{ departmentId: string | null }> } }>(
    '/rest/credosTimeEmployeeDepartments',
    { filter: `employeeId[eq]:${targetEmployeeId}`, limit: '200' },
  );
  for (const a of assigns.data?.credosTimeEmployeeDepartments ?? []) {
    if (a.departmentId && headedIds.has(a.departmentId)) return true;
  }
  return false;
};

// REST-резолвер PM/owner-ветки. project.manager/owner → WorkspaceMember; мост на
// employee по credosTimeEmployee.workspaceMemberRef[eq]. actor — PM/owner проекта.
const defaultIsProjectManager = async (
  actorEmployeeId: string,
  projectId: string,
): Promise<boolean> => {
  if (!isUuid(actorEmployeeId) || !isUuid(projectId)) return false;
  const proj = await restGet<{ data: { credosTimeProjects: Array<{ managerId: string | null; ownerId: string | null }> } }>(
    '/rest/credosTimeProjects',
    { filter: `id[eq]:${projectId}`, limit: '1' },
  );
  const p = proj.data?.credosTimeProjects?.[0];
  if (!p) return false;
  const wmIds = [p.managerId, p.ownerId].filter(isUuid);
  if (wmIds.length === 0) return false;
  // Мост WM→employee: сотрудник actor с workspaceMemberRef среди manager/owner проекта.
  const me = await restGet<{ data: { credosTimeEmployees: Array<{ workspaceMemberRef: string | null }> } }>(
    '/rest/credosTimeEmployees',
    { filter: `id[eq]:${actorEmployeeId}`, limit: '1' },
  );
  const actorWmRef = me.data?.credosTimeEmployees?.[0]?.workspaceMemberRef ?? null;
  if (!actorWmRef) return false;
  return wmIds.includes(actorWmRef);
};

const defaultDeps: CanWriteForDeps = {
  isHeadOfEmployeeDept: defaultIsHeadOfEmployeeDept,
  isProjectManager: defaultIsProjectManager,
};

// Экспорт PM/owner-проверки для отдельского/проектного планирования (plan-slots:
// слот без employeeId — не «свой ввод», canWriteFor его не покрывает). actor — PM
// или владелец проекта. Деградация identity (actor=null) → false.
export const isActorProjectManager = async (
  actor: Actor,
  projectId: string | null | undefined,
  deps: CanWriteForDeps = defaultDeps,
): Promise<boolean> => {
  if (!actor || !projectId) return false;
  return deps.isProjectManager(actor.employeeId, projectId);
};

// Может ли actor писать ЗА target. Вызывающий ОБЯЗАН передавать actor только когда
// он trusted и target известен; при actor==null / отсутствии target вызывающий
// деградирует на текущее поведение и canWriteFor НЕ вызывает.
export const canWriteFor = async (
  actor: Actor,
  targetEmployeeId: string | null | undefined,
  ctx: CanWriteForContext = {},
  deps: CanWriteForDeps = defaultDeps,
): Promise<boolean> => {
  // Деградация identity: без trusted-актора gate не судит (вызывающий решает).
  if (!actor) return false;
  // 1) Свой ввод — всегда ок (target не задан трактуем как «свой», см. вызывающий).
  if (!targetEmployeeId || actor.employeeId === targetEmployeeId) return true;
  // 4) Админ (деградация на isManager — глобальный обход; RBAC follow-up сузит).
  //    Проверяем РАНЬШЕ сетевых веток: руководитель/админ и так проходит → экономим fetch.
  if (actor.isManager === true) {
    // Сначала точный scope-отдел (быстрый/узкий путь по смыслу).
    if (await deps.isHeadOfEmployeeDept(actor.employeeId, targetEmployeeId)) return true;
    // 3) PM/owner проекта записи.
    if (ctx.projectId && (await deps.isProjectManager(actor.employeeId, ctx.projectId))) return true;
    // Админ-деградация: руководитель без scope-совпадения всё равно пишет за любого
    // (нет источника admin-роли). Осознанная широта до RBAC-волны (см. шапку).
    return true;
  }
  // 2) Руководитель отдела target (даже если isManager-флаг не выставлен — head есть head).
  if (await deps.isHeadOfEmployeeDept(actor.employeeId, targetEmployeeId)) return true;
  // 3) PM/owner проекта записи.
  if (ctx.projectId && (await deps.isProjectManager(actor.employeeId, ctx.projectId))) return true;
  return false;
};
