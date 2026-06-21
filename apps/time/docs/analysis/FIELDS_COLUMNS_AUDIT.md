# Аудит полей карточек и столбцов таблиц

Аналитик AITEAM · time.credos.ru · 2026-06-21

Опора: Timetta (research/timetta, OFFICIAL_DOCS_INDEX) + Kimai (research/timetta-kimai-timesheet-views.md), правило 8.

## Сквозные ограничения (применяются ко всем строкам)

- **[no-billable-concept]** — биллируемости НЕТ. Поля Timetta/Kimai `isBillable`, `billableMode`, `rate/hourlyRate/internal_rate`, `billCode`, `projectTariff`, `billableDuration` НЕ предлагаются. Cost-rate — отдельная финансовая волна.
- **ПДн-минимизация (CISO-007)** — не добавлять лишние персональные поля (телефон, адрес, паспорт и т.п.); ФИО в отчётах скрывается флагом `revealEmployeeNames`.
- **Не переусложнять** — если значение выводимо из данных (rollup/computed), не заводить ручное поле.
- Вердикты: **ОК** / **ЛИШНЕЕ** (убрать поле) / **СКРЫТЬ** (поле оставить, из колонки/карточки убрать) / **ПЕРЕИМЕНОВАТЬ** / **ДОБАВИТЬ**.

---

## 1. Проект (credosTimeProject)

### Карточка проекта — вкладки
Сводка (canvas) · Обзор (поля) · Трудозатраты · Этапы · Связи с 1С · Бюджет (canvas) · Команда (canvas) · Отделы · Брони · Документы. Структура вкладок ОК, перекрывает Timetta (Обзор+Команда+Этапы+Финансы).

### Карточка «Обзор» — поля
| Поле | Сейчас | Вердикт | Добавить / комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| code | Код проекта | ОК | — | — | Timetta code |
| externalCode | Код клиента/Директум | ОК | — | — | Kimai orderNumber |
| company | Клиент | ОК | — | — | Timetta organizationId |
| department | Отдел | ОК | — | — | Timetta department |
| manager | Руководитель проекта | ОК | — | — | Timetta managerId |
| owner | Владелец | СКРЫТЬ из обзора | дублирует manager при одном лице; оставить в системе, в карточке прятать | P3 | — |
| category | Категория работ | ОК | — | — | — |
| status | Статус | ОК | — | — | Timetta stateId |
| startDate / endDate | Даты | ОК | — | — | Timetta start/end |
| plannedEffort | Плановые часы | ОК | — | — | Kimai timeBudget |
| factHours | Факт (computed) | ОК | в обзоре не показан — оставить только на Сводке/Бюджете | — | — |
| budgetRemaining | Остаток (computed) | ОК | — | — | — |
| approvalRequired | Требуется согласование | ОК | — | — | — |
| serviceRef | Типовая услуга (каталог) | ОК если используется | проверить что заполняется; иначе СКРЫТЬ | P3 | — |
| — | **description** (текст) | ДОБАВИТЬ | у Timetta/Kimai есть описание проекта; сейчас нет | **P2** | Timetta/Kimai description |

### Index-таблица проектов (credos-time-project.view)
Сейчас: code · category · status · company · department · manager · plannedEffort · factHours · budgetRemaining.
| Столбец | Вердикт | Комментарий | Приор. |
|---|---|---|---|
| code…manager | ОК | ядро реестра | — |
| plannedEffort/factHours/budgetRemaining | ОК | сильная сторона — план/факт/остаток в реестре, как «Часы проектов» Timetta | — |
| startDate/endDate | ДОБАВИТЬ (опц. колонка) | для фильтра активных проектов по периоду | P3 |

**Вывод проект:** добавить `description` (P2). Остальное закрыто. Биллинг-поля Kimai (budget в деньгах, billable, color) — не нужны.

---

## 2. Сотрудник (credosTimeEmployee)

### Карточка — вкладки: Отделы · Трудозатраты · Брони
Нет вкладки «Обзор» — скалярные поля (ФИО, email, должность) не имеют отдельной вкладки-карточки, видны только в шапке. Для Timetta-паритета это норма (профиль ресурса минимален).

### Поля объекта
| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| firstName/lastName/middleName | ФИО | ОК | — | — | Timetta fullName |
| email | Email | ОК | — | — | оба |
| jobTitle | Должность | ОК | — | — | Timetta grade/level (упрощ.) |
| active | Активен | ОК | — | — | оба IsActive |
| isManager | Руководитель | ОК | используется в approval-flow | — | — |
| workspaceMemberRef | ID юзера workspace | ОК | техническое, СКРЫТЬ из UI-колонок | — | — |
| department | Отдел (прямой) | ПЕРЕСМОТРЕТЬ | дублирует departmentAssignments (FTE×отдел); риск рассинхрона | **P2** | — |
| — | competences/skills/roles | НЕ добавлять | Timetta-фича, для текущего скоупа избыточно | — | Timetta (skip) |
| — | scheduleId (норма часов) | НЕ добавлять | норма — глобально в settings.normHoursPerDay | — | Timetta schedule |

> Замечание по `department` vs `departmentAssignments`: с введением REQ-0011 (сотрудник×отдел с FTE% и датами) прямое поле `employee.department` стало вторым источником истины. Рекомендация: либо сделать его computed («основной отдел = назначение с макс. FTE на сегодня»), либо оставить как «домашний отдел» с явным label. Не дублировать молча.

### Index-таблица сотрудников (credos-time-employee.view)
Сейчас: lastName · firstName · jobTitle · department · active.
| Столбец | Вердикт | Комментарий | Приор. |
|---|---|---|---|
| все текущие | ОК | компактный реестр | — |
| email | ДОБАВИТЬ (опц.) | для поиска/идентификации; ПДн-минимум — оставить email, не телефон | P3 |

### Вкладки-views сотрудника
- card-departments: departmentAssignments (FTE) + headedDepartments — ОК.
- card-time-entries: timeEntries inline — ОК (Kimai user report-аналог).
- card-bookings: bookings inline — ОК.

**Вывод сотрудник:** разобраться с дублем `department`/`departmentAssignments` (P2). competences/skills/roles из Timetta — НЕ тащить.

---

## 3. Запись трудозатрат (credosTimeEntry)

### Поля объекта
| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| date | Дата | ОК | — | — | оба |
| hours | Часы (decimal) | ОК | decimal как Timetta (не сек как Kimai) | — | Timetta |
| description | Состав работ | ОК | — | — | оба |
| status | Статус (Draft/Submitted/Approved/Rejected) | ОК | полный жизненный цикл = Timetta | — | Timetta stateId |
| tags | Теги (6 шт) | ОК | прямой аналог Kimai tags | — | Kimai tags |
| approvedBy/approvedAt | Согласование | ОК | — | — | Timetta approval |
| rejectComment | Причина отклонения | ОК | — | — | — |
| employee/project | Связи | ОК | — | — | оба |
| stage | Этап | ОК | — | — | Timetta projectTask |
| workType | Вид работ | ОК | — | — | оба activity |

### Index-таблица записей (credos-time-entry.view)
Сейчас: description · date · hours · project · workType · employee · status.
| Столбец | Вердикт | Комментарий | Приор. |
|---|---|---|---|
| все | ОК | соответствует Kimai timesheet-вью | — |
| stage | ДОБАВИТЬ (опц.) | этап есть у записи, но не в реестре; полезно для проектного разреза | P3 |
| tags | СКРЫТЬ из дефолта | многозначно, шумит колонку; оставить в фильтрах/карточке | P3 |

### Таблица согласования (credos-time-approval.view)
Сейчас: date · hours · project · workType · employee · status · approvedAt. Вердикт **ОК** — закрывает batch-approve поток.

**Вывод запись:** объект записи — самый зрелый, паритет с Timetta достигнут. Только опц. колонка stage в реестре (P3).

---

## 4. Бронь / планирование (credosTimeBooking)

| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| label | Название | ОК | — | — | — |
| bookingType | SOFT/HARD | ОК | прямая сверка Timetta booking soft/hard | — | Timetta |
| hours | Часов | ОК | — | — | Timetta hours |
| startDate/endDate | Период | ОК | — | — | Timetta dateFrom/dateTo |
| note | Комментарий | ОК | — | — | — |
| employee/project | Связи | ОК | — | — | Timetta |
| — | projectTask/stage | НЕ добавлять сейчас | Timetta привязывает бронь к работе; для нашего скоупа избыточно | P3 | Timetta projectTaskId |

### Index-таблица броней (credos-time-booking.view)
Сейчас: employee · project · type · hours · startDate · endDate. Вердикт **ОК**.
Замечание: Kimai брони не имеет — это сильная сторона нашей системы относительно Kimai.

**Вывод бронь:** закрыто. SOFT/HARD корректно отражает Timetta-модель.

---

## 5. Отдел (credosTimeDepartment)

### Карточка — вкладки: Обзор · Сотрудники · Проекты
| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| code | Код отдела (SELECT) | ОК | — | — | Timetta department |
| approvalRequired | Согласование | ОК | — | — | — |
| capacityFactor | Коэф. загрузки (0.8) | ОК | основа capacity-расчёта | — | Timetta schedule-аналог |
| headcount | Численность (ручное, INT) | **ЛИШНЕЕ/ПЕРЕСМОТРЕТЬ** | reports-calc вычисляет headcount=Σ активных сотрудников / ΣFTE по дате → ручное поле конфликтует и устаревает | **P1** | вывод из данных |
| head | Руководитель | ОК | — | — | — |
| parentDepartment / childDepartments | Иерархия | ОК | — | — | Timetta dept hierarchy |
| — | name (полное) | проверить | в capacity есть shortName/полное имя; убедиться что у отдела есть читаемое имя помимо code | P2 | — |

### Index-таблица отделов (credos-time-department.view)
Сейчас: code · approvalRequired · headcount · head · parentDepartment.
| Столбец | Вердикт | Комментарий | Приор. |
|---|---|---|---|
| headcount | СКРЫТЬ или пометить «(расчёт)» | если поле остаётся ручным — вводит в заблуждение; лучше показывать вычисленное | **P1** |
| capacityFactor | ДОБАВИТЬ | важная характеристика отдела для планирования, в реестре её нет | P2 |

### Вкладки-views отдела — ОК
employees (employeeAssignments FTE), projects (projectShares), overview (head+parent).

**Вывод отдел:** `headcount` ручное vs вычисляемое — главный конфликт (P1). Добавить `capacityFactor` в реестр (P2).

---

## 6. Этап (credosTimeStage)

| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| code | Код этапа | ОК | — | — | Timetta projectTask.name |
| status | Статус | ОК | — | — | — |
| startDate/endDate | Период | ОК | — | — | — |
| plannedEffort | Плановые часы | ОК | — | — | — |
| project | Проект (CASCADE) | ОК | нет orphan-этапов | — | Timetta |
| — | name (название) | ДОБАВИТЬ | сейчас только code; у Timetta projectTask есть человекочитаемое name | **P2** | Timetta projectTask.name |
| — | factHours (computed) | ДОБАВИТЬ (опц.) | факт по этапу выводим из timeEntries; полезен план/факт по этапу | P3 | вывод из данных |

### Index-таблица этапов (credos-time-stage.view)
Сейчас: code · project · status · plannedEffort. Вердикт ОК; при добавлении name — показать его.

**Вывод этап:** добавить `name` (P2), опц. factHours-rollup (P3).

---

## 7. Вид работ (credosTimeWorkType)

| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| group | Группа (SELECT, 6) | ОК | — | — | Kimai activity grouping |
| department | Отдел (nullable) | ОК | кросс-отдельные виды работ | — | — |
| — | **name/label** | **ДОБАВИТЬ** | у объекта нет собственного имени! В реестре показываются group+department, но не название вида работ. Kimai activity.name обязателен | **P1** | Kimai activity.name |
| — | active/visible | ДОБАВИТЬ (опц.) | скрывать устаревшие виды работ из пиклистов | P3 | Kimai visible |

### Index-таблица видов работ (credos-time-work-type.view)
Сейчас: group · department. **Проблема:** нет колонки с самим названием вида работ → строки неразличимы при нескольких видах в одной группе.
| Столбец | Вердикт | Приор. |
|---|---|---|
| name | ДОБАВИТЬ (после добавления поля) | **P1** |

**Вывод вид работ:** критично — отсутствует поле `name`. Без него виды работ в одной группе/отделе неотличимы (P1).

---

## 8. Отсутствие (credosTimeAbsence)

| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| absenceType | Тип (Vacation/Sick/Unpaid/Other) | ОК | — | — | Timetta timeOff types |
| startDate/endDate | Период | ОК | — | — | Timetta |
| note | Примечание | ОК | ПДн: не требовать мед.детали | — | — |
| employee | Работник | ОК | — | — | — |

### Index-таблица (credos-time-absence.view)
Сейчас: type · employee · startDate · endDate. Вердикт **ОК**.

**Вывод отсутствие:** закрыто, ПДн-минимум соблюдён.

---

## 9. Связь с 1С (credosTimeBillingLink)

| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| externalSystem | Внешняя система ('1С') | ОК | — | — | — |
| docType | Тип документа (Order/Payment/Act) | ОК | — | — | Timetta Act/Invoice |
| externalId | Внешний ID | ОК | — | — | — |
| number/date | Номер/дата документа | ОК | — | — | — |
| amount | Сумма | ОК | финансовая интеграция, не биллинг-расчёт внутри | — | — |
| project | Проект | ОК | — | — | — |

### Index-таблица (credos-time-billing-link.view)
Сейчас: number · docType · project · date · amount. Вердикт **ОК**.

**Вывод 1С-связь:** закрыто. amount здесь — ссылка на внешний документ, [no-billable] не нарушает.

---

## 10. Назначение сотрудник×отдел FTE (credosTimeEmployeeDepartment)

| Поле | Сейчас | Вердикт | Комментарий | Приор. | Референс |
|---|---|---|---|---|---|
| ftePercent | Доля ставки % (100) | ОК | основа headcount=ΣFTE | — | — |
| startDate/endDate | Период действия | ОК | — | — | — |
| employee/department | Связи | ОК | — | — | — |

### Index (credos-time-employee-department.view)
Сейчас: employee · department · ftePercent · startDate. **endDate отсутствует в колонках** при наличии в объекте.
| Столбец | Вердикт | Приор. |
|---|---|---|
| endDate | ДОБАВИТЬ | без неё не видно завершённые/срочные назначения | P2 |

**Вывод:** добавить колонку endDate (P2).

---

## 11. Доля отдела в проекте (credosTimeProjectDepartment)

| Поле | Сейчас | Вердикт | Комментарий | Приор. |
|---|---|---|---|---|
| plannedEffortShare | Плановая доля (часы) | ОК | используется capacity | — |
| project/department | Связи | ОК | — | — |

### Index (credos-time-project-department-card-registry.view)
Сейчас: project · department · plannedEffortShare. Вердикт **ОК**.

**Вывод:** закрыто.

---

## 12. План отдела без проекта (credosTimeDeptPlan)

| Поле | Сейчас | Вердикт | Комментарий | Приор. |
|---|---|---|---|---|
| label | Название | ОК | — | — |
| category | Категория работ | ОК | — | — |
| plannedEffort | Плановые часы | ОК | — | — |
| startDate/endDate | Период | ОК | — | — |
| department | Отдел | ОК | — | — |

### Index (credos-time-dept-plan.view): department · category · plannedEffort · startDate · endDate. Вердикт **ОК**.

**Вывод:** закрыто.

---

## 13. Производственный календарь (credosTimeWorkdayCalendar)

| Поле | Сейчас | Вердикт | Комментарий | Приор. |
|---|---|---|---|---|
| date · year · dayType · hours · note | — | ОК | справочник норм-часов РФ; year избыточен (выводим из date), но дёшев для фильтра | P3 |

### Index: date · dayType · hours · year. Вердикт **ОК**.

**Вывод:** закрыто.

---

## 14. Настройки (credosTimeSettings) — singleton

15 полей (нормы часов, согласование, планирование, напоминания, revealEmployeeNames). Все ОК, покрывают и Timetta (validation rules, approval state), и больше Kimai. `revealEmployeeNames` — правильное ПДн-решение.

### Index-таблица настроек показывает 7 из 15 полей — ОК (singleton, остальные в карточке).

**Вывод:** закрыто, ПДн-флаг — образцово.

---

## 15. Отчётные таблицы (front-components/reports)

### Измерения OLAP-drill (7 осей)
dept · employee · project · workType · workTypeGroup · category · stage. Вердикт **ОК** — шире референсов (Timetta/Kimai типично 4-5 осей). Покрывает «10 измерений фильтров» из последнего коммита.

### KPI-карточки: Утилизация · Факт ч · Норма ч · Недогруз ч — **ОК**. (util=client/fact, [no-billable]-совместимо — на основе категории CLIENT, не биллинга.)

### Breakdown/drill-таблица — колонки
Name · Загрузка/Бюджет (бар) · Категории · Факт ч · Утил./План ч · Недогруз/Остаток. Вердикт **ОК** — контекстные колонки (для проекта показывают План/Остаток, для отдела/сотрудника Утил/Недогруз). Грамотно.

### Detail-экспорт CSV (groupBy=detail)
7 колонок: Дата · Сотрудник · Отдел · Проект · Вид работ · Часы · Статус. RU-Excel/1С формат (`;`, BOM). Вердикт **ОК**.
| Добавить | Комментарий | Приор. |
|---|---|---|
| Этап (stage) | у записи есть, в CSV нет — нужен для проектной детализации | P2 |
| Состав работ (description) | детальный отчёт без описания работ менее ценен для актов | P2 |
| Теги | для срезов; опционально | P3 |

> Примечание: «detail-отчёт 40+ полей / 6 групп» из коммита 9bd4356 относится к КАРТОЧКЕ записи (детальный вид), а CSV-экспорт намеренно компактен (7 колонок). Если заказчик ждёт богатый CSV — расширить (см. выше).

**Вывод отчёты:** сильнейший модуль. Расширить CSV stage+description (P2).

---

## 16. Capacity-доска (front-components/capacity)

### Срезы: по отделам (раскрытие проектов/планов) · по людям. Метрики ячейки: pct/free/plan/gap.
### Столбцы строки отдела: имя+«N чел × коэф» · период-ячейки · SIGMA_W (средняя за горизонт) · маркеры HARD/SOFT-брони · обводка овербукинга. Вердикт **ОК**.
### Строка сотрудника: имя+код отдела · период-ячейки · SIGMA_W. ОК.
### Строка плана проекта (редакт.): часы · дата завершения. ОК.

Доска точно отражает Timetta resource planning (ёмкость/спрос/овербукинг, soft/hard). Замечаний по столбцам нет.
Зависимость от `department.headcount`/`capacityFactor` → см. P1 по отделу (если headcount ручной — доска врёт).

**Вывод capacity:** закрыто; единственный риск — источник headcount.

---

# ТОП-приоритеты

## P1 — критично (добавить/исправить сейчас)
1. **WorkType.name отсутствует** — у вида работ нет собственного названия; в реестре и пиклистах виды в одной группе неразличимы. ДОБАВИТЬ поле `name` + колонку. (Kimai activity.name — обязателен.)
2. **Department.headcount ручной vs вычисляемый** — reports-calc считает headcount=Σ активных/ΣFTE по дате, а в объекте поле ручное (INT). Конфликт → доска/отчёты могут расходиться с реестром. Сделать вычисляемым либо убрать ручное и показывать расчёт; в реестре пометить.

## P2 — важно
3. **Project.description** — нет описания проекта (есть у Timetta и Kimai). ДОБАВИТЬ.
4. **Stage.name** — этап только по code, добавить человекочитаемое название (Timetta projectTask.name).
5. **Employee.department vs departmentAssignments** — второй источник истины после REQ-0011; сделать computed «основной отдел» или явный «домашний отдел», не дублировать молча.
6. **employeeDepartment: колонка endDate** — есть в объекте, нет в реестре; не видно завершённых назначений.
7. **CSV detail-экспорт: + stage + description** — для проектной детализации/актов.
8. **Department: + capacityFactor в реестр**, проверить наличие читаемого `name` отдела помимо code.

## P3 — улучшения
- Entry-реестр: опц. колонка stage; tags скрыть из дефолта.
- Project-реестр: опц. колонки start/endDate.
- Employee-реестр: опц. колонка email (ПДн-минимум).
- Stage: factHours-rollup (вывод из данных).
- WorkType/Project.serviceRef/Employee.owner: проверить заполняемость, скрыть неиспользуемое.

## Что уже хорошо (паритет/превосходство над референсами)
- **Запись трудозатрат** — полный жизненный цикл статусов, теги (Kimai), decimal-часы (Timetta), этап+вид работ, причина отклонения. Зрелее Kimai.
- **Бронь SOFT/HARD** — точная модель Timetta booking; у Kimai брони вообще нет.
- **Отчёты OLAP** — 7 осей drill + контекстные колонки + cross-filter-pills + KPI. Шире референсов.
- **Capacity-доска** — ёмкость/спрос/овербукинг/soft-hard визуально, как Timetta resource planning.
- **FTE-модель (сотрудник×отдел % + даты)** — гибче плоского department у Timetta/Kimai.
- **Settings.revealEmployeeNames** и ПДн-минимум в absence/employee — образцовое compliance-решение (CISO-007).
- **[no-billable] выдержан** — util считается по категории CLIENT, не по биллингу; billing-link = ссылка на 1С, а не внутренний расчёт ставок.
