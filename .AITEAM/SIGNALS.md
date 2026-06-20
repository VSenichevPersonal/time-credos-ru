# SIGNALS — канал коммуникации команды time.credos.ru

**Как работает:** короткие записи с датой/временем, разделы по подписям. Все читают этот файл. Arch отвечает в секцию `## → arch feedback`. Остальные пишут в свои секции.

**Префиксы и flow:** см. [INTERACTION.md](INTERACTION.md). **Состав ролей:** см. [ROLES.md](ROLES.md).

**Формат записи:**
```
### YYYY-MM-DD HH:MM — [префикс] <короткое имя>
<тело записи: что сделано / что прошу / repro / файлы>
```

**Сортировка:** новые записи **сверху** в каждой секции (LIFO). При большом объёме — архивируется в `archive/SIGNALS-YYYY-MM-DD-full.md`.

---

## → arch feedback (ответы)

### 2026-06-20 — [arch] 🟢 Команда AI Team развёрнута для time.credos.ru

Адаптировал систему `.AITEAM` из CredosCRM под наш SDK-app. Ключевые отличия зафиксированы:
- Мы **приложение**, не форк → ядро Twenty не трогаем; вместо upstream-merge — **bump twenty-sdk**.
- Красная зона: репо платформы CredosCRM1, опубликованные `universalIdentifier` UUID, общие мастер-данные с app catalog (ADR-0003).
- Нейминг объектов: **`credosTime`** (ADR-0004). UUID-SSOT: `apps/time/src/constants/universal-identifiers.ts`.
- Деплой = `yarn twenty` app sync/install в workspace «Twenty Credos Time» (Twenty 2.14, Railway).

**Текущее состояние проекта (на момент запуска команды):**
- 8 объектов модели трудозатрат в `apps/time/src/objects/` (credosTime Department/Employee/Project/Stage/WorkType/Entry/BillingLink/WorkdayCalendar).
- Последние коммиты: производственный календарь РФ + CAPACITY (2 режима); консистентные коды проектов; топовый timesheet (3 режима + клавиатура + мультифильтры).
- Незакоммиченные правки (git status): `universal-identifiers.ts`, `grid/types.ts`, `credos-time-entry.object.ts`, новые `constants/approval.ts` + `logic-functions/approval.logic.ts` — похоже, в работе фича **approval** (согласование трудозатрат).

**Команде:** прочитайте свой handoff + этот файл, напишите `[received]` с планом. Dev 2 — поясни статус фичи approval (что готово, что блокирует).

— arch

---

## Dev 1 → arch

_Frontend: `apps/time/src/{front-components,views,page-layouts,navigation-menu-items}/`, i18n, timesheet-сетка. Пиши план дня `[received]`, прогресс `[signal-arch]`, блокеры `[blocker]`._

---

## Dev 2 → arch

_Data/Logic: `apps/time/src/{objects,fields,logic-functions,roles,constants}/` + модель данных. Пиши план дня `[received]`, прогресс `[signal-arch]`, блокеры `[blocker]`._

---

## DevOps → arch

_Railway Twenty 2.14 + ENV + `yarn twenty` app sync/install. Пиши `[deployed]`, `[synced]`, `[infra-ok]`, `[blocker]`._

---

## QA → arch

_Vitest + oxlint + smoke на workspace. Пиши `[received]`, `[qa-ok]`, `[qa-nak]`, `[bug] #N`, `[smoke-ok/nak]`, `[flaky]`._

---

## Domain Analyst → arch

_Доменный эксперт Кредо-С (учёт трудозатрат). Пиши `[signal-arch] requirement`, `[dom-ok]`, `[dom-nak]`, `[bug]`, `[observed]`._

---

## CISO → arch

_Security governance + 152-ФЗ. Пиши `[ciso-finding] #N <P0-P3>`, `[ciso-review ADR-NNNN ...]`, `[ciso-policy]`._

---

## Design → arch

_Twenty UI + page-layouts SSOT + timesheet-grid. Пиши `[design-proposal]`, `[design-ok]`, `[design-nak]`._

---

## Product → arch

_Stub. Активируется когда у Кредо-С появятся реальные пользователи с feedback. См. [handoffs/PRODUCT.md](handoffs/PRODUCT.md)._
</content>
