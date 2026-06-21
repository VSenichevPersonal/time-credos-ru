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

---

## РАЗВЕДКА SDK 2026-06-21 (Dev 2, итер. ciso-005-actor): серверный actor — ВЕРДИКТ

**Вопрос ШАГ 1:** доступен ли в logic-function (`/s/`-роут) серверный идентификатор аутентифицированного пользователя, НЕ переданный клиентом, и можно ли по нему резолвить роль/владельца?

**Ответ: identity ПРИХОДИТ серверно (`event.userWorkspaceId`), но НЕПРИГОДНА для резолва actor — нет моста к workspaceMember/employee. Реализовать `resolveActorRole` по этому идентификатору НЕЛЬЗЯ.**

### Что проверено (источники)

| Источник | Факт |
|---|---|
| `twenty-sdk@2.14.0` `dist/logic-function/index.d.ts` (тип `LogicFunctionEvent` = `RoutePayload`) | На HTTP-роуте сервер кладёт ровно ОДИН identity-флаг: `userWorkspaceId: string \| null`. Полей `userId` / `workspaceMemberId` / `authContext` НЕТ. |
| Тот же файл, `ObjectRecordBaseEvent` (стр. 184–186) | `userId` / `workspaceMemberId` есть **только у DB-событий** (create/update/...), НЕ у `/s/`-роутов. DB-event-вето в SDK невозможно (реактивные триггеры) → этот путь для approval неприменим. |
| docs.twenty.com `logic-functions.md` (RoutePayload-таблица) | В публичной таблице `userWorkspaceId` даже не указан среди полей роута — т.е. это не задокументированный «actor-API», а внутренний флаг (тип в SDK его декларирует). На него нельзя строить публичный контракт безопасности. |
| `twenty-client-sdk` `core/generated/schema.graphql` | Тип `WorkspaceMember` фильтруется (`WorkspaceMemberFilterInput`) только по `id` / `userId` / `userEmail`. Поля `userWorkspaceId` НЕТ. Типа/объекта `UserWorkspace` в Core-схеме НЕТ вообще (0 вхождений `userWorkspace`). |
| `docs/data-model/A1_CURRENT_USER_RESEARCH.md` §3 (прошлая разведка, live-проверено на dev) | `/rest/me`, `/rest/currentWorkspaceMember`, `/rest/users/me` → **HTTP 400 «object not found»**. Прямого REST-маппинга `userWorkspaceId → workspaceMember` нет. |

### Почему мост не строится

`event.userWorkspaceId` — это ID сущности **userWorkspace** (связка user↔workspace), а НЕ `workspaceMember.id`, НЕ `userId` и НЕ email. Резолв actor требует цепочки `→ workspaceMember → credosTimeEmployee (workspaceMemberRef/email) → isManager/employeeId`. Первое же звено `userWorkspaceId → workspaceMember` нечем пройти: в Core REST/GraphQL нет ни объекта `UserWorkspace`, ни фильтра `WorkspaceMember.userWorkspaceId`. Фронтовый мост из A1 (`useUserId()` → `workspaceMembers.userId[eq]`) здесь НЕ работает: `useUserId()` доступен только в front-component-песочнице и даёт `userId`, которого в `RoutePayload` нет.

### Что это значит для actor

- `userWorkspaceId` — **server-truth для аудита** «кто нажал» (клиент подделать не может). Уже используется как `actorId` → `approvedBy` (`approval.logic.ts:286`). Это корректно и оставляем.
- **Роль/владелец** (isManager, ownership для recall/revoke/SoD) сейчас резолвится из `params.workspaceMemberRef` — **client-supplied, недоверенный**. Это и есть IDOR-ядро CISO-005. Закрыть его «серверным actor из `userWorkspaceId`» в текущем SDK **невозможно** — выдумывать маппинг запрещено (KISS / не переусложнять).

### Компенсирующие контролы (минимум, по приоритету)

Полноценный server-side actor требует одного из (вне зоны Dev 2 logic — нужен arch/DevOps + версия платформы):

1. **(предпочтительно) Доверенная таблица-маппинг `userWorkspaceId → workspaceMemberRef`.** Собственный объект `credosTimeUserMap`, заполняется при install/первом входе (когда identity достоверна). Тогда `/s/`-функция: `event.userWorkspaceId` → map → `workspaceMemberRef` → employee → роль. Снимает IDOR полностью, не доверяя params. **Стоимость:** новый объект + механизм заполнения (где взять `userWorkspaceId↔workspaceMemberRef` достоверно при install — открытый вопрос, требует проверки install-hook payload на наличие identity).
2. **Доверенный заголовок от gateway.** Если перед `/s/` стоит прокси Twenty, прокинуть подписанный заголовок с workspaceMemberId (`forwardedRequestHeaders` в `httpRouteTriggerSettings` — SDK поддерживает форвард заголовков). Требует доверенного источника заголовка на стороне платформы — на dev отсутствует.
3. **RLS / fieldPermissions на уровне Twenty** (raw-API) — единственный по-настоящему путь-независимый enforcement (см. CISO-012 L3). Тоже вне SDK-logic, RBAC-волна.

**До появления (1)/(2)/(3) — компенсирующий контрол текущей итерации:** identity-as-audit (`userWorkspaceId`→`approvedBy`) + UUID-валидация client-ref (CISO-006, инъекция закрыта) + UI-гейты ролей. Остаточный риск: клиент может подставить **чужой валидный** `workspaceMemberRef` и пройти isManager/ownership-guard (подмена легитимного UUID, не инъекция). Среда dev / 15–20 доверенных юзеров → severity смягчён, но при выходе в прод (1) обязателен ДО релиза.

**Версионный долг (R4):** в новых версиях Twenty может появиться `currentWorkspaceMember`-резолвер для logic-function — тогда (1) не нужен. Перепроверять при апгрейде SDK.

### Вывод по фейл-кложу

Текущая логика уже **fail-safe для инъекции** (невалидный ref → actor=null) и **fail-open для подмены** (валидный чужой ref → проходит). Ужесточать «fail-closed при actor=null» в prod-режиме (отклонять операцию, если actor не резолвлен) — дешёвый частичный контрол: закрывает анонимный/пустой ref, НЕ закрывает подмену. Это паллиатив, не решение; не меняю поведение в этой итерации без решения arch (риск сломать рабочий dev-flow, где ref пуст у 42/43 — A1 §2.4).
