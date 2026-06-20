# DP-0005 — Ресурсная аллокация (Timetta-модель): назначения вместо доли отдела

**Автор:** Dev 1 · **Дата:** 2026-06-22 · **Статус:** PROPOSED (заказчик: «делать правильно сразу»)
**Запрос заказчика:** «доля отделов в проекте — надо как-то по-другому». Сверка с Timetta → делать правильно: аллокация по людям/ролям, time-phased, доля отдела = derived.

## Проблема (тех-разбор текущего)

Загрузка по людям сейчас — **фикция**: `calc-load.ts:311-342` делит загрузку отдела поровну на численность (`load = deptLoad × 1/headcount`). Комментарий в коде: «allocation по людям в модели нет». Три перекрывающихся входа:

| Вход | Что | Проблема |
|---|---|---|
| `credosTimeProjectDepartment` (13b) | отдел × `plannedEffortShare` (часы) | ручной лумп-сум, без людей, не time-phased, Σ≈план не валидируется жёстко |
| `credosTimeDeptPlan` (REQ-0012) | резерв отдела без проекта | отдельный объект, дублирует логику раскида |
| `project.plannedEffort ÷ headcount` | per-employee | равномерный делёж = неправда (кто реально занят — неизвестно) |

## Сверка Timetta (ключевое, по приоритету)

1. **Единица аллокации = РЕСУРС (человек/роль), не отдел.** Отдел/практика = производная (Σ людей). ← главный сдвиг.
2. **Time-phased** (раскид по диапазону/периодам).
3. **Обобщённые роли** как плейсхолдеры до найма.
4. **Тип брони** soft (пресейл) / hard (подтверждено).
5. **Перегруз** виден (Σ человека по всем проектам vs ёмкость).

## Решение: один примитив `credosTimeAssignment`

Заменяет projectDepartment + deptPlan + фикцию-делёж. **Не** per-cell грид (42 чел вручную неподъёмно) — раскид по диапазону дат существующим движком `plannedHoursInPeriod` (time-phasing бесплатно, как у проектов).

### Объект (Dev2)
```
credosTimeAssignment («Назначение ресурса»)
  employee     RELATION → Employee.assignments  (MANY_TO_ONE, nullable; null = обобщённая роль)
  roleLabel    TEXT (nullable)                   — «Аналитик», плейсхолдер до найма
  project      RELATION → Project.assignments    (MANY_TO_ONE, nullable, CASCADE; null = резерв без проекта)
  department   RELATION → Department.assignments  (MANY_TO_ONE, nullable) — для роли/резерва; иначе из employee
  startDate    DATE_TIME
  endDate      DATE_TIME
  plannedHours FLOAT
  bookingType  SELECT [SOFT, HARD]               — пресейл-бронь / жёсткая
```
UUID — генерит Dev2 (зона объектов). Иконка `IconUserCheck`/`IconCalendarTime`.

### Derived (формулы, всё из assignment)
- **Загрузка отдела** за период = Σ assignment, где dept(assignment)=X, раскид `plannedHoursInPeriod`.
  dept(assignment) = `assignment.department ?? employee.department`.
- **Загрузка человека** = Σ его assignment (РЕАЛЬНО, не делёж).
- **Доля отдела в проекте** = Σ assignment проекта, сгруппированная по dept (заменяет ручной projectDepartment).
- **Перегруз** человека = Σ его assignment по ВСЕМ проектам за период vs личная ёмкость.

### Валидация (мягкая)
Σ `plannedHours` assignment проекта vs `project.plannedEffort` → бар-варн «распланировано N / M ч» (не блок; пресейл может быть неполным).

## UI (Dev 1, переиспользует)

1. **Карточка проекта, вкладка «Команда»** → строки-назначения: `ресурс | даты | часы | чип soft/hard`, inline-edit на паттернах `ProjectDeptRow` + `usePlanEdit`. Add-resource: выбрать сотрудника ИЛИ ввести роль. Footer-бар «Σ vs plannedEffort» (`<Explainable>` — из чего сложилось).
2. **Доска планирования, ось «Люди»** → реальная загрузка (убрать `1/headcount`). Перегруз-подсветка — `cap-tokens` (ratio>1 = тревога) уже есть.
3. **soft/hard визуал**: hard = сплошной, soft = штрих/светлее (пресейл-бронь явно отличима).

## Миграция (Dev2)

- `projectDepartment` → assignment (`employee=null`, `department`=отдел доли, `plannedHours`=share, даты проекта, `bookingType=HARD`).
- `deptPlan` → assignment (`project=null`, `department`=отдел, часы/даты плана).
- Старые объекты: оставить read-only/derived или удалить после backfill. Backfill — post-install (как `backfill-project-departments`).

## Фазы

| Фаза | Кто | Что |
|---|---|---|
| 1 | Dev2 | объект `credosTimeAssignment` + SELECT bookingType + REST + миграция share/deptPlan |
| 2 | Dev1 | `assignment-types` + `calc-assignment` (заменить `employeeLoadCells` делёж) + проводка доски |
| 3 | Dev1 | вкладка «Команда» карточки: team-edit (строки-назначения, add-resource, Σ-бар) |
| 4 | Dev1/Dev2 | soft/hard визуал + перегруз cross-project + deprecate старых вводов |

## Зоны / риск
- Контракт (поля/формулы) — этот DP. Объект+миграция = Dev2. Calc+UI = Dev1.
- Риск: переписывание свежих 13b/REQ-0012. Митигация: миграция-backfill, не потеря данных. Доска рендер не меняется (LoadCell[]), меняется источник load — низкий риск регресса при покрытии calc unit-тестами (QA).

## Связи
REQ-0013 (13b доли — поглощается), REQ-0012 (deptPlan — поглощается), DP-0001 (capacity board), REPORTS_CONTRACT byEmployee (станет реальным, не делёж).
