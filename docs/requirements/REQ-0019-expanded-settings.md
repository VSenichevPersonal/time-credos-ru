# REQ-0019 — Расширенные настройки (глобальный singleton credosTimeSettings)

**Статус:** PROPOSED → в реализацию (заказчик 2026-06-22 «больше параметров в настройки!»)
**Приоритет:** 🔴 (конфигурируемость модуля)

## Контекст
Сейчас Настройки = только per-отдел (Согласование/Коэф.ёмкости/Числ-вычисл) + ссылки на справочники. Нужно МНОГО глобальных параметров → завести объект-синглтон `credosTimeSettings` (1 запись на workspace).

## Сверка Timetta
Системные настройки: расписания/норма (work-schedule), периоды таймшитов, правила валидации, шаблоны таймшитов, матрицы ставок и т.п. — много конфигов. Берём релевантное.

## Глобальные параметры (credosTimeSettings, singleton)
| Параметр | Тип | Default | Зачем |
|---|---|---|---|
| `normHoursPerDay` | NUMBER | 8 | fallback нормы (осн. источник — календарь, ADR-0007) |
| `weekStartsOn` | SELECT | MONDAY | старт недели сетки |
| `planningHorizonWeeks` | NUMBER | 16 | горизонт доски планирования |
| `defaultCapacityFactor` | NUMBER | 0.8 | дефолт коэф.ёмкости новых отделов |
| `defaultApprovalRequired` | BOOLEAN | false | согласование по умолчанию |
| `approvalPeriod` | SELECT | WEEK/MONTH | гранулярность согласования (REQ-0007) |
| `overtimeWarnHours` | NUMBER | 12 | порог предупреждения переработки/день |
| `fillTemplateHours` | NUMBER | 8 | часы для шаблона «8×5» |
| `reminderEnabled` | BOOLEAN | false | напоминания заполнить таймшит (F-E) |
| `reminderDayOfWeek` | SELECT | FRIDAY | день напоминания |
| `revealEmployeeNames` | BOOLEAN | false | показ ФИО в отчётах (CISO-007; до CISO-005 — false; админ-тоггл) |
| `tentativeBookingEnabled` | BOOLEAN | true | пресейл-бронь в планировании (REQ-0009) |

Per-отдел (уже есть, оставить): approvalRequired, capacityFactor.

## Реализация
- **Dev 2:** объект `credosTimeSettings` (singleton — index-view 1 запись + post-install сид дефолтов) + поля. Потребители читают из него (норма-fallback, горизонт, пороги, revealEmployeeNames вместо хардкод-флага в reports). Backfill 1 записи.
- **Dev 1:** в «Настройки Time Credos» секция «Общие параметры» (глобальные поля, правка) над секцией «Отделы». Группировка по смыслу (ввод/планирование/согласование/безопасность).
- Связь: ADR-0007 (норма), REQ-0007 (период согл.), REQ-0009 (бронь), CISO-007 (revealEmployeeNames → заменить флаг-константу настройкой).

## Границы
Singleton (1 запись). Не плодить по объекту на параметр. Не переусложнять — плоский список полей. Чувствительные (revealEmployeeNames) — админ-доступ (RBAC-волна).
