# Timetta — официальная документация (РЕФЕРЕНС, легальный)

**Источник:** https://timetta.com/ru/docs (200+ статей). **Скачано:** 2026-06-22.
**Правило:** сюда ходить узнавать/советоваться помимо кода и разведки (заказчик 2026-06-22). Скачанные страницы — `research/timetta/docs/`.

## Карта (ключевое для нас → URL)
| Тема | URL | Наш REQ |
|---|---|---|
| **Подразделения** | /ru/docs/settings/users/departments | REQ-0018 структура отделов |
| Таймшит (компонент) | /ru/docs/time-tracking/components/timesheet | ядро |
| ЖЦ таймшита | /ru/docs/time-tracking/components/lifestyle/timesheet | согласование |
| Согласование (руковод) | /ru/docs/time-tracking/instructions/supervisor/approval-process | A2/REQ-0007 |
| Правила валидации таймшитов | /ru/docs/settings/time-accounting/timesheet-validation-rules | SCOUT-B дубли |
| Периоды таймшитов | /ru/docs/settings/time-accounting/timesheet-periods | lock T3 |
| Шаблоны таймшитов | /ru/docs/settings/time-accounting/timesheet-templates | 8×5 |
| Виды работ | /ru/docs/settings/time-accounting/work-types | категории |
| Утилизация | /ru/docs/time-tracking/concepts/application-of-utilization-rate | отчёты |
| Непроектное время | /ru/docs/time-tracking/concepts/how-to-track-non-project-time | без проекта REQ-0012 |
| RBAC: как работают права | /ru/docs/settings/permissions/how-premissions-sets-works | RBAC/CISO-005 |
| RBAC: финансовые права | /ru/docs/settings/permissions/financial-permissions | E1/ПДн |
| Бронирование (концепция) | /ru/docs/resources/concepts/booking-concept | REQ-0004/0009 |
| Ресурсный план | /ru/docs/projects/components/projects/resource-plan | планирование |
| Ресурсный разрыв | /ru/docs/resources/concepts/resource-gap | «когда свободен» |
| Матрицы ставок | /ru/docs/settings/finances/rate-matrices | E1 |
| Ставка себестоимости труда | /ru/docs/finance/concepts/labor-cost-rate-calculation | E1 |
| Финансовый учёт по проводкам | /ru/docs/finance/concepts/accounting-entries-financial | C проводки |
| Акты | /ru/docs/finance/components/acts-of-acceptance | REQ-0017/G1 |
| P&L | /ru/docs/finance/components/pl | E1 |
| Договоры | /ru/docs/finance/components/contracts | биллинг |
| Отчёт таймшиты детально | /ru/docs/analytics/report-types/timesheets-detailed-report | detail-отчёт |
| Виджеты/дашборды | /ru/docs/analytics/widget-types · /ru/docs/analytics/dashboards | OLAP/тепловая карта |
| Keycloak | /ru/docs/settings/system/keycloak | SSO/AD |
| Dynamic-code: entity hooks | /ru/docs/settings/dynamic-code/entity-type-custom-hooks | наши триггеры factHours |
| Scheduled jobs | /ru/docs/settings/dynamic-code/scheduled-jobs | cron-напоминания |
| API / Reporting API | /ru/docs/api/main · /ru/docs/api/reporting-api | интеграции |

Полная структура (200+) — в истории SIGNALS/чате. Скачивать страницы по мере нужды через WebFetch → docs/.
