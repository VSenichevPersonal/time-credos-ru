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
- **`norm` (норма)** — нормо-часы периода из производственного календаря `credosTimeWorkdayCalendar`:
  - база = Σ `hours` рабочих дней периода (`dayType` ∈ {`WORKDAY`, `SHORT`});
  - **отдел:** `база × headcount × capacityFactor`;
  - **сотрудник:** `база × capacityFactor отдела` (личная норма);
  - **проект:** норма не определена → `norm = null`, `under = null`.
- **`under` (недогруз)** = `norm − fact`. `> 0` — недозагрузка, `< 0` — перегруз. UI: цвет (зелёный недогруз / красный перегруз).
- **`byCategory` (R3-D2)** — разбивка `fact` по категории проекта: `[{category, hours, share}]`, отсортировано по убыванию часов; `share = hours/fact`. Есть на `totals`, `byDept`, `byEmployee`, `byProject`. Сумма `hours` == `fact` строки. Записи без проекта/категории → бакет `OTHER`. UI: stacked-bar / разбивка в строке.
- **`plannedEffort`/`budgetUsed` (F-A, только byProject)** — план проекта и доля выработки (`fact/plannedEffort`); `budgetUsed > 1` = перерасход (алерт), `null` если плана нет.

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

## Замечания

- Пагинация: Core REST отдаёт max 60/страница → `reports.logic` идёт по курсору `starting_after` (`restGetAll`) и собирает ВСЕ записи/проекты/сотрудников/календарь. Лимита данных нет.
- Значения SELECT на сервере — UPPER_CASE (`CLIENT`, `WORKDAY`, `SHORT`).
