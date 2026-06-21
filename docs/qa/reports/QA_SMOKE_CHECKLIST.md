# QA — smoke-чеклист UX/UI (QA-1)

Браузер-smoke ВСЕХ экранов dev-workspace. Цель: убедиться, что UI работает,
данные видны, интеракции не падают. Прогон → `[smoke-ok]` или `[bug] #N` с repro.

**Среда:** `https://twenty-production-e5c5.up.railway.app` (Twenty 2.14, app «Трудозатраты»).
**Инструмент:** chrome-devtools (snapshot-first: navigate → wait_for → snapshot → click).
**Проверять на каждом экране:** (а) рендер без пустого/белого экрана, (б) `list_console_messages` без `error`, (в) `list_network_requests` без 5xx/4xx на data-запросах.

Легенда статуса: ⬜ не прогнан · ✅ ok · ❌ bug (#N) · ⚠️ замечание.

---

## 0-API. Backend/schema smoke (REST, без браузера)

### 0-A. Объекты — ✅ ПРОЙДЕН 2026-06-20 (8 объектов) → 2026-06-21 (+ credosTimeAbsences ✅)
```bash
set -a; . ./.env; set +a; BASE="${TWENTY_DEV_URL%/}"
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/healthz"   # → 200
for o in credosTimeDepartments credosTimeEmployees credosTimeProjects credosTimeStages \
         credosTimeWorkTypes credosTimeEntries credosTimeWorkdayCalendars credosTimeBillingLinks \
         credosTimeAbsences; do
  curl -s -o /dev/null -w "$o %{http_code}\n" -H "Authorization: Bearer $TWENTY_DEV_API_KEY" "$BASE/rest/$o?limit=1"
done
```

### 0-B. Logic-functions — ✅ ПРОЙДЕНО 2026-06-21

| Проверка | Метод | Статус | Результат |
|---|---|---|---|
| `/s/reports` byCategory | POST | ✅ | 6 кат. CLIENT/INTERNAL/PRESALE/PILOT/TRAINING/INFRA; Σhours==fact |
| `/s/reports` H2 util=null | POST `entries:[]` | ✅ | fact=0 → util=null |
| P-D1: PATCH plannedEffort | PATCH /rest/credosTimeProjects/{id} | ✅ | 200, restored |
| F-D: credosTimeAbsences | GET | ✅ | 11 записей (VACATION:4/SICK:3/UNPAID:2/OTHER:2) |
| op:delete (app-токен) | POST /s/time-entry op:delete | ❌ **[bug]#1** | 400 PERMISSION_DENIED — нужен `canDestroyObjectRecords` |
Результат: health 200; все 8 объектов HTTP 200 (схема накатилась). Данные есть везде, **кроме `credosTimeStages` (0 строк)** — ⚠️ этапы не засижены (→ Dev 2, D2-2; вкладка «Этапы» в карточке проекта будет пустой).

## 0. Вход и навигация (UI)
- ⬜ Логин в workspace проходит (нужны тест-креды — см. блокер ниже).
- ⬜ Сайдбар: 12 navigation-menu-items видны, кликабельны.
- ⬜ Каждый nav-item открывает свою index-view без ошибки (9 объектов + спец-виды).

## 1. Timesheet (3 режима) — `front-components/grid/`
- ⬜ **Week**: сетка Пн–Вс, строки проект×вид, ввод часов в ячейку.
  - ⬜ Ввод `8` / `2,5` / `0.25` → отображается `8` / `2.5` / `0.25` (`fmtHours`, покрыто unit).
  - ⬜ Ввод `25` / `abc` → отклоняется/не пишет (`parseHours` null, покрыто unit).
  - ⬜ Пустой ввод → ячейка 0/пусто (`parseHours('')→0`, покрыто unit).
  - ⬜ Footer-totals: сумма по дню/строке, итог недели.
  - ⬜ Индикатор загрузки: «норма выполнена» / «переработка +N ч» / «недобор N ч» (`loadHint`, покрыто unit) + цвет (`loadColor`).
- ⬜ **Day**: один день, навигация ‹ › переходит на соседнюю неделю на границах (`useWeek.shiftDay`).
- ⬜ **Project**: группировка по проекту.
- ⬜ Клавиатура: Tab/стрелки/Enter перемещают фокус по ячейкам (`use-keyboard`).
- ⬜ Мультифильтры (`filters-bar`): фильтр по проекту/виду/сотруднику сужает строки.
- ⬜ Cheatsheet (горячие клавиши) открывается.
- ⬜ Период-навигация: ‹ › / «сегодня» меняют неделю, заголовок корректен (`weekTitle`).

## 2. Capacity (2 режима) + ввод планов P-D1 — `front-components/capacity/`
- ⬜ **Overview**: колонки-периоды (недели/месяцы), строки отделов, ячейки load/capacity, ratio-цвет.
  - ⬜ Переключение week/month меняет колонки (`buildPeriods`, покрыто unit).
  - ⬜ Ёмкость отдела = часы×headcount×factor (`deptCapacity`, покрыто unit).
- ⬜ **Detail**: разбивка по проектам отдела, planned vs unplanned (`deptProjectLoads`, покрыто unit).
- ⬜ Навигация по горизонту вперёд/назад.
- ⬜ **P-D1 (ввод планов руководителем):** кнопка «✎ Планировать» видна только при `isManager`. Не-руковод → кнопки нет, доска read-only.
  - ⬜ Кнопка «Планировать» → срез фиксируется «Отделы», подсказка «раскройте отдел → задайте часы и срок».
  - ⬜ Раскрытие отдела → список проектов с инпутами часы+срок.
  - ⬜ Ввод `160` + Enter/blur → PATCH 200, загрузка пересчитана, индикатор «Сохранено» в шапке.
  - ⬜ Ошибка PATCH → красный баннер «Не удалось сохранить план: …», не crash.
  - ✅ API-слой: PATCH plannedEffort 200 (проверено REST smoke 2026-06-21).

## 3. Approval-bar — `front-components/grid/approval-bar.tsx`
- ⬜ Бар появляется при наличии записей на согласование.
- ⬜ Submit: DRAFT → SUBMITTED (записи периода, где проект требует согласования).
- ⬜ Approve/Reject: SUBMITTED → APPROVED/REJECTED.
- ⚠️ **Известный issue (Dev 2 blocker / CISO-002 / REQ-0001):** `isManager` захардкожен → approve/reject видны без RBAC-роли. На smoke зафиксировать как ⚠️, не баг (в работе у Dev 2).

## 4. Карточка проекта (7 вкладок) — после фикса arch
- ⬜ Открывается из index-view «Проекты».
- ⬜ Все 7 вкладок переключаются, контент грузится.
- ⬜ Виджеты «Бюджет»/«Команда» (D1-1 в работе — пока заглушки, зафиксировать состояние).
- ⬜ Код проекта `[ОТДЕЛ]-[ГОД]-[NNN]` + externalCode видны.

## 5. Карточка записи трудозатрат — после фикса a87ef4e
- ⬜ Поле **Проект** видно в карточке (регрессия из `CARDS_VIEWS_AUDIT.md` — главное).
- ⬜ Часы, вид работ, статус, дата, сотрудник отображаются.
- ⬜ approvedBy/approvedAt видны для APPROVED/REJECTED.

## 6. Регрессия карточка↔вид (QA-2)
- ⬜ Свериться с `docs/data-model/CARDS_VIEWS_AUDIT.md`: для каждого объекта поля карточки = полям вида (консистентность из коммита a87ef4e).

---

## 7. Отчёты (дашборд) + byCategory R3 — `front-components/reports/`
- ⬜ Дашборд «Отчёты» рендерится без ошибок (KPI: Утилизация/Факт/Норма/Недогруз).
- ⬜ Срезы Отдел/Проект/Человек переключаются.
- ⬜ **byCategory разбивка** (R3-D1): stacked-bar или колонки по категориям в строках. Цвет CLIENT ≠ INTERNAL.
  - ✅ API-слой: 6 категорий в totals.byCategory, Σ==fact (проверено REST smoke 2026-06-21).
  - ⬜ UI: категории визуализируются в строках отделов/сотрудников.

## 8. Отсутствия (F-D) — `credosTimeAbsence`
- ⬜ Раздел «Отсутствия» в сайдбаре (nav-item в папке «Трудозатраты»).
- ⬜ Index-view отображает 11 засеянных записей (VACATION/SICK/UNPAID/OTHER).
- ⬜ Карточка отсутствия: поля absenceType/startDate/endDate/employee/note видны.
- ⚠️ **CISO-008 (P3):** поле `note` — без placeholder; при smoke зафиксировать отсутствие предупреждения «не вводите диагноз».
  - ✅ REST smoke: 11 записей, объект задеплоен, absenceType корректный (2026-06-21).

## 9. Настройки Time Credos (S1-D1) — `front-components/settings/`
- ⬜ Подраздел «Настройки Time Credos» виден в Settings workspace.
- ⬜ Секция «Отделы»: inline-правка approvalRequired (тоггл) / capacityFactor / headcount.
  - ⬜ PATCH сохраняет, индикатор «Сохранено», rollback при ошибке.
- ⬜ Секция «Справочники»: ссылки на Виды работ / Произв. календарь / Сотрудники кликабельны.
- ⚠️ **CISO (настройки=admin):** пока фронт-only gate. При RBAC-волне — проверить что не-admin не видит вкладку.

## 10. Производственный календарь — помесячный вид (CAL-D1) — `front-components/calendar/`
- ⬜ Nav-item «Календарь» (папка «Трудозатраты») виден в сайдбаре.
- ⬜ Помесячный вид: 12 строк по месяцам, колонки кал.дней/рабочих/выходных+праздн./коротких/рабочих часов.
- ⬜ Подытоги по кварталам и за год.
- ⬜ Навигация по годам (← →).
- ⬜ Посуточный объект-вью (старый) тоже доступен.
- ⚠️ **[bug]#2 (P3):** NaN guard в `calc-month.ts` L19 — crash при invalid date. Практически не достижимо из UI, но зафиксировать.

## 11. Security-smoke (CISO-005 IDOR / CISO-002 SoD) — после фикса Dev 2
Регресс-контракт зафиксирован в `logic-functions/time-entry-api.logic.test.ts` (`it.todo` → реальные тесты после фикса). Smoke-проверки на живом UI:
- ⬜ Запись юзера A не редактируется/не удаляется под юзером B (ownership).
- ⬜ Нельзя создать запись от имени чужого сотрудника (impersonation).
- ⬜ List показывает только свои записи (или скоуп роли), не любого employeeId.
- ⬜ Approve/Reject доступны только роли «Руководитель» (после REQ-0001).
- ⬜ Руководитель не может approve СВОИ записи (separation of duties CISO-002).
- **CISO-007 (P2):** `/s/reports byEmployee` — ⚠️ LIVE CONFIRMED: раскрывает 42 ФИО+переработки без role-guard. UI не закрывает — нужен server-side canSeeAll.

## Открытые баги (обновляется)

| # | P | Описание | Зона | Статус |
|---|---|---|---|---|
| [bug]#1 | P1 | `op:delete` → 400 PERMISSION_DENIED (нужен `canDestroyObjectRecords`) | `roles/default-role.ts` | ❌ ждёт arch |
| [bug]#2 | P3 | `calc-month.ts`: NaN month-index (crash вместо skip) | `calendar/calc-month.ts:19` | ⚠️ `it.todo` |
| [bug]#3 | P2 | Кнопка «Планировать» не видна: `resolveSelfIsManager(null)` fallback `orderBy=isManager[DescNullsLast]` не работает для boolean custom-field → всегда false | `capacity/capacity-rest.ts:resolveSelfIsManager` | ✅ Fix Dev 1: `filter=isManager[eq]:true` — browser-smoke pending |
| [bug]#4 | P1 | Регрессия DP-0003: колонка «Категории» пустая (stacked-bar 0px) — `Explainable` без `block` → `inline-flex` → `CategoryBar width:100%` = нулевой контейнер | `reports/breakdown-table.tsx`, `shared/explainable.tsx` | ✅ Fix Dev 1: проп `block` — browser-smoke pending |

## Блокеры выполнения (актуально)
1. **chrome-devtools --isolated** — ждёт apply от arch/пользователя в `~/.claude/settings.json`. Обходной: сериализовать (один UI-агент за раз).
2. **Тест-креды** — `TWENTY_DEV_EMAIL`/`TWENTY_DEV_PASSWORD` в `.env` (DevOps T2 ✅). Для CISO-007 smoke нужен отдельный non-admin аккаунт (запрос DevOps).
3. **[bug]#1** — op:delete заблокирован до `canDestroyObjectRecords` в default-role.

## Привязка к unit-покрытию
UX-логика ячеек/индикаторов/периодов покрыта unit-тестами (1859+) — smoke проверяет **интеграцию** в живом UI. Падение на smoke при зелёных unit = проблема связки/данных/рендера, не формул.

---

# ВОЛНА 2 — smoke-кейсы (21 uncommitted блок, срез 2026-06-21)

> Все секции ниже **⬜ не прогнаны**, ожидают arch gate + `app sync` DevOps.
> Легенда: ⬜ не прогнан · ✅ ok · ❌ bug (#N) · ⚠️ замечание · ⏳ in-progress.

## 0-B2. Logic-functions v2 — новые маршруты (⬜ после gate)

```bash
set -a; . ./.env; set +a; BASE="${TWENTY_DEV_URL%/}"

# credosTimeBookings (Dev2 booking-REQ0004)
curl -s -o /dev/null -w "credosTimeBookings %{http_code}\n" \
  -H "Authorization: Bearer $TWENTY_DEV_API_KEY" "$BASE/rest/credosTimeBookings?limit=1"

# /s/reports format=tabel-grid (Dev2 tabel-T13)
curl -s -w "\n%{http_code}\n" -X POST "$BASE/s/reports" \
  -H "Authorization: Bearer $TWENTY_DEV_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"format":"tabel-grid","from":"2026-06-01","to":"2026-06-30"}' | tail -2

# /s/reminders (Dev2 напоминания-FE)
curl -s -o /dev/null -w "/s/reminders %{http_code}\n" -X POST "$BASE/s/reminders" \
  -H "Authorization: Bearer $TWENTY_DEV_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"windowDays":3}'

# CISO-012 guard: попытка upsert APPROVED → 403
# (вручную: взять id записи со статусом APPROVED, попробовать через /s/time-entry)
```

---

## 12. Таймшит-сетка UX v2 — worktype-column · gap-cell-fit · DP-0006-R3

**Unit-покрытие:** `tokens.test.ts` (COL_W=56 / COL_W_GAP=68), `cap-tokens.test.ts` (gapTone/gapIcon).

### 12-A. Отдельная колонка «Вид работ» (worktype-column, Dev1)
- ⬜ Колонка «Вид работ» отображается в гриде как отдельный столбец (не слита с «Проектом»).
- ⬜ Значение берётся из `workType.name` записи, не захардкожено.
- ⬜ Пустой вид работ: ячейка «—», не crash.
- ⬜ Ширина колонки: `COL_W=56px` в normal-режиме, `COL_W_GAP=68px` в gap-режиме.

### 12-B. GAP-режим ячейки 68px (gap-cell-fit, Dev1)
- ⬜ Тоггл GAP-режима переключает ширину ячеек 56→68px без перезагрузки.
- ⬜ Все 7 уровней строк применяют `COL_W_GAP` последовательно (нет перекоса).
- ⬜ Текст в ячейке не обрезается при 68px (snap + visual check).
- ⬜ Переключение GAP↔normal не сбрасывает введённые данные.

### 12-C. Разделители месяцев в period-header (DP-0006-R3, Dev1)
- ⬜ При переходе через границу месяца в заголовке колонок виден визуальный разделитель.
- ⬜ При полностью внутримесячной неделе разделителей нет.
- ⬜ Граница декабрь/январь — разделитель отображается, год обновляется в заголовке.

---

## 13. Ёмкость v2 — fix-capacity-metric · booking-capacity · Resource-gap

**Unit-покрытие:** `calc-load.test.ts` (30 ассертов booking + 20 absences), `cap-tokens.test.ts` (gapTone/gapIcon/formatCell), `use-capacity.test.ts` (horizonRange).

### 13-A. Дочерние строки метрики (fix-capacity-metric, Dev1)
- ⬜ Раскрытие строки отдела в capacity-доске показывает дочерние строки по метрике.
- ⬜ Дочерние строки рендерятся через SSOT `cap-tokens.ts` `childCell()` — нет хардкода формата.
- ⬜ Сумма дочерних ≤ значение родительской (нет двойного счёта).
- ⬜ Дочерняя строка без данных: «—», не «0%» / NaN.

### 13-B. Брони в ёмкости (booking-capacity, Dev1 + Dev2)
- ⬜ **HARD-бронь:** входит в `load`, уменьшает «свободно», влияет на ratio/gap.
- ⬜ **SOFT-бронь** при `tentativeBookingEnabled=true`: отдельный приглушённый слой, НЕ меняет `load`.
- ⬜ Тоггл `tentativeBookingEnabled=false`: SOFT-слой скрыт, HARD-данные остаются.
- ⬜ **Овербукинг** (HARD+план > capacity): терракот-обводка + иконка ▲; заливка не меняется.
- ⬜ Ячейка без броней: no regression.
- ⚠️ ИНВАРИАНТ: бронь ≠ план-оценка ≠ факт. Smoke: факт не меняется при добавлении брони.

### 13-C. Resource Gap (Resource-gap, Dev1)
- ⬜ Метрика `gap`: дефицит `+Nч / +N%`, профицит `−Nч / −N%`.
- ⬜ Цвета: |gap|≤5% нейтраль; дефицит 5–15% янтарь, >15% терракот; профицит синий.
- ⬜ Иконка: баланс ●, дефицит ▲, профицит ▼.
- ⬜ capacity=0: ячейка пустая (нет деления на ноль, нет «Infinity%»).

---

## 14. Брони — объект и карточки (booking-REQ0004 + booking-cards)

**Unit-покрытие:** `calc-load.test.ts` (buildBookingCtx, bookingHoursInPeriod).

### 14-A. Объект credosTimeBookings (Dev2)
- ⬜ REST smoke: `GET /rest/credosTimeBookings?limit=1` → 200.
- ⬜ Index-view: поля employee, project, bookingType (SOFT/HARD), hours, startDate, endDate видны.
- ⬜ CRUD: создать → список обновился; правка → 200; soft-delete → исчезает.

### 14-B. Вкладки «Брони» в карточках (Dev1)
- ⬜ Карточка **Проекта**: вкладка «Брони» — список броней (employee / hours / тип / период).
- ⬜ Карточка **Сотрудника**: вкладка «Брони» — брони этого сотрудника.
- ⬜ Пустая вкладка: пустой стейт без ошибки.
- ⬜ Кнопка «+ Добавить бронь»: форма открывается (поля: сотрудник/проект/тип/hours/даты).
- ⚠️ CISO-009: синтетические проекты/сотрудники в dev-данных (нет реальных ФИО/клиентов).

---

## 15. Настройки v2 — REQ-0019 (3 новых поля + валидаторы)

**Unit-покрытие:** `settings-rest.test.ts`, `constants/validation.test.ts` (14 тестов validateEntry).

### 15-A. Форма настроек отдела (Dev1 REQ-0019-UI)
- ⬜ Секция «Отделы» → строка отдела → три новых поля: `dailyHoursLimit`, `weeklyOvertimeThreshold`, `weeklyUndertimeThreshold`.
- ⬜ PATCH каждого поля → 200, индикатор «Сохранено», rollback при ошибке 4xx.
- ⬜ Регресс: существующие поля (`approvalRequired` / `capacityFactor` / `headcount`) не сломаны.

### 15-B. Валидация в гриде (Dev2 + Dev1)
- ⬜ `hours > dailyHoursLimit` → ячейка ERROR, сохранение БЛОКИРОВАНО (нет запроса в Network).
- ⬜ `hours` в WARNING-зоне → 200, body содержит `warnings: ["overtime"]`.
- ⬜ Правила `null`/не заданы: graceful skip, нет 422.

---

## 16. CISO-012 — lock APPROVED-ячейки

**Unit-покрытие:** `use-timesheet-actions.test.ts` (isCellLocked 8 ассертов), `time-entry-api.logic.test.ts` (cannot_modify_approved).

### 16-A. UI lock (W6-2, Dev1)
- ⬜ Ячейка APPROVED: визуально read-only (приглушённая / иконка замка), клик не открывает редактор.
- ⬜ Bulk-fill: APPROVED-дни пропускаются, остальные заполняются.
- ⬜ Копирование недели: APPROVED-ячейки не перезаписываются.

### 16-B. Роутинг /s/time-entry (ciso012-routing, Dev1)
- ⬜ Все UI-мутации грида в Network: путь `/s/time-entry`, НЕ прямой `/rest/credosTimeEntries`.
- ⬜ Попытка изменить APPROVED → 403 `cannot_modify_approved` в Network.
- ⬜ Ошибка 403 → UI: «Запись согласована, изменение запрещено» (не crash, не silent no-op).
- ⚠️ L3 RLS (server-actor) закроется CISO-005; smoke фиксирует L1+L2, L3 → ⏳.

---

## 17. CSV-экспорт (csv-export-FF, Dev2)

**Unit-покрытие:** `reports-detail.test.ts` (escapeCsv/toCsvRow/BOM, 19 тестов), `reports-timesheet-grid.test.ts` (gridToCsv BOM+`;`, 18 тестов).

- ⬜ Кнопка «Экспорт CSV» в «Отчётах» / Т-13 видна и кликабельна.
- ⬜ SDK Remote-DOM: `Blob`/`URL.createObjectURL` недоступны. Реализация через **popover** (textarea + copy) или host-bridge. Проверить, что данные доступны пользователю.
- ⬜ RU-Excel: файл начинается с BOM `EF BB BF`, кириллица без «кракозябр».
- ⬜ Разделитель `;` — колонки разнесены корректно.
- ⬜ Поле с `;` или `"` внутри: экранировано `"..."`.
- ⬜ EOL: `\r\n` (Windows), не только `\n`.
- ⬜ CISO-007: `revealNames=false` → колонка «Сотрудник» = КОД, не UUID/ФИО.
- ⚠️ CISO-010: код SICK в Т-13 — не-HR видит «Н», не «Б» (если реализовано).

---

## 18. Напоминания / missing-timesheets (напоминания-FE, Dev2)

**Unit-покрытие:** `reminders-rest.test.ts` (7 тестов), `missing-timesheets.test.ts` (reveal=false guard).

- ⬜ `POST /s/reminders {"windowDays":3}` → 200, список {employeeId, periodEnd, hoursLogged}.
- ⬜ `revealNames=false`: employeeId = КОД, не UUID/ФИО.
- ⬜ Сотрудник с закрытой нормой: отсутствует в списке.
- ⬜ `windowDays=0` или `-1`: 400 Bad Request, не crash.
- ⚠️ SDK pitfall #2: logic-function не может слать email/push. Маршрут возвращает данные для внешней доставки. Зафиксировать поведение.

---

## 19. Табель Т-13 (tabel-T13 backend + timesheet-t13 frontend)

**Unit-покрытие:** `reports-timesheet-grid.test.ts` (enumerateDays/buildTimesheetGrid/gridToCsv, 18 тестов).

### 19-A. Backend Т-13 (Dev2) — ⬜
- ⬜ `POST /s/reports {"format":"tabel-grid","from":"2026-06-01","to":"2026-06-30"}` → 200.
- ⬜ Ответ: матрица сотрудник × день (31 колонка), итоговые колонки (дни/часы/коды).
- ⬜ CISO-007: без `revealNames=true` строки = КОД, не ФИО.
- ⬜ `gridToCsv`: BOM + `;` + `\r\n` (→ §17).

### 19-B. Frontend экран Т-13 (Dev1) — ⏳ IN-PROGRESS
- ⬜ Nav-item «Табель Т-13» виден в сайдбаре.
- ⬜ Экран рендерит матрицу сотрудник × день за выбранный месяц.
- ⬜ Переключение месяца (‹ ›) перезапрашивает данные.
- ⬜ Кнопка «Экспорт CSV» (→ §17).
- ⬜ Пустой период: пустой стейт, не crash.

---

## 20. Отделы v2 — REQ-0018 (head/parentDepartment + backfill)

**Unit-покрытие:** `backfill-project-departments.test.ts` (идемпотентность, 8 тестов).

- ⬜ Index-view «Отделы»: колонки `head` (руководитель) и `parentDepartment` видны.
- ⬜ Карточка отдела: поля `head → Сотрудник` и `parentDepartment → Отдел` отображаются.
- ⬜ Иерархия: дочерний отдел показывает родителя; корневой → `parentDepartment` пуст.
- ⬜ `seed-department-heads.mjs` (⚠️ нужен prod-access): после прогона `head` заполнен у всех отделов.
- ⬜ Backfill идемпотентен: повторный запуск не дублирует.
- ⚠️ CISO-009: seed содержит синтетические данные — `grep -r "Директум\|ООО\|ФГБУ" seed/` → 0 строк.

---

## 21. OLAP drill-UI (OLAP-drill, Dev1)

**Unit-покрытие:** `reports-calc.test.ts` (computeOlap 28 тестов: groupBy×5, фильтры, пагинация, dimLabel).

- ⬜ Раздел «Отчёты» → OLAP: таблица с группировкой, строки кликабельны.
- ⬜ Клик агрегата → drill-down; breadcrumbs наращиваются.
- ⬜ Breadcrumb назад → возврат на родительский уровень.
- ⬜ `dimLabel`: читаем, не сырой UUID (SSOT `categoryMeta`/`tagMeta`).
- ⬜ Сумма дочерних ≤ значение родителя (visual check).
- ⬜ CISO-007: ось employee при `revealNames=false` → КОД, не ФИО.

---

## 22. Валидация REQ-0019 — backend-правила (Dev2)

**Unit-покрытие:** `constants/validation.test.ts` (14 тестов validateEntry).

- ⬜ `POST /s/time-entry op=upsert hours > dailyHoursLimit` → 422 `hours_limit_exceeded`.
- ⬜ `hours` в WARNING-зоне → 200 + `warnings: ["overtime"]` в body.
- ⬜ Правила per-отдел: отдел A (лимит 10) ≠ отдел B (лимит 12).
- ⬜ Правила `null`: op=upsert → 200, нет 422 (graceful skip).

---

## 23. Diverse-seed (Dev2) — ⏳ IN-PROGRESS

- ⬜ После прогона seed: 5+ синтетических проектов, 3+ отдела, 10+ сотрудников, записи за 3+ месяца.
- ⬜ CISO-009: `grep -r "Директум\|ООО\|ФГБУ\|realdomain" seed/` → 0 строк.
- ⬜ CISO-001: `seed-real.mjs` НЕ в git (только gitignored).
- ⬜ После seed: capacity-доска, OLAP, Т-13 показывают заполненные данные.

---

## Открытые баги — обновление (2026-06-21)

| # | P | Описание | Зона | Статус |
|---|---|---|---|---|
| [bug]#1 | P1 | `op:delete` → 400 PERMISSION_DENIED (нужен `canDestroyObjectRecords`) | `roles/default-role.ts` | ❌ ждёт arch |
| [bug]#2 | P3 | `calc-month.ts`: NaN month-index (crash вместо skip) | `calendar/calc-month.ts:19` | ⚠️ `it.todo` |
| [bug]#3 | P2 | `resolveSelfIsManager` boolean orderBy | `capacity/capacity-rest.ts` | ✅ CLOSED Dev1 |
| [bug]#4 | P1 | `Explainable` без `block` → stacked-bar нулевой (DP-0003) | `reports/breakdown-table.tsx` | ✅ CLOSED Dev1 |
| [ciso-006-gap]#1 | P2 | `fetchProjectEntries` — нет isUuid guard | `project-team/team-rest.ts` | ⚠️ тест есть, guard ждёт Dev2 |
| [ciso-006-gap]#2 | P2 | `fetchProjectSummary` — нет isUuid guard | `project-summary/summary-rest.ts` | ⚠️ тест есть, guard ждёт Dev2 |
