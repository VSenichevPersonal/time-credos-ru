# RECON: Float (float.com) — SaaS ресурсного планирования

Дата сбора: 2026-06-21. Источник — публичные support/product страницы Float. Всё ниже —
проверяемое из доков; где не нашёл, помечено «не нашёл».

---

## 1. Модель данных

Сущности и публично видимые поля (из glossary, allocate-time, project-view):

- **Person (ресурс)** — поля: роль (role), отдел (department), person tag, person type,
  manager, cost rate, bill rate, standard working hours/days, доступность (availability).
- **Allocation (бронь / назначение)** — «Planned assignment of a person's time to a specific
  project. Basic scheduling unit at Float.» (glossary). Поля:
  - Project (обязательное — каждая бронь привязана к проекту)
  - Phase (опционально, если у проекта есть фазы)
  - Task (опционально; есть фильтр «No task used»)
  - h/day — часы в день (основная единица)
  - Percentage — % от рабочего времени (100% = полная ёмкость)
  - Dates — период (с гибким или зафиксированным концом)
  - Notes — заметки (лимит 1500 символов)
  - Assigned to — один или несколько людей
  - Allocation status (см. ниже)
- **Project** — поля: name, status, code, client, budget type, фазы (phases), project owner,
  project tag, project status. Профициент/бюджет считается из scheduled hours × bill rates.
- **Time off** — «Periods during which a team member is unavailable… factored into capacity
  calculations» (glossary). Учитывается в ёмкости.
- **Allocation status** — зависит от стадии проекта/фазы: Draft, Tentative, Confirmed,
  Completed, Canceled. «Tentative allocation — yet to be confirmed; allocations linked to
  tentative projects/phases are tentative as well.»

> Важно для нас: НЕТ отдельной сущности «команда» как контейнера броней — агрегация по команде
> строится группировкой людей (по role/department), а не отдельной сущностью.

---

## 2. Source of truth

- **Человек, не команда.** Базовая единица — Person + его Allocations. Команда — это группировка.
- **Schedule — единый source of truth:** «All work allocated to your team lives on the Schedule,
  making it the single source of truth for everything that's planned» (capacity-planning).
  «The Schedule page visualizes your team's planned work on a calendar timeline.»
- **Направление агрегации:** снизу вверх. Capacity и utilization считаются на уровне человека,
  затем People Report группирует их по Roles / Departments / Projects / Tasks (вкладки), строку
  можно развернуть и «split by person». Явной формулы каскадной агрегации док не приводит, но
  структура — person → группа.

---

## 3. UX планирования

- **Экраны:** Schedule (общий таймлайн команды) и Project view (один проект за раз).
- **Project view:** «Use the Project view to scope and manage one project at a time.» Quick-add
  allocations по умолчанию привязаны к этому проекту (не надо каждый раз выбирать проект).
- **Group by / сортировка:** в Project view люди группируются с ролью, cost rate, bill rate,
  utilization за период; сортировка — по алфавиту, стоимости, тарифам, доступности или вручную.
  Полный список Group-by на Schedule (day/week/month переключатели) — **не нашёл** в открытых
  статьях (Schedule-обзор не детализирует визуальные переключатели; ссылается на отдельную
  статью «Get to know your Schedule», которую не доставал).
- **Как вводят план/allocation:** «click a specific date on the Schedule, click and drag across
  multiple days, or use the keyboard shortcut "T"».
- **Единицы:** основная — **h/day** (часы в день), поле prefilled из доступности человека.
  Альтернатива — **percentage** (100% = полная ёмкость). **FTE — не нашёл** (термин в доках
  не встречается).

---

## 4. Визуал занятости (capacity / utilization)

- **Capacity:** «The total amount of work hours available for a team or individual… taking into
  account standard work hours, planned work, and upcoming time off» (glossary).
- **Utilization:** «A percentage of hours scheduled out of total capacity. If 20 hours are
  scheduled in a 40-hour week, that's 50% utilization.»
- **Единицы отображения:** переключатель часы ↔ проценты («Display utilization in hours or
  percentages»; иконки clock / %).
- **Цвета / пороги (date-range-insights):**
  - **RED** — «Over capacity. Overall utilization in the selected timeframe is above 100%
    (no unscheduled time remains), and overtime is scheduled.»
  - Зелёный/нейтральные пороги для <100% — точные цвета **не нашёл** дословно.
- **«Heatmap» как термин в glossary не упоминается**; маркетинг (search-snippet) говорит про
  «red heatmap» на расписании, но в support-доках слово heatmap не подтверждено — фиксирую как
  не подтверждённое доком. Подтверждено: фон брони краснеет при overtime.

---

## 5. Овербукинг (overallocation)

- Определение: «Allocations beyond team members' capacity (overallocation).»
- Поведение: **warning через цвет, не блокировка.** «If you schedule over a person's capacity
  for the day, the background behind the allocation will turn red to indicate overtime»
  (glossary). Жёсткого блока ввода (нельзя сохранить) в доках **не нашёл** — переплан разрешён
  и подсвечивается.
- В date-range-insights: общий индикатор периода краснеет при utilization >100% или наличии
  overtime при исчерпанной ёмкости.
- Метрики: Utilization (сколько распределено), Remaining capacity (свободные часы), Overtime
  (часы сверх лимита).

---

## 6. Память контекста / Views

- **Views** = сохранённые фильтры + порядок сортировки. «Create filters and easily save, share,
  and switch between different views… save filters and sort orders to quickly access the items
  you need most.»
- **Что persist:** фильтры + sort order. **Custom (ручная) сортировка НЕ сохраняется** в View.
  Группировка как отдельно сохраняемая сущность — явно не описана (сохраняются фильтры+сортировка).
- **Типы:** Personal views (на всех планах, видны только автору) и Shared views (Pro/Enterprise;
  создают Managers/Admins/Account Owners, видны всем).
- **Где доступны:** Schedule, Project plan, People, Projects, Reports, Log time.
- **Фильтры переносятся между страницами:** «If you set them on the Schedule page, they will
  follow you if you move to Project plan, Log team or Report.»
- **Полный список фильтров:** Department, Role, Person, Person tag, Person type, Manager,
  Time off, Time off status, Client, Project, Phase, Project tag, Project owner, Project status,
  Task, Allocation status (+ спец. «No task used», «Me»).
- **Операторы:** AND (между категориями), OR (значения внутри категории), is / is not.

---

## 7. Что ПРИМЕНИМО нам

Наш стек: **Twenty CRM + Remote DOM**, БЕЗ drag-and-drop, без прямого доступа к host-DOM.

**Переносимо (концептуально, без DnD):**
- Модель данных: Person + Allocation(project, phase, task, h/day | %, dates, status) ложится на
  Twenty-объекты напрямую. Allocation как базовая единица — здравая основа.
- Единица **h/day** и переключатель часы ↔ %  — простые числовые поля + toggle, без DOM-хаков.
- **Source of truth = расписание/записи человека**, агрегация снизу вверх по role/department —
  совпадает с нашей памятью «OLAP-связь-с-людьми» и «человек, не команда».
- **Allocation status** (Draft/Tentative/Confirmed/...) → enum-поле; tentative наследуется от
  проекта/фазы — простое правило.
- **Цветовой порог overallocation:** util >100% → красный. Это чистая логика по данным,
  реализуется на уровне рендера ячейки (цвет фона) без DnD и без host-DOM.
- **Views = сохранённые фильтры + сортировка**, personal/shared, переносимы между экранами.
  Совпадает с задачами saved-views в нашем sort-header/breakdown-table. Persist в БД, не в DOM.
- **Богатый набор фильтров + операторы AND/OR, is/is not** — переносимо как декларативный фильтр.
- **Project view** (scope один проект, quick-add со связью с проектом) — переносимо как
  отфильтрованный вид.

**НЕ переносимо / переносимо с оговорками:**
- **Drag-to-create / click-drag по таймлайну** — основной способ ввода в Float. У нас DnD нет →
  заменяем формой ввода (часы/даты/проект) + быстрый ввод по клику на ячейку (модалка), без drag.
  Шорткат «T» можно сымитировать клавиатурным хендлером, но без перетягивания диапазона.
- **Интерактивный heatmap-таймлайн с перетягиванием границ брони** — недоступен без DnD/host-DOM;
  заменяем таблицей/сеткой с цветовыми ячейками (read-heavy), редактирование — через форму.
- **FTE** — в Float нет, и нам по памяти «no-billable-concept» подобные финметрики ограничивать;
  bill rate / billable % у Float завязаны на биллинг — нам НЕ переносить (cost-rate допустим).
- Тонкие цветовые градиенты загрузки <100% — док не даёт порогов, не копируем вслепую.

---

## 8. Ссылки-источники (реально открыл)

- https://support.float.com/en/articles/13847946-capacity-planning-and-resource-scheduling
- https://support.float.com/en/articles/4188692-allocate-time
- https://support.float.com/en/articles/11468891-schedule-plan-your-team-s-work
- https://support.float.com/en/articles/11405498-project-view
- https://support.float.com/en/articles/8282472-views
- https://support.float.com/en/articles/8820706-the-float-glossary
- https://support.float.com/en/articles/8850727-date-range-insights
- https://support.float.com/en/articles/28939-search-and-filter
- https://support.float.com/en/articles/4385599-people-report
- https://www.float.com/product/reports

Не открыл / 404: https://www.float.com/product (404).
Не детализировано в открытых статьях: Group-by и day/week/month переключатели Schedule
(нужна статья «Get to know your Schedule»).

---

## Вердикт: полезен ли как референс и чем

**Да, полезен — как концептуальный, не UX-механический референс.** Сильные стороны для нас:
(1) чистая модель Person→Allocation(project/phase/task, h/day|%, status) — прямо ложится на Twenty;
(2) «человек как source of truth» + агрегация снизу вверх по role/department — совпадает с нашим
направлением; (3) overallocation как мягкий цветовой warning (>100% → красный), а не блок —
реализуемо без DnD/host-DOM; (4) Views = persist фильтров+сортировки (personal/shared,
кросс-страничные) — готовый паттерн для наших saved-views.

**Ограничения:** ключевой UX-ввод Float построен на drag-and-drop по таймлайну — нам недоступен,
заменяем формой + клик-модалкой. Heatmap-таймлайн с перетягиванием границ не воспроизводим.
Биллинг-метрики (bill rate, billable %, FTE) — НЕ переносить (наша линия no-billable).
Итог: брать модель данных, статусы, логику overallocation и Views; не брать DnD-таймлайн и биллинг.
