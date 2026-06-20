# SIGNALS — канал коммуникации команды time.credos.ru

**Как работает:** короткие записи с датой/временем, разделы по подписям. Все читают этот файл. Arch отвечает в секцию `## → arch feedback`. Остальные пишут в свои секции.

**Префиксы и flow:** см. [INTERACTION.md](INTERACTION.md). **Состав ролей:** см. [ROLES.md](ROLES.md).

**Формат записи:**
```
### YYYY-MM-DD HH:MM — [префикс] <короткое имя>
<тело записи: что сделано / что прошу / repro / файлы>
```

**Сортировка:** новые записи **сверху** в каждой секции (LIFO). При большом объёме — архив в `archive/SIGNALS-YYYY-MM-DD-full.md`.

---

## → arch feedback (ответы)

### 2026-06-20 — [arch] 🟢 Команда AI Team развёрнута для time.credos.ru (6 ролей)

Адаптировал систему `.AITEAM` из CredosCRM под наш SDK-app. Урезано до 6 ролей с совмещением:
- **arch**, **Dev 1** (Front + UX/дизайн), **Dev 2** (Data + домен/данные/требования), **DevOps**, **QA**, **CISO**.
- Design ушёл внутрь Dev 1; доменная экспертиза — внутрь Dev 2; Product не заводим до реальных пользователей.

Ключевые отличия от CredosCRM зафиксированы:
- Мы **приложение**, не форк → ядро Twenty не трогаем; вместо upstream-merge — **bump twenty-sdk**.
- Красная зона: репо платформы CredosCRM1, опубликованные `universalIdentifier` UUID, общие мастер-данные с app catalog (ADR-0003).
- Нейминг объектов: **`credosTime`** (ADR-0004). UUID-SSOT: `apps/time/src/constants/universal-identifiers.ts`.
- Деплой = `yarn twenty` app sync/install в workspace «Twenty Credos Time» (Twenty 2.14, Railway).

**Текущее состояние проекта (на момент запуска команды):**
- 8 объектов модели трудозатрат в `apps/time/src/objects/` (credosTime Department/Employee/Project/Stage/WorkType/Entry/BillingLink/WorkdayCalendar).
- Последние коммиты: производственный календарь РФ + CAPACITY (2 режима); консистентные коды проектов; топовый timesheet (3 режима + клавиатура + мультифильтры).
- Незакоммиченные правки (git status): `universal-identifiers.ts`, `grid/types.ts`, `credos-time-entry.object.ts`, новые `constants/approval.ts` + `logic-functions/approval.logic.ts` — в работе фича **approval** (согласование трудозатрат).

**Команде:** прочитайте свой handoff + этот файл, напишите `[received]` с планом. Dev 2 — поясни статус фичи approval (что готово, что блокирует).

— arch

---

## Dev 1 → arch

_Front + UX: `apps/time/src/{front-components,views,page-layouts,navigation-menu-items}/`, page-layouts SSOT, timesheet-grid, i18n. Пиши `[received]`, `[signal-arch]`, `[blocker]`, `[design-proposal]`._

---

## Dev 2 → arch

_Data + Domain: `apps/time/src/{objects,fields,logic-functions,roles,constants}/`, модель, демо-данные, требования. Пиши `[received]`, `[signal-arch]`, `[requirement]`, `[blocker]`._

---

## DevOps → arch

_Railway Twenty 2.14 + ENV + `yarn twenty` app sync/install. Пиши `[deployed]`, `[synced]`, `[infra-ok]`, `[blocker]`._

---

## QA → arch

_Vitest + oxlint + smoke на workspace + приёмка. Пиши `[received]`, `[qa-ok]`, `[qa-nak]`, `[bug] #N`, `[smoke-ok/nak]`, `[flaky]`._

---

## CISO → arch

_Security governance + 152-ФЗ + RBAC. Пиши `[ciso-finding] #N <P0-P3>`, `[ciso-review ADR-NNNN ...]`, `[ciso-policy]`._
</content>
