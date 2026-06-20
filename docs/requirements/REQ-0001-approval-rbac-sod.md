# REQ-0001 — Approval: RBAC роли «Руководитель» + separation of duties

**Статус:** PARTIALLY_IMPLEMENTED (guard есть, но обходится — см. «Ревью реализации»)
**Источник:** CISO #002 (P2), CISO #003 (P3), TODO коммита c515b55 («isManager хардкод»)
**Затрагивает:** `roles/manager.role.ts`, `logic-functions/approval.logic.ts`, `constants/approval.ts` (опц.), фронт (контракт Dev 1)

## Контекст

Фича approval (submit/approve/reject) накатана (c515b55), но авторизация actor отсутствует:
- `runResolve` (approval.logic.ts L108–127) меняет SUBMITTED→APPROVED/REJECTED, проверяя **только** `status===SUBMITTED`.
- `actor = event.userWorkspaceId` фиксируется в `approvedBy`, но **не сверяется** ни с ролью, ни с автором записи.
- Все REST-вызовы идут под сервис-токеном app (`TWENTY_APP_ACCESS_TOKEN`) → per-user RBAC платформы обходится → авторизацию обязана делать сама logic-function.
- Фронт (approval-bar) всегда рисует кнопки approve/reject (Dev 1) — нет gate по роли.

## Требование

1. **Роль «Руководитель»** подключена и резолвится в рантайме (заменить хардкод `isManager`).
2. **Guard в `runResolve`** перед сменой статуса:
   - actor имеет роль «Руководитель» — иначе reject операции;
   - **separation of duties:** `actorWorkspaceMember != entry.employee.workspaceMemberRef` (нельзя approve/reject свои записи);
   - (желательно) scope: `entry` принадлежит отделу/проекту руководителя.
3. **Контракт для фронта** (Dev 1): logic-function возвращает `canApprove` (или RBAC-контекст) → UI прячет кнопки без права.

## Критерии приёмки

- Не-руководитель на `op=approve|reject` → `{ok:false, error:'forbidden'}`, статус не меняется.
- Руководитель на **своей** записи → отказ (SoD).
- Руководитель на чужой SUBMITTED-записи своего скоупа → APPROVED + `approvedBy=actor`, `approvedAt`.
- Фронт: кнопки approve/reject не видны без `canApprove`.
- QA smoke на 3 кейсах; lint/dry-run чисто.

## Ревью реализации (2026-06-20, Dev 2)

Guard добавлен в `approval.logic.ts` (`resolveActor` + `runResolve`): роль-чек `actor.isManager` + SoD `entry.employeeId === actor.employeeId`. Структурно верно, **но обходится** — CISO-002 НЕ закрыт:

1. 🔴 **Spoofable authorization.** `actor = resolveActor(params.workspaceMemberRef)`, а `params` = `readParams(event)` (query + body, **client-supplied**). Вызывающий передаёт **любой** `workspaceMemberRef` → может выдать себя за руководителя (`isManager:true`) или за другого сотрудника (обход SoD). Авторизация на самозаявленной identity.
2. 🔴 **Fail-open.** Нет `workspaceMemberRef` → `actor=null` → guard пропускается (только `console.warn`), approve проходит. Тривиальный обход: не передавать параметр.
3. Доверенная серверная identity — `event.userWorkspaceId` — используется только для аудита `approvedBy`, НЕ для guard.

**Корень:** нет резолва `userWorkspaceId → workspaceMember → credosTimeEmployee` (в коде: «маппинга через REST нет»). Решили через client-param — небезопасно.

**Требуется доработка:**
- actor резолвить из `event.userWorkspaceId` **серверно**, не из client-param (найти путь: Twenty REST `/rest/...` userWorkspace→workspaceMember, или SDK-контекст logic-function).
- **fail-closed** в проде: если approval требуется, а actor не резолвлен → `forbidden`, не пропускать.
- (dev-bypass допустим только за явным флагом окружения, не дефолтом).

## Исследование SDK — резолв actor (2026-06-20, Dev 2)

Проверил `twenty-sdk` + `research/twenty-sdk/openapi/twenty-core-openapi.json`:

- **`LogicFunctionEvent` (RoutePayload) несёт только `userWorkspaceId: string|null`** — ни workspaceMember, ни ролей, ни email. (`dist/logic-function/index.d.ts`.)
- **`/rest/workspaceMembers` есть**, фильтр по `userId`/`userEmail`, **но поля `userWorkspaceId` у `WorkspaceMember` НЕТ** → по userWorkspaceId не отфильтровать.
- **`/userWorkspaces` в REST НЕ экспонирован** → цепочка `userWorkspaceId → userId → workspaceMember` обрывается на первом шаге.
- front-component SDK: `currentWorkspaceMember`/`currentUser` не обнаружен (нужен probe реального рантайма).

**Вывод:** чистого REST-пути `userWorkspaceId → workspaceMember` под app-токеном **нет**. Текущий guard вынужденно берёт identity из client-param → небезопасен (см. выше).

**Опции (требуют решения arch + probe DevOps на живом сервере):**
1. **DevOps probe:** есть ли у logic-function доступ к GraphQL core (`currentWorkspaceMember`) или иному эндпоинту с userWorkspace→member помимо REST. Если да — резолвить там.
2. **ENV-allowlist по `userWorkspaceId` (безопасный interim):** хранить `MANAGER_USER_WORKSPACE_IDS` (server-set ID, НЕ спуфится). Guard C1: `event.userWorkspaceId ∈ allowlist`. Заполнять при install/вручную. Технический долг, но не обходится клиентом.
3. **Install-time mapping `userWorkspaceId → workspaceMemberRef`** — заполнять install-hook'ом, если хук видит оба ID.
4. **fail-closed:** пока резолва нет и approval требуется → `forbidden` (approval не работает, но не профанируется). Сочетать с 2/3.

**Рекомендация Dev 2:** interim = опция 2 (ENV-allowlist по userWorkspaceId) — закрывает C1 без спуфинга уже сейчас; параллельно DevOps probe (опция 1) как целевое решение. SoD (C2): нужен owner→userWorkspaceId — отложить до резолва или хранить в `approvedBy` сопоставимый ID.

## Открытые вопросы

- **Резолв `userWorkspaceId` → `workspaceMemberId`:** `event.userWorkspaceId` ≠ `workspaceMemberId` автора напрямую. Нужен путь резолва (REST `/rest/...` или поле в payload). → уточнить с arch/CISO.
- **Scope руководителя:** по отделу (`credosTimeEmployee.department`) или по проекту? Зависит от реального процесса Кредо-С — добить домен-знанием.
- **Field-level PII (CISO #003):** `manager.role.fieldPermissions: []` — пока ACCEPTED для dev, не блокирует REQ-0001.
