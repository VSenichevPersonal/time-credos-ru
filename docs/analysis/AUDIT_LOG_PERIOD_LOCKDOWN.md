# AUDIT-LOG + PERIOD-LOCKDOWN — разведка и рекомендация

**Дата:** 2026-06-21 · **Автор:** аналитик AITEAM · **Приоритет:** ВЫСОКИЙ (заказчик)
**Связь:** TIMETTA_KIMAI_DEEP_VALUE.md #2 (lockdown+exported, P0), CISO-011 (lock APPROVED), CISO-005 (server-truth actor), ADR-0007.
**Два домена:**
- **А. AUDIT-LOG** — полная история правок трудозатрат (кто/когда/что менял часы: create/edit/delete/смена статуса).
- **Б. PERIOD-LOCKDOWN** — защита прошлых/закрытых периодов от правки (по дате / после approve / после выгрузки в 1С).

---

## 1. ТЕКУЩЕЕ СОСТОЯНИЕ (факты из кода)

### А. Audit-log: что ЕСТЬ
- **Точечный approval-аудит на самой записи** `credos-time-entry.object.ts`:
  `approvedBy/approvedAt` (кто согласовал), `resolvedBy/resolvedAt` (кто вынес решение approve|reject — WI-56), `revokedBy/revokedAt` (кто отозвал согласование/отправку), `rejectComment`. Заполняет `/s/approval` (`approval.logic.ts`), actor резолвится server-truth (см. CISO-005 ниже).
- **Нативные поля Twenty-ядра** `createdBy` / `createdAt` (и `updatedAt`) — есть из коробки на каждом объекте. Уже используются во view броней (`credos-time-booking.view.ts`): `nativeFieldId('createdBy')`, адресуются через `generateDefaultFieldUniversalIdentifier` БЕЗ объявления в objects/ (additive). То есть «кто создал запись» доступно уже сейчас.
- **Twenty-ядро Timeline/Activity** — у объектов ядра есть встроенный таймлайн активности и `updatedAt`. НО: он фиксирует факт «обновлено», а не diff значений (old→new часов) и не кастомную семантику действий.

### А. Audit-log: чего НЕТ (gap)
- **НЕТ полной истории правок часов.** Если сотрудник правит запись 8ч → 6ч → 9ч до согласования — сохраняется только финальное значение + `updatedAt`. Diff (oldHours→newHours), кто и когда каждой правки — НЕ хранится.
- **НЕТ лога удалений** (после delete запись исчезает; кто удалил — неизвестно, кроме нативного факта в core, который тоже не diff).
- `createdBy`-аудит покрывает только **создание**, не последующие правки/удаления.

### Б. Period-lockdown: что ЕСТЬ
- **Построчный lock APPROVED (CISO-011)** — единственный механизм блокировки:
  - Серверный гард `time-entry-api.logic.ts`: op=`upsert` и op=`delete` читают `status` ДО операции, при `APPROVED` → `{ ok:false, error:'cannot_modify_approved' }`.
  - БД-уровень: relations employee/project `onDelete: RESTRICT` — нельзя снести запись каскадом (целостность табеля/1С).
  - UI-индикация: `lockedByDay: boolean[]` в гриде (`use-grid-model.ts` ставит true при `status==='APPROVED'`); ячейки read-only (`use-timesheet-actions.ts`, `grid-row.tsx`, `day-view.tsx`).
- **Settings-singleton** `credos-time-settings.object.ts` — есть место для новых параметров (`maxHoursPerDay`, `approvalPeriod` и т.д. читаются через Core REST `credosTimeSettings`).

### Б. Period-lockdown: чего НЕТ (gap)
- **НЕТ блокировки по ДАТЕ/закрытию периода.** Прошлый месяц можно править, если записи не в статусе APPROVED. Закрыть «весь период разом» (даже DRAFT/REJECTED) нельзя.
- **НЕТ грейс-периода** (тип «прошлый месяц закрывается 5-го числа следующего»).
- **НЕТ exported-флага** (выгруженное в 1С не становится read-only). DEEP_VALUE #2 предлагал, но не внедрён.
- **НЕТ reopen-механики уровня периода** (revoke есть только построчно для APPROVED).

### Server-truth actor (CISO-005) — фундамент для обоих доменов
`approval.logic.ts` уже резолвит достоверного актора: приоритет `event.userWorkspaceId` → employee по `userWorkspaceRef[eq]` (trusted); TOFU-привязка по `workspaceMemberRef` при первом использовании; деградация trusted=false для dev/legacy. **Это готовый источник «кто менял достоверно» для audit-log.** ВАЖНО: `time-entry-api.logic.ts` (CRUD часов) сейчас НЕ использует этот резолвер — там `resolveEmployeeId` без trusted-семантики. Для audit-log правок CRUD нужно переиспользовать паттерн resolveActor.

---

## 2. РАЗВЕДКА КОНКУРЕНТОВ

### Audit-log (история правок)

| Система | Полнота истории правок | Детали |
|---|---|---|
| **Timetta** | Полная, встроенная | «Журнал изменений» (Settings, гранула Change Log, только админ): изменения строк (TimeSheetLine) и ячеек (TimeAllocation) по ID |
| **Kimai** | Полная, но **платный плагин** Audit Trail | begin/end/duration/rate/exported/billable; виден только SUPER_ADMIN; без плагина истории нет |
| **Harvest** | Полная, модуль Activity log | кто/чей таймшит/что (project/task/date/hours); хранит ~6 мес даже при выкл. логе |
| **Clockify** | Только approval-аудит | след при withdraw approval (кто/когда/почему); полного old→new по правкам нет |
| **Toggl Track** | Частичный (Premium, Admin) | Audit Log пишет ТОЛЬКО правки НЕ владельцем (админ поправил чужое), old→new; с сент.2024, хранение 1 год |
| **Float / Forecast** | Практически нет | в публичных доках audit-trail по часам не найден |

### Period-lockdown

| Система | Триггер лока | Грейс | Кто reopen |
|---|---|---|---|
| **Timetta** | **approve** (статус «Согласовано» → документ заблокирован + проводки); серверные флаги `editAllowed`/`deleteAllowed` (OData) | не документирован | админ / возврат согласования (не раскрыто) |
| **Kimai** | **дата** (`lockdown_period_start/_end`) + **exported-флаг** (read-only после выгрузки) | **да** (`lockdown_grace_period` + permission `lockdown_grace_timesheet`); обход — `lockdown_override_timesheet`, `edit_exported_timesheet` | роль с override-permission |
| **Harvest** | **invoice / approve / archive / запланированный lock** | нет (момент дискретный) | **только Administrator** (withdraw/unlock); manager правит notes/hours без разлока, но не project/task |
| **Clockify** | **дата** («older than N days/weeks/months», обновление в полночь TZ) + опц. approve | окно «older than N» = де-факто грейс | **только Admin** (лок не действует на админов) |
| **Toggl** | **дата** («lock up to date») | нет (жёсткая дата) | **только Admin** |
| **Float / Forecast** | **дата** по периоду (week/month/year) + «N дней после конца периода» | **Float: да** («N дней после периода»); Forecast: exempt-сотрудники правят после даты | Account Owner + Admin; PM свои проекты |

### Пять выводов-паттернов
1. **Два главных триггера лока — approve и дата.** Дату используют почти все; approve-лок — Timetta/Harvest/Clockify; **export-лок (read-only после выгрузки) — редкость, только Kimai** (и косвенно Harvest invoice). Для РФ+1С export-лок ценен, но это P2.
2. **Reopen = почти всегда только Admin/Owner.** Универсально. Лок не действует на самих админов.
3. **Грейс-период — редкость, только в дата-лок системах** (Kimai, Float). У approve-лок грейса нет (момент дискретный).
4. **Полная история old→new — НЕ дефолт.** Встроена у Timetta; у Harvest/Kimai — модуль/плагин; Clockify/Toggl дают лишь частичный аудит; Float/Forecast — ничего.
5. **«Кто менял ЧУЖОЕ» важнее «кто менял своё»** (Clockify/Toggl логируют в первую очередь правки админом чужих записей — фокус на контроле корректировок сверху).

---

## 3. РЕКОМЕНДАЦИЯ (MVP, additive, не переусложнять)

### Топ-рекомендация
Внедрять **двумя дешёвыми additive-слоями**, переиспользуя то, что уже есть. **Audit-log MVP** — НЕ свой полный change-log с самого старта: на создание/удаление опереться на нативные `createdBy/createdAt` ядра (уже доступны), а для diff правок часов завести **узкий объект `credosTimeEntryLog`** {entry-ref, actor (server-truth `userWorkspaceRef`, паттерн CISO-005), action, oldHours, newHours, at}, который пишет `/s/time-entry` при upsert/delete — только по факту изменения часов/удаления, без попытки логировать каждое поле. **Lockdown MVP** — добавить в singleton `credosTimeSettings` поля `lockdownDate` + `gracePeriodDays` и расширить существующий серверный гард в `time-entry-api.logic.ts` (тот же, что уже ловит APPROVED): записи с `date ≤ lockdownDate` блокируются после грейса, как 2-й уровень поверх CISO-011 (SSOT защиты — один guard, два правила). Reopen/обход — только admin-роль. Exported-флаг — отдельный P2-шаг. Обе части ложатся на server-truth actor и НЕ требуют ломающих миграций схемы.

### Детально

**А. Audit-log — гибрид (дёшево + достаточно):**
- **Создание/удаление:** нативные `createdBy/createdAt` ядра (нулевая стоимость схемы; уже работает в booking-view) + строка лога на delete.
- **Правки часов:** новый объект `credosTimeEntryLog`:
  - поля: `entry` (RELATION MANY_TO_ONE → credosTimeEntry, onDelete RESTRICT/SET_NULL — чтобы лог пережил удаление записи лучше делать **без жёсткой FK или хранить entryRef как TEXT-snapshot**), `actorRef` (TEXT, userWorkspaceRef из resolveActor), `action` (SELECT: CREATE/UPDATE/DELETE/STATUS), `oldHours` (NUMBER nullable), `newHours` (NUMBER nullable), `at` (DATE_TIME), опц. `note`.
  - **[[twenty-sdk-apply-gotchas]]:** имена полей НЕ резервные (`name` не использовать как поле — labelIdentifier ставить на синтетическое описание или другое TEXT-поле; избегать reserved). Не дропать/переименовывать поля в том же sync. nav-item для index-view (Common Pitfalls).
  - писать из `time-entry-api.logic.ts` (op=upsert при изменении hours, op=delete) — нужно сперва подтянуть туда server-truth resolveActor (сейчас там простой resolveEmployeeId).
- **Дёшево-vs-полно:** только diff часов + действие (а не каждое поле описания/проекта) — закрывает 90% аудиторской потребности РФ-табеля при минимуме записей. Полный per-field change-log (как Timetta) — НЕ MVP.
- **Альтернатива (ещё дешевле):** не заводить объект, опереться ТОЛЬКО на нативный Timeline ядра — но он не даёт old→new часов и кастомных действий → недостаточно для «защита прошлых периодов + аудит правок».

**Б. Lockdown — Settings + расширение существующего guard:**
- В `credos-time-settings.object.ts` (additive поля):
  - `lockdownDate` (DATE_TIME nullable) — записи с `date ≤ lockdownDate` закрыты.
  - `gracePeriodDays` (NUMBER INT, default 0) — окно после конца периода, когда правка ещё разрешена (паттерн Kimai/Float). Эффективная граница = `lockdownDate` сдвинутая на грейс, ИЛИ скользящее правило «закрыть всё старше N дней».
  - (P2) `exportedLockEnabled` (BOOLEAN) — задел под exported-флаг.
- Guard в `time-entry-api.logic.ts` — **расширить тот же блок, что ловит APPROVED** (SSOT): после чтения настроек, если `entry.date ≤ lockdownDate` и actor не admin → `{ ok:false, error:'period_locked' }`. Применять к upsert/delete (create в прошлом периоде тоже блокировать).
- UI-индикация: переиспользовать `lockedByDay` — поднять флаг не только для APPROVED, но и для дней `≤ lockdownDate` (та же визуальная семантика read-only, минимум нового UI).
- **SSOT с CISO-011:** один серверный guard, два правила (status==APPROVED ИЛИ date в закрытом периоде). `lockedByDay` — единый источник UI-блокировки.
- **Reopen:** только admin-роль (паттерн «reopen = только Admin» — универсальный у конкурентов). Обход guard по admin-признаку актора.

**Связь с server-actor (CISO-005):** и лог («кто менял достоверно»), и admin-обход lockdown опираются на trusted-резолв `userWorkspaceRef`. Перенести/переиспользовать `resolveActor` из `approval.logic.ts` в `time-entry-api.logic.ts` — предусловие для надёжного audit-log правок.

**Что НЕ делать сейчас ([[keep-it-simple]]):** полный per-field history; биллинг-завязки; сложный многоуровневый workflow закрытия периода; отдельный UI-экран «журнал» (на MVP — показ истории в карточке записи + колонка в detail-отчёте).

---

## 4. ВОЛНА ВОПРОСОВ W9 (заказчику)

Формат: вопрос → гипотезы → реф.

**Гранулярность и состав audit-log**

W9.1. Логировать ВСЕ правки часов или только до согласования (после approve запись и так залочена)?
- (а) Все правки, включая admin-корректировки залоченного; (б) только DRAFT/SUBMITTED-этап; (в) все + отдельная пометка «правка после лока».
- Реф: Timetta пишет всё; Clockify/Toggl фокус на правках чужого/сверху.

W9.2. Что именно фиксировать в логе?
- (а) только oldHours→newHours + действие (MVP); (б) + смена проекта/вида работ; (в) + описание; (г) полный per-field diff как Timetta.
- Реф: Harvest (project/task/date/hours), Kimai (begin/end/duration/exported).

W9.3. Логировать создание и удаление, или только правки?
- (а) всё три (create/update/delete); (б) только update+delete (create виден по createdBy); (в) только delete (юридически важнее всего).
- Реф: нативный `createdBy` ядра уже даёт «кто создал».

W9.4. Нужен ли лог смены статуса (submit/approve/reject/revoke) отдельно, или approvedBy/resolvedBy/revokedBy достаточно?
- (а) достаточно текущих полей; (б) дублировать в единый лог для сводной истории.
- Реф: текущий approval-аудит уже на записи.

**Видимость и хранение**

W9.5. Кто видит историю правок?
- (а) только админ (как Timetta/Kimai SUPER_ADMIN); (б) + руководитель по своим подчинённым; (в) + сам сотрудник по своим записям.
- Реф: Kimai/Toggl — только админ.

W9.6. Где показывать историю?
- (а) карточка записи трудозатрат (раскрывающийся блок); (б) колонка/группа в detail-отчёте; (в) отдельный экран «Журнал»; (г) (а)+(б) на MVP.
- Реф: Timetta — отдельный Change Log; Harvest — Activity log.

W9.7. Срок хранения лога?
- (а) бессрочно; (б) N лет (РФ-учёт обычно 5 лет первички); (в) как у Harvest ~6 мес; (г) конфигурируемо.
- Реф: РФ — хранение первички/табелей; Toggl 1 год, Harvest 6 мес.

W9.8. Фиксировать «кто менял достоверно» через server-truth (CISO-005 trusted) — приемлемо ли, что для dev/legacy actor может быть trusted=false?
- (а) да, помечать недостоверные; (б) блокировать правку без trusted-актора; (в) всё равно.
- Реф: CISO-005 TOFU userWorkspaceRef.

**Триггер lockdown**

W9.9. Главный триггер закрытия периода?
- (а) по дате (lockdownDate, как Kimai/Clockify/Toggl); (б) после approve (как Timetta/Harvest); (в) после выгрузки в 1С (exported, как Kimai); (г) комбинация.
- Реф: дата — самый частый; export-лок — редкий, но ценен для 1С.

W9.10. Lockdown по дате — фиксированная дата или скользящее правило «всё старше N дней»?
- (а) фиксированная дата закрытия месяца; (б) скользящее «старше N дней от сегодня»; (в) оба режима.
- Реф: Clockify «older than N»; Float «N дней после периода».

W9.11. Нужен ли exported-флаг (выгруженное в 1С → read-only) на MVP или P2?
- (а) P2, потом; (б) сразу MVP (важно для аудита 1С); (в) не нужно.
- Реф: Kimai exported read-only — единственный среди конкурентов.

W9.12. Lockdown закрывает ВСЕ записи периода (вкл. DRAFT/REJECTED) или только согласованные?
- (а) все записи периода разом (отличие от построчного CISO-011); (б) только не-DRAFT; (в) все, но DRAFT можно дозаполнить до даты.
- Реф: DEEP_VALUE #2 — «закрывает весь прошлый период разом».

**Грейс-период**

W9.13. Нужен ли грейс-период?
- (а) да, фиксированное число дней (Kimai/Float); (б) нет, жёсткая дата (Toggl); (в) на усмотрение позже.
- Реф: грейс есть только у Kimai/Float.

W9.14. Если грейс да — длина и привязка?
- (а) N дней после конца месяца (напр. «закрывается 5-го»); (б) N рабочих дней; (в) конфигурируемо в Settings.
- Реф: «прошлый месяц закрывается 5-го числа следующего» (DEEP_VALUE).

W9.15. Кто может править в грейс-окне?
- (а) все (грейс = окно для всех); (б) только роль с правом грейса (Kimai `lockdown_grace_timesheet`); (в) только руководитель/админ.
- Реф: Kimai — отдельный permission на грейс.

**Reopen и роли**

W9.16. Кто может reopen (разблокировать) закрытый период?
- (а) только админ (универсально у конкурентов); (б) админ + руководитель отдела; (в) роль с спец-правом override (Kimai).
- Реф: Harvest/Clockify/Toggl — только Admin.

W9.17. Reopen — это снятие lockdown целиком или точечная правка одной записи без разлока всего?
- (а) только полное reopen периода; (б) точечная admin-правка залоченной записи (как Harvest manager правит hours/notes); (в) оба.
- Реф: Harvest — точечная правка без разлока.

W9.18. Действует ли lockdown на самих админов?
- (а) нет, админ всегда правит (Clockify/Toggl/Float); (б) да, но с override-правом; (в) да, требуется явный reopen.
- Реф: у большинства лок не действует на админов.

**Ретроактивность и переход**

W9.19. Ретроактивность: при включении lockdownDate — что с уже существующими записями в прошлом?
- (а) сразу залочены (read-only задним числом); (б) залочены, но текущие незавершённые правки сохраняются; (в) только новые правки блокируются.
- Реф: внедрение lock задним числом — риск для незакрытых табелей.

W9.20. Что показывать пользователю при попытке правки в закрытом периоде?
- (а) ошибка «период закрыт, обратитесь к админу»; (б) read-only без кнопок (как lockedByDay); (в) запрос на reopen.
- Реф: текущий `cannot_modify_approved` → аналог `period_locked`.

W9.21. Создание записей задним числом в открытом, но прошлом периоде (до lockdownDate) — разрешать?
- (а) да, пока не закрыт; (б) предупреждать; (в) запрещать создание в прошлом всегда.
- Реф: Timetta периоды таймшитов.

W9.22. Удаление записи в закрытом периоде — блокировать так же, как правку?
- (а) да (delete = тоже изменение периода); (б) только admin; (в) запрещено всем, включая admin (только архив).
- Реф: CISO-011 уже RESTRICT на каскад; DEEP_VALUE — против потери lockdown/exported записей.

W9.23. Связь lockdown ↔ approval: закрытие периода требует, чтобы все записи были согласованы, или закрывает независимо?
- (а) независимо (дата важнее статуса); (б) предупреждать о несогласованных при закрытии; (в) блокировать закрытие до полного согласования.
- Реф: Timetta approve-лок vs Kimai дата-лок — разные модели.

W9.24. Глобальный lockdownDate один на воркспейс или per-отдел/per-проект?
- (а) один глобальный (singleton Settings, MVP); (б) per-отдел; (в) per-юрлицо.
- Реф: Settings — singleton; отделы есть в модели.

W9.25. Нотификация при закрытии периода — нужна?
- (а) да, уведомить сотрудников «период закрывается DD» (переиспользовать reminder-механику); (б) нет; (в) только тех, у кого незаполнено.
- Реф: в Settings уже есть reminder*.

---

## Файлы (ссылки)
- `/Users/vsenichev/Documents/GitHub/time-credos-ru/apps/time/src/objects/credos-time-entry.object.ts` — approval-аудит поля, onDelete RESTRICT
- `/Users/vsenichev/Documents/GitHub/time-credos-ru/apps/time/src/logic-functions/time-entry-api.logic.ts` — CRUD-гард CISO-011 (место для lockdown-guard + audit-log записи)
- `/Users/vsenichev/Documents/GitHub/time-credos-ru/apps/time/src/logic-functions/approval.logic.ts` — server-truth resolveActor (CISO-005), статус-переходы
- `/Users/vsenichev/Documents/GitHub/time-credos-ru/apps/time/src/objects/credos-time-settings.object.ts` — singleton для lockdownDate/gracePeriodDays
- `/Users/vsenichev/Documents/GitHub/time-credos-ru/apps/time/src/views/credos-time-booking.view.ts` — паттерн нативных createdBy/createdAt
- `/Users/vsenichev/Documents/GitHub/time-credos-ru/apps/time/src/front-components/grid/use-grid-model.ts` — lockedByDay (UI read-only)
- `/Users/vsenichev/Documents/GitHub/time-credos-ru/docs/analysis/TIMETTA_KIMAI_DEEP_VALUE.md` — #2 lockdown+exported P0
