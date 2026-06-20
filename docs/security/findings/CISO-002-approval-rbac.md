# CISO-002 — approval без авторизации actor + separation of duties (P2)

**Статус:** OPEN · **Severity:** P2 · **Owner устранения:** Dev 2 (logic), Dev 1 (UI) · **Дата:** 2026-06-20

## Суть

`apps/time/src/logic-functions/approval.logic.ts` `runResolve` (approve/reject, L108–127) меняет статус `SUBMITTED → APPROVED/REJECTED`, проверяя ТОЛЬКО `entry.status === SUBMITTED`. Отсутствуют контроли доступа.

## Пробелы

1. **C1 — нет авторизации actor:** любой аутентифицированный пользователь, дёрнувший `POST /approval` op=approve, согласует записи. Роль «Руководитель» (`manager.role.ts`) не проверяется.
2. **C2 — нет separation of duties:** actor (`event.userWorkspaceId`) не сверяется с автором записи → сотрудник может согласовать **свои** трудозатраты.
3. **C3 — нет scope:** руководитель согласует записи любого отдела.
4. **Сервис-токен:** REST идёт под `TWENTY_APP_ACCESS_TOKEN` → per-user RBAC платформы обходится; авторизацию обязана делать сама logic-function.

Подтверждено независимо Dev 1 и Dev 2 (хардкод `isManager = false`, `weekly-grid.tsx:25`).

## Severity

**P2** — dev-среда, ограниченный круг доверенных пользователей. Но контроль целостности согласования (HR/коммерческие данные) отсутствует полностью.

## Требование

Полная спека: [specs/RBAC_APPROVAL.md](../specs/RBAC_APPROVAL.md). Кратко:
- C1: резолв роли actor = «Руководитель» перед сменой статуса.
- C2: `actor != owner` — привести `userWorkspaceId` и `employee.workspaceMemberRef` к одному типу ID (⚠️ это разные сущности Twenty, прямое сравнение даст ложный pass).
- C3 (желательно): scope по отделу руководителя.
- UI (Dev 1): прятать approve/reject при `!isManager`, но это не замена серверного контроля.

## DoD

1. approve от не-руководителя → `forbidden`, статус не изменился.
2. Руководитель approve своей записи → отказ.
3. Руководитель approve чужой SUBMITTED → APPROVED + audit-поля.
4. UI без кнопок approve/reject у не-руководителя.
