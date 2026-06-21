# Ввод трудозатрат руководителем ЗА ДРУГИХ (отдел / команда проектов)

**Статус:** анализ · **Дата:** 2026-06-21 · **Аналитик AITEAM** · итер.128 follow-up
**Запрос заказчика:** «руководители должны вводить трудозатраты ЗА отдел или за команду проектов (довносить за других)».

**Флаг (итер.128):** серверный `resolveActor` (CISO-005 TOFU) есть ТОЛЬКО в `approval.logic`. В `time-entry-api.logic` (CRUD записей) и `plan-slots.logic` (plan-write) actor серверно НЕ резолвится → ввод-за-другого серверно НЕ защищён. **UX «за кого» строить НЕЛЬЗЯ до server-gate.**

---

## 1. Текущее состояние (факты из кода)

### 1.1 Server-gate gap по доменам

| Logic-function | Резолв actor | Authz по владельцу/роли | Ввод-за-другого защищён? |
|---|---|---|---|
| `approval.logic.ts` | **ЕСТЬ** `resolveActor(event, wmRef)` — server-truth по `event.userWorkspaceId → employee.userWorkspaceRef` + TOFU-привязка (L62–112). Деградация на client-ref при пустом uwId. | `isManager`-guard (approve/reject/revoke), ownership (recall), SoD «не своя» (casApply L300–305). | ✅ (для согласования) |
| `time-entry-api.logic.ts` | **НЕТ.** `resolveEmployeeId(wmRef)` (L124–151) берёт сотрудника из **client-supplied** `workspaceMemberRef`; не сопоставлен → **DEV-fallback на первого активного** (L137–150, IDOR-ядро CISO-005). | **Нет вообще.** `delete`/`upsert`/`list` не проверяют, что запись принадлежит актору и что актор вправе писать за этого employee. Любой клиент шлёт любой `employeeId`. | ❌ |
| `plan-slots.logic.ts` | **НЕТ.** Actor не резолвится в принципе. `upsert`/`read` по `projectId` без проверки, кто вызывает (L262–271). | **Нет.** Любой пишет слоты любого проекта × отдела × сотрудника. | ❌ |

Итог: «ввод за другого» **уже технически возможен** в `time-entry-api`/`plan-slots` — но как **уязвимость** (нет authz), а не как фича. Превратить в управляемую фичу = закрыть gap server-gate.

### 1.2 Кто «руководитель» в модели (носители scope уже есть)

| Источник «руководителя» | Где | Что даёт |
|---|---|---|
| `credosTimeEmployee.isManager` (BOOLEAN) | employee.object L101 | Флаг «может согласовывать». Используется в approval-guard и UX-гейте. Грубый (не привязан к scope). |
| `credosTimeDepartment.head` → Employee (MANY_TO_ONE) | department.object L163–179 | **Объективный руководитель отдела.** Обратная сторона `employee.headedDepartments` (employee.object L193–204). → scope «свой отдел». |
| `credosTimeDepartment.parentDepartment` / `childDepartments` (self-relation) | department.object L182–211 | Иерархия отделов → scope «свой + дочерние» (REQ-0018, заготовка). |
| `credosTimeEmployeeDepartment` (FTE join, employee×dept+%+даты) | employee-department.object | **Принадлежность сотрудника к отделу(ам)** в периоде. Мульти-отдел. Источник «кто в команде отдела». |
| `credosTimeProject.manager` / `owner` → стандартный **WorkspaceMember** (MANY_TO_ONE) | project.object L233–250 / L216–232 | **PM / владелец проекта.** Внимание: ссылка на WorkspaceMember, НЕ на credosTimeEmployee → для server-резолва нужен мост WM→employee. |
| Команда проекта (фактическая) | `project-team.logic` `computeProjectTeam` | Участники проекта = кто списывал часы (НЕ штатный список). Не пригоден как authz-scope (циркулярно: чтобы ввести за участника, он уже должен был списать). |

**Вывод по модели:** scope «руководитель отдела → его сотрудники» полностью выводится из `department.head` + `employeeDepartment`/`employee.department`. Scope «PM → команда проекта» — слабее (нет штатного project-team, `project.manager` указывает на WM, не employee).

### 1.3 Таймшит сейчас: чей и есть ли селектор «за кого»

- `my-time-dashboard.tsx` + `use-self-employee.ts`: фронт резолвит **СВОЕГО** сотрудника по цепочке `useUserId() → /rest/workspaceMembers[userId] → credosTimeEmployees[workspaceMemberRef] → {employeeId, isManager}`. Это **готовый клиентский мост userId→employee** (A1).
- Грид (`use-grid-model.ts`, `weekly-grid.tsx`): всегда свой таймшит. **Селектора «за кого» НЕТ.** `isManager` используется только для видимости кнопок approve (UX-гейт, не authz — прямо помечено TODO(ciso-005) в use-self-employee L15–17).
- На записи `credosTimeEntry` **НЕТ поля «кто внёс»** (createdBy/enteredByActor отсутствует — проверено grep). Аудит on-behalf писать некуда.

### 1.4 Роли (RBAC-долг, контекст CISO-005/012)

- `default-role.ts` (function-role, app-токен): `canRead/Update/SoftDeleteAll = true`, destroy только на entry. Широкая сервис-роль → **функции ОБЯЗАНЫ сами авторизовать вызывающего** (сейчас не делают в time-entry/plan-slots).
- `manager.role.ts`: повышенная user-роль (RW на объекты модуля). Назначается вручную. Не несёт scope — даёт RW на ВСЕ записи объекта (не «только свой отдел»). Через UI-платформы, не через logic.
- CISO-012/RBAC (SESSION_HANDOFF L21): server-identity + ownership-guard закроют raw-API остаток. On-behalf — частный случай той же волны.

---

## 2. Разведка конкурентов (как менеджер вводит за команду)

[[verify-ideas-vs-timetta-kimai]] — Timetta/Kimai легальные референсы.

| Вопрос | **Timetta** (реф.) | **Kimai** (реф.) | **Float** | **Harvest** | **Clockify** |
|---|---|---|---|---|---|
| **Можно? как зовётся** | Да: «Заполнение таймшита за пользователя» / режим замещения | Да: `create_other_timesheet` (admin/teamlead) | Да: «Log team» | Да: «edit another person's timesheet» | Да: «Add time for others» (платно) |
| **Кто вправе** | Руковод — **только свои подчинённые**; HR/бизнес-админ — за всех. PM-ввод не подтверждён | `ROLE_TEAMLEAD` (свои команды) + ADMIN; делегирование через Teams | Owner/Admin все; Manager — **только свои проекты × видимые люди** | Admin все; Manager — при opt-разрешении, в своём scope | Owner/Admin все; Team Manager — **только свои members**, если включено |
| **Серверная авторизация** | Роль «Управление командой» × гранулы Просмотр/Редактирование, scope = подчинённые/орг | Symfony voters по permission; **team-scope только с 2.56.0** (до — CVE: глоб.право в обход UI) | Роль × scope видимости (everyone/department/individual) | Роль + opt-permission × managed people/projects | Role + scope назначенных members |
| **Аудит «X за Y»** | Да: Журнал изменений (автор правки ≠ владелец) | Только плагин Audit Trail (не в ядре) | Слабо («logged by you»), журнала нет | Да: Activity log («кто менял» + «чей таймшит») | Нет общего audit-log |
| **Сотрудник правит после? approval** | Правит, пока «Черновик»; submit → lock; возврат — автор/руковод/админ | Правит как свою, если не lockdown; approval — платный bundle | Правит до lock-периода; approval отработки нет | До approve свободно; после — lock, разлок только Admin | До approve правится; после — жёсткий lock всем |

### Ключевые выводы (паттерны authz on-behalf)

1. **Авторизация = «роль × scope», не голая роль.** У всех: (право вводить за других) И (объект в области видимости: подчинённые/своя команда/managed). Глобально «за всех» — только Admin/Owner. У нас scope «свой отдел» уже выводим из `department.head` + `employeeDepartment`.
2. **Носителей on-behalf-права обычно ДВА:** линейный руководитель/teamlead (узкий scope, своя команда) + HR/админ (глобально). Чистый «PM проекта вводит за участника» как отдельный путь почти нигде не выделен (Timetta/Clockify — PM больше про approval). → **привязывать ввод-за-другого к руководителю отдела + админу, PM — под вопросом (W10).**
3. **Scope-проверка — типичная дыра** (CVE Kimai до 2.56.0: UI прятал чужие команды, сервер чтил право глобально → обход через API). **Мораль:** scope обязан проверяться на СЕРВЕРЕ (наш текущий gap ровно про это).
4. **Аудит «автор ≠ владелец» обязателен** (Timetta/Harvest разделяют; бюджетные — слабо). Дифференциатор: писать «внёс X за Y».
5. **Lifecycle защищает через статус, не через флаг «внесено руководителем».** Никто не лочит по признаку «ввёл менеджер» — лочат стадией (черновик→на согласовании→согласовано→lock), снимает высшая роль. У нас статус-машина approval уже есть (CISO-011 lock APPROVED).

---

## 3. РЕКОМЕНДАЦИЯ (MVP)

[[keep-it-simple]] · additive [[twenty-sdk-apply-gotchas]] · НЕТ биллируемости [[no-billable-concept]].

**Принцип: server-gate СНАЧАЛА, UX ПОТОМ.** До закрытия gap в time-entry/plan-slots любой UX «за кого» = публикация уязвимости (выводы 3 разведки — ровно CVE-Kimai).

### 3.1 Server-gate (этап 1, обязателен)

**A. Переиспользовать `resolveActor` из approval в time-entry-api + plan-slots.**
- Вынести `resolveActor` (+ TOFU userWorkspaceRef-мост) в общий модуль (напр. `logic-functions/resolve-actor.ts`), импортировать в три функции. Один источник server-identity.
- `time-entry-api`: заменить `resolveEmployeeId(client wmRef)` на `resolveActor(event)`. **Убрать DEV-fallback «первый активный»** (CISO-005 DoD#4) — actor=null → ошибка «не сопоставлен» (в prod), мягкая деградация только при пустом `userWorkspaceId` (dev), как в approval.

**B. Правило авторизации «actor может писать за employee E»:**
```
canWriteFor(actor, E) =
   actor.employeeId == E                              // свой таймшит (обычный путь)
|| actor — head отдела, к которому принадлежит E       // department.head + employeeDepartment/employee.department
|| actor — head вышестоящего отдела E (иерархия)        // parentDepartment (REQ-0018, если включаем)
|| actor — админ (глобально)                            // отдельный флаг/роль — см. W10
|| (опц.) actor — PM проекта записи                     // project.manager→WM→employee, СЛАБО (W10)
```
- Для `time-entry-api` upsert/delete: целевой `employeeId` берём из params, но **разрешаем только если `canWriteFor(actor, employeeId)`**; иначе `forbidden`. Свой ввод (E==actor) — всегда ок.
- Для `plan-slots` upsert: слот несёт `departmentId`/`employeeId` → проверять `canWriteFor` по этим полям (actor — head этого отдела / админ).
- `list`/`read`: actor видит свои + (если head) свой отдел (CISO-005 DoD#3).

**C. Аудит on-behalf (additive поле, [[twenty-sdk-apply-gotchas]]):**
- Добавить на `credosTimeEntry` поле `enteredByActor` (TEXT, nullable) = `event.userWorkspaceId` актора, который внёс/изменил запись. Когда `enteredByActor`-employee ≠ `employeeId` → «введено руководителем X за Y». (Зеркалит approval `approvedBy`.) Добавлять ОТДЕЛЬНЫМ sync (не в один apply с другими дропами — грабли apply).
- Аналог для plan-slot опционально (W10).

**Стоимость этапа 1:** вынос `resolveActor` (рефактор, риск низкий — код существует и протестирован в approval), `canWriteFor` (новая чистая функция, тестируема), +1 поле на entry. Без новых объектов.

### 3.2 UX (этап 2, ТОЛЬКО после 3.1)

- **Селектор «за кого»** в таймшите — показывать ТОЛЬКО руководителю (`isManager`/head). Список = его команда/отдел (выводим из `department.head`+`employeeDepartment`). По умолчанию — свой таймшит. Переиспользовать готовый мост `use-self-employee`.
- При вводе за другого передавать выбранный `employeeId` в `/s/time-entry` (сервер всё равно перепроверит `canWriteFor` — UI не доверенный, вывод 3).
- **Пометка «введено руководителем»** на ячейке/строке, где `enteredByActor ≠ owner` (как Timetta «автор правки»). Цвет/иконка, tooltip «внёс {ФИО руковод.} {дата}».
- Без отдельного «флага блокировки чужого ввода» — защита через статус-машину approval (вывод 5).

### 3.3 Этапность

1. **Этап 1 — server-gate** (resolveActor в 3 функции + `canWriteFor` + `enteredByActor`). Без него этап 2 небезопасен. Блокирует UX.
2. **Этап 2 — UX** (селектор «за кого» + пометка). Только поверх готового этапа 1.
3. Решения волны W10 (ниже) определяют детали scope (PM да/нет, иерархия, SoD) — собрать ДО этапа 1, т.к. влияют на `canWriteFor`.

---

## 4. ВОЛНА ВОПРОСОВ W10 заказчику (16)

Формат: вопрос + гипотезы + референс.

**Scope «кто за кого»**

**W10.1.** Кто должен иметь право вводить за другого?
- (а) только руководитель отдела (`department.head`) за сотрудников своего отдела;
- (б) + админ/HR глобально;
- (в) + руководитель проекта (PM) за участников своего проекта.
- Реф: Timetta (руковод = подчинённые + HR глоб.); Kimai (teamlead + admin). PM-ввод почти нигде не выделен.

**W10.2.** «За отдел» — это какой отдел сотрудника, если он в нескольких (мульти-отдел FTE)?
- (а) любой из его текущих отделов; (б) только основной (max FTE); (в) только активное на дату записи назначение.
- Реф: `credosTimeEmployeeDepartment` (даты+%). Float — scope по department.

**W10.3.** Распространять ли scope руководителя на ДОЧЕРНИЕ отделы (иерархия)?
- (а) только свой отдел; (б) свой + все дочерние (`parentDepartment`); (в) свой + 1 уровень.
- Реф: REQ-0018 (иерархия отделов заготовлена); Timetta «подчинённые».

**W10.4.** «За команду проектов» — нужен ли отдельный путь PM, если scope-отдела покрывает большинство?
- (а) не нужен (только отдел+админ, проще, безопаснее); (б) нужен, PM вводит за участников проекта; (в) нужен только для кросс-отдельных проектов.
- Реф: `project.manager`→WorkspaceMember (мост к employee неочевиден); вывод 2 разведки (PM-ввод редок).

**W10.5.** Кто «админ» в нашей модели (глобальный ввод за всех)?
- (а) `manager.role` пользователь; (б) отдельный новый флаг `isAdmin`/роль; (в) член отдела «администрация».
- Реф: Timetta бизнес-админ; Clockify Owner/Admin.

**Согласование и SoD**

**W10.6.** Может ли руководитель согласовать запись, которую сам же ввёл за сотрудника? (SoD)
- (а) нет, нарушение разделения обязанностей (как сейчас SoD в approval: нельзя согласовывать своё); (б) да (он и так руковод); (в) да, но с пометкой/вторым согласующим.
- Реф: CISO-002 SoD (casApply `sameEmployeeForbidden`); Timetta — submit отдельно от approve.

**W10.7.** В каком статусе создаётся запись, введённая руководителем за сотрудника?
- (а) DRAFT (сотрудник потом проверяет/отправляет); (б) сразу SUBMITTED; (в) сразу APPROVED (руковод ручается).
- Реф: Timetta — за пользователя в «Черновик»; lifecycle-защита (вывод 5).

**Право сотрудника на правку**

**W10.8.** Может ли сотрудник править/удалять то, что за него ввёл руководитель?
- (а) да, пока DRAFT (как свою); (б) нет, чужой ввод заблокирован для него; (в) да, но это снимает пометку «введено руководителем».
- Реф: Timetta/Harvest — правка до submit/approve; Clockify lock после approve.

**W10.9.** Уведомлять ли сотрудника, что за него внесли часы?
- (а) да, обязательно (прозрачность ПДн/трудозатрат); (б) нет; (в) только при вводе сразу в SUBMITTED/APPROVED.
- Реф: `reminders.logic` (механизм уведомлений есть); Timetta — видимость в своём таймшите.

**Аудит и видимость**

**W10.10.** Насколько детальный аудит «введено X за Y» нужен?
- (а) только «кто последний изменил» (1 поле `enteredByActor`); (б) полный журнал правок (кто/когда/что); (в) видно только администратору.
- Реф: Timetta Журнал изменений; Harvest Activity log; вывод 4.

**W10.11.** Кому показывать пометку «введено руководителем» на ячейке?
- (а) всем, кто видит таймшит; (б) только сотруднику-владельцу и руководителю; (в) только в отчётах/аудите.
- Реф: Timetta — автор правки в журнале (роль-ограничен).

**W10.12.** Нужен ли ввод-за-другого также для ПЛАНА (plan-slots), или только для факта (time-entry)?
- (а) оба (slots тоже под gate); (б) только факт; (в) план и так делает руковод (планирование — его задача), отдельный селектор не нужен.
- Реф: `plan-slots.logic` (план проекта×отдел×сотрудник); REQ-0011/0012.

**Реализация / приоритет**

**W10.13.** TOFU-маппинг `userWorkspaceRef` (CISO-005) сейчас заполняется при первом действии в approval. ОК ли расширить TOFU-привязку и на time-entry (первый ввод тоже привязывает)?
- (а) да, единый механизм; (б) нет, привязку только через approval/админ-сверку; (в) завести явный install/admin-маппинг до релиза.
- Реф: CISO-005 разведка (нет install-time источника); `userMapPending`-сверка.

**W10.14.** Что делать в prod, если actor НЕ сопоставлен (нет userWorkspaceRef и uwId)?
- (а) отклонять операцию (fail-closed, безопасно); (б) разрешать только свой ввод по client-ref (текущая деградация); (в) блокировать вход до сверки админом.
- Реф: CISO-005 DoD#4 (убрать fallback «первый активный»).

**W10.15.** Нужен ли лимит «задним числом» при вводе руководителем за сотрудника (lock-период)?
- (а) нет, как обычный ввод; (б) да, отдельный horizon для on-behalf; (в) общий lock-период для всех (Float/Kimai lockdown).
- Реф: Float/Kimai lock-период; наш `credosTimeSettings`.

**W10.16.** Приоритет фичи относительно текущей RBAC-волны (CISO-012)?
- (а) делать в рамках одной RBAC-волны (server-gate общий); (б) отдельной фичей после RBAC; (в) сначала только аудит-поле, authz позже.
- Реф: SESSION_HANDOFF L21 (RBAC закроет raw-API остаток).

---

## Связанные

- `docs/security/findings/CISO-005-time-entry-idor.md` — server-identity gap (ядро).
- `apps/time/src/logic-functions/approval.logic.ts` — эталон `resolveActor`+TOFU для переиспользования.
- `apps/time/src/logic-functions/{time-entry-api,plan-slots}.logic.ts` — где закрыть gap.
- `apps/time/src/objects/{credos-time-department,credos-time-employee,credos-time-employee-department,credos-time-project}.object.ts` — носители scope (head/parent/FTE/PM).
- `apps/time/src/front-components/shared/use-self-employee.ts` — готовый мост userId→employee для UX-селектора.
