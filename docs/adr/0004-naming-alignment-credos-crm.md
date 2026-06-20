# ADR-0004. Нейминг модуля time — выравнивание с CredosCRM

**Дата:** 2026-06-20
**Статус:** Принято
**Зависит от:** ADR-0001 (один workspace с CRM), ADR-0002 (SDK-app)
**Основание:** кросс-сверка схемы CredosCRM — `../standards/CRM_SCHEMA_ALIGNMENT.md`

---

## Контекст

Модуль time ставится в ОБЩИЙ workspace с CredosCRM (ADR-0001, Вопрос 9 — отдельный tenant отклонён). Кросс-сверка показала:
- Технических коллизий `nameSingular` у `tt*` нет (префикс уникален).
- Но CRM-конвенция (`CUSTOMIZATION_GUIDE §3.2`) **жёстко требует префикс `credos`** для всех custom-объектов (grep-видимость, защита от коллизий).
- Семантические риски: «Activity» занято `credosActivity` (коммуникации); `credosProject` зарезервирован в roadmap CRM.
- Сотрудник в CRM = стандартный `WorkspaceMember` (ссылки owner/assignee/manager).

## Решение

1. **Префикс `tt*` → `credosTime*`** для всех объектов модуля.
   `credosTimeDepartment, credosTimeEmployee, credosTimeProject, credosTimeStage, credosTimeWorkType, credosTimeEntry, credosTimeBillingLink`.

2. **`ttActivity` → `credosTimeWorkType`** (ярлык «Вид работ») — уходим от «Activity» (занято `credosActivity`).

3. **Сотрудник — не дублируем личность.** Связи «кто сделал/менеджер» → стандартный `WorkspaceMember` (`owner`/`manager`). `credosTimeEmployee` остаётся как **профиль для учёта** (ссылка на workspaceMember + отдел + `capacityFactor`) — хранит то, чего нет у WorkspaceMember (отдел, ёмкость).

4. **Поля — как в CRM** (для стыковки):
   - часы: `hours` (запись), план: `plannedEffort`, факт (вычисл.): `actualEffort`
   - `company → Company` (стандартный), `owner/manager → WorkspaceMember`
   - даты: суффикс `Date` (`startDate`, `endDate`)
   - суммы: `budget` / `amount`
   - направление/линия (если нужно): `workDirection` / `businessLine`

5. **i18n** — общие термины как в платформе (`L10N_GLOSSARY.md`); доменные ярлыки русские.

## Альтернатива (отклонена)
- Оставить `tt*`: допустимо ТОЛЬКО если модуль — отдельный продукт/деплой/workspace. Но мы в общем workspace → нарушает CRM-конвенцию `credos*`. Отклонено.

## Последствия
- При установке в CredosCRM объекты модуля видны как `credos*` — единообразно, grep-находимы, без путаницы с `credosActivity`/`credosProject`.
- Поля совпадают по неймингу → проще будущая интеграция (отчёты, связи presale/pilot/quote ↔ трудозатраты).
- Цена: разовый рефактор Wave 2 (переименование 7 объектов + полей). Дёшево сейчас, дорого потом.

## Действие
Рефактор `apps/time/src/objects/*`, `constants/universal-identifiers.ts`, `fields/*`, `labels.ts` → `credosTime*` + поля. Пере-валидация `dev --once --dry-run`.
