# Аудит консистентности person-level планирования + UX + волна W8

Дата: 2026-06-21. Автор: аналитик AITEAM. Режим: READ-ONLY (код + REST dev).
Запрос заказчика (дословно): «записи попадают в Плановое распределение (по месяцам)?
консистентно всем остальным данным? в отдел всё суммируется и приходит? в UX UI
путаницы нет?»

Окружение проверки: `TWENTY_DEV_URL` (railway dev), объект `credosTimePlanSlots`.

---

## TL;DR (топ-находки)

| # | Находка | Severity | Где |
|---|---------|----------|-----|
| B1 | **Отчёты/КПИ НЕ используют plan-slots** — план в отчётах = `project.plannedEffort` (скаляр), на доске = Σ слотов. Доска ↔ отчёты расходятся в MANUAL | 🔴 Критично | `reports-calc.ts`, `projects-plan-fact.ts` |
| B2 | **Drill под отделом игнорирует слоты** — `deptProjectLoads` без `slotsByProject`. Total отдела (Σ слотов) ≠ Σ строк drill (EVEN/доли) в MANUAL | 🟠 Высоко | `calc-load.ts:828`, `board-rows.tsx:92` |
| B3 | **2 пустые записи-мусор** в `credosTimePlanSlot` (periodMonth="", всё null) — созданы вручную через нативный object-view | 🟡 Средне | object-view + nav-меню |
| B4 | **Object-view «Плановое распределение» в sidebar** показывает сырые слоты (UUID, employeeId, пустые) + кнопка «+Создать» = точка ввода мусора | 🟡 Средне (UX) | `*.navigation-menu-item.ts`, `*.view.ts` |
| B5 | dept-план и person-план в одном проекте/месяце визуально не различимы; 3 точки ввода плана | 🟡 Средне (UX) | панели + object-view |

Инвариант rollup `отдел = Σ(персон-слоты) + остаток-по-FTE` в **расчётном ядре доски
соблюдён** (employeeLoadCells/deptLoadCells, без двойного счёта). Расхождения — на
**периметре** ядра: drill (B2) и отчёты (B3→B1) НЕ переиспользуют тот же путь.

---

## 1. ПЕРСИСТ: попадают ли записи в «Плановое распределение»

**ДА, dept-слоты сохраняются.** REST `GET /rest/credosTimePlanSlots` (totalCount=7):

5 валидных dept-слотов одного проекта `9f1d2774…`, отдел `29f78f0f…`, **employeeId=null**:
- 2026-05 → 100ч, 2026-06 → 100ч, 2026-07 → 100ч, 2026-08 → 100ч, 2026-09 → 80ч (Σ=480ч)
- источник `MANUAL` (Василий Сеничев), valid `searchVector`.

**ВСЕ найденные слоты — отдельские (employeeId=null).** Персональных слотов
(employeeId≠null) в dev-БД сейчас НЕТ — значит ветка person-level в проде ещё не
заполнялась данными ИЛИ пишется отдельным проектом. Сам механизм записи персональных
готов (employee-plan-panel прокидывает employeeId, contract upsert дедупит по
`month|dept|emp`).

### B3 — 2 пустые записи (мусор)

```
{ periodMonth:"", plannedHours:null, projectId:null, departmentId:null, employeeId:null }  // 17:38
{ periodMonth:"", plannedHours:null, projectId:null, departmentId:null, employeeId:null }  // 17:16
```

**Откуда (разобрано):** НЕ из панелей. И `project-plan-panel`, и `employee-plan-panel`
шлют через `savePlanSlots → /s/plan-slots upsert`, где `parseInputSlots` (plan-slots.logic.ts:184)
**отбрасывает** слоты без валидного `MONTH_RE`, а `runUpsert` при `plannedHours<=0` ничего
не создаёт (строка 225). Через панель пустой слот создать НЕЛЬЗЯ.

Источник — **нативный object-view** «Плановое распределение» (B4): объект имеет
index-view + navigationMenuItem (sidebar, папка «Планирование», pos 9). Нативная кнопка
Twenty «+ Создать запись» создаёт слот напрямую через Core REST в обход логик-функции;
`plannedHours` объекта `isNullable:true, defaultValue:null`, `periodMonth` TEXT без
обязательности → пустая запись. Два разных времени создания (17:16 и 17:38) = ручные
клики при изучении UI.

**Последствие:** доска НЕ ломается — `fetchAllPlanSlots`/`fetchPlanSlots` фильтруют
`!!s.periodMonth` (plan-slots-rest.ts:69), пустые отсеиваются. `buildSlotsByProject`
тоже отбрасывает (`!monthRange` + `!s.projectId`). Но: мусор виден юзеру в object-view,
засоряет, и при добавлении будущих отчётов «по слотам» может попасть в Σ.

---

## 2. КОНСИСТЕНТНОСТЬ ROLLUP (инвариант SSOT §7.2)

Расчётное ядро (`calc-load.ts`): инвариант проверен по коду.

**`employeeLoadCells` (стр. 709–781):**
```
employeeLoad = max(personal_slot, hardBooking) + remainder
remainder    = max(0, deptLoad − Σ персон.слотов отдела) × remainderShare(FTE)
```
- `personal` = `employeePersonalHoursInPeriod` (слоты с employeeId=emp по ВСЕМ проектам).
- `deptPersonal` вычитается из deptLoad → **двойного счёта нет** (персон.слоты не
  попадают и в персональную часть, и в остаток).
- остаток делится по FTE (`remainderShare`), fallback 1/headcount. ✅ закрыт W5B.13.
- booking SSOT: `max(personal, hard)` — слот и HARD-бронь = одна ось Demand. ✅

**`deptLoadCells` (стр. 613–642):** `projectDeptHoursInPeriod` + dept-plans + HARD.
В MANUAL берёт слоты (`useManual` → `slotsHoursInPeriod`), слоты dept + слоты без
departmentId относятся к «родному» отделу проекта. ✅

**ВЫВОД по ядру:** инвариант `отдел = Σ персон + остаток-по-FTE`, один путь
для доски, БЕЗ двойного счёта — **соблюдён**. `Σ employeeLoadCells по отделу = deptLoadCells`
(персональная часть + остаток = deptLoad − deptPersonal + deptPersonal). ✅

### B2 — drill под отделом расходится с total (ПОДТВЕРЖДЁН, флаг ae0fc верен)

`deptProjectLoads` (calc-load.ts:828–861) — детализация проектов под раскрытым отделом.
Сигнатура: `(dept, projects, periods, sharesByProject?, spread?)` — **`slotsByProject`
НЕ принимает**. Внутри строка 853 зовёт `projectDeptHoursInPeriod(p, dept.id, per,
sharesByProject, spread)` — **без 6-го аргумента slotsByProject** → `useManual`=false →
проект считается по EVEN/долям даже в MANUAL.

Вызов: `board-rows.tsx:92`
```
const detail = isOpen ? deptProjectLoads(dept, projects, periods, sharesByProject, spread) : null;
```
Total строки отдела (`board-rows.tsx:90` → `deptLoadCells(…, slotsByProject)`) слоты УЧИТЫВАЕТ.

**Эффект для проверенного проекта `9f1d…`** (MANUAL, Σслотов=480ч, distribution
100/100/100/100/80): если `plannedEffort`≠480 ИЛИ распределение по месяцам ≠ EVEN —
строка проекта в drill покажет EVEN-раскид, а суммарная строка отдела сверху — Σслотов.
Числа в раскрытом отделе НЕ сойдутся вертикально. **Реальный баг рассинхрона.**

Фикс (низкорисковый): прокинуть `slotsByProject` в `deptProjectLoads` и далее в
`projectDeptHoursInPeriod`; обновить `board-rows.tsx:92`. Сигнатура уже совместима
(slotsByProject опционален в `projectDeptHoursInPeriod`).

> Примечание: `projectDeptShareLoads` (drill 3-го уровня по долям) тоже считает по
> долям, без слотов — в MANUAL мульти-отдел даст тот же класс расхождения, но это
> follow-up (мульти-отдел + MANUAL — редкая комбинация).

---

## 3. ОТЧЁТЫ / КПИ — используют ли plan-slots?

**НЕТ. Это главное расхождение (B1).**

`reports-calc.ts` (`computeReports` / `computeOlap` / `computeTimeseries`):
- `RawProject.plannedEffort` — единственный источник «плана».
- `byProject.budgetUsed = fact/plannedEffort` (стр. 381) — скаляр, без помесячного раскида.
- Нет импорта slot-логики, нет `slotsHoursInPeriod`, нет `planMethod`.

`projects-plan-fact.ts` (`computeProjectsPlanFact`):
- `planned = p.plannedEffort` (стр. 138), `remaining = planned − fact`. Тоже скаляр.

`computeTimeseries` бакетирует **факт** по месяцам, но **план/норму** — из календаря и
plannedEffort, НЕ из слотов. То есть «план по месяцам» в тренде ≠ ручной помесячный
раскид слотов.

**Расхождение доска↔отчёты:**
- Доска (MANUAL): загрузка проекта/отдела = Σ слотов (помесячно, по рабочим дням).
- Отчёты: план = plannedEffort (целое), раскид по месяцам отсутствует.
- В MANUAL `project-plan-panel.save` пишет `plannedEffort = manualRecon.sum` (Σслотов,
  стр. 200) → **итоговая сумма совпадёт**, НО помесячная разбивка в отчётах будет EVEN/
  отсутствовать, а на доске — ручная. КПИ «план месяца» разъедутся.
- Для **персональных** слотов: отчёт `byEmployee` плана не имеет вовсе (только
  factHours/norm) → person-level план в отчётах НЕ виден совсем.

Это согласуется с историей коммитов («reports … нет scheduled»): отчёты строились до
slot-механики и не были к ней подключены.

---

## 4. UX / UI путаница

### B4 — нативный object-view сырых слотов в sidebar
«Плановое распределение (по месяцам)» в левом меню (папка «Планирование»). Колонки:
periodMonth, проект, плановые часы, отдел. **employeeId в view не выведен** → персон. и
отдельские слоты неразличимы там. Показывает технические записи (включая 2 пустые),
есть кнопка «+Создать» (источник мусора B3). Для конечного юзера это «сырая таблица
бэкенда» — смысловой ценности мало, риск порчи данных высокий.

### B5 — три точки ввода плана, неразличимость dept/person
1. `project-plan-panel` (строка проекта) — EVEN | MANUAL, dept-уровень (departmentId слота
   = project.departmentId).
2. `employee-plan-panel` (строка сотрудника, срез «Люди») — персон. слот (employeeId=emp,
   departmentId=отдел сотрудника).
3. нативный object-view — сырое создание.

Проблемы:
- **dept-слот и person-слот в одном проекте+месяце сосуществуют** (разные ключи дедупа,
  не схлопываются). В UI пользователь не видит, что у проекта в июле есть и «отдел: 100ч»,
  и «Иванов: 40ч». Риск двойного планирования восприятия (хотя ядро вычитает персон.
  из остатка — двойного счёта в расчёте нет, но в голове у юзера — да).
- **planMethod EVEN/MANUAL** виден только при открытии панели проекта (радио). На строке/
  в ячейке нет индикатора, что проект в ручном режиме. Юзер не понимает, почему правка
  «Объёма» в EVEN мгновенно меняет раскид, а в MANUAL — нет.
- booking vs slot: на доске для сотрудника `max(personal, hard)` — корректно одна ось, но
  в UI бронь и план-слот показываются как разные плашки (`hardBooking` отдельно). При
  наличии обоих юзер видит две сущности на одного человека и может не понять, что в
  load учтён только max.

---

## 5. Волна вопросов W8 (консистентность + UX)

Формат: вопрос → гипотезы → референс.

**W8.1.** Пустые слоты (periodMonth="", null) — что с ними делать?
- (а) удалить 2 текущие + добавить серверную валидацию (отклонять слот без месяца/часов);
- (б) скрыть нативный object-view, чтобы их нельзя было создать (см. W8.4);
- (в) фильтр-кондиция в view (periodMonth is not empty).
- Реф: Timetta не даёт создавать «пустой план» — всегда период+часы. → рекомендуем (а)+(б).

**W8.2.** Нужен ли юзеру object-view «Плановое распределение» в sidebar?
- (а) скрыть из меню (оставить объект техническим, как entry/booking-служебные);
- (б) оставить только для админа/отладки;
- (в) оставить, но read-only + убрать пустые + вывести employee-колонку.
- Реф: keep-it-simple; SDK-pitfall требует index-view у объекта, но nav-меню необязателен.

**W8.3.** Отчёты должны учитывать помесячный раскид слотов (план месяца), или достаточно
итогового plannedEffort?
- (а) план в отчётах = Σ слотов помесячно (полная консистентность доска↔отчёты, дорого);
- (б) только timeseries-тренд использует слоты, табличные отчёты — plannedEffort (компромисс);
- (в) оставить как есть (план = plannedEffort), задокументировать различие.
- Реф: Timetta «план/факт» в отчётах согласован с ресурсным планом. → склоняемся к (б).

**W8.4.** Person-level план в отчёте по сотрудникам — нужен (byEmployee сейчас без плана)?
- (а) добавить колонку «план» в byEmployee из персон.слотов;
- (б) отдельный отчёт «план/факт по сотрудникам»;
- (в) не нужно (KPI сотрудника = util/недогруз от нормы, план не релевантен).

**W8.5.** Drill под отделом (B2) — фикс слотов: подтвердить, что drill ОБЯЗАН биться с total?
- (а) да, прокинуть slotsByProject в deptProjectLoads (рекоменд.);
- (б) показывать в MANUAL строку «ручной раскид» отдельной строкой, не разбивая по EVEN.

**W8.6.** Как пользователь должен РАЗЛИЧАТЬ dept-план и person-план в одном проекте?
- (а) бейдж на строке проекта «есть персональные планы (N чел)»;
- (б) в drill отдела под проектом — под-строки сотрудников с их слотами;
- (в) переключатель «показать персональный раскид».
- Реф: Timetta resource-plan показывает строки по людям внутри проекта.

**W8.7.** Индикатор-мэтчинг Σ(персон.слоты) vs план-отдела/проекта в UI?
- (а) показывать «Σ персон 320ч из 480ч плана отдела (нераспределено 160ч)»;
- (б) только при рассинхроне (>порога) — предупреждение;
- (в) не показывать (мягкая сверка уже есть в панели Σ).
- Реф: `slotsVsPlannedEffort` хелпер уже считает gap — переиспользовать в drill.

**W8.8.** Переаллокация >100% (персон.слоты + бронь + остаток > ёмкости сотрудника)?
- (а) показывать конфликт (уже есть `conflict` в LoadCell) + не блокировать (как Timetta overbooking);
- (б) предупреждать при сохранении в employee-plan-panel;
- (в) жёстко ограничивать (НЕ рекомендуем — Timetta overbooking не блокирует).

**W8.9.** planMethod (EVEN/MANUAL) — индикатор на строке проекта вне панели?
- (а) иконка/бейдж «ручной раскид» на строке;
- (б) подпись в ячейке tooltip;
- (в) не нужно.

**W8.10.** Персон.слот БЕЗ departmentId (employee-plan-panel ставит departmentId сотрудника,
но что если сотрудник без отдела?) — попадает ли в остаток отдела?
- Факт: `deptPersonalHoursInPeriod` фильтрует `s.departmentId===deptId` → слот без отдела
  в остаток НЕ вычитается, но в `employeePersonalHoursInPeriod` (по employeeId) учитывается.
- (а) это корректно (учёт на уровне человека/проекта, не отдела) — задокументировать;
- (б) форсить departmentId при сохранении (panel уже делает `employee.departmentId ?? null`).

**W8.11.** Что показывать в ячейке доски при наличии и брони, и персон.слота на человека
(load = max, но обе плашки видны)?
- (а) одна плашка «Demand = max», бронь — пунктир-индикатор;
- (б) подпись «учтён резерв, план перекрыт»;
- (в) оставить две плашки + tooltip-пояснение.

**W8.12.** При смене EVEN→MANUAL у проекта: старые EVEN-числа отчётов остаются (plannedEffort),
а доска показывает слоты. Нужна ли миграция/пересчёт plannedEffort?
- (а) panel уже пишет plannedEffort=Σслотов при сохранении MANUAL — достаточно;
- (б) предупреждать «Σ слотов ≠ объём, отчёты используют объём».

**W8.13.** При смене MANUAL→EVEN: слоты остаются в БД (не удаляются), но `useManual`=false
их игнорирует на доске. Они «висят». Удалять?
- (а) при переключении на EVEN — спросить «удалить N слотов?»;
- (б) оставлять (история, обратное переключение вернёт);
- (в) скрывать, но не удалять.

**W8.14.** Object-view не выводит employeeId — если оставляем view, добавить колонку
«Сотрудник», чтобы dept/person различались?
- (а) да, добавить; (б) нет, скрыть view целиком (см. W8.2).

**W8.15.** Σ-сверка в employee-plan-panel сейчас «самостоятельна» (без цели) — нужна ли
сверка с ёмкостью сотрудника / остатком отдела при вводе?
- (а) показывать «из них ёмкость сотрудника в месяце X ч»;
- (б) предупреждать при превышении ёмкости;
- (в) оставить как есть.

**W8.16.** Удаление сотрудника (SET_NULL на слоте) → слот с employeeId=null становится
неотличим от dept-слота → «всплывает» в остаток отдела. Ожидаемо?
- (а) да, часы возвращаются в нераспределённый остаток (задокументировать);
- (б) при деактивации — помечать слот, не возвращать молча.

**W8.17.** Нужен ли массовый read слотов (сейчас N запросов на доску, по проекту)?
- Факт: `fetchAllPlanSlots` шлёт N POST. Контракт `/s/plan-slots` read требует projectId.
- (а) follow-up Dev2: read-all / by-period одним вызовом (перф при многих проектах);
- (б) оставить (проектов немного).

**W8.18.** Timesheet vs plan: согласованы ли единицы и округление между слотом (decimals:2)
и фактом/нормой? (визуально проверить, не баг ли округления в Σ).

---

## 6. Рекомендации фиксов (приоритет)

| Приоритет | Фикс | Объём | Файлы |
|-----------|------|-------|-------|
| P0 | B2: прокинуть `slotsByProject` в `deptProjectLoads` → drill бьётся с total | XS (2 строки + тест) | `calc-load.ts`, `board-rows.tsx` |
| P0 | B3: удалить 2 пустых слота (REST DELETE) + серверная валидация upsert уже есть; добавить guard в object (или скрыть view) | XS | dev-БД, `*.view.ts`/nav |
| P1 | B1: подключить слоты к отчётам — минимум timeseries «план месяца» (W8.3-б) | M | `reports-calc.ts`, `reports.logic.ts` |
| P1 | B4/W8.2: скрыть object-view из sidebar ИЛИ read-only + employee-колонка + фильтр непустых | S | nav-меню, view |
| P2 | B5/W8.6: бейдж «N персон.планов» на строке проекта + индикатор planMethod (W8.9) | S | row-компоненты |
| P2 | W8.7: индикатор мэтчинга Σперсон vs план отдела (переиспользовать slotsVsPlannedEffort) | S | drill UI |
| P3 | W8.13/W8.17: очистка слотов при EVEN, массовый read | M | logic + UI |

---

## Приложения — ключевые файлы

- Контракт/персист: `apps/time/src/logic-functions/plan-slots.logic.ts`
- Объект/view/nav: `apps/time/src/objects/credos-time-plan-slot.object.ts`,
  `apps/time/src/views/credos-time-plan-slot.view.ts`,
  `apps/time/src/navigation-menu-items/credos-time-plan-slot.navigation-menu-item.ts`
- Расчётное ядро (rollup): `apps/time/src/front-components/capacity/calc-load.ts`
  (employeeLoadCells:709, deptLoadCells:613, **deptProjectLoads:828 ← B2**)
- Фетч/состояние: `apps/time/src/front-components/capacity/use-capacity.ts`,
  `apps/time/src/front-components/capacity/plan-slots-rest.ts`
- UI-точки ввода: `apps/time/src/front-components/capacity/project-plan-panel.tsx`,
  `apps/time/src/front-components/capacity/employee-plan-panel.tsx`
- Drill вызов: `apps/time/src/front-components/capacity/board-rows.tsx:92` ← B2
- Отчёты (НЕ используют слоты): `apps/time/src/logic-functions/reports-calc.ts`,
  `apps/time/src/logic-functions/projects-plan-fact.ts`
