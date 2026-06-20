# Глоссарий домена — учёт трудозатрат Кредо-С

SSOT русской доменной терминологии. UI/i18n/доки используют эти термины. Английские — только технические идентификаторы объектов (`credosTime*`).

| Русский термин | Объект/поле | Англ. (НЕ использовать в UI) | Заметка |
|---|---|---|---|
| Отдел | `credosTimeDepartment` | Department | OV/OIB/OPIB/… — 5 отделов |
| Сотрудник | `credosTimeEmployee` | Employee | профиль (отдел+ёмкость); личность — `WorkspaceMember` |
| Проект | `credosTimeProject` | Project | код `[ОТДЕЛ]-[ГОД]-[NNN]` + `externalCode` (1С) |
| Этап | `credosTimeStage` | Stage | этап проекта |
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

## Правила терминологии

- Никаких «activity/активность» для видов работ — конфликт с зарезервированным Twenty `Activity`.
- «Запись трудозатрат», не «запись времени», не «лог».
- Коды статусов в БД — UPPER_CASE; в UI — русские ярлыки.
