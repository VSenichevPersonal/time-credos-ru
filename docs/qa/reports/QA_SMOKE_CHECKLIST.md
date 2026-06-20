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
UX-логика ячеек/индикаторов/периодов покрыта unit-тестами (557 шт.) — smoke проверяет **интеграцию** в живом UI. Падение на smoke при зелёных unit = проблема связки/данных/рендера, не формул.
