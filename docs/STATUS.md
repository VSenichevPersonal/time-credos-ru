# STATUS — единое состояние модуля time (архитекторский лог)

**Обновлено:** 2026-06-21
**Назначение:** ОДНО МЕСТО — что построено, накатано, решено, что открыто. Обновляется по ходу.

> Это живой индекс. Детали — в связанных доках. Решения — в `adr/`. Регламент — `devops/PLAYBOOK.md`.

---

## Где живёт продукт
- **Dev-сервер:** Twenty **2.14** на Railway (проект «Twenty Credos Time»), `https://twenty-production-e5c5.up.railway.app`. Доступы/CLI — `devops/DEV_SERVER.md`, регламент — `devops/PLAYBOOK.md`.
- **Код app:** `apps/time/` (Twenty SDK-app, префикс `credosTime*`). Прод-таргет позже — CredosCRM1 после upstream-sync (ADR-0002).
- **Секреты:** `.env` (gitignored): `TWENTY_DEV_URL`, `TWENTY_DEV_API_KEY` (админ), `RAILWAY_TOKEN`.

## Накатано на сервер (готово)
| Слой | Состав |
|---|---|
| **Объекты (9)** | credosTimeDepartment · Employee · Project (+externalCode) · Stage · WorkType · Entry (+approvedBy/At) · BillingLink · WorkdayCalendar · **Absence (F-D, поле absenceType)** |
| **Данные** | 5 отделов · 38 видов работ · 42 сотрудника · 42 проекта · ~420 записей · 365 дней календаря РФ-2026 · **50 этапов / 12 проектов** · **статусы согласования (SUBMITTED 36 / APPROVED / REJECTED)** · **11 отсутствий** |
| **Навигация** | папка «Трудозатраты»: Таймшит · Проекты · Записи · Виды работ · Сотрудники · Отделы · Согласование · Планирование · **Отчёты** · Этапы · Связи с 1С · **Отсутствия** · Произв.календарь |
| **Front-компоненты** | Таймшит (3 режима, клавиатура, мультифильтры, копир-неделя, bulk-fill, cheatsheet) · CAPACITY доска (Отделы/Люди, режимы, **ввод планов «Планировать» для isManager**) · **Дашборд «Отчёты» (утилизация/недогруз, срезы отдел/проект/человек + категории stacked-bar)** · approval-bar |
| **Карточки (RECORD_PAGE)** | Запись трудозатрат · **Проект — вкладки: Обзор · Трудозатраты · Этапы · Связи с 1С · Бюджет (план vs факт + алерт) · Команда (часы по людям) · Документы** |
| **Логика** | /s/time-entry (CRUD) · /s/approval (submit/approve/reject) · **/s/reports (утилизация/недогруз/агрегаты + byCategory + норма с учётом отсутствий)** — LOGIC_FUNCTION_TYPE=LOCAL |
| **Роли** | дефолтная app (per-object permissions, soft-delete) + «Руководитель» |

## Решения (ADR)
- 0001 — платформа Twenty, данные внутри, IdP
- 0002 — SDK-app в изолированном репо, install не merge
- 0003 — каталог услуг отдельным app (CRM-контур)
- 0004 — нейминг `credosTime*` (выравнивание с CRM)
- 0005 — прод-топология: отдельный чистый 2.14 в РФ + синк Company по API (ACCEPTED)
- 0006 — модель сотрудника: credosTimeEmployee + workspaceMemberRef→WorkspaceMember (ACCEPTED)

> **Перспективный план всех будущих работ — `ROADMAP.md`.** Требования — `requirements/` (REQ-0001..0009). Сверка идей с Timetta/Kimai — `data-model/GAP_AUDIT_TIMETTA_KIMAI*.md`.

## Карта документации
| Тема | Док |
|---|---|
| Это состояние | `STATUS.md` (тут) |
| **Перспективный план (всё будущее)** | **`ROADMAP.md`** |
| Требования (REQ-0001..0009) | `requirements/README.md` |
| Контракт /s/reports | `data-model/REPORTS_CONTRACT.md` |
| Gap-аудит Timetta/Kimai (v1+v2) | `data-model/GAP_AUDIT_TIMETTA_KIMAI.md`, `..._2.md` |
| Исследование OLAP | `research/OLAP_REPORTS_RESEARCH.md` |
| Модель данных | `data-model/DATA_MODEL_SYNTHESIS.md` |
| Трейсабилити источников | `data-model/SOURCE_TRACEABILITY.md` |
| UX таймшита | `data-model/TIMESHEET_UX_SPEC.md` |
| Планирование загрузки | `data-model/CAPACITY_PLANNING.md` |
| Бэклог UX-улучшений (28) | `data-model/UX_IMPROVEMENTS_BACKLOG.md` |
| Сид-данные | `data-model/SEED_DATA_PLAN.md` |
| Аудит целостности данных | `data-model/DATA_INTEGRITY_AUDIT.md` |
| Стандарты кода/нейминга | `standards/DEV_STANDARDS.md` |
| Глоссарий RU | `standards/L10N_GLOSSARY.md` |
| Сверка со схемой CRM | `standards/CRM_SCHEMA_ALIGNMENT.md` |
| Devops регламент | `devops/PLAYBOOK.md`, `devops/DEV_SERVER.md` |
| SDK-факты/сверка | `../research/twenty-sdk/{README,CONSISTENCY_CHECK}.md` |
| Разбор вью Timetta/Kimai | `../research/timetta-kimai-timesheet-views.md` |

## Открытые TODO (приоритет) — детально в `ROADMAP.md`
1. 🔴 **Гейт незакоммиченной работы в дереве:** S1 «Настройки» (`front-components/settings/`), UI-E Календарь (`front-components/calendar/`), REQ-0005 — самодеятельность прошлых агентов (до правила 6). Проверить по 4 осям → принять/доделать, не сливать вслепую.
2. 🔴 **OLAP-отчёты (фаза 02)** — research+GSD готовы (`research/OLAP_REPORTS_RESEARCH.md`, `.planning/phases/02-olap-reports/`). v1 обезличенный, v2 по людям за RBAC.
3. 🔴 **RBAC/identity-волна:** server-identity (CISO-005) → роль «Сотрудник» + fieldPermissions → разблокирует approval-SoD (REQ-0001), OLAP по людям, REQ-0007/0008.
4. 🟡 Волна-3 удобство (дубль строки/сохр.фильтры/теги/цвет/фильтр-статус) + волна-4 (колонки/lock периода/batch-edit/напоминания/экспорт).
5. 🟢 Бэклог требований: REQ-0002 P&L · 0004 аллокации · 0006 табель · 0007 согласование-периоды · 0008 селектор «чей» · 0009 пресейл-заявка→план.
- ✅ Закрыто: карточка записи (проект виден) · Бюджет/Команда виджеты · дашборд утилизации · [bug] delete · отсутствия→норма · admin→isManager.

## Дисциплина (как ведём)
- Каждое изменение → коммит (`feat(time)/fix/docs`), описания по-русски.
- Значимое → обновить этот STATUS + профильный док.
- Правки модели → накат `dev --once` + проверка REST/браузер.
- Секреты не коммитим (проверка перед каждым commit).
