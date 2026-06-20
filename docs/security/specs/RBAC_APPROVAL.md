# RBAC-требования — согласование трудозатрат (approval)

Спека CISO для Dev 2 (logic + role) и Dev 1 (UI). Закрывает finding [CISO-002](RISK_REGISTER.md). Уровень — пропорционально dev-среде, но контроль целостности обязателен (HR/коммерческие данные).

## Контроли (обязательные)

| # | Контроль | Где | Правило |
|---|---|---|---|
| **C1** | Авторизация actor | `approval.logic.ts` `runResolve` | approve/reject разрешён ТОЛЬКО если actor имеет роль «Руководитель» (`manager.role.ts`). Иначе → `{ ok:false, error:'forbidden' }`, статус не меняется. |
| **C2** | Separation of duties | `approval.logic.ts` `setStatus`/`runResolve` | actor НЕ может approve/reject запись, где он сам — автор (owner). `actor != owner` обязательно. |
| **C3** | Scope (желательно) | `approval.logic.ts` | Руководитель согласует записи своего отдела/проектов. Для dev можно отложить (P3), но заложить точку расширения. |

## Ключевая ловушка идентификаторов ⚠️

**Нельзя сравнивать `event.userWorkspaceId` напрямую с `employee.workspaceMemberRef`.**

- `actor` в коде = `event.userWorkspaceId` (ID **userWorkspace**).
- `owner` = `entry.employee.workspaceMemberRef` (TEXT, ID **workspaceMember** — см. описание поля: «Идентификатор workspaceMember CRM»).
- В Twenty userWorkspace и workspaceMember — **разные сущности**. Прямое `actor === owner` всегда `false` → C2 не сработает (ложный «не свой»).

**Требование к Dev 2:** привести оба к одному идентификатору перед сравнением. Варианты:
1. Резолвить `userWorkspaceId` → `workspaceMemberId` через платформу (REST/metadata воркспейса), сравнивать с `employee.workspaceMemberRef`.
2. Либо хранить в `approvedBy` тот же тип ID, что в `workspaceMemberRef`, и сравнивать его.
Зафиксировать в коде комментарием, какой ID с каким сверяется.

## C1 — как определить «Руководитель»

`event.userWorkspaceId` не несёт роли. Резолвить роли actor серверно:
- запросить назначенные роли userWorkspace через платформу и проверить наличие `CREDOS_TIME_MANAGER_ROLE_UNIVERSAL_IDENTIFIER`;
- REST под `TWENTY_APP_ACCESS_TOKEN` (сервис-токен) полный → **авторизацию проверяет сама функция**, не полагается на токен.

Dev-fallback (если SDK не отдаёт роли в logic-function просто): временный allowlist managerIds из ENV — но это технический долг, отметить в коде `// TODO C1: заменить на резолв роли`.

## Для Dev 1 (UI) — `isManager`

Сейчас `weekly-grid.tsx:25` `const isManager = false` (хардкод). Кнопки approve/reject в `approval-bar.tsx` за флагом — это правильно (UI-gate). Но **UI-gate ≠ контроль безопасности**: серверный C1/C2 в logic-function обязателен независимо от UI (UI можно обойти прямым POST `/approval`).

Как фронту узнать роль actor:
1. Предпочтительно — SDK-контекст текущего пользователя с ролями (если есть в `twenty-sdk`).
2. Fallback — лёгкая logic-function `/whoami` (op без сайд-эффектов), возвращает `{ isManager }` для actor; фронт вызывает при маунте grid.

UI прячет approve/reject при `!isManager`, submit оставляет всем. Дублирует серверный контроль, не заменяет.

## Definition of Done (для QA-приёмки)

1. POST `/approval` op=approve от не-руководителя → `forbidden`, статус не изменился.
2. Руководитель approve **своей** записи → отказ (C2).
3. Руководитель approve чужой SUBMITTED → APPROVED + `approvedBy`/`approvedAt`.
4. UI: у не-руководителя кнопок approve/reject нет.
