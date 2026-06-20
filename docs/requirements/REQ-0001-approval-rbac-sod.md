# REQ-0001 — Approval: RBAC роли «Руководитель» + separation of duties

**Статус:** PROPOSED
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

## Открытые вопросы

- **Резолв `userWorkspaceId` → `workspaceMemberId`:** `event.userWorkspaceId` ≠ `workspaceMemberId` автора напрямую. Нужен путь резолва (REST `/rest/...` или поле в payload). → уточнить с arch/CISO.
- **Scope руководителя:** по отделу (`credosTimeEmployee.department`) или по проекту? Зависит от реального процесса Кредо-С — добить домен-знанием.
- **Field-level PII (CISO #003):** `manager.role.fieldPermissions: []` — пока ACCEPTED для dev, не блокирует REQ-0001.
