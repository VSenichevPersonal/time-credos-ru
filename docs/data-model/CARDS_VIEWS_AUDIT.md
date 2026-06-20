# Аудит консистентности: карточки (record pages) ↔ табличные виды (index views)

**Дата:** 2026-06-20
**Объём:** все объекты `credosTime*` модуля time (apps/time).
**Статус:** исправления накатаны на dev-сервер (`yarn twenty dev --once`, 21 created / 20 updated, без ошибок и дублей UUID).

---

## 0. Как устроена карточка записи в Twenty (важно для понимания фикса)

- **Табличный вид (index view)** = `defineView` + `defineNavigationMenuItem`. Колонки = `viewFields`.
- **Карточка записи (record page)** строится из **page-layout типа `RECORD_PAGE`**. Главный виджет — `FIELDS`,
  у которого конфиг `{ viewUniversalIdentifier, newFieldDefaultVisibility }`. **Виджет FIELDS показывает поля,
  привязанные к конкретной view.** Поля объекта, которых в этой view нет, попадают в «скрытые».
- Если у объекта **нет своей `RECORD_PAGE`** — ядро строит дефолтную раскладку, и набор полей карточки/формы
  становится неоднозначным (особенно при нескольких index-view у объекта).
- **Заголовок карточки** = поле `labelIdentifier`. По умолчанию это авто-поле `name` (TEXT), которое мы НЕ заполняем
  → заголовки карточек были пустыми у всех объектов.
- Ограничения ядра: `labelIdentifier` должен быть **searchable-типа (TEXT)**; SELECT/DATE_TIME/NUMBER нельзя.
  Поле-labelIdentifier в каждой view должно стоять в **позиции 0** (самой низкой).

---

## 1. ПРОБЛЕМА 1 — почему в карточке/форме записи не было видно проект

**Диагностика (через `/rest/metadata` dev-сервера):**

- Поле `project` (RELATION → credosTimeProject) на объекте **существует, активно, label «Проект»** — с моделью всё в порядке.
- В данных `projectId` у записей **заполнен** (проверено на `/rest/credosTimeEntries`).
- В index-view «Все записи» колонка `project` **была** (позиция 2, видима).

**Истинные причины (две):**

1. **У `credosTimeEntry` не было своей `RECORD_PAGE`-раскладки.** Карточка/форма строилась ядром по дефолту.
   У объекта ДВЕ index-view («Все записи» pos0 + «Согласование» pos1) → дефолтный FIELDS-виджет привязывался
   неоднозначно, и часть полей (в т.ч. relation-проект) в карточке/форме создания терялась.
2. **`labelIdentifier` = пустое авто-поле `name`** → заголовок карточки пустой, карточка выглядела «голой».
3. Сопутствующе: в index-view **отсутствовали `workType` (вид работ) и `description` (состав работ)** —
   значит и в карточке (FIELDS привязан к view) их не было.

**Что исправлено:**

- Создана собственная **`RECORD_PAGE` «Карточка записи трудозатрат»** (`credos-time-entry.page-layout.ts`):
  один таб «Запись», виджет `FIELDS` с `viewUniversalIdentifier` = view «Все записи», `newFieldDefaultVisibility: true`.
- В view «Все записи» добавлены колонки **«Вид работ»** и **«Состав работ»**.
- `labelIdentifier` записи переключён на `description` («Состав работ», TEXT) → у карточек осмысленный заголовок.
  По требованию ядра «Состав работ» поставлен **первой колонкой** view (label-поле = позиция 0).

Теперь в карточке/форме записи видны: **Состав работ, Дата, Часы, ПРОЕКТ, Вид работ, Сотрудник, Статус.**

---

## 2. Таблица аудита по каждому объекту

Легенда: ✅ было ок · 🔧 исправлено · ➕ добавлено.

| Объект | Назначение (DATA_MODEL) | Поля объекта (ключевые) | Колонки index-view | Карточка (record page) | Найдено / Исправлено |
|---|---|---|---|---|---|
| **credosTimeEntry** «Запись трудозатрат» | атом учёта: дата+часы+проект+работник | date, hours, description, status, approvedBy/At, employee→, project→, stage→, workType→ | 🔧 Состав работ, Дата, Часы, Проект, Вид работ, Сотрудник, Статус | ➕ своя RECORD_PAGE (FIELDS по view) | проект/вид работ/состав не доходили до карточки; пустой заголовок → всё исправлено (см. §1) |
| **credosTimeProject** «Проект» | развитая сущность (code/name, ЖЦ, этапы) | code, externalCode, category, status, startDate/endDate, plannedEffort, approvalRequired, company→, department→, owner→, manager→ | 🔧 Код, Категория, Статус, Клиент, Отдел, Руководитель проекта, Плановые часы | дефолтная (label=code) | в виде не было ключевых связей (Клиент, Руководитель) → ➕ company + manager; 🔧 labelIdentifier=code |
| **credosTimeEmployee** «Работник» | профиль учёта поверх WorkspaceMember | firstName, lastName, middleName, email, jobTitle, active, workspaceMemberRef, department→ | ✅ Фамилия, Имя, Должность, Отдел, Активен | дефолтная (label=lastName) | 🔧 labelIdentifier=lastName (был пустой name) |
| **credosTimeDepartment** «Отдел» | производственное подразделение | code(SELECT), approvalRequired, capacityFactor, headcount, employees→, projects→, workTypes→ | ✅ Код отдела, Согласование, Численность | дефолтная (label=name) | заголовок остаётся `name`: у отдела нет TEXT-поля (code = SELECT, ядро запрещает SELECT как label) |
| **credosTimeStage** «Этап» | подуровень проекта, списание времени | code, status, startDate/endDate, plannedEffort, project→, timeEntries→ | ➕ Код этапа, Проект, Статус, Плановые часы | дефолтная (label=code) | не было своей view/nav → ➕ view «Все этапы» + пункт «Этапы»; 🔧 labelIdentifier=code |
| **credosTimeWorkType** «Вид работ» | справочник видов работ с группировкой | group(SELECT), department→, timeEntries→ | ✅ Группа, Отдел | дефолтная (label=name) | заголовок остаётся `name`: нет TEXT-поля (group = SELECT) |
| **credosTimeBillingLink** «Связь с 1С» | junction проект↔документ 1С (M:N задел) | externalSystem, docType, externalId, number, date, amount, project→ | ➕ Номер, Тип документа, Проект, Дата, Сумма | дефолтная (label=number) | не было своей view/nav → ➕ view «Все связи с 1С» + пункт «Связи с 1С»; 🔧 labelIdentifier=number |
| **credosTimeWorkdayCalendar** «Произв. календарь» | производственный календарь РФ (день=запись) | date, year, dayType(SELECT), hours, note | ✅ Дата, Тип дня, Часов в дне, Год | дефолтная (label=name) | заголовок остаётся `name`: дата = DATE_TIME (ядро запрещает как label); note часто пуст |

---

## 3. Заголовки карточек (labelIdentifier) — итог

| Объект | labelIdentifier | Тип | Заголовок карточки |
|---|---|---|---|
| credosTimeEntry | description | TEXT | состав работ |
| credosTimeProject | code | TEXT | код проекта |
| credosTimeEmployee | lastName | TEXT | фамилия |
| credosTimeStage | code | TEXT | код этапа |
| credosTimeBillingLink | number | TEXT | номер документа |
| credosTimeDepartment | name (авто) | TEXT | — (нет своего TEXT-поля) |
| credosTimeWorkType | name (авто) | TEXT | — (нет своего TEXT-поля) |
| credosTimeWorkdayCalendar | name (авто) | TEXT | — (дата — DATE_TIME) |

**Ограничение ядра:** `labelIdentifier` обязан быть TEXT (searchable). У Department/WorkType/WorkdayCalendar
нет подходящего TEXT-поля, поэтому их заголовок остаётся системным `name`. Если в будущем эти заголовки нужны
осмысленными — добавить им явное TEXT-поле `name`/`title` и назначить labelIdentifier на него.

---

## 4. Запись трудозатрат — фильтрация (Задача 3)

**Принцип двух поверхностей:**

- **Таймшит (недельная сетка, front-component «Трудозатраты»)** — ОСНОВНАЯ поверхность богатой фильтрации
  (по сотруднику/проекту/виду работ/периоду/категории, агрегаты, быстрый ввод). Это кастом-UI вне ядра,
  богатый кастом-фильтр живёт там (см. `TIMESHEET_UX_SPEC.md`, `front-components/grid/use-filters.ts`).
- **Index-view «Записи»** — НАТИВНЫЙ список Twenty с колонками под фильтр. Богатый кастом-фильтр в нативном
  виде НЕ реализуем (это ядро), но нативные фильтры Twenty доступны по каждой колонке.

**Колонки «Все записи» (под нативный фильтр):** Состав работ, Дата, Часы, Проект, Вид работ, Сотрудник, Статус.
Поддерживаемые ядром операнды (см. `research/twenty-sdk/fresh/layout/views.md`):

- Дата (DATE_TIME): IS / IS_BEFORE / IS_AFTER / IS_TODAY / IS_IN_PAST / IS_RELATIVE …
- Часы (NUMBER): IS / GREATER_THAN_OR_EQUAL / LESS_THAN_OR_EQUAL …
- Проект, Вид работ, Сотрудник (RELATION): IS / IS_NOT / IS_EMPTY / IS_NOT_EMPTY.
- Статус (SELECT): IS / IS_NOT / IS_EMPTY.
- Состав работ (TEXT): CONTAINS / DOES_NOT_CONTAIN.

> Категория работ принадлежит **проекту** (`credosTimeProject.category`), а не записи, поэтому в нативном
> виде записей фильтр по категории идёт через связь Проект. Богатый разрез «по категории» — в таймшите.

**Дефолтные viewFilter:**

- «Все записи» — без дефолтного фильтра (это полный список всех записей, фильтр — вручную пользователем).
- «Согласование» — дефолтный фильтр `status IS SUBMITTED` (уже был, сохранён) + добавлена колонка «Вид работ».

---

## 5. Файлы, затронутые в этой сессии

- `objects/credos-time-{entry,project,employee,stage,billing-link}.object.ts` — `labelIdentifierFieldMetadataUniversalIdentifier`.
- `objects/credos-time-{department,work-type,workday-calendar}.object.ts` — комментарий-обоснование (label остаётся `name`).
- `views/credos-time-entry.view.ts` — ➕ Вид работ, Состав работ; перенос label-поля в позицию 0.
- `views/credos-time-approval.view.ts` — ➕ Вид работ.
- `views/credos-time-project.view.ts` — ➕ Клиент, Руководитель проекта.
- `views/credos-time-stage.view.ts` — ➕ новая view «Все этапы».
- `views/credos-time-billing-link.view.ts` — ➕ новая view «Все связи с 1С».
- `page-layouts/credos-time-entry.page-layout.ts` — ➕ RECORD_PAGE карточки записи.
- `navigation-menu-items/credos-time-{stage,billing-link}.navigation-menu-item.ts` — ➕ пункты в папке «Трудозатраты».
- `constants/universal-identifiers.ts` — новые UUID-константы (view/nav/record-page/поля для колонок).

---

## 6. Развитая карточка проекта (RECORD_PAGE со вкладками) — Wave 8

**Дата:** 2026-06-20. **Статус:** накатано (`yarn twenty dev --once`, 35 created / 1 updated, без ошибок и дублей UUID).

Карточка `credosTimeProject` получила собственную `RECORD_PAGE` «Карточка проекта»
(`page-layouts/credos-time-project.page-layout.ts`) с 7 вкладками. Заголовок карточки =
`labelIdentifier` проекта (`code`); поля `name` у объекта нет (см. §3), поэтому «название
проекта как заголовок» сейчас невозможно без добавления TEXT-поля `name`.

**Механика вкладок (как у карточки записи):** FIELDS-виджет показывает поля, привязанные к
конкретной **card-view**. Для каждой содержательной вкладки создана своя card-view
(`key: INDEX`, но **без navigationMenuItem** → в сайдбар не попадает; `position` 10–13).
Вкладки-таблицы дочерних записей построены так: в card-view виден **relation-field обратной
связи** (`timeEntries` / `stages` / `billingLinks`, ONE_TO_MANY) — ядро рендерит его
инлайн-таблицей дочерних записей этого проекта (колонки берутся из самой дочерней записи).
В каждой card-view поле `code` (labelIdentifier) стоит в позиции 0 (требование ядра).

| # | Вкладка | Тип виджета | Что показывает | card-view / источник |
|---|---|---|---|---|
| 1 | **Обзор** | FIELDS | Код, Код клиента/Директум, Клиент, Отдел, Руководитель, Категория, Статус, Дата начала/окончания, Плановые часы | view «Проект — обзор» (10 полей) |
| 2 | **Трудозатраты** | FIELDS (relation) | Инлайн-таблица записей трудозатрат проекта (дата/часы/вид работ/сотрудник/статус — из записи) | view «Проект — трудозатраты» (relation `timeEntries`) |
| 3 | **Этапы** | FIELDS (relation) | Инлайн-таблица этапов проекта | view «Проект — этапы» (relation `stages`) |
| 4 | **Связи с 1С** | FIELDS (relation) | Инлайн-таблица документов 1С (номер/тип/дата/сумма) — задел под финансы | view «Проект — связи с 1С» (relation `billingLinks`) |
| 5 | **Бюджет** | STANDALONE_RICH_TEXT | Заглушка «скоро»: план (`plannedEffort`) vs факт (Σ `hours` записей) | текст-markdown |
| 6 | **Команда** | STANDALONE_RICH_TEXT | Заглушка «скоро»: кто списывал время + Σ часов по сотруднику | текст-markdown |
| 7 | **Документы** | FILES | Нативные attachments проекта | ядро Twenty |

**Файлы Wave 8:**
- `page-layouts/credos-time-project.page-layout.ts` — ➕ RECORD_PAGE «Карточка проекта» (7 вкладок).
- `views/credos-time-project-card-{overview,time-entries,stages,billing-links}.view.ts` — ➕ 4 card-view.
- `constants/universal-identifiers.ts` — ➕ UUID record-page/табов/виджетов/card-view + field-id start/end date.

**Замечание про FIELDS-relation vs «отдельный RELATION-виджет»:** в текущем SDK нет
выделенного RELATION-таблица-виджета по обратной связи. `RECORD_TABLE`-виджет показывает
произвольную view объекта (не фильтруется по родителю). Поэтому связи проекта показаны
нативным способом — relation-field в FIELDS-виджете (рендерится инлайн-списком дочерних
записей, отфильтрованных по родителю автоматически). Это документированный механизм Twenty.

**TODO-доделки (на будущее):**
- «Бюджет план vs факт» — заменить заглушку на AGGREGATE_CHART/BAR_CHART или front-компонент
  (план `plannedEffort` против суммы `hours`; позже — суммы из `billingLinks`).
- «Команда» — front-компонент со сводкой часов по сотрудникам проекта.
- При необходимости «название проекта» в заголовке карточки — добавить TEXT-поле `name`
  и переключить `labelIdentifier`.
