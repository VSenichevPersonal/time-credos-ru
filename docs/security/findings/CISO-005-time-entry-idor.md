# CISO-005 — time-entry-api: broken access control / impersonation (P1)

**Статус:** OPEN · **Severity:** P1 · **Owner устранения:** Dev 2 (logic) + DevOps/arch (server-side identity) · **Дата:** 2026-06-20

## Суть

`apps/time/src/logic-functions/time-entry-api.logic.ts` определяет личность сотрудника по **client-supplied** `params.workspaceMemberRef`, а не по аутентифицированному `event.userWorkspaceId`. Серверной привязки actor↔запись нет → нарушитель управляет чужими трудозатратами.

## Векторы

| op | Строки | Проблема |
|---|---|---|
| `delete` | L113–116 | `DELETE /rest/credosTimeEntries/{params.id}` — **ноль проверки владельца**. Любой аутентифицированный юзер удаляет любую запись. |
| `upsert` (create) | L120–146 | `employeeId` = резолв из `params.workspaceMemberRef` (передаёт клиент). Юзер создаёт записи **от имени любого** сотрудника (impersonation). |
| `upsert` (patch) | L135–141 | PATCH по `params.id` без проверки, что запись принадлежит actor. Правка чужих записей. |
| `list` (GET) | L153–155 | `employeeId[eq]` из client-ref → чтение трудозатрат любого сотрудника. |

## Корневая причина

`resolveEmployeeId` (L73–104) + комментарий L74–78: *«RoutePayload отдаёт только `event.userWorkspaceId` (НЕ workspaceMember ID)… серверного маппинга userWorkspace→workspaceMember через REST нет. Поэтому клиент обязан передавать workspaceMemberRef явно»*.

→ Личность берётся из недоверенного входа. + DEV-fallback (L90–103) при несопоставленном ref возвращает **первого активного** сотрудника (маскирует/подменяет).

**Системность:** тот же gap делает невозможным надёжный контроль C2 в [CISO-002](CISO-002-approval-rbac.md) (separation of duties) — actor-identity спуфится одинаково в обоих logic-functions.

**Контекст function-role:** `default-role.ts` (`defineApplicationRole`, identity logic-functions / `TWENTY_APP_ACCESS_TOKEN`) даёт `canReadAllObjectRecords/canUpdateAllObjectRecords/canSoftDeleteAllObjectRecords: true` (`canDestroyAll: false` ✅). Широта корректна для сервис-роли (функции делают кросс-юзерные операции) — НО ровно поэтому функции ОБЯЗАНЫ сами авторизовать вызывающего. Не авторизуют → широкая роль = эксплуатируемая поверхность. Это не отдельный риск, а почему CISO-005 критичен.

**Заметка (P3):** приложение определяет только повышенную роль «Руководитель» (`manager.role.ts`), отдельной ограниченной роли рядового сотрудника нет → прямой доступ к объектам вне logic-functions (через UI платформы) ограничен дефолтом воркспейса, не приложением. Для сетки не критично (идёт через function-role), но учесть при RBAC-модели.

## Severity

**P1** — класс broken access control (IDOR + impersonation + неавторизованное удаление). Смягчает: dev-среда, 15–20 доверенных юзеров, нет внешней поверхности, аутентификация на входе есть (`isAuthRequired: true`). Но контроль доступа к данным отсутствует.

## Требование

1. **Server-side identity (корень).** Найти способ резолвить `event.userWorkspaceId` → workspaceMember/employee серверно, не доверяя params:
   - исследовать SDK: GraphQL `currentWorkspaceMember`/`/rest/.../me`, контекст app-токена, либо payload-поля RoutePayload помимо userWorkspaceId (→ DevOps/arch + проверить twenty-sdk доки).
   - если строго нет — завести серверную таблицу-маппинг `userWorkspaceId → workspaceMemberRef`, заполнять при install/первом входе.
2. **Ownership-guard** на `delete`/`patch`: запись принадлежит resolved-actor (после п.1). Руководитель — исключение по роли (как в [RBAC_APPROVAL](../specs/RBAC_APPROVAL.md)).
3. **Убрать DEV-fallback** «первый активный» из прод-пути (уже помечен `TODO(prod)` L93) — отдавать ошибку «не сопоставлен».

## DoD

1. delete/patch чужой записи обычным юзером → `forbidden`.
2. upsert игнорирует client `workspaceMemberRef`, привязывает к серверной личности actor.
3. list возвращает только записи actor (+ его отдел для руководителя).
4. Нет DEV-fallback на первого активного в прод-режиме.
