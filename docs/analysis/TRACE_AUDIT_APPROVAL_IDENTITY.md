# TRACE: ДОМЕН СОГЛАСОВАНИЕ + IDENTITY — реализовано? в мануале?

**Дата:** 2026-06-22 · **Автор:** аудитор-трассировщик AITEAM · READ-ONLY
**Цель:** для каждого решения заказчика/арха по согласованию и identity (lockdown/on-behalf/audit-log/CISO-005) проверить: РЕАЛИЗОВАНО в коде? ОТРАЖЕНО в мануалах?
**Источники решений:** UI_ANSWERS.md (A4), UI_ANSWERS_W5_A.md (lifecycle W5A.1-30), MANAGER_ENTRY_ON_BEHALF.md (W10), AUDIT_LOG_PERIOD_LOCKDOWN.md (W9), SIGNALS [arch РЕШЕНИЯ/ОТМЕНА], memory planning-identity-decisions.
**Код:** `logic-functions/{approval,time-entry-api,plan-slots}.logic.ts` + `shared/{resolve-actor,can-write-for,lockdown,write-entry-log}.ts` + `objects/{credos-time-entry,credos-time-entry-log,credos-time-settings,credos-time-employee}.object.ts` + `front-components/grid/*`.
**Мануалы:** `docs/user/03-approval.md`, `docs/developer/04-security.md` (+02-data-model, 05-planning).
**Легенда:** ✅ полностью · 🟡 частично/с оговоркой · ❌ нет.

---

## A. Согласование (submit/approve/reject/recall/revoke, SoD, pre-submit)

| # | Решение | Реализовано? | В мануале? | Gap |
|---|---------|--------------|------------|-----|
| A4.1 | submit период целиком (неделя Пн-Вс, W5A.22) | ✅ `runSubmit` фильтрует записи периода `from..to` | ✅ user/03 «таймшиты согласуются понедельно» | — |
| A4.2 | флаг `approvalRequired` на проекте/отделе | ✅ `buildApprovalMap` + `isApprovalRequired(project, dept)` | 🟡 user/03 не объясняет «проекты без согласования» | minor: терминальный визуал «не требует согласования» (W5A.21) в user-доке не описан |
| A4.3/A4.4 | recall: SUBMITTED→DRAFT, владелец, пока не решено | ✅ `runRecall` + `foreignEmployeeForbidden` (только своя) | ✅ user/03 «Отозвать отправку» | — |
| A4.25/A4.26 | revoke: APPROVED→SUBMITTED, только руководитель (Reopen) | ✅ `runRevoke` isManager + SoD | ✅ user/03 «Отозвать согласование» | — |
| A4.13 | нет частичного reject — весь submit одного сотрудника | ✅ `findIncompleteRejectEmployees` (WI-57 reject-defense) | 🟡 user/03 не упоминает запрет частичного reject | minor |
| A4.18/A4.19 | строгий SoD в проде; isManager — UX-гейт, нужен серверный | 🟡 SoD по owner в `casApply`; RBAC-серверный — деградация на isManager | ✅ user/03 «нельзя согласовать свой»; dev/04 «деградирует на isManager» | см. сводку: deg отмечена в dev, но admin=isManager-широта |
| A4.20/W5A.24 | 4 статуса, REVOKED не вводить (revokedBy+approvedAt=null) | ✅ `setStatus` revoke/recall: approvedAt=null, revokedBy=actor | ✅ user/03 (косвенно) | — |
| W5A.6/W5A.30 | submit переотправляет REJECTED (`status[in]:DRAFT,REJECTED`) | ✅ `SUBMITTABLE = {DRAFT, REJECTED}` | ✅ user/03 mermaid «Reject→Черновик→Submit» | — |
| W5A.7/W5A.29 | CAS optimistic-lock + collect-errors (не падать на середине) | ✅ `casApply` CAS-skip + `failed[]` | ❌ внутренняя механика, мануалу не нужна | n/a |
| W5A.11/W5A.12 | revokedBy/revokedAt + resolvedBy/resolvedAt (аудит отзыва/решения) | ✅ поля на `credos-time-entry`, пишутся в `setStatus` | ✅ user/03 «Отозвал: ФИО»; dev/04 аудит-поля | — |
| W5A.5 | reject-defense: backend валидирует полноту submit | ✅ `findIncompleteRejectEmployees` | ❌ внутренняя защита | n/a |
| pre-submit | предупреждение о недоборе/переработке при submit (A4.9) | ✅ `approval-bar.tsx` inline-поповер при факт<норма | 🟡 user/03 не описывает pre-submit-предупреждение | minor |
| batch-approve | согласование всей команды разом (A4.10) | ✅ `runResolve` батч по ids | ✅ user/03 «Batch-согласование» | — |
| история | лог действий согласования (кто/когда) | ✅ STATUS-строки в `credos-time-entry-log` (`casApply`→`writeEntryLog`) | ✅ user/03 «Просмотр истории согласования» | см. сводку: user-док показывает лог, но не говорит ГДЕ его смотреть (view не описан) |

---

## B. SoD (по owner) — ключевое решение с ОТМЕНОЙ

| # | Решение (финал) | Реализовано? | В мануале? | Gap |
|---|-----------------|--------------|------------|-----|
| SoD-1 | **SoD считается по OWNER** (`approver != entry.employeeId`), НЕ по enteredByActor | ✅ `casApply` `sameEmployeeForbidden: entry.employeeId === actor.employeeId` → skippedOwn | ✅ user/03 §on-behalf: «SoD по сотруднику-владельцу»; dev/04 «SoD по owner» | — |
| SoD-2 | **ОТМЕНА строгого SoD-by-enteredBy** (итер.146 `SOD_ENTERED_CANNOT_APPROVE` УБРАН, итер.149) | ✅ в `approval.logic` НЕТ блока по enteredByActor — подтверждено grep (нет `SOD_ENTERED`) | ✅ user/03 «руководитель, заполнивший за отсутствующего, может и согласовать» | — |
| SoD-3 | enteredByActor = аудит/UI-чип, НЕ гейт согласования | ✅ поле стампится в `time-entry-api`, читается фронтом (`OnBehalfBadge`), в SoD не участвует | ✅ dev/04 «SoD по owner, не по enteredByActor»; data-model «НЕ участвует в SoD» | — |

> История: enteredBy-SoD был ВНЕДРЁН (SIGNALS итер.146, `SOD_ENTERED_CANNOT_APPROVE`), затем заказчик/арх ОТМЕНИЛ (итер.149) → вернулись к SoD-by-owner. Код и оба мануала отражают **финальное** состояние (по owner). Рассинхрона нет.

---

## C. On-behalf (canWriteFor рук+PM+админ, enteredByActor, submit-on-behalf)

| # | Решение | Реализовано? | В мануале? | Gap |
|---|---------|--------------|------------|-----|
| OB-1 | canWriteFor: свой / руковод отдела / PM проекта / админ | ✅ `shared/can-write-for.ts` 4 ветки | ✅ user/03 «свой/руковод отдела/РП проекта/админ»; dev/04 перечень веток | — |
| OB-2 | **admin деградирует на isManager** (нет admin-роли) | 🟡 ветка 4: `isManager===true → return true` (любой руковод пишет за любого) | ✅ dev/04 явно: «admin — **деградирует на isManager**, сужение → RBAC-волна» | — (деградация ЧЕСТНО отмечена в dev-доке) |
| OB-3 | enforcement в time-entry (upsert/delete) | ✅ `time-entry-api` upsert+delete → `canWriteFor` → FORBIDDEN_ON_BEHALF | ✅ dev/04 «enforcement: time-entry-api» | — |
| OB-4 | enforcement в plan-slots (план тоже под gate) | ✅ `plan-slots` runUpsert: персональный слот→canWriteFor, отдел/проект→isManager/isProjectManager | 🟡 dev/04 упоминает plan-slots; user/05-planning НЕ описывает on-behalf-план | minor: план-on-behalf в user-доке не раскрыт |
| OB-5 | enteredByActor стампится только при on-behalf | ✅ `isOnBehalf` → `enteredByActor = actor.employeeId`, иначе null | ✅ data-model «при вводе за другого, иначе null» | — |
| OB-6 | **submit-on-behalf РАЗРЕШЁН** (руковод/PM/админ отправляет за сотрудника) | ✅ `runSubmit` actor.trusted + employeeId≠actor → `canWriteFor` (commit 77f6165) | ✅ user/03 (косвенно, on-behalf); 🟡 явного «руководитель может ОТПРАВИТЬ за сотрудника» нет | minor: submit-on-behalf не выделен явно в user-доке |
| OB-7 | UI-селектор «Таймшит сотрудника» только руководителю | ✅ `employee-selector.tsx` (виден при непустом списке подчинённых) | ✅ user/03 «селектор виден только руководителю» | — |
| OB-8 | UI-чип «введено руководителем» (рук.) | ✅ `grid-row.tsx` `OnBehalfBadge` («рук.») по `onBehalfByDay` | ✅ user/03 «чип 🧑 рук.» | minor: в коде чип-текст «рук.» без эмодзи 🧑; user-док пишет «🧑 рук.» — косметика |
| OB-9 | «чей таймшит» индикатор (whose-timesheet/owner-badge) | ✅ `whose-timesheet.ts` (ФИО+отдел, reveal-gated), `owner-badge.tsx` | ✅ user/03 «Таймшит: ФИО · Отдел» | — |
| OB-10 | сотрудник может править введённое за него (до согласования) | ✅ статус DRAFT, lock только APPROVED (CISO-011); владелец правит свою DRAFT | 🟡 user/03 не акцентирует «вы можете править введённое за вас» | minor |

---

## D. Lockdown (дата + грейс + reopen-админ)

| # | Решение | Реализовано? | В мануале? | Gap |
|---|---------|--------------|------------|-----|
| LD-1 | закрытие по дате `lockdownDate` | ✅ `shared/lockdown.ts` `isPeriodLocked`; поле на `credos-time-settings` | ✅ user/03 «Закрытие периодов»; dev/04 lockdown | — |
| LD-2 | грейс-окно `lockdownGraceDays` | ✅ эффективная граница = lockdownDate − graceDays | ✅ user/03 «грейс-окно»; data-model | — |
| LD-3 | guard в time-entry (upsert/delete) | ✅ `canMutateInPeriod` → LOCKED_PERIOD | ✅ dev/04 | — |
| LD-4 | guard в plan-slots (план по месяцу) | ✅ `canMutatePlanMonth` / `isPlanMonthLocked` | 🟡 dev/04 упоминает; user/05 нет | minor |
| LD-5 | закрывает ВСЁ за период (DRAFT/REJECTED/новые задним числом), не только APPROVED | ✅ guard по дате независимо от статуса | ✅ user/03 «закрывается ВСЁ за период, а не только согласованное» | — |
| LD-6 | **reopen/override — только руководитель** (admin деградация) | 🟡 `canMutateInPeriod` override = `actor.isManager` (не выделенный admin) | ✅ user/03 «сейчас — руководитель; в дальнейшем — отдельное право администратора»; dev/04 «деградирует на isManager → RBAC-волна» | — (деградация отмечена в обоих доках) |
| LD-7 | override-действие логируется (override=true) | ✅ `writeEntryLog({override: gate.isOverride})` в time-entry CRUD | ✅ user/03 «правка в закрытом периоде логируется как override»; dev/04 | — |
| LD-8 | автозакрытие после согласования | 🟡 ЧАСТИЧНО: построчный APPROVED-lock (CISO-011) даёт авто-read-only; авто-сдвиг lockdownDate по согласованным месяцам — НЕ реализован (явный follow-up в `lockdown.ts`) | 🟡 dev/04 — нет явного «автозакрытие отложено»; user/03 — нет | см. сводку: решение заказчика #2 «АВТОЗАКРЫТИЕ после согласования» закрыто лишь частично (через APPROVED-lock), полный авто-сдвиг даты не сделан и нигде не помечен как отложенный |
| LD-9 | reopen = только админ; lockdown не действует на админов | 🟡 реализовано как «не действует на руководителя» (admin=isManager) | ✅ см. LD-6 | — |
| LD-10 | защита от каскадной потери (Entry.project/employee RESTRICT, было CASCADE) | ✅ `OnDeleteAction.RESTRICT` на обеих relation | ✅ dev/04 «CASCADE→RESTRICT»; data-model | — |

---

## E. Audit-log (кто/что/когда + STATUS)

| # | Решение | Реализовано? | В мануале? | Gap |
|---|---------|--------------|------------|-----|
| AL-1 | объект журнала `credosTimeEntryLog` (action/actor/oldHours/newHours/loggedAt) | ✅ `credos-time-entry-log.object.ts` (все поля + override + entryDate + old/newStatus) | ✅ data-model `credos-time-entry-log` | — |
| AL-2 | лог CRUD часов (CREATE/UPDATE/DELETE, diff old→new) | ✅ `time-entry-api` `writeEntryLog` на upsert/delete (UPDATE только при изменении часов) | 🟡 data-model описывает объект; user-док НЕ показывает CRUD-журнал | см. сводку: **audit-log правок часов в user-доках НЕ описан** (user/03 показывает только approval-историю) |
| AL-3 | лог смены статуса (STATUS, old→new) подключён из approval | ✅ `casApply` → `writeEntryLog({action:'STATUS'})` на approve/reject/recall/revoke; submit логируется в своём домене | 🟡 user/03 «история согласования» отражает суть, но не указывает источник (entry-log view) | minor |
| AL-4 | лог НИКОГДА не роняет операцию (try/catch внутри) | ✅ `write-entry-log.ts` глотает ошибки, возвращает boolean | ❌ внутренняя гарантия | n/a |
| AL-5 | actor = server-truth (CISO-005), не клиент | ✅ `writeEntryLog(actor, ...)` берёт `actor.employeeId` из resolveActor | ✅ dev/04 «источник кто = серверный actor.employeeId» | — |
| AL-6 | override-пометка в логе (reopen в закрытом периоде) | ✅ `override` BOOLEAN на entry-log, пишется из CRUD | ✅ data-model/dev (косвенно) | — |

---

## F. CISO-005 server-actor (identity-фундамент)

| # | Решение | Реализовано? | В мануале? | Gap |
|---|---------|--------------|------------|-----|
| ID-1 | resolveActor: event.userWorkspaceId → employee (server-truth), вынесен в shared SSOT | ✅ `shared/resolve-actor.ts`, импорт в approval/time-entry/plan-slots | ✅ dev/04 «Identity-домен: resolveActor» | — |
| ID-2 | TOFU-привязка userWorkspaceRef при 1-м действии + userMapPending | ✅ ветка 2 resolveActor (PATCH userWorkspaceRef + userMapPending=true); поля на employee | ✅ dev/04 «TOFU»; data-model employee | — |
| ID-3 | коллизия userWorkspaceRef (занят другим) → reject (actor=null) | ✅ `if (e.userWorkspaceRef && e.userWorkspaceRef !== uwId) return null` | 🟡 dev/04 «коллизия = reject» (кратко) | — |
| ID-4 | NULL-деградация (dev/legacy без uwId) → trusted=false, не hard-fail | ✅ ветка 3 resolveActor | ✅ dev/04 «userWorkspaceId NULL → деградация» | — |
| ID-5 | enforcement применяется ТОЛЬКО к trusted-актору (untrusted не доходит до gate) | ✅ time-entry/plan-slots/approval гейтят `actor?.trusted` | ✅ dev/04 (косвенно) | — |
| ID-6 | **CISO-005 DoD#4: убрать DEV-fallback «первый активный»** | ❌ `resolveEmployeeId` (`time-entry-api` L157-184) ВСЁ ЕЩЁ возвращает первого активного в untrusted-ветке | ❌ нигде не помечено что fallback остался | см. сводку: **главный технический gap** — IDOR-fallback жив в untrusted-пути (prod-маскировка несопоставленного юзера) |
| ID-7 | CISO-005 статус в реестре = OPEN | 🟡 фундамент закрыт (resolveActor), но реестр dev/04 всё ещё «CISO-005 \| OPEN» | 🟡 dev/04 таблица: CISO-005 OPEN, хотя identity-домен ниже описан как реализованный | см. сводку: реестр находок не обновлён под фактическое состояние (рассинхрон статуса) |

---

## СВОДКА: топ-gaps

**Реализовано в коде:** ~95% решений по согласованию+identity. submit/approve/reject/recall/revoke, SoD-by-owner, on-behalf (canWriteFor 4 ветки), enteredByActor, submit-on-behalf, lockdown (дата+грейс+override+log), audit-log (CRUD+STATUS), resolveActor/TOFU — ВСЁ на месте и протестировано (тесты в `shared/*.test.ts`, `approval.logic.test.ts`, `audit-log.test.ts`, `entry-crud-matrix.test.ts`).

**В мануалах:** user/03-approval и developer/04-security покрывают тему хорошо и отражают ФИНАЛЬНЫЕ решения (включая отмену SoD-by-enteredBy).

### Главные gaps (по приоритету)

1. **[ТЕХ, P1] CISO-005 DoD#4 НЕ выполнен — DEV-fallback «первый активный» жив.** `time-entry-api.resolveEmployeeId` (L170-184) в untrusted-ветке (event.userWorkspaceId пуст) возвращает первого активного сотрудника. Это исходный IDOR-вектор CISO-005. В trusted-пути закрыто, но untrusted = prod-щель при незаполненных userWorkspaceRef. TODO-коммент на месте, fix не сделан. **Не отражено как остаточный риск ни в одном доке.**

2. **[ДОК, P2] Audit-log правок часов в USER-доках отсутствует.** Объект `credosTimeEntryLog` (CRUD+STATUS diff old→new) реализован и описан в developer/02-data-model, но **в user/03-approval показана только approval-история** («кто отправил/отклонил/согласовал»), а журнал правок ЧАСОВ (кто/когда менял 8ч→6ч, кто удалил) пользователю нигде не объяснён. Решение W9 заказчика по audit-log в user-документации не раскрыто. Плюс: ни user, ни dev не указывают, ГДЕ смотреть журнал (есть `credos-time-entry-log.view.ts`, но мануал на него не ссылается).

3. **[ДОК+КОД, P2] «АВТОЗАКРЫТИЕ после согласования» (решение заказчика #2) закрыто лишь частично.** Реализован построчный APPROVED-lock (CISO-011) — даёт авто-read-only согласованных записей. Но полного авто-сдвига `lockdownDate` по согласованным месяцам НЕТ (явный follow-up в `lockdown.ts`). Это расхождение с дословной формулировкой решения «закрывать + АВТОЗАКРЫТИЕ после согласования» нигде не помечено как «отложено».

4. **[ДОК, P3] admin = isManager-деградация ОТМЕЧЕНА корректно.** Проверено особо: и `can-write-for.ts`, и `lockdown.ts`, и developer/04-security ЧЕСТНО фиксируют «admin/override деградирует на isManager (нет admin-роли) → сужение на RBAC-волне». user/03 формулирует мягче («сейчас — руководитель; в дальнейшем — отдельное право администратора»). Деградация задокументирована — это НЕ скрытый gap, но широта «любой руковод пишет/reopen за любого» в проде существует.

5. **[ДОК, P3] SoD-by-owner описан ВЕРНО.** Проверено особо: финальное решение (SoD по owner, enteredBy НЕ гейтит) корректно отражено в обоих мануалах и в коде. Отменённый строгий вариант (SOD_ENTERED_CANNOT_APPROVE) в коде отсутствует. Рассинхрона нет.

6. **[ДОК, P3] Реестр находок dev/04 не синхронизирован.** Таблица показывает CISO-005 как `OPEN`, хотя identity-домен ниже в том же файле описан как реализованный (resolveActor/TOFU). CISO-011/012 — `MITIGATING`. Статусы в реестре отстали от фактического состояния кода.

7. **[ДОК, minor] Мелочи user-доки:** submit-on-behalf не выделен явно («руководитель может ОТПРАВИТЬ за сотрудника»); on-behalf/lockdown для ПЛАНА (plan-slots) не раскрыты в user/05-planning; «вы можете править введённое за вас» не акцентировано; чип в коде «рук.» без эмодзи, в доке «🧑 рук.».
