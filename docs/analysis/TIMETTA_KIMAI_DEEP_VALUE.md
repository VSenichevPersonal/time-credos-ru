# Глубокая доразведка Timetta/Kimai — агрегированная архитектурная ценность (4 направления)

**Дата:** 2026-06-21
**Автор:** Аналитик AITEAM (итерация 115)
**Метод:** 4 параллельных глубоких среза разведки → финансы/биллинг · lifecycle/workflow/RBAC · аналитика/дашборды/AI · Kimai prod-код. Агрегация находок, не извлечённых ранее.
**Предыдущее:** TIMETTA_KIMAI_ARCH_VALUE.md (валидация/detail-поля/workflow/периоды/exported). Этот док — ГЛУБЖЕ, новые направления.

---

## 🔴 НАХОДКА №1 (КРИТИЧНО): lifecycleRoleResolver = прямой образец закрытия CISO-005

**Проблема:** CISO-005 (прод-блокер) — actor берётся из client-param `workspaceMemberRef` → IDOR/impersonation. recall/revoke/plan-write уязвимы.

**Образец Timetta (lifecycle/workflow):**
- Identity и права на переход состояния резолвятся **СЕРВЕРОМ от самой записи**, client-param как actor НЕ используется.
- `lifecycleRoleResolver(record, sessionUser)` динамически вычисляет роль актора относительно записи: **`Author` / `AuthorManager` (руководитель автора) / `ProjectManager` / `ClientManager`**.
- Переход легален ⟺ `sessionUser ∈ transition.performers` (роли/группы/юзеры/permissionSet) И состояние не `isEntityProtected` для edit И переход есть в `stateConfigurations[from].transitions`.
- Наш SoD («не свой») = просто резолвер, где `Author` исключён из согласующих — НЕ отдельный код.

**Действие арху:** закрыть CISO-005 по этому паттерну — server-side `resolveActorRole(record, event.userWorkspaceId)` + проверка `actor ∈ allowedPerformers(transition)`. Это снимает IDOR для submit/recall/revoke/approve И даёт основу многоуровневого согласования (A4.17). **Прямой образец, проверенный в проде Timetta.**

---

## 🔴 НАХОДКА №2: Lockdown period (Kimai prod) — 3-й уровень защиты прошлого учёта

**Где у нас:** только APPROVED-lock (построчный) + предложенный exported-флаг. Нет защиты «закрытый месяц».

**Kimai (prod-проверено, `RECON.md:141` + config):**
- Lockdown = **СЕРВИСНОЕ правило, НЕ поле сущности**. Config: `lockdown_period_start / _end / _grace_period / _timezone`.
- Логика: записи с `begin ≤ lockdown_end` нельзя править/создавать после grace-period (напр. «прошлый месяц закрывается 5-го числа следующего»). Admin обходит.

**Действие арху:** три уровня защиты прошлого учёта:
1. **APPROVED-lock** (построчный, есть) — согласованное.
2. **exported-флаг** (Kimai, находка ARCH_VALUE §5) — выгруженное в 1С read-only.
3. **lockdown period** (новое) — `lockdownEnd` + `gracePeriod` в Settings + guard в `time-entry-api.logic` перед create/update. Закрывает весь прошлый период разом (не построчно).
Комбинация = аудиторский след для РФ-учёта. **Усиливает аргумент против CASCADE (W5C.23):** lockdown/exported-записи тем более нельзя терять каскадом.

---

## 🟡 НАХОДКА №3: Серверная агрегация `$apply` — снимает нашу фронт-боль (W4C.26)

**Проблема:** `deptLoadCells` O(отделы×проекты×периоды) + `limit:500` без hasNextPage считаются НА ФРОНТЕ → сломаются при росте проектов (ГИП-4/W4C.26).

**Образец Timetta Reporting API:**
- OData V4 `$apply`: `filter(...)/groupby((dim1,dim2), aggregate(measure with sum as alias))` + `$orderBy`. Параметрический период `?periodStart&periodFinish`. Лимит 500k.
- **View-конфиг** (сериализуемый): `{sourceName, rowGroupFields[], columnGroupFields[], valueFields[{field, agg}], filters[]}`. agg = Sum/Count/Average/Max/Min.
- Дашборд исполняет запрос **от имени владельца** (security-паттерн), отчёт — от текущего юзера.

**Действие арху:** заменить жёсткий drill на **декларативный view-конфиг**; фронт шлёт `{rows, cols, values+agg, filters}` → бэк (`/s/reports`) агрегирует, фронт рисует. Снимает тяжёлое с фронта (уже частично так для reports). Бонус: колоночная группировка (pivot) — чего у нас нет. **Реалистично, прямое попадание в боль масштаба.**

---

## 🟢 НАХОДКА №4: Модель Акта (ActOfAcceptance) = прямой маппинг на 1С-акт

**Где у нас:** «Акт» = заглушка 1С (A4.27/W5A.16-19), модель не определена.

**Timetta ActOfAcceptance:**
- Шапка: `Number` (авто-нумерация, отключаемо), `Date` (обяз.), **`RecognitionDate`** (дата признания выручки → период факта), `Description`, вложения.
- Строки: `Work`(=этап), `Description`, `Amount` (валюта проекта), `ExchangeRate`, `AccountingItem` (учётная статья), `AmountBC` (базовая валюта).
- Статус-lifecycle, переход «Признано» требует RecognitionDate. Создаётся из «Оценки выручки» проекта.
- **Акт ≠ агрегат таймшитов** — сумма по этапу, часы и выручка РАЗВЯЗАНЫ (важно).

**Действие арху (когда дойдёт до актов):** `Number/Date/RecognitionDate/Amount/AccountingItem` — почти прямой маппинг на акт выполненных работ для выгрузки в 1С/Директум. НДС для РФ включать обязательно. Подтверждает W5A.16 (акт=снимок), W5A.18 (нумерация без дублей). **[NB-сейчас: суммы выкл, но структура акта валидна и без денег — часы по этапу+период.]**

---

## НАХОДКА №5: Финансовая модель (фаза 2, [NB-сейчас-выкл])

Если заказчик выберет деньги (W4A.18 go):
- **Две независимые ставки:** `CostRate` (себестоимость, на сотруднике/уровне) vs `BillingRate` (клиенту, на роли/проекте). НЕ путать.
- **RateMatrix + RateMatrixLine:** ставка по комбинации аналитик (роль/уровень/грейд/локация/ЮрЛицо), период действия (effective/expiry).
- **ProjectBillingType:** NON_BILLABLE / TM (Время+затраты) / FIXED_BID. T&M: счёт=Σ(часы×bill-rate); Fixed: по этапам; NB: только себестоимость.
- **Нормализация часов** (фактор 0-1 при согласовании): переработка не раздувает себестоимость; «равномерно» / «вначале оплачиваемые». **Концепт применим к util/FTE даже без денег** (W5B.13).
- **На Twenty SDK ложится:** RateMatrix/Line, BillingType (SELECT UPPER_SNAKE), Tariff, Act — как объекты+relations. **НЕ ложится:** resolution ставки по иерархии (бизнес-логика, сервис-слой), P&L накопительный (Working Capital/Capital Charge — кросс-периодная агрегация, нужен расчётный модуль).

---

## НАХОДКА №6: RBAC-модель Timetta — гранулы + row-level scope (для CISO/W4B)

- **PermissionSet** → строки `{granularName, scopeName, view/edit/delete/actionEnabled}`. ~125 гранул.
- **Scope = row-level:** `My / MySubordinates / MyProjects / MyClients / All / Templates`. Даёт «свои vs все vs подчинённые» БЕЗ field-level.
- **Field-level RBAC Timetta НЕ имеет** (как и Twenty, как и мы) — чувствительные поля выносятся в отдельную сущность-гранулу (`UserFinancial`/`ProjectFinancial`/`ResourceCurrentRate`).
- Системные роли = области приложения: User/TeamManager/ProjectManager/ResourceManager/FinanceManager/ClientManager/BillingManager/Administrator.
- **«Принудительная смена состояния» — НЕ отдельная гранула,** а performer-роль на переходе (напр. HR → «Переоткрыть»).

**Действие арху:** наш RBAC (2 роли) — грубая версия. Заложить: row-level scope `My/MySubordinates/MyProjects/All` (закрывает W4B.6/21/22); «принудительный revoke» = performer-роль на переходе, не спец-гранула; field-level НЕ строить (no-billable → нет чувствительных финполей). Twenty roles/permissions покрывают объектный RBAC.

---

## НАХОДКА №7: TimeEntry — поля из Kimai prod (что добавить)

- **`duration` хранить явно** (int сек) + nullable (считается из begin/end−break если null) — отчёты/валидации без пересчёта.
- **`timezone` на записи** + **`date_tz`** (денормализ. локальная дата для OLAP без TZ-сдвига) — решает W5C.6/7 (граница суток/месяца) элегантнее, чем DATE vs DATE_TIME.
- **`Tag.visible`** (архив метки без удаления) — = W5C.25 (нельзя удалять опцию с данными). Добавить `visible`/`isArchived` тегам/видам работ.
- **Композитные индексы — карта горячих фильтров:** `(user,date)`, `(user,project,workType)` (recent), `(user,id,duration)` (stats). На Twenty индексами не управляем напрямую, но это карта для оптимизации запросов.

**Чего ИЗБЕГАТЬ (Kimai-antipattern на Twenty):** своя meta key-value таблица (Twenty metadata-driven сам), своя ACL-таблица (роли Twenty), INT auto-PK (у нас UUID), billable-поля (no-billable).

---

## Сводка: приоритет для арха по ROI

| # | Находка | Применимость | ROI |
|---|---------|--------------|-----|
| 1 | **lifecycleRoleResolver server-side** | закрывает CISO-005 (прод-блокер) + основа A4.17 | 🔴 наивысший |
| 2 | **lockdown period** (Settings+guard) | 3-й уровень защиты, аудит РФ, усиливает CASCADE-аргумент | 🔴 высокий |
| 3 | **серверный $apply / view-конфиг** | снимает фронт-боль масштаба (W4C.26), pivot-cols | 🟡 высокий |
| 4 | **ActOfAcceptance модель** | прямой маппинг 1С-акт (A4.27), структура валидна без денег | 🟡 средний |
| 7 | **duration/timezone/date_tz/Tag.visible** | TZ-граница (W5C.6), архив тегов (W5C.25) | 🟡 средний |
| 6 | **row-level scope RBAC** | W4B.6/21/22 scope, без field-level | 🟢 средний |
| 5 | **финмодель (ставки/нормализация)** | фаза 2 если деньги (W4A.18); нормализация даже без денег | 🟢 [NB] |

**Связь с текущими P0:**
- №1 → **закрывает CISO-005** (сквозной прод-блокер, под W5A.5/7, W5C-CASCADE).
- №2 + exported → усиливают защиту против CASCADE-потери (3-й P0).
- №3 → решает архитектурный риск масштаба до роста.

**Подтверждения прошлых решений:** workflow-канон (идемпотентность/SoD/admin-override — TIMETTA_KIMAI_ARCH_VALUE §3) ✓; акт=снимок (W5A.16) ✓; нормализация часов для FTE-util (W5B.13) ✓.

**Источники:** timetta/docs/{settings-lifecycle-*, finance-*, analytics-*, api-reporting-api}.md; raw-odata-{LifeCycles,Roles,PermissionSets,RateMatrices,Dashboards,Reports,AiPrompts}.json; kimai/{entity-Timesheet,Tag,Team,Configuration}.php, RECON.md, BEST_PRACTICES.md.
