# Исследование: интерактивные OLAP-отчёты с drill-down на стеке Twenty SDK-app

**Дата:** 2026-06-20 · **Тип:** research (не код) · **Автор:** research-аналитик AITEAM
**Цель заказчика:** «Отчёты» и «Люди» — кликабельны → детализация по человеку/проекту/отделу/виду работ/категории. Полноценный взаимосвязанный OLAP: drill-down, cross-filter, хлебные крошки, безопасно (RBAC/152-ФЗ), красиво (impeccable).

**Что прочитано:** `reports.logic.ts`, `reports-calc.ts`, `REPORTS_CONTRACT.md`, `DATA_MODEL_SYNTHESIS.md`, дашборд `front-components/reports/*`, паттерны `grid/*` + `capacity/*` (RestApiClient, состояние, drill через expand), `PLAYBOOK §9` (грабли песочницы), `DEV_STANDARDS.md`, `PII_152FZ_REVIEW.md`, `CISO-007`, SDK-доки (`research/twenty-sdk/fresh/layout/*`, `config/roles.md`, `logic/logic-functions.md`), impeccable `reference/product.md`.

---

## 0. Краткий контекст (что уже есть)

| Слой | Состояние | Файл |
|---|---|---|
| Сервер-агрегат | `/s/reports` (POST, isAuthRequired). Возвращает СРАЗУ три фиксированных среза: `byDept`, `byProject`, `byEmployee` + `totals`. Каждая строка несёт `byCategory[]` (R3-D2 разбивка). Курсорная пагинация уже есть (`restGetAll`, `limit=60`, `starting_after`). | `logic-functions/reports.logic.ts`, `reports-calc.ts` |
| Дашборд | Период (месяц/квартал/год) + Segmented-переключатель среза (Отдел/Проект/Человек). Плоская таблица: имя · бар · факт · утил · недогруз. KPI-карточки. **Drill НЕТ** — строки не кликабельны. | `front-components/reports/*` |
| Прецедент drill | `capacity` уже делает 1-уровневый drill: отдел → раскрытие списка проектов (`expanded: Set<string>` в React state, `toggle()`, `ProjectDetail`). | `front-components/capacity/capacity-board.tsx`, `project-detail.tsx` |
| Доступ к данным | Два паттерна: `/s/`-logic (агрегаты, сервер считает) и прямой `/rest/<object>` через `RestApiClient` (CRUD сетки). На dev `/s/` отключены → grid ходит на `/rest/*` напрямую. | `reports-rest.ts`, `time-rest.ts`, `capacity-rest.ts` |

**Вывод:** фундамент сильный. OLAP = эволюция `/s/reports` (параметризуемый `groupBy`+`drillPath`) + стек drill-состояния на клиенте + breadcrumbs. Паттерн drill уже отработан в capacity, переносим и обобщаем.

---

## 1. Архитектура агрегации (server-side OLAP)

### 1.1. Где считать — однозначно на сервере

Объём: сейчас ~422 записи, растёт (модель Директум 5 = 34k за 11 лет, т.е. тысячи/год при полном внедрении 5 отделов). Тянуть все `TimeEntry` в песочницу и агрегировать в Web Worker — нельзя:
- песочница без host-DOM, скудная по ресурсам (Remote DOM/Web Worker, PLAYBOOK §9);
- N+1 join'ов (entry→project→category, entry→employee→dept) на клиенте = тормоза;
- раскрытие сырых записей всем = нарушение 152-ФЗ (минимизация).

Агрегация остаётся в `/s/reports`. Текущий `computeReports` уже строит все нужные карты (`projById`, `deptById`, `empById`, `catOfEntry`, `deptOfEntry`) — обобщаем их в произвольную группировку.

### 1.2. Обобщение `/s/reports` → произвольный `groupBy` + `drillPath` + `filters[]`

Сейчас контракт жёсткий: всегда три среза. Для OLAP нужен **один параметризуемый запрос**: «дай мне группировку по измерению X, отфильтрованную контекстом drill (Y=a, Z=b)».

**Измерения (dimensions)** — из `DATA_MODEL_SYNTHESIS`:

| dim | источник в записи | примечание |
|---|---|---|
| `dept` | `employee.departmentId` ?? `project.departmentId` (`deptOfEntry`) | отдел |
| `employee` | `entry.employeeId` | сотрудник (ПДн!) |
| `project` | `entry.projectId` | проект |
| `workType` | `entry.workTypeId` | вид работ (есть в `ApiEntry`) |
| `category` | `project.category` (`catOfEntry`, иначе `OTHER`) | категория проекта (Client/Presale/…) |
| `stage` | `entry.stageId` | ⚠️ **в `RawEntry` сейчас НЕ читается** — добавить поле для drill по этапам |
| `workTypeGroup` | `workType.group` | группа видов работ (производственная/совещания/…) |

> **Находка-грабли:** `RawEntry` в `reports-calc.ts` сейчас несёт только `hours/projectId/employeeId`. Для OLAP по `workType`/`stage`/`workTypeGroup` нужно расширить выборку `restGetAll<RawEntry>` полями `workTypeId`, `stageId` и подтянуть справочник `credosTimeWorkTypes` (для `group`/имени). Категория и отдел — деривативны (через проект/сотрудника), их считать не из записи.

**Черновик контракта запроса:**

```jsonc
POST /s/reports
{
  "from": "2026-01-01T00:00:00.000Z",
  "to":   "2026-06-30T23:59:59.999Z",

  // НОВОЕ: измерение группировки строк ответа (одно). Обратная совместимость:
  // если не задан — поведение как сейчас (три фикс-среза).
  "groupBy": "employee",          // dept|employee|project|workType|category|stage|workTypeGroup

  // НОВОЕ: контекст drill = накопленные фильтры по измерениям (cross-filter).
  // Это "путь" в кубе: где мы сейчас стоим.
  "filters": [
    { "dim": "dept",     "op": "eq", "value": "<deptId>" },
    { "dim": "category", "op": "eq", "value": "CLIENT" }
  ],

  // НОВОЕ: курсорная пагинация строк ответа (для крупных групп, напр. byProject).
  "limit": 100,
  "cursor": null,                 // endCursor предыдущей страницы

  // НОВОЕ: сортировка (опц.)
  "sort": { "by": "fact", "dir": "desc" }   // by: fact|util|under|name
}
```

**Черновик контракта ответа:**

```jsonc
{
  "ok": true,
  "period": { "from": "...", "to": "..." },
  "groupBy": "employee",
  "appliedFilters": [ { "dim": "dept", "value": "<deptId>", "label": "ОПИБ" }, ... ],

  // Агрегат по ТЕКУЩЕМУ срезу с учётом фильтров (= "Итого по этому уровню").
  "totals": { "key": "total", "name": "Итого", "fact": 740, "client": 560,
              "norm": 800, "util": 0.76, "under": 60, "byCategory": [ ... ] },

  // Строки = значения измерения groupBy, уже отфильтрованные по filters[].
  "rows": [
    { "key": "<empId>", "name": "Иванов И.", "fact": 320, "client": 240,
      "norm": 400, "util": 0.75, "under": 80,
      "byCategory": [ { "category": "CLIENT", "hours": 240, "share": 0.75 }, ... ],
      // подсказки для drill: какие дочерние измерения доступны из этой строки
      "drillable": ["project", "workType", "stage"] },
    ...
  ],

  // Пагинация
  "pageInfo": { "hasNextPage": false, "endCursor": null },

  // Доступные оси drill из текущего уровня (для UI-меню "развернуть по…")
  "availableDims": ["project", "workType", "category", "stage", "workTypeGroup"],

  // RBAC-маркер (см. §5): что вернул сервер с учётом роли актора
  "scope": { "level": "department", "deptId": "<id>", "redactedPII": false }
}
```

**Деривация и реализация (минимальная переделка `computeReports`):**

1. Один проход по `entries` (как сейчас), но `bump()` параметризуется **функцией ключа** `keyOf(entry, groupBy)` вместо трёх фикс-карт. `keyOf` для `dept`→`deptOfEntry`, `category`→`catOfEntry`, `workTypeGroup`→`workTypeById(workTypeId).group` и т.д.
2. **Фильтры применяются ДО bump:** `if (!matchesFilters(entry, filters)) continue;`. `matchesFilters` использует те же деривации (`deptOfEntry`, `catOfEntry`). Так cross-filter работает по любой комбинации измерений.
3. Норма (`norm`/`under`) считается только для `groupBy ∈ {dept, employee}` и только если фильтры не делают норму бессмысленной (напр. фильтр по `category` режет факт, но норма периода целая → `under` показывать осторожно или null при активных факт-режущих фильтрах — задокументировать в контракте).
4. `byCategory[]` остаётся на каждой строке (даёт мини-OLAP внутри строки без доп. запроса).

> **Обратная совместимость:** оставить старый ответ (`byDept/byProject/byEmployee`) при отсутствии `groupBy`/`filters`, либо версионировать. Текущий дашборд + виджет «Бюджет» (`project-budget`) читают старый контракт — не ломать в одной волне.

### 1.3. Курсорная пагинация — на двух уровнях
- **Входная (источники):** уже есть `restGetAll` (`starting_after`/`hasNextPage`). Расширить лимит на `credosTimeEntries` за длинные периоды (год × 5 отделов).
- **Выходная (строки ответа):** новая — `byProject`/`byEmployee` при 5 отделах × сотни проектов. `limit`+`cursor`+`pageInfo` в контракте выше. Сервер сортирует и режет после агрегации.

### 1.4. Производительность агрегации
- Сложность — O(entries) на проход + O(rows·cats) на сборку. Линейно, кэшируемо.
- `timeoutSeconds: 20` уже стоит — для года×5 отделов держать в уме (профилировать). При росте — материализованные срезы (см. §6).

---

## 2. Drill-down модель

### 2.1. Дерево измерений (граф путей, не одно дерево)

OLAP-куб ⇒ путей много. Не фиксируем единственную иерархию «Отдел→Сотрудник→…». Любое измерение может быть следующим уровнем (если ещё не в фильтрах). Типовые «естественные» пути:

```
Отдел ─┬─► Сотрудник ─┬─► Проект ─► Вид работ ─► Запись (лист)
       │              └─► Вид работ ─► …
       ├─► Проект ────► Этап ──► Вид работ ─► Запись
       └─► Категория ─► Проект ─► …
Категория ─► Отдел ─► … (обратный взгляд: «кто делает Presale»)
Вид работ ─► Сотрудник ─► … («кто пишет на совещания»)
```

Реализация: каждая строка несёт `drillable[]` = `availableDims` минус уже-применённые. Клик по строке + выбор оси (или дефолтная ось по контексту) = `filters.push({dim: groupBy, value: row.key})` + `groupBy := выбранная_ось`. Лист дерева — `groupBy: "entry"` (список сырых записей) — отдельная ветка контракта (`rows` = записи, не агрегаты), с особым RBAC-гейтом (см. §5).

### 2.2. Состояние drill на клиенте (песочница, без URL/host-DOM)

PLAYBOOK §9: нет `window`/`document`/`getBoundingClientRect`, нет роутинга через URL внутри widget. ⇒ состояние drill — **только React state** (как `expanded` в capacity).

```ts
// Стек уровней = путь в кубе. Каждый уровень фиксирует ось + выбранное значение.
type DrillLevel = {
  dim: Dimension;        // ось этого уровня (по чему группировали)
  value: string;         // выбранный ключ (id отдела/сотрудника/…)
  label: string;         // русский ярлык для крошки ("ОПИБ", "Иванов И.")
};

type DrillState = {
  stack: DrillLevel[];   // [] = корень (срез верхнего уровня)
  groupBy: Dimension;    // текущая ось группировки строк
};
```

- `filters[]` для запроса = `stack.map(l => ({dim:l.dim, op:'eq', value:l.value}))`.
- **Drill down** (клик по строке): `stack.push({dim: groupBy, value: row.key, label: rowLabel}); groupBy = nextDim`.
- **Drill up / breadcrumb** (клик по крошке уровня i): `stack = stack.slice(0, i); groupBy = …`.
- **Cross-filter** (клик по ячейке `byCategory` или по бару): добавить фильтр без смены оси — `stack.push({dim:'category', value:'CLIENT', ...})`, `groupBy` остаётся. Это «отфильтровать текущий список по категории».
- Хранить в одном `useReducer` (actions: `drillInto`, `goToLevel`, `crossFilter`, `setGroupBy`, `reset`). Хук `useReports(period, drillState)` перезапрашивает `/s/reports` при изменении `stack/groupBy` (как сейчас `useReports` реагирует на `[from,to,groupBy]`).
- Кэш в памяти: `Map<serializedDrillKey, ReportsResponse>` чтобы возврат по крошке был мгновенным (без повторного запроса). Сбрасывать при смене периода.

> **Без URL** = состояние не шарится ссылкой и теряется при перезагрузке. Для product-инструмента приемлемо (Linear-tier инструменты часто держат drill в памяти). Если позже понадобится deep-link — это уже host-app фича, не песочница.

---

## 3. UX/UI (impeccable, product-register)

Register = **product** (`reference/product.md`): «инструмент исчезает в задаче», earned familiarity, Restrained-палитра (акцент ≤10% — уже соблюдается в `report-tokens`), tabular-nums (уже есть), системный/один sans, плотность таблиц ОК, мотив 150–250ms только для смены состояния.

### 3.1. Хлебные крошки (breadcrumbs)
Стандартный product-паттерн (product.md прямо разрешает breadcrumbs). Рендер из `stack`:

```
Все отделы  ›  Отдел: ОПИБ  ›  Сотрудник: Иванов И.  ›  Проект: …
   ^корень       ^клик=срез верх.   ^клик=вернуться сюда       ^текущий (не кликабелен)
```

- Каждая крошка = кнопка `goToLevel(i)`. Последняя — текущий уровень (статична, акцент-цвет).
- Корень «Все отделы / Все проекты» = `reset()`.
- Префикс измерения («Отдел:», «Сотрудник:») — из L10N-ярлыков (`departmentLabel`, `WORK_CATEGORY_LABELS` уже есть в `constants/labels.ts`).
- Переполнение на узком виджете: коллапс средних крошек в «…» (раскрыть меню) — без host-DOM, чисто CSS/flex + state. НЕ measure DOM.

### 3.2. Таблица с кликабельными строками
Переиспользовать `BreakdownTable` (grid-раскладка, sticky-заголовок, zebra, tabular-nums — всё уже impeccable-grade):
- Строка → `role="button"`, `tabIndex=0`, hover-фон (`T.rowAlt`/чуть темнее), `cursor:pointer`, обработчик `onDrill(row)`. Клавиатура: Enter/Space (паттерн уже есть в grid `use-keyboard`).
- Если строка — лист (`drillable` пуст) — не кликабельна, обычный курсор.
- **Cross-filter точки:** клик по сегменту `byCategory` (если показываем stacked-bar) или по чипу категории = добавить фильтр. Affordance — тонкий hover-контур, не «изобретённая» кнопка (product ban: invented affordances).
- Меню «развернуть по…»: если из строки доступно >1 оси (`drillable.length>1`) — маленький chevron/контекст-кнопка справа открывает список осей (Проект / Вид работ / Этап). Если ось одна — клик сразу проваливает. Без модалок (анти-паттерн ниже) — поповер-список рядом со строкой (CSS-позиционирование без measure).

### 3.3. Бары и мини-разбивка
- `Bar` (есть) — загрузка относительно нормы/макс. Оставить.
- `byCategory[]` → опционально stacked-bar в строке (цвета категорий из палитры, Restrained). Даёт OLAP-глубину без клика. Это «report drenched in one category color» — единственное место, где product.md разрешает Committed-цвет.

### 3.4. Состояния (product.md: каждый компонент имеет все состояния)
- **Загрузка:** skeleton-строки (не спиннер по центру — product.md против). При drill — держать прошлые строки приглушёнными + skeleton поверх (избежать «прыжка» layout).
- **Пусто:** обучающий текст («За этот срез нет записей. Вернитесь на уровень выше или смените период») + кнопка «На уровень выше», а не голое «Нет данных». Уже частично есть в `BreakdownTable`/`ProjectDetail`.
- **Ошибка:** как сейчас (`Center` с текстом), `role="alert"` (паттерн в capacity-board).
- **RBAC-запрет:** отдельное состояние «Детализация по сотрудникам доступна руководителю» (не пустота, не ошибка — объяснение, см. §5).

### 3.5. «Классно» в ограничениях Remote DOM
- Инструмент-grade плотность + мгновенный возврат по крошке (кэш) = ощущение скорости (Linear-tier).
- Мотив только на смену уровня: 150–200ms cross-fade строк / лёгкий slide крошки. Никаких orchestrated page-load (product ban).
- Один акцент-цвет на «текущий уровень/выбор» (breadcrumb tail, активная ось). Всё остальное — нейтрали (`report-tokens` уже такие).
- tabular-nums везде (есть). Русская локаль чисел (`fmtHrs` уже `ru-RU`).

### 3.6. Анти-паттерны (ЗАПРЕЩЕНО)
- ❌ **Модалки для drill** (product ban «non-standard modals» + нет host-DOM portal). Drill — inline (смена строк) или side-panel внутри виджета, не overlay-модаль.
- ❌ **Градиент-текст**, display-шрифты в данных/лейблах, декоративная анимация.
- ❌ Кастомные скроллбары, изобретённые affordance для стандартных задач.
- ❌ `getBoundingClientRect`/`window`/`document` для позиционирования (PLAYBOOK §9 — краш песочницы).
- ❌ Спиннер по центру контента вместо skeleton.

---

## 4. Связь с «Людьми» (Employee/Department record page)

**Вопрос:** можно ли из index-view объекта (Employee/Department) кликом уйти в OLAP-детализацию? **Что реально на SDK:**

### 4.1. Что SDK НЕ даёт
- Переопределить клик по строке index-view (defineView) на кастомную страницу — **нельзя**. Строка view всегда ведёт на стандартную record page объекта. (`views.md` не даёт хука на row-click.)

### 4.2. Что SDK ДАЁТ (рабочие механики)

**A. Tab с front-component на record page (рекомендуется).**
`definePageLayout` / `definePageLayoutTab` с `objectUniversalIdentifier = Employee/Department` + widget `type: 'FRONT_COMPONENT'`. Front-component на record page получает **`useRecordId()`** (id текущей записи). ⇒ На карточке сотрудника — вкладка «Трудозатраты»: front-component читает `recordId` (= employeeId), вызывает `/s/reports` с `filters:[{dim:'employee', value: recordId}]` и `groupBy:'project'` (или другой). Аналогично карточка отдела — вкладка с `filters:[{dim:'dept', value: recordId}]`.
- Это нативный, чистый путь: пользователь открывает человека/отдел из «Людей» обычным кликом → видит вкладку с его OLAP-детализацией, дальше drill-down внутри виджета.
- ⚠️ `useRecordId()` помечен deprecated в пользу `useSelectedRecordIds()` — уточнить актуальный хук в целевой версии SDK при реализации (риск-неизвестное).

**B. Standalone OLAP-раздел в сайдбаре (уже есть как дашборд).**
`defineNavigationMenuItem` type `PAGE_LAYOUT` → standalone-страница с OLAP-виджетом (текущий «Отчёты» — это он). Из него drill по любому измерению, включая выбор конкретного человека/отдела через фильтр. Не требует record page.

**C. Command-menu / quick-action (Cmd+K).**
`defineCommandMenuItem` + `CommandLink`/`CommandOpenSidePanelPage` — «Открыть детализацию по сотруднику». `availabilityType: RECORD_SELECTION` → доступно при выбранной записи Employee. Может вести в side-panel с OLAP-виджетом. Доп. путь, не основной.

### 4.3. Рекомендация по связи
**A (record-tab) + B (standalone дашборд)** в паре:
- «Люди» → карточка → вкладка «Трудозатраты» (контекст предзадан recordId) — для точечного «посмотреть на этого человека/отдел».
- «Отчёты» (standalone) — для исследовательского OLAP «сверху вниз» с полным drill/cross-filter.
- Обе используют **один** front-component-движок OLAP (props: `initialFilters`, `initialGroupBy`) — DRY. На record page `initialFilters` приходят из `useRecordId()`; на дашборде — пустые.

---

## 5. Безопасность / ПДн (RBAC + 152-ФЗ)

### 5.1. Кто что видит (целевая матрица)

| Роль | Агрегаты по отделам/проектам/категориям | Детализация по сотрудникам (ФИО+util+under) | Сырые записи (лист, `description`) |
|---|---|---|---|
| **Сотрудник** | да (обезличенно: dept/project/category) | **только себя** | только свои |
| **Руководитель** | да | **свой отдел** (scope) | свой отдел |
| **Админ/директор** | да | все | все |

Это прямо из `DATA_MODEL_SYNTHESIS` (утилизация = KPI) + `PII_152FZ_REVIEW`: трудозатраты по человеку = ПДн + оценка производительности ⇒ минимизация (ст. 5), доступ по роли (ст. 7).

### 5.2. ГЛАВНАЯ проблема — гейт должен быть на сервере, но identity недоступна

**Находка (критично, связь CISO-007 + CISO-005):**
- `RoutePayload` (logic-функция `/s/`) **НЕ содержит** актора: ни `currentWorkspaceMember`, ни роли, ни userId (подтверждено по `logic/logic-functions.md` — есть только `headers/body/query/pathParameters/requestContext.http`). `userId/workspaceMemberId` есть только в `DatabaseEventPayload` (триггеры БД), не в HTTP-route.
- Токен приложения (`TWENTY_APP_ACCESS_TOKEN`) — **app-scoped, не user-scoped** ⇒ logic-функция ходит в Core REST правами роли приложения, а не вызвавшего пользователя.
- ⇒ `/s/reports` сейчас раскрывает `byEmployee[42]` любому аутентифицированному (CISO-007, P2). RBAC-гейт на сервере **физически невозможен без предварительного решения identity** (CISO-005).

**Где гейтить:**
- ❌ **Клиент (песочница) — НЕЛЬЗЯ как единственный гейт:** front-фильтр обходится прямым POST `/s/reports`. Клиентский гейт = только UX (скрыть вкладку), не безопасность.
- ✅ **Сервер (logic) — единственно правильно**, НО требует identity. Варианты получить актора в `/s/reports`:
  1. **Передавать `workspaceMemberRef`/employeeId в запросе + валидировать.** Слабо: клиент может подставить чужой. Нужна серверная сверка токена→member. На текущем SDK прямого способа нет.
  2. **`forwardedRequestHeaders`** — пробросить заголовок сессии/identity (если хост его шлёт) и резолвить актора по нему. Зависит от платформы — **проверить, что хост форвардит identity-заголовок** (риск-неизвестное, главный для прода).
  3. **CISO-005 R: серверная привязка userWorkspaceId→employee** (server-side identity). Без неё ни scope по отделу, ни «только себя» не реализуемы корректно. Это блокер полноценного RBAC.

### 5.3. Краткосрочные меры (до решения identity) — по CISO-007
- **R1:** role-guard «детализация по людям только менеджеру» — но требует actor. Пока actor нет — **R3**.
- **R3 (быстро сейчас):** для среза `groupBy:'employee'` и для листа `groupBy:'entry'` — **редактировать ПДн**: возвращать `byEmployee`/записи без ФИО (только key/метрики) ИЛИ отключать срез, пока нет identity. Маркер `scope.redactedPII` в ответе → UI показывает состояние «детализация по людям недоступна» (§3.4).
- **CISO-006:** `from`/`to`/`filters[].value` интерполируются в filter-строки REST → **валидация** (ISO-date / UUID) перед подстановкой. OLAP добавляет много новых параметров (`filters[]`) ⇒ риск инъекции растёт — валидировать каждый `value` по типу измерения (UUID для id-измерений, enum для category/group).

### 5.4. 152-ФЗ дополнительно
- Лист (сырые `TimeEntry` с `description`) — `description` может содержать незапланированные ПДн (152FZ-004). Drill до листа по чужим людям = повышенный риск → жёсткий гейт + аудит доступа (152FZ-006: журнал «кто смотрел чьи трудозатраты»).
- Прод: локализация БД в РФ (152FZ-001, P0-блокер) — не относится к OLAP-фиче напрямую, но OLAP усиливает экспозицию ПДн ⇒ не выходить в прод с детализацией по людям без RBAC+локализации.

**Вывод по безопасности:** OLAP по `dept/project/category/workType` (обезличенные измерения) — безопасен и сейчас. OLAP по `employee`/лист записей — **gated**, требует server-side identity (CISO-005). До неё — редакция ПДн (R3). Это определяет порядок волн (см. §7).

---

## 6. Производительность

| Аспект | Сейчас | Риск при росте | Мера |
|---|---|---|---|
| Объём записей | ~422 | тысячи/год × 5 отделов | агрегация на сервере (есть), курсор на источнике (есть) |
| Выходные строки | 3 фикс-среза | byProject/byEmployee — сотни строк | выходная пагинация `limit`+`cursor` (§1.3) |
| Время агрегации | <20s timeout | год × все отделы | профилировать; при превышении — материализованные дневные/недельные срезы (pre-agg объект) |
| Каждый drill | новый запрос | много кликов = много запросов | клиент-кэш `Map<drillKey, resp>` (§2.2) → возврат мгновенный; debounce смены периода |
| `byCategory` на строку | есть | дёшево (O(cats)) | оставить — даёт глубину без доп. запроса |
| Норма/календарь | курсор `limit=400` | год = ~250 дней OK | следить за лимитом на длинных периодах |

**Главный риск производительности:** не текущий объём, а **число запросов при активном drill** (каждый уровень = round-trip к `/s/reports`, который заново тянет все записи периода и агрегирует). Митигация: (а) клиент-кэш по drillKey; (б) на сервере — если период не сменился, входные данные те же → возможен серверный кэш сырья на короткое TTL (в рамках одного `timeoutSeconds`-инстанса не сохраняется, поэтому кэш — клиентский). При больших объёмах — pre-aggregation (отдельный объект `credosTimeDailyRollup` или materialized view) = фаза оптимизации, не MVP.

---

## 7. Варианты решения + рекомендация

### Вариант M — Минимальный (drill без переписи сервера)
**Что:** клиент-only 1–2 уровня drill поверх СУЩЕСТВУЮЩЕГО ответа `/s/reports` (он уже даёт byDept+byProject+byEmployee+byCategory одним запросом). Клик по отделу → фильтр byProject/byEmployee локально (по `dept`-полю). Breadcrumbs из 2 уровней. Cross-filter по `byCategory` — локально.
- **+** Без правок logic. Быстро (1 волна). Безопасность не ухудшается (данные уже отдаются — но CISO-007 уже открыт).
- **−** Не настоящий OLAP: глубже 2 уровней / по workType/stage — нет (нет данных в ответе). ПДн `byEmployee` всё равно раскрыты (CISO-007 не закрыт). Не масштабируется.
- **Когда:** demo / промежуточный шаг.

### Вариант S — Средний (параметризуемый сервер, без employee-гейта)
**Что:** обобщить `/s/reports` до `groupBy + filters[] + пагинация` (§1.2) для **обезличенных** измерений (dept/project/category/workType/workTypeGroup/stage). Полный drill+cross-filter+breadcrumbs по ним. `employee`-срез и лист записей — **редактированы** (R3, без ФИО) до решения identity. Связь с «Людьми» через record-tab (§4.A) — для отдела (обезличенно) сразу, для сотрудника — после identity.
- **+** Настоящий многомерный OLAP по бизнес-осям. Безопасно (ПДн под редакцией). Закрывает CISO-006 (валидация). Переиспользует drill-паттерн capacity. Масштабируемо (пагинация).
- **−** Детализация именно «по людям» (ключевое требование заказчика про «каждый человек кликабелен») — частична, ждёт CISO-005.
- **Когда:** рекомендуемая цель первой реализации.

### Вариант F — Полный OLAP (S + RBAC по людям)
**Что:** S + server-side identity (CISO-005) → role-guard + scope по отделу + «только себя» → полная детализация по сотрудникам и до листа записей, с аудитом доступа (152FZ-006). Record-tab «Трудозатраты» на карточке сотрудника с полными данными для уполномоченных.
- **+** Полностью закрывает требование заказчика + CISO-007 + 152-ФЗ-минимизацию.
- **−** Зависит от CISO-005 (server-side identity — нетривиально, возможно требует уточнения возможностей SDK/хоста по проброске актора). Больше работы, аудит-журнал, прод-гейты (локализация).
- **Когда:** после/вместе с identity-решением; прод-готовность.

### РЕКОМЕНДАЦИЯ

**Идти S → F волнами.** Сначала S (полноценный OLAP по обезличенным осям + record-tab по отделам + редакция ПДн в employee-срезе) — даёт 80% ценности «взаимосвязанных отчётов» безопасно и без блокера identity. Параллельно/следом — CISO-005 (server-side identity) как отдельная инфраструктурная задача, разблокирующая F (детализацию «по людям» с RBAC). Вариант M — только если нужен быстрый demo до волны S.

**Почему не сразу F:** RBAC по людям упирается в CISO-005 (актор недоступен в `RoutePayload`) — это потенциально требует уточнения механик SDK/хоста (риск-неизвестное). Блокировать весь OLAP ради этого нельзя — обезличенные оси ценны сами по себе.

### Риски / неизвестные (для уточнения при реализации)
1. **R-IDENTITY (высокий):** как `/s/`-logic получает актора/роль. `RoutePayload` его не несёт. Нужно проверить: форвардит ли хост identity-заголовок (`forwardedRequestHeaders`), или нужен другой механизм. Блокер F и полного CISO-007.
2. **R-RECORDID (средний):** `useRecordId()` deprecated. Уточнить актуальный хук получения id текущей записи на record page в целевой версии SDK (для record-tab §4.A).
3. **R-CONTRACT-COMPAT (средний):** текущий дашборд + виджет «Бюджет» читают старый ответ. Обобщение контракта — с обратной совместимостью или версионированием в одной волне.
4. **R-ENTRY-FIELDS (низкий):** `RawEntry`/выборка не несут `stageId`/`workTypeId`/справочник workTypes — добавить для drill по этим осям.
5. **R-NORM-UNDER (низкий):** при факт-режущих фильтрах (category/workType) норма/недогруз становятся некорректны — определить семантику (null или «норма уровня выше») в контракте.
6. **R-PERF (низкий сейчас):** при росте — pre-aggregation; пока хватает on-the-fly + клиент-кэш.

---

## 8. Выводы для GSD-планирования

**Что трогать (объекты / logic / front):**

| Слой | Изменение | Файлы (ориентир) |
|---|---|---|
| logic (сервер) | Обобщить `computeReports` → `keyOf(groupBy)` + `matchesFilters(filters)` + выходная пагинация + валидация params (CISO-006) + редакция ПДн в employee/entry-срезе (R3) + маркер `scope`. Расширить выборку записей полями `workTypeId/stageId` + подтянуть `credosTimeWorkTypes`. Обратная совместимость старого ответа. | `reports.logic.ts`, `reports-calc.ts`, `+ reports-calc.test.ts` |
| контракт (docs) | Обновить `REPORTS_CONTRACT.md`: новый запрос (`groupBy`/`filters[]`/`limit`/`cursor`/`sort`) + ответ (`rows`/`pageInfo`/`availableDims`/`scope`). Версионирование. | `docs/data-model/REPORTS_CONTRACT.md`, `REQ-0003` |
| front (движок OLAP) | `useDrill` (useReducer: drillInto/goToLevel/crossFilter/setGroupBy/reset) + клиент-кэш по drillKey. Обобщить `useReports(period, drillState)`. | новый `front-components/reports/use-drill.ts`, правка `use-reports.ts`, `reports-rest.ts` |
| front (UI) | Breadcrumbs-компонент. Кликабельные строки (`role=button`, клавиатура, hover) в `BreakdownTable`. Поповер «развернуть по…» (без модалок/host-DOM). skeleton-загрузка, обучающие пусто/RBAC-состояния. Опц. stacked-bar `byCategory`. | `breakdown-table.tsx` (правка), новый `breadcrumbs.tsx`, `drill-row.tsx`, `dim-menu.tsx` |
| layout (связь с «Людьми») | `definePageLayoutTab` «Трудозатраты» на record page Employee и Department с widget FRONT_COMPONENT (тот же OLAP-движок, `initialFilters` из `useRecordId()`). | новые `page-layouts/employee-time.ts`, `department-time.ts`, обёртка front-component |
| безопасность | CISO-006 валидация (в logic). CISO-007 R3 редакция (в logic). CISO-005 server-side identity — **отдельная задача-блокер** для F. Аудит-журнал (152FZ-006) — фаза F. | `reports.logic.ts`, `docs/security/findings/CISO-007`, `specs/RBAC_APPROVAL.md` |

**Оценка волн (грубо):**
- **Волна A (Вариант S, ядро):** обобщение сервера + контракт + `useDrill` + breadcrumbs + кликабельные строки + cross-filter по обезличенным осям + skeleton/состояния. Валидация params (CISO-006) + редакция ПДн (R3). → ~1 крупная волна (2–4 дня dev), полностью в 🟢-зоне.
- **Волна B (связь с «Людьми»):** record-tab «Трудозатраты» на карточках Employee/Department + переиспользование OLAP-движка с `initialFilters`. Зависит от уточнения `useRecordId` (R-RECORDID). → ~0.5–1 волна.
- **Волна C (Вариант F, RBAC по людям):** CISO-005 server-side identity (инфра-блокер, риск R-IDENTITY) → role-guard + scope отдела + «только себя» + полная детализация по сотрудникам + аудит-журнал. → отдельная волна, гейтится прод-готовностью (152-ФЗ локализация).
- **(Опц.) Волна D (перф):** pre-aggregation при росте объёма — только когда профиль покажет нужду.

**Порядок:** A → B параллельно с началом C-identity → C. Прод-выход детализации «по людям» — только после C + 152FZ-001 (локализация).

**В 🟢-зоне (DEV_STANDARDS §6):** вся работа — `apps/time/src/{logic-functions,front-components,page-layouts}` через `defineX`. Ядро не трогаем. Файлы <150/200/100 строк, thin→hooks→logic, SSOT, русский UI, named exports, strict TS.
