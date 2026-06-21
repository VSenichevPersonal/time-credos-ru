# Runn — RECON (референс по ресурсному планированию)

Контекст: вспомогательный референс для нашего учёта времени (Twenty CRM + Remote DOM, без drag-and-drop). Зафиксировано только проверяемое по публичным help/developer-докам Runn. Где не нашёл — помечено «не нашёл».

## 1. Модель данных

Сущности (из People/Project Planner и REST API v1, `https://api.runn.io`, OpenAPI v3.1):

- **People** — сотрудники; есть рабочие контракты (contracts), роли по умолчанию (default role), employment type, skills, tags, custom fields.
- **Placeholders** — заполнители незакрытого спроса (роль/позиция без конкретного человека). Представляют «неудовлетворённый спрос».
- **Projects** — проекты; имеют бюджет (опц.), статус confirmed / tentative.
- **Phases** — этапы проекта (цветные линии на таймлайне).
- **Milestones** — вехи (иконки на линии проекта).
- **Assignments** — назначение человека/placeholder на проект: связь person × project × role, нагрузка (часы/день и период start/end). Это ключевая сущность бронирования.
- **Actuals (timesheets)** — фактически залогированные часы.
- **Time off** — отпуска/нерабочее время, вычитается из доступности.
- **Roles**, **Contracts**, **Skills**, **Workstreams**, **Tags**, **Custom fields**.

API: REST, JSON, заголовок `Accept-Version`, доступ только администраторам. Эндпоинты ресурс-ориентированные: `GET /people/:id/projects`, `GET /people/:id/assignments`, `GET /people/:id/skills`. Полная схема — OpenAPI: `https://developer.runn.io/openapi/v1.0.0.json` (детальные поля каждого DTO в JSON-схеме; здесь не выгружал построчно — «не выгружал поля построчно»).

GraphQL: не нашёл (API именно REST).

## 2. Source of truth

Двойственная, но первично — **проект как источник назначений**. Availability Summary в People Planner считается **по Scheduled Hours (Assignments)**, т.е. агрегат назначений снизу вверх → к человеку и к команде. Назначения создаются и в Project Planner (на проект), и видны в People Planner (по человеку) — одна сущность Assignment, две проекции. Направление агрегации: assignments → человек → группа (team/role).

## 3. UX планирования

- **People Planner** — по умолчанию показывает Availability в часах по людям и placeholders, сгруппированным по Team. «Птичий полёт» доступности/перегруза по командам и ролям. Группировки: Team (деф.), Default Role, Employment Type, Skills, Tags, Projects, Workstreams, custom fields.
- **Project Planner** — все проекты, разворачиваются в команду и распределение; phases (цветные линии), milestones (иконки), assignments, индикатор бюджета.
- **Единицы отображения assignments (4 варианта):** часы/день, часы/неделю, **FTE**, **% capacity**. Плюс отдельно **% utilization**.
- Группировка людей и переключатель tentative — основные «переключатели».

## 4. Визуал занятости (heatmap)

People Planner heatmap по доступности (зафиксированные пороги из help):

- Зелёный — 75–100% свободно
- Светло-голубой — 50–74%
- Тёмно-голубой — 25–49%
- Насыщенный голубой — 0–24%
- Синий с **красной полосой** — овербукинг
- Затенённая область — выходные/отпуска

Три типа чартов: **Capacity** (хватает ли подтверждённой ёмкости; можно подмешать tentative), **Availability** (сколько часов свободно на дату с учётом текущей нагрузки), **Utilization** (% распределённых от доступных рабочих часов).

## 5. Овербукинг

Показывается отдельным маркером — насыщенный синий с **красной полосой** в heatmap (нагрузка > доступности). То есть не «обрезается», а явно сигнализируется поверх ячейки.

## 6. Soft/hard / tentative (сценарии)

Runn НЕ использует терминологию soft/hard. Вместо этого: **Confirmed** vs **Tentative** проекты.

- Tentative — спекулятивные/условные проекты для сценарного анализа («что если»).
- Переключатель tentative: когда включён — нагрузка confirmed + tentative входит в расчёт availability/utilization; выключен — tentative исключается полностью.
- В **планировщиках** tentative можно включать/выключать выборочно по проектам; в **отчётах** toggle применяет СРАЗУ все tentative-проекты и вариации.
- Scenario planning делается дублированием проекта → правкой копии → переименованием. **Сохранения сценариев нет** — тоггли надо переключать вручную каждый раз.
- People Utilization Report по умолчанию исключает tentative и placeholders; есть разбивка billable / non-billable utilization.

## 7. Анти-двойной-счёт

Явного режима «allocations XOR tasks» (как в Forecast) у Runn нет — нет отдельной сущности task в планировщике, единица планирования = **Assignment**. Двойной счёт не возникает структурно: один assignment = одна нагрузка. Actuals (timesheets) используются для точности отчётов, но планирование строится на scheduled hours. Предупреждение: «Missing actuals may affect the accuracy of your reports».

## 8. Что ПРИМЕНИМО нам (Remote DOM, без drag)

Применимо:

- **Дискретные пороги heatmap по % свободно** (75/50/25/0) — легко рендерить как цветные ячейки без drag, чисто декларативно. Хорошо ложится на Remote DOM.
- **Овербукинг как отдельный визуальный маркер** (красная полоса поверх), а не как обрезка.
- **Переключатель единиц** часы/неделю / FTE / % — наш UX ввода может дать выбор отображения.
- **Tentative toggle** как простой boolean-флаг проекта, входящий/не входящий в утилизацию — реализуемо без drag, через формы.
- **Assignment как единая сущность** (person × project × role × hours × период) с двумя проекциями (по человеку / по проекту) — чистая модель, согласуется с нашей «нет billable» (берём cost-rate, billable игнорируем — billable/non-billable у Runn НЕ применять).

Не применимо / осторожно:

- Drag-and-drop редактирование на таймлайне — у нас нет, заменяем формами/инлайн-вводом.
- Сценарии через дублирование проектов без сохранения — костыльно, не повторять.
- billable/bill-rate разбивка — по нашему решению не вводим.

## 9. Ссылки-источники

- People Planner Overview — https://help.runn.io/en/articles/4293043-people-planner-overview
- Project Planner Overview — https://help.runn.io/en/articles/4372978-project-planner-overview
- People Utilization Report — https://help.runn.io/en/articles/4292231-people-utilization-report
- Scenario Planning — https://help.runn.io/en/articles/6141007-scenario-planning
- How to Use Charts — https://help.runn.io/en/articles/3780211-how-to-use-charts
- Capacity Dashboard — https://help.runn.io/en/articles/11517226-capacity-dashboard
- Developer API (getting started) — https://developer.runn.io/docs/getting-started
- OpenAPI spec — https://developer.runn.io/openapi/v1.0.0.json

## Вердикт

Полезен как референс. Главная ценность: (а) чёткая дискретная heatmap по % свободно с явным маркером овербукинга — прямой паттерн для Remote DOM без drag; (б) единая сущность Assignment с двумя проекциями (человек/проект) — чистая модель данных, совместимая с нашим «source of truth = назначения»; (в) tentative как простой флаг, управляющий вхождением в утилизацию. Слабые места (сценарии через дублирование, billable-разбивка) — не копировать.
