# A1 — Текущий пользователь во front-component (research)

**Статус:** ДА (с оговоркой по данным).
**Дата:** 2026-06-21. Автор: research-аналитик AITEAM.
**Линчпин:** разблокирует approval-workflow (`weekly-grid.tsx:25 isManager=false` хардкод), isManager-гейт, REQ-0014 личный кабинет, фильтр «мой».

---

## 1. Доступен ли current-user во фронте — ДА, через `userId`

Front-component SDK (Remote DOM / Web Worker песочница) **отдаёт идентификатор текущего user**, но НЕ workspaceMember и НЕ роль напрямую. Точные цитаты из `node_modules/twenty-sdk/dist/front-component/index.d.ts`:

```ts
// строка 163
declare const useUserId: () => string | null;

// строки 138-151 — контекст исполнения front-component
type FrontComponentExecutionContext = {
    frontComponentId: string;
    userId: string | null;          // <-- доступен
    recordId: string | null;        // @deprecated
    selectedRecordIds: string[];
    colorScheme: 'light' | 'dark';
};
declare const useFrontComponentExecutionContext: <T>(selector: (context: FrontComponentExecutionContext) => T) => T;
```

Чего НЕТ в SDK (проверено grep'ом по всему `front-component/`): `currentWorkspaceMember`, `currentUser`, `useWorkspaceMember`, `getCurrentUser`, `actor`, эндпоинта `/me`. Единственный «след» — это `userId`.

**Это `userId` (user-уровень платформы), а не `workspaceMemberId`.** Поэтому предыдущий вывод в коде («SDK не отдаёт текущего пользователя» — `use-capacity.ts:80-83`, `capacity-rest.ts:164`) **частично устарел**: user-id есть, недоставало лишь моста user → workspaceMember → employee.

### Мост найден и проверен live

`WorkspaceMember` имеет поле `userId: UUID!` — и оно фильтруемо в Core REST.

Цитата из `node_modules/twenty-client-sdk/dist/core/generated/schema.graphql` (`type WorkspaceMember`):
```graphql
"""Associated User Id"""
userId: UUID!
"""Related user email address"""
userEmail: String
```

Live-проверка (dev-воркспейс `twenty-production-e5c5.up.railway.app`, ключ `TWENTY_DEV_API_KEY`):

| Запрос | Результат |
|---|---|
| `GET /rest/workspaceMembers?limit=1` | **HTTP 200** — отдаёт `id`, `userId`, `userEmail`, `name` |
| `GET /rest/workspaceMembers?filter=userId[eq]:<реальный userId>` | **HTTP 200**, 1 запись (тот же workspaceMember) |
| `GET /rest/workspaceMembers?filter=userEmail[eq]:vs@credos.ru` | **HTTP 200** (альтернативный ключ-мост) |
| `GET /rest/me`, `/rest/auth/me`, `/rest/currentWorkspaceMember`, `/rest/users/me` | **HTTP 400** «object not found» — таких объектов/эндпоинтов нет |

Пример записи REST:
```json
{ "id":"4674db8c-291a-4a46-9781-43145400527c",
  "name":{"firstName":"Василий","lastName":"Сеничев"},
  "userEmail":"vs@credos.ru",
  "userId":"fe1c1765-fb8b-43b6-883d-42a8dadeee40" }
```

**Цепочка резолва (полностью рабочая на REST):**
```
front: useUserId()                           → userId (UUID)
REST:  workspaceMembers?filter=userId[eq]    → workspaceMember.id
REST:  credosTimeEmployees?filter=workspaceMemberRef[eq]:<id> → employee.isManager, employee.id
```
Это ровно тот ключ (`workspaceMemberRef`), который уже ждут `resolveSelfIsManager(workspaceMemberRef)` (`capacity-rest.ts:170`) и `resolveActor(workspaceMemberRef)` (`approval.logic.ts:32`). Сейчас в оба передаётся `null`/пусто — заполнить нечем было.

---

## 2. План разблокировки (ДА-ветка)

### 2.1 Новая функция-резолвер во фронте
В `capacity-rest.ts` (или общий `current-user.ts`):
```
resolveSelfWorkspaceMemberId(userId): GET /rest/workspaceMembers?filter=userId[eq]:<userId>&limit=1 → .id
```
Затем существующая `resolveSelfIsManager(workspaceMemberRef)` отрабатывает как задумано.

### 2.2 Подключение в use-capacity / weekly-grid
- `weekly-grid.tsx:25` `const isManager = false` → читать из хука, который: `useUserId()` → resolveSelfWorkspaceMemberId → resolveSelfIsManager.
- `use-capacity.ts:76` `resolveSelfIsManager(null)` → передать реальный workspaceMemberRef; убрать костыль `isManager: true` всем (`use-capacity.ts:88`) и `void isManagerInWorkspace` (стр. 84).

### 2.3 Approval — фронт обязан передавать `workspaceMemberRef` в params
`approval.logic.ts:185` `resolveActor(params.workspaceMemberRef)` уже готов. Фронт (кнопки approve/reject) должен класть в тело запроса `workspaceMemberRef = resolveSelfWorkspaceMemberId(useUserId())`. Тогда RBAC-guard (`approval.logic.ts:150` «только isManager») и separation-of-duties (`:170` actor != owner) включаются по-настоящему — сейчас они пропускаются с warning (`:153-158`).

### 2.4 БЛОКЕР данных (критично!)
Поле `credosTimeEmployees.workspaceMemberRef` **почти не заполнено**: из **43** сотрудников ref есть лишь у **1** (тестовый VS, ref=`4674db8c…`). Live-проверка `GET /rest/credosTimeEmployees?limit=200` → `с workspaceMemberRef = 1/43`.

Без массового заполнения `workspaceMemberRef` (мэппинг employee↔workspaceMember) цепочка даст «actor не резолвлен» для всех, кроме одного. **Это предусловие, без него план мёртв на данных.** Мост заполнения: `workspaceMembers.userEmail` ↔ `credosTimeEmployees.email` (оба доступны, у обоих 200). Нужна одноразовая миграция/seed-скрипт: для каждого employee найти workspaceMember по email → записать `workspaceMemberRef`.

---

## 3. NET-блок / CISO-005 — что с server-identity

**`RoutePayload` НЕ несёт workspaceMemberId/userId.** HTTP-route logic-function получает только `userWorkspaceId`. Цитата `node_modules/twenty-sdk/dist/logic-function/index.d.ts`:
```ts
type LogicFunctionEvent<TBody = object> = {   // = RoutePayload (см. export-alias)
    headers: Record<string, string | undefined>;
    queryStringParameters: ...;
    body: TBody | null;
    requestContext: { http: { method; path } };
    userWorkspaceId: string | null;            // <-- ЕДИНСТВЕННЫЙ identity-флаг
};
```
`userId`/`workspaceMemberId` в SDK есть **только у `ObjectRecordBaseEvent`** (DB-триггеры, стр. 184-186), НЕ у HTTP-роутов:
```ts
declare class ObjectRecordBaseEvent<T> {
    recordId: string;
    userId?: string;
    userWorkspaceId?: string;
    workspaceMemberId?: string;   // есть только для событий БД, не для /s/ роутов
    ...
}
```

**Вывод по CISO-005:** server-side actor по HTTP-роуту определяется через `event.userWorkspaceId` — он реально приходит (тип `string | null`). Но `userWorkspaceId` — это **userWorkspace ID, не workspaceMember и не employee** (так и помечено в коде: `approval.logic.ts:28-29`). Прямого REST-маппинга `userWorkspaceId → workspaceMember` через Core REST НЕ найдено (объекта/фильтра нет). Поэтому:
- `userWorkspaceId` пригоден как **аудит-метка «кто нажал»** (`approval.logic.ts:183` `actorId = event.userWorkspaceId` → пишется в `approvedBy`). Это server-truth, его подделать клиент не может.
- Для **RBAC-роли** (isManager) server полагается на `params.workspaceMemberRef`, который **передаёт клиент** → это не доверенный источник (клиент может подменить чужой ref). Защита от инъекции есть (CISO-006, UUID-валидация), но не от подмены легитимного чужого UUID.

Итог: identity **частично серверная** (userWorkspaceId — truth для аудита), но **роль — клиентская** (workspaceMemberRef в params). Полноценный CISO-005 (server сам резолвит роль из доверенного identity) требует моста `userWorkspaceId → workspaceMember`, которого в текущем Core REST нет. Варианты добычи: GraphQL Query `Query` имеет `workspaceMembers(...)` (schema.graphql:44740), но фильтра по userWorkspaceId не видно; нужен либо встроенный `currentWorkspaceMember`-резолвер платформы (в этой версии SDK отсутствует), либо хранить связку `userWorkspaceId↔workspaceMemberId` в собственном объекте.

---

## 4. Влияние на фичи

| Фича | Влияние |
|---|---|
| **approval-workflow** (`weekly-grid.tsx:25`) | РАЗБЛОКИРУЕТСЯ во фронте: isManager резолвится → кнопки согласования по роли. RBAC-guard в logic-function включается, КОГДА фронт передаёт `workspaceMemberRef`. Предусловие — заполнить `workspaceMemberRef` у employees. |
| **isManager-гейт** (`use-capacity.ts` «Планировать») | РАЗБЛОКИРУЕТСЯ: убрать `isManager:true` всем, гейтить по реальной роли. |
| **REQ-0014 личный кабинет** | РАЗБЛОКИРУЕТСЯ: `useUserId()`→workspaceMember→employee даёт «карточку себя» (свои записи, отдел, ФИО). База для «моих» данных. |
| **REQ-0008 / фильтр «мой»** | РАЗБЛОКИРУЕТСЯ: знаем свой employeeId → фильтр своих трудозатрат/проектов. |
| **CISO-005 server-actor** | ЧАСТИЧНО: аудит (approvedBy=userWorkspaceId) — server-truth уже сейчас; доверенная server-side роль — НЕТ (нужен мост userWorkspaceId→workspaceMember). |

---

## 5. Рекомендация + риски

**Рекомендация:** взять ДА-ветку. Порядок (минимальный, без gold-plating):
1. **Сначала данные:** seed/миграция `credosTimeEmployees.workspaceMemberRef` по email-мосту (1/43 сейчас — иначе всё впустую). Это отдельная задача-предусловие.
2. Добавить `resolveSelfWorkspaceMemberId(userId)` (REST `workspaceMembers?filter=userId[eq]`) + хук «свой employee/isManager».
3. Снять хардкоды: `weekly-grid.tsx:25`, `use-capacity.ts:88`.
4. Фронт approval-кнопок: прокидывать `workspaceMemberRef` в params → RBAC-guard оживает.
5. CISO-005 (отдельно, ниже приоритет): держать `userWorkspaceId` как аудит-truth; доверенную роль server-side отложить до появления моста userWorkspaceId→workspaceMember.

**Риски:**
- **R1 (высокий, блокер):** `workspaceMemberRef` пуст у 42/43. Без миграции фича не работает на проде. Email-мост требует совпадения `userEmail`==`employee.email` (проверить расхождения регистра/доменов).
- **R2 (security, средний):** роль приходит из клиентских params (`workspaceMemberRef`) → клиент может подставить чужой валидный workspaceMemberId и пройти isManager-guard. Server-truth для роли нет. Митигировать: после появления моста — резолвить роль на сервере из `userWorkspaceId`, params игнорировать для RBAC.
- **R3 (низкий):** `useUserId()` возвращает `string | null` — обрабатывать null (не залогинен/anon-контекст) → фолбэк без isManager.
- **R4 (версионность SDK):** `currentWorkspaceMember`-резолвер может появиться в новых версиях Twenty — тогда мост через REST упростится. Зафиксировать как технический долг.

**Вердикт:** ДА — current-user доступен во фронте через `useUserId()`; мост к роли = REST `workspaceMembers.userId[eq]` → `workspaceMemberRef` → `employee.isManager` (проверено live, 200). Блокер не в SDK, а в незаполненном `workspaceMemberRef` (1/43).
