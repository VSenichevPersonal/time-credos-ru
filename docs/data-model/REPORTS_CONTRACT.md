# Контракт /s/reports — агрегатная аналитика (для Dev 1)

**Дата:** 2026-06-20 · **Волна:** 2 · **Автор:** Dev 2
**Источник:** `apps/time/src/logic-functions/reports.logic.ts`
**Потребители:** UI «Отчёты» (дашборд) + UX-2 группировка «по людям» в «Планировании».

---

## Эндпоинт

```
POST /s/reports        (isAuthRequired: true)
Content-Type: application/json
```

Паттерн вызова — как у `/s/time-entry` и `/s/approval` (logic-функция поверх Core REST воркспейса). Параметры можно слать в body или query.

## Запрос

| Поле | Тип | Обяз. | Описание |
|---|---|---|---|
| `from` | ISO datetime | нет | Начало периода (вкл.). По умолчанию `1970-01-01`. |
| `to` | ISO datetime | нет | Конец периода (вкл.). По умолчанию `2999-12-31`. |
| `groupBy` | `'dept' \| 'project' \| 'employee'` | нет | Подсказка UI о приоритетной группировке. Ответ ВСЕГДА содержит все три массива; параметр не влияет на расчёт. |

Пример:
```json
{ "from": "2026-01-01T00:00:00.000Z", "to": "2026-06-30T23:59:59.999Z", "groupBy": "dept" }
```

## Ответ

```ts
{
  ok: true,
  period: { from: string; to: string },
  groupBy: string | null,
  totals: Row,                                  // агрегат по всему периоду
  byDept:     Row[],                            // по отделам (все отделы, даже с fact=0)
  byProject:  ProjectRow[],                     // только проекты с записями за период
  byEmployee: (Row & { dept })[],               // только сотрудники с записями за период
}

type CategoryShare = {
  category: string;     // CLIENT/PRESALE/.../OTHER (UPPER_CASE; OTHER = без проекта/категории)
  hours: number;        // Σ часов категории внутри строки
  share: number | null; // hours / row.fact (0..1), null если fact == 0
}

type Row = {
  key: string;          // id сущности (для total — 'total')
  name: string;         // отдел: код (OV/OIB/...); проект: name; сотрудник: «Фамилия Имя»
  fact: number;         // Σ часов всех записей группы (факт)
  client: number;       // Σ часов записей проектов категории CLIENT
  norm: number | null;  // нормо-часы периода (null для проектов)
  util: number | null;  // утилизация = client / fact (0..1), null если fact == 0
  under: number | null; // недогруз = norm − fact (null где norm null)
  byCategory: CategoryShare[]; // R3-D2: разбивка часов по категории (по убыв.), для total/dept/employee/project
}

// byProject = Row + поля проекта (F-A бюджет)
type ProjectRow = Row & {
  code: string | null;
  category: string | null;
  plannedEffort: number | null;  // план проекта (часы)
  budgetUsed: number | null;     // fact / plannedEffort (доля выработки), null без плана
}
```

При ошибке: `{ ok: false, error, apiBase, hasToken }` (роут не падает 500).

## Семантика метрик

- **`fact`** — фактически списанные часы (все статусы записей; нулевые часы игнорируются).
- **`client`** — часть `fact`, попавшая на проекты категории `CLIENT`.
- **`util` (утилизация)** = `client / fact`. Доля «клиентского» (оплачиваемого профиля) времени. `null` при нулевом факте — UI показывает «—».
- **`norm` (норма)** — нормо-часы периода из производственного календаря `credosTimeWorkdayCalendar`, **за вычетом отсутствий** (F-D):
  - база = Σ `hours` рабочих дней периода (`dayType` ∈ {`WORKDAY`, `SHORT`});
  - **отдел:** `база × headcount × capacityFactor − Σ часов отсутствий сотрудников отдела`;
  - **сотрудник:** `база × capacityFactor отдела − часы отсутствий сотрудника` (личная норма);
  - **проект:** норма не определена → `norm = null`, `under = null`.
  - **Норма не опускается ниже 0** (`Math.max(0, …)`) — защита от переучёта отсутствий.
- **`under` (недогруз)** = `norm − fact`. `> 0` — недозагрузка, `< 0` — перегруз. UI: цвет (зелёный недогруз / красный перегруз).
- **`byCategory` (R3-D2)** — разбивка `fact` по категории проекта: `[{category, hours, share}]`, отсортировано по убыванию часов; `share = hours/fact`. Есть на `totals`, `byDept`, `byEmployee`, `byProject`. Сумма `hours` == `fact` строки. Записи без проекта/категории → бакет `OTHER`. UI: stacked-bar / разбивка в строке.
- **`plannedEffort`/`budgetUsed` (F-A, только byProject)** — план проекта и доля выработки (`fact/plannedEffort`); `budgetUsed > 1` = перерасход (алерт), `null` если плана нет.

## Норма с учётом отсутствий (F-D phase2)

Норма сотрудника/отдела уменьшается на рабочие часы **отсутствий** (`credosTimeAbsence`: отпуск/больничный/без содержания/иное), попадающих в отчётный период.

**Как считается (`reports-calc.ts`):**
1. `reports.logic` грузит отсутствия, пересекающие период: фильтр `startDate[lte]:to, endDate[gte]:from`.
2. Из производств. календаря строится карта `день(YYYY-MM-DD) → часы` только по рабочим дням (`WORKDAY`/`SHORT`).
3. Для каждого отсутствия суммируются часы рабочих дней календаря, чей день попал в `[startDate, endDate]` отсутствия **И** в отчётный период `[from, to]` (сравнение по дню, включительно). Выходные/праздники не в карте → дают 0.
4. Часы отсутствий агрегируются по сотруднику и по отделу (Σ его сотрудников).
5. Норма сотрудника `= база × capacityFactor − часы_отсутствий_сотрудника`; норма отдела `= база × headcount × capacityFactor − Σ часов_отсутствий_сотрудников_отдела`. Обе через `Math.max(0, …)`.

**Эффект:** недогруз (`under = norm − fact`) корректнее — отпуск/больничный снижают плановую норму, человек в отпуске не считается «недозагруженным».

**Деградация:** если у дня календаря нет `date` (старые данные) — отсутствие нечего сопоставить по дате, вычет = 0 (норма как раньше). Проект — `norm = null`, отсутствия на него не влияют.

## Секция `byCategory` (R3-D2, для Dev1-viz)

Разбивка факта строки по **категории проекта** — готовая структура для stacked-bar / донат / разбивки внутри строки. Backend (`reports-calc.ts` → `buildCats`) уже это отдаёт; UI ничего не пересчитывает.

**Где есть:** `totals.byCategory`, `byDept[].byCategory`, `byEmployee[].byCategory`, `byProject[].byCategory` — на каждой строке свой массив.

**Структура элемента:**
```ts
type CategoryShare = {
  category: string;     // значение поля category проекта (UPPER_CASE): CLIENT/PRESALE/PILOT/
                        // INTERNAL/INFRASTRUCTURE/TRAINING; 'OTHER' — записи без проекта/категории
  hours: number;        // Σ часов категории внутри строки, округл. до 2 знаков
  share: number | null; // hours / row.fact (0..1), округл. до 4 знаков; null если row.fact == 0
}
// byCategory: CategoryShare[]  — отсортирован по убыванию hours
```

**Инварианты:**
- `Σ byCategory[].hours == row.fact` (часы строки полностью разложены по категориям).
- `Σ byCategory[].share ≈ 1.0` (при `fact > 0`; погрешность округления ≤ ~0.0004).
- Массив отсортирован по `hours` убыв.; первый элемент — крупнейшая категория.
- При `row.fact == 0` массив пустой `[]`.

**Пример (`totals.byCategory`):**
```json
"byCategory": [
  { "category": "CLIENT",   "hours": 184.5, "share": 0.6150 },
  { "category": "INTERNAL", "hours": 72.0,  "share": 0.2400 },
  { "category": "PRESALE",  "hours": 28.5,  "share": 0.0950 },
  { "category": "OTHER",    "hours": 15.0,  "share": 0.0500 }
]
```

**Подсказки viz:**
- Для stacked-bar держать стабильный порядок/цвет категорий между строками — сортируй цвета по фикс. словарю категорий, не по `hours` (иначе цвета «прыгают» между отделами).
- `share` уже доля 0..1 → проценты = `share * 100`.
- `OTHER` — служебный бакет (нераспределённое/без проекта); выделять нейтральным серым.

## Подсказки для UI

- Утилизацию показывать в процентах: `util * 100`, 0 знаков (или «—» если `null`).
- `byDept` отсортирован в порядке отделов как пришли из REST; UI может пересортировать.
- `byProject` несёт `category` (CLIENT/PRESALE/PILOT/INTERNAL/INFRASTRUCTURE/TRAINING) — можно фильтровать/красить.
- `byEmployee[].dept` — код отдела сотрудника для группировки «по людям» внутри отдела (UX-2).
- Для «загрузки вперёд» (capacity H2) использовать отдельный capacity-расчёт по `plannedEffort`+`startDate..endDate` — это другой источник, не /s/reports (он считает ФАКТ vs НОРМУ за прошедший/текущий период).

## Режим `timeseries` — тренд утилизации по месяцам (C4)

Динамика факт/норма/утилизация/недогруз **по месяцам** за период (напр. янв–дек) — для линейного/столбчатого тренда (аналог reporting Kimai «динамика»). Тот же расчёт, что в основном режиме (календарь + отсутствия + FTE-headcount), но разложенный по месяцам даты записи.

**Включение:** `mode=timeseries` (или `groupBy=month`). Опц. фильтр отдела — `departmentId` (id отдела).

**Запрос:**
| Поле | Тип | Обяз. | Описание |
|---|---|---|---|
| `from`/`to` | ISO datetime | нет | Границы периода (как в осн. режиме). |
| `mode` | `'timeseries'` | да* | Включает режим тренда. *Либо `groupBy=month`. |
| `departmentId` | string (id) | нет | Считать только записи и норму этого отдела. Пусто → весь воркспейс. |

Пример:
```json
{ "from": "2026-01-01T00:00:00.000Z", "to": "2026-12-31T23:59:59.999Z", "mode": "timeseries", "departmentId": "d-uuid" }
```

**Ответ:**
```ts
{
  ok: true,
  period: { from: string; to: string },
  departmentId: string | null,   // эхо примененного фильтра отдела
  months: TimeseriesPoint[],      // отсортированы по возрастанию 'YYYY-MM'
}

type TimeseriesPoint = {
  month: string;        // 'YYYY-MM' (бакет месяца)
  fact: number;         // Σ часов записей месяца (после опц. фильтра отдела)
  client: number;       // Σ клиентских часов месяца (проект категории CLIENT)
  norm: number;         // нормо-часы месяца (раб. дни месяца × headcount/FTE × factor − отсутствия)
  util: number | null;  // client / fact, null если fact == 0
  under: number;        // norm − fact (> 0 недогруз, < 0 перегруз)
}
```

**Семантика:**
- Факт раскладывается по месяцу поля `credosTimeEntry.date`. Запись без `date` в бакеты **не попадает** (безопасная деградация).
- Норма месяца = Σ по отделам (или один отдел при фильтре): `база_месяца × headcount × capacityFactor − отсутствия(отдел, месяц)`, `Math.max(0, …)` на отдел. `база_месяца` = Σ часов рабочих дней (`WORKDAY`/`SHORT`) этого месяца из календаря.
- `headcount` — FTE-численность (REQ-0011): Σ `ftePercent/100` активных в периоде назначений; без `assignments` — count активных сотрудников. Постоянна в пределах периода.
- Месяцы точек = **месяцы с фактом ∪ месяцы рабочего календаря** → пустой месяц (есть норма, нет записей) тоже точка: `fact=0, client=0, util=null, under=norm`.

**Инвариант:** `Σ months[].fact == totals.fact` основного режима, `Σ months[].client == totals.client`, `Σ months[].norm == totals.norm` за тот же период (тот же набор рабочих дней/отсутствий, лишь сгруппированный по месяцам).

> **Follow-up Dev 1 (UI):** фронт тренда (линия/столбцы факт vs норма + util %) — отдельная задача Dev 1. Бэкенд-контракт готов; UI ничего не пересчитывает.

## Замечания

- Пагинация: Core REST отдаёт max 60/страница → `reports.logic` идёт по курсору `starting_after` (`restGetAll`) и собирает ВСЕ записи/проекты/сотрудников/календарь. Лимита данных нет.
- Значения SELECT на сервере — UPPER_CASE (`CLIENT`, `WORKDAY`, `SHORT`).
