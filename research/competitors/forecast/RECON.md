# Forecast (forecast.app) — RECON (референс по ресурсному планированию)

Контекст: вспомогательный референс для нашего учёта времени (Twenty CRM + Remote DOM, без drag-and-drop). Зафиксировано только проверяемое по публичным support.forecast.app. Часть страниц отдавала 403 на прямой fetch — данные взяты из проверенных выдержек support.forecast.app. Где не нашёл — помечено «не нашёл».

## 1. Модель данных

Сущности:

- **Person** — сотрудник; индивидуальные рабочие часы задаются в профиле (могут отличаться между людьми); учитываются time-off и company holidays (нерабочее время).
- **Role** — роль; используется в placeholder и аллокациях.
- **Placeholder** — выражение спроса на роль/скилл без конкретного человека. Определяется на уровне роли. Может представлять одного человека или целую команду. Подлежит «staffing» (замене на реального человека).
- **Project** — проект; имеет настройки resource management (см. §7) и financials.
- **Task** — задача внутри проекта; имеет estimate, remaining work, actual. Назначается людям (assignees).
- **Allocation** — бронь времени человека на проект. Бывает **soft** и **hard**. Распределяется по длине аллокации равномерно (по умолчанию) или вручную (manual distribution).
- **Time registration / Timesheet (Actuals)** — фактически залогированные часы.

API/схема сущностей построчно — не нашёл (публичной OpenAPI-схемы не выгружал).

## 2. Source of truth

Зависит от **режима resource management проекта** (компанийная/проектная настройка):

- Режим **Allocate people to projects** → истина = **проектные аллокации** (на уровне проекта); задачи НЕ учитываются в утилизации.
- Режим **Assign people to tasks** → проектные аллокации создавать нельзя; истина = **задачи** (estimates / registrations).

Агрегация: People Schedule собирает утилизацию по человеку из аллокаций ИЛИ задач (в зависимости от режима) и его индивидуальных рабочих часов.

## 3. UX планирования

- **People Schedule** — интерактивный heatmap (Gantt-подобный): утилизация и остаток доступности по каждому человеку. Видно under / over / fully booked.
- Масштаб времени: **квартал / месяц / неделя / день**.
- Доступность считается по индивидуальным рабочим часам человека за выбранный период.
- **Единицы:** часы (рабочие часы профиля) и % утилизации. FTE — не нашёл явного упоминания как у Runn.
- Фильтр отображения: показывать **soft и/или hard** аллокации (полезно для анализа общей утилизации либо только одного типа).
- Создание аллокаций — в Timeline проекта или прямо в People Schedule.

## 4. Визуал занятости (heatmap)

- Ячейки окрашиваются цветом по утилизации на основе **трёх (3) пороговых значений**. Точные цвета и проценты порогов — **не нашёл** (в публичных выдержках конкретные коды/числа не раскрыты).
- Heatmap показывает under-booked / fully-booked / over-booked.
- Доступные часы на человека показываются по выбранному периоду и его рабочим часам.
- Time-off и company holidays — нерабочее время, уменьшают доступность и/или плановые часы за тот же период.

## 5. Овербукинг

Heatmap явно идентифицирует overbooked ресурсы (нагрузка > доступности) отдельным состоянием ячейки. Конкретный цвет — не нашёл, но статус over/under/fully booked — заявлен явно.

## 6. Soft/hard / tentative

- **Soft allocation** — предварительный (tentative) спрос: бронь человека до подтверждения проекта (до «won»). Позволяет планировать будущий спрос и максимизировать утилизацию.
- **Hard allocation** — подтверждённая фактическая работа, назначенная человеку.
- Переход: когда проект выигран, soft легко конвертируется в hard.
- В People Schedule можно включать в расчёт soft и/или hard по отдельности — т.е. tentative-спрос можно учитывать или исключать из утилизации переключателем фильтра.
- Доступность soft/hard — фича уровней Pro и Plus.

## 7. Анти-двойной-счёт (ключевая фича Forecast)

Режимы взаимоисключающие на уровне настройки resource management:

- **Allocate people to projects**: задачи проекта НЕ входят в утилизацию вовсе — считаются только проектные аллокации. → нет двойного счёта проект+задача.
- **Assign people to tasks**: проектные аллокации создавать НЕЛЬЗЯ — считаются только задачи (estimate / registrations + remaining).

Внутри task-режима — два подрежима учёта факта:

- **Task Estimate Ignoring Registrations**: залогированное время не влияет на утилизацию; estimate задачи входит в утилизацию пока задача не Done.
- **Task Estimate With Registrations**: утилизация = распределение по длине задачи на основе registrations + remaining estimate. Регистрации уменьшают remaining; при логировании утилизация пересчитывается на перераспределённый остаток. → факт не складывается с планом, а замещает его (нет двойного счёта план+факт).

Формула: **Forecasted Resource Utilization = Forecasted Total Time / Available Time × 100**. Данные — из People Schedule + Timesheets; estimated виден сразу, actual — на следующий день.

## 8. Что ПРИМЕНИМО нам (Remote DOM, без drag)

Применимо:

- **Взаимоисключающий режим «аллокации XOR задачи»** — главный заимствуемый принцип: на уровне проекта выбираем ОДИН источник истины (наши «записи времени/назначения» против «задач»), чтобы не было двойного счёта. Реализуемо чисто настройкой проекта (boolean/enum), без drag.
- **Факт замещает план, а не суммируется** (registrations уменьшают remaining) — корректная логика утилизации; применимо к нашим actuals vs scheduled.
- **soft/hard как enum статуса аллокации** + фильтр «учитывать soft в утилизации» — простой переключатель, без drag, ложится на Remote DOM формы.
- **Масштабы день/неделя/месяц/квартал** для heatmap — декларативный рендер.
- **Placeholder как роль-спрос** до стаффинга — совместимо с нашей моделью назначений.

Не применимо / осторожно:

- Точные цвета/пороги heatmap — не раскрыты, взять явные пороги у Runn (75/50/25/0).
- Drag в Timeline/People Schedule — у нас нет; создание/правка через формы.
- Сложность двух подрежимов task-учёта — для MVP избыточно; взять одну ясную логику (факт замещает план).

## 9. Ссылки-источники

- Overview of People Schedule (resource heatmap) — https://support.forecast.app/hc/en-us/articles/4775562212753-Reviewing-your-resource-heatmap-People-Schedule
- Using People Schedule — https://support.forecast.app/hc/en-us/articles/36268778057233-Using-People-Schedule
- Monitoring your Resource Utilization — https://support.forecast.app/hc/en-us/articles/12134140688657-Monitoring-your-Resource-Utilization
- Overview of Utilization Report — https://support.forecast.app/hc/en-us/articles/5286588674065-Overview-of-Utilization-Report
- Using soft and hard project allocations — https://support.forecast.app/hc/en-us/articles/12466858951185-Using-soft-and-hard-project-allocations
- Allocating People to Projects — https://support.forecast.app/hc/en-us/articles/4803949658769-Allocating-People-to-Projects
- Assigning People to Tasks — https://support.forecast.app/hc/en-us/articles/4831301627409-Assigning-People-to-Tasks
- Working with Placeholders — https://support.forecast.app/hc/en-us/articles/12134108360337-Working-with-Placeholders
- Forecast terminology — https://support.forecast.app/hc/en-us/articles/10017499314961-Forecast-terminology

## Вердикт

Полезен как референс, и сильнее Runn именно в одном: **анти-двойной-счёт через взаимоисключающие режимы (аллокации XOR задачи) и логику «факт замещает план»** — это прямой архитектурный урок для нашей утилизации. soft/hard как enum + фильтр в утилизации — чистый паттерн без drag. Слабое место для нас: непрозрачные пороги heatmap (числа берём у Runn) и избыточная для MVP двойственность task-учёта.
