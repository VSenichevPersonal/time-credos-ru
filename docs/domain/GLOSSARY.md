# Глоссарий домена — учёт трудозатрат Кредо-С

SSOT русской доменной терминологии. UI/i18n/доки используют эти термины. Английские — только технические идентификаторы объектов (`credosTime*`).

| Русский термин | Объект/поле | Англ. (НЕ использовать в UI) | Заметка |
|---|---|---|---|
| Отдел | `credosTimeDepartment` | Department | OV/OIB/OPIB/… — 5 отделов |
| Сотрудник | `credosTimeEmployee` | Employee | профиль (отдел+ёмкость); личность — `WorkspaceMember` |
| Проект | `credosTimeProject` | Project | код `[ОТДЕЛ]-[ГОД]-[NNN]` + `externalCode` (1С) |
| Этап | `credosTimeStage` | Stage | этап проекта; **обязан иметь проект** (no orphan); запись с проектом-с-этапами обязана иметь этап (REQ-0005) |
| Отсутствие | `credosTimeAbsence` | Absence | отпуск/больничный/без содержания/иное; период [start,end] вычитается из ёмкости (F-D) |
| Вид работ | `credosTimeWorkType` | ~~Activity~~ (занято) | 38 видов; НЕ «Activity», НЕ «активность» |
| Запись трудозатрат | `credosTimeEntry` | ~~TimeEntry~~ | НЕ «таймшит-запись» |
| Связь с 1С | `credosTimeBillingLink` | BillingLink | биллинг/выгрузка |
| Производственный календарь | `credosTimeWorkdayCalendar` | WorkdayCalendar | РФ-2026, 365 дней |
| Таймшит | front-component grid | timesheet | экран ввода (week/day/project) |
| Ёмкость / Планирование | CAPACITY | capacity | плановая загрузка |
| Согласование | approval | approval | submit/approve/reject |
| Руководитель | `manager.role` | manager | роль, согласует трудозатраты |

## Статусы записи (`credosTimeEntry.status`)

Коды в БД — UPPER_CASE (SSOT: `constants/approval.ts` `ENTRY_STATUS`).

| Код | Русский (UI) |
|---|---|
| `DRAFT` | Черновик |
| `SUBMITTED` | На согласовании |
| `APPROVED` | Согласовано |
| `REJECTED` | Отклонено |

## Тип отсутствия (`credosTimeAbsence.absenceType`)

Коды UPPER_CASE (SSOT: `constants/select-options.ts` `ABSENCE_TYPE_OPTIONS`). Поле названо `absenceType`, НЕ `type` (зарезервировано в Twenty).

| Код | Русский (UI) |
|---|---|
| `VACATION` | Отпуск |
| `SICK` | Больничный |
| `UNPAID` | Без содержания |
| `OTHER` | Иное |

## Аналитика отчётов (`/s/reports`)

| Термин | Где | Заметка |
|---|---|---|
| Утилизация | `util` | доля часов категории CLIENT / весь факт |
| Недогруз | `under` | норма − факт (норма за вычетом отсутствий) |
| Разрез по категории | `byCategory` | `[{category, hours, share}]` на строке отдела/проекта/сотрудника/итого (R3) |
| Бюджет проекта | `budgetUsed` | факт / план (`plannedEffort`); >1 = перерасход (F-A) |

## Правила терминологии

- Никаких «activity/активность» для видов работ — конфликт с зарезервированным Twenty `Activity`.
- «Запись трудозатрат», не «запись времени», не «лог».
- Коды статусов в БД — UPPER_CASE; в UI — русские ярлыки.
