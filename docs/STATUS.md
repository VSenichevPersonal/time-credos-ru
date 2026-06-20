# STATUS — единое состояние модуля time (архитекторский лог)

**Обновлено:** 2026-06-20
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
| **Объекты (8)** | credosTimeDepartment · Employee · Project (+externalCode) · Stage · WorkType · Entry (+approvedBy/At) · BillingLink · WorkdayCalendar |
| **Данные** | 5 отделов · 38 видов работ · 42 сотрудника (реальные, Битрикс) · 42 проекта (реальные клиенты, коды `[ОТДЕЛ]-[ГОД]-[NNN]`) · ~420 записей · 365 дней календаря РФ-2026 |
| **Навигация** | папка «Трудозатраты»: Таймшит · Проекты · Записи · Виды работ · Сотрудники · Отделы · Согласование · Планирование · Произв.календарь |
| **Front-компоненты** | Таймшит (3 режима, клавиатура, мультифильтры, копир-неделя, bulk-fill, cheatsheet) · CAPACITY доска (2 режима) · approval-bar |
| **Карточки (RECORD_PAGE)** | Запись трудозатрат (FIELDS по view) · **Проект — развитая карточка со вкладками: Обзор · Трудозатраты · Этапы · Связи с 1С · Бюджет (скоро) · Команда (скоро) · Документы (FILES)** |
| **Логика** | /s/time-entry (CRUD) · /s/approval (submit/approve/reject) — LOGIC_FUNCTION_TYPE=LOCAL |
| **Роли** | дефолтная (app) + «Руководитель» |

## Решения (ADR)
- 0001 — платформа Twenty, данные внутри, IdP
- 0002 — SDK-app в изолированном репо, install не merge
- 0003 — каталог услуг отдельным app (CRM-контур)
- 0004 — нейминг `credosTime*` (выравнивание с CRM)

## Карта документации
| Тема | Док |
|---|---|
| Это состояние | `STATUS.md` (тут) |
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

## Открытые TODO (приоритет)
1. 🔴 **Карточка записи: не виден проект** — поправить layout/видимость связи на credosTimeEntry.
2. 🔴 **Аудит карточек ↔ табличных видов** на консистентность (все объекты).
3. 🟡 **Развитая фильтрация «Записи»** (переиспользовать паттерн таймшита).
4. ✅ **Развитая карточка проекта** со вкладками (Обзор/Трудозатраты/Этапы/Связи с 1С/Бюджет/Команда/Документы) — накатано (см. `data-model/CARDS_VIEWS_AUDIT.md §6`). TODO-доделки: реальные виджеты «Бюджет план vs факт» и «Команда» (сейчас текст-заглушки «скоро»).
5. 🟡 **Роль (isManager) + workspaceMemberRef маппинг** (сетка/approval под реального юзера).
6. 🟢 Бэклог UX (календарь уже сделан): бюджеты, отчёты/экспорт, автосейв-индикатор, напоминания, дашборд утилизации.

## Дисциплина (как ведём)
- Каждое изменение → коммит (`feat(time)/fix/docs`), описания по-русски.
- Значимое → обновить этот STATUS + профильный док.
- Правки модели → накат `dev --once` + проверка REST/браузер.
- Секреты не коммитим (проверка перед каждым commit).
