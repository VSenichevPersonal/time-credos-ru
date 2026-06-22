# TRACE-аудит: настройки / календарь / целостность / ПДн / справочники

**Дата:** 2026-06-22
**Автор:** аудитор-трассировщик AITEAM (READ-ONLY)
**Домен:** настройки singleton, производственный календарь, целостность данных, ПДн-редакция, справочники/soft-delete.
**Источники решений:** UI_ANSWERS_2 (F/G), UI_ANSWERS_W5_A, UI_QUESTIONS_W5_B, UI_QUESTIONS_W5_C, PERSON_PLAN_CONSISTENCY_AUDIT.
**Код:** `objects/{credos-time-settings,credos-time-entry,credos-time-workday-calendar,credos-time-department}.object.ts`, `indexes/credos-time-entry-unique.index.ts`, `constants/{capacity,validation,select-options}.ts`, `logic-functions/{reports-calc,reports.logic,reports-detail,time-entry-api}.logic.ts`, `front-components/settings/*`, `shared/lockdown.ts`.
**Мануал:** `docs/user/*`, `docs/developer/{02-data-model,04-security}.md`, `docs/security/RISK_REGISTER.md`.

Легенда: ✅ полностью · 🟡 частично · ❌ нет · — неприменимо.

---

## Таблица трассировки

| # | Решение (источник) | Реализовано? | В мануале? | Gap |
|---|---|---|---|---|
| **A. Настройки singleton** | | | | |
| A1 | `credosTimeSettings` = singleton, плоский список (REQ-0019) | ✅ object + сид post-install | ✅ developer/02 (косвенно), comment в object | — |
| A2 | `overtimeWarnHours` (12, WARNING/день) | ✅ object + `validation.ts` | 🟡 02-timesheet (валидация) | Порог не описан в user/settings (нет такого мануала) |
| A3 | `maxHoursPerDay` (24, ERROR/день, блок) | ✅ object + `validateEntry` | 🟡 02-timesheet | как A2 |
| A4 | `minHoursPerWeek` (0=выкл, WARNING/неделя) | ✅ `validateWeekUnderfill` | ❌ | Не описано в user-доках |
| A5 | `lockdownDate`/`lockdownGraceDays` (singleton) | ✅ object + `shared/lockdown.ts` | ✅ user/03-approval §«Закрытие периодов», developer/04 | — |
| A6 | `defaultCapacityFactor` (0.8) | ✅ object | 🟡 developer/02 (SSOT-секция) | user-настройки не задокументированы |
| A7 | `revealEmployeeNames` (тоггл ПДн) | ✅ object, дефолт **true** (user-direct) | 🟡 RISK_REGISTER CISO-007 | user/04-reports говорит «ФИО скрыты» — РАССИНХРОН (G-1) |
| A8 | UI «Настройки модуля» (Dev1) | ✅ `front-components/settings/*` (general/dept-section) | ❌ | Нет user-мануала по экрану настроек (G-2) |
| **B. Норма дня / capacityFactor / FTE** | | | | |
| B1 | Норма дня SSOT = произв.календарь, `normHoursPerDay` = fallback (ADR-0007) | ✅ `use-daily-norm`, `reports-calc` | ✅ developer/02 «Норма дня — SSOT» | — |
| B2 | Единый `resolveCapacityFactor(dept ?? settings ?? 0.8)` (устранён баг ×1 vs ×0.8, W5B.9/10) | ✅ `constants/capacity.ts` | ✅ developer/02 SSOT-секция | — |
| B3 | FTE-headcount (`ftePercent`, clamp, fallback 100%) (REQ-0011) | ✅ `reports-calc fteHeadcountByDept` | ✅ developer/02 EmployeeDepartment | План делится поровну, не по FTE (W5B.13) — осознанное упрощение, не задокументировано |
| B4 | Снапшот нормы/headcount закрытых периодов (W5B.2/16) | ❌ норма ad-hoc, истории нет | — | Пересчёт задним числом неизбежен (открытый край, признан аналитиком) |
| **C. Производственный календарь** | | | | |
| C1 | Объект `credosTimeWorkdayCalendar` (день=запись) | ✅ object + сид | ✅ developer/02 | — |
| C2 | Праздник `HOLIDAY` = 0ч в норме/ёмкости/раскиде | ✅ `WORKDAY_TYPES` filter, `?? 0` | ✅ developer/02 | — |
| C3 | Короткий день `SHORT` (предпраздничный, часы вручную) | ✅ тип в options, `hours` суммируется как есть | ✅ developer/02 («7.0 короткий») | Правило −1ч НЕ автоматизировано (данные вручную) — соответствует решению W5B.4а |
| C4 | **Рабочая суббота (WI-03)** — перенос рабочего дня на выходной | 🟡 запись WORKDAY на дату субботы РАБОТАЕТ (норма/ёмкость учтут); **отдельного типа `WORKING_WEEKEND` НЕТ** | ❌ | **GAP G-3:** 5-го типа дня нет (решение W5B.5 оставлено открытым). Механика «WORKDAY на субботу» нигде не описана для оператора календаря |
| C5 | Дни вне диапазона календаря = 0ч (безопасная деградация) | ✅ `?? 0` | ❌ | Нет валидации полноты календаря (W5C.10/W5B.7) |
| **D. Целостность: уникальность/дедуп/дата** | | | | |
| D1 | UNIQUE(employee,project,workType,date) — БД-индекс | ✅ `indexes/credos-time-entry-unique.index.ts` | ✅ developer/02 (косвенно), comment в индексе | — |
| D2 | Upsert-гард (defense-in-depth, NULL-щель) в `/s/time-entry` | ✅ `findExistingEntryIdByKey` + `dayBounds` | 🟡 developer/02 (rollup A∧B∧C) | NULL-комбинации индексом не ловятся (осознанно, гард закрывает) |
| D3 | **Нормализация date к полночи UTC** (W5C.2/6 — сдвиг суток) | ✅ `normalizeEntryDate` (`slice(0,10)+T00:00:00.000Z`) на upsert | ❌ | Закрыто в коде; не отражено в developer-доках. Грид Twenty/CSV в обход гарда — остаточный риск |
| D4 | Дедуп-скрипт перед apply индекса | ✅ `scripts/dedup-entries.mjs` | 🟡 comment в индексе | Не в developer-доках; откат необратим (открытый край W5C.28) |
| D5 | 0ч = ERROR (`validatePositiveHours`, WI-52/W5C.27) | ✅ `constants/validation.ts` | ❌ | Реализовано; в user/developer-доках не описано |
| **E. Целостность: CASCADE→RESTRICT, rollup** | | | | |
| E1 | `Entry.project` CASCADE→**RESTRICT** (W5C.23, защита APPROVED) | ✅ object | ✅ developer/02 (нижняя секция) + 04-security §«каскадная потеря» | **Верхняя таблица developer/02 ещё пишет CASCADE** (G-4) |
| E2 | `Entry.employee` CASCADE→**RESTRICT** (W5C.24) | ✅ object | ✅ developer/02 (нижняя секция) + 04-security | как E1 (верхняя таблица CASCADE) |
| E3 | `workType`/`stage` SET_NULL × unique-коллизия (W5C.22) | 🟡 SET_NULL оставлен | ❌ | Риск коллизии ключа при удалении wt — НЕ закрыт, не задокументирован (открытый край) |
| E4 | factHours rollup идемпотентный (A∧B∧C: триггеры+/s/+backfill) | ✅ `project-fact-rollup*` | ✅ developer/02 «Derived-stored A∧B∧C» | — |
| **F. ПДн-код / reveal** | | | | |
| F1 | `employeeCode` = `Сотрудник·<deptCode>·<4hex>` | ✅ `reports-calc.ts:166-176` | 🟡 user/02,03 («код сотрудника при скрытых ФИО») | Формат кода НЕ описан в developer/04-security (G-5) |
| F2 | reveal=false → КОД во ВСЕХ срезах (byEmployee/OLAP/крошки) | ✅ `reports.logic redactByEmployee/redactOlap` | ✅ developer/04 §CISO-007 | — |
| F3 | **detail/CSV-экспорт тоже редактируется** (W5C.19) | ✅ `computeDetail(revealNames)`, дефолт false | ✅ RISK_REGISTER CISO-016 (CLOSED, проверено) | Аналитик-флаг W5C.19 = false alarm, guard есть |
| F4 | reveal-дефолт = true (user-direct, 152-ФЗ законный интерес) | ✅ object `defaultValue: true` | ✅ RISK_REGISTER CISO-007 | user/04-reports не обновлён (см. A7/G-1) |
| F5 | employeeCode меняется при смене отдела + коллизия 4hex (W5C.16/17) | 🟡 deptCode из текущего departmentId | — | Открытый край (низкий приоритет), не закрыт |
| **G. Справочники / soft-delete** | | | | |
| G1 | Сотрудник/проект архивируются, не удаляются (RESTRICT) | ✅ (= E1/E2) | ✅ developer/04 §«каскадная потеря» | — |
| G2 | Hard-delete записи без корзины (DRAFT/REJECTED) | ✅ `time-entry-api` DELETE + APPROVED-guard | 🟡 03-approval (lockdown/lock) | Корзина не реализована (W5C.21, осознанно «(а)») |
| G3 | Теги MULTI_SELECT, опции — enum, удаление при данных (W5C.25) | 🟡 опции в `ENTRY_TAG_OPTIONS` | ✅ developer/02 (таблица тегов) | Поведение SDK при удалении опции — открытый вопрос |
| **H. lockdown** | | | | |
| H1 | `canMutateInPeriod` (дата ≤ lockdownDate−grace = read-only, override-роль) | ✅ `shared/lockdown.ts`, guard в time-entry-api + plan-slots | ✅ user/03 + developer/04 §«Закрытие периодов» | — |
| H2 | Override логируется (`entry-log.override=true`) | ✅ `credos-time-entry-log` | ✅ developer/04 | — |

---

## Сводка

- **Решений протрассировано:** 40 (A1–H2 по доменам настройки/норма/календарь/целостность/ПДн/справочники/lockdown).
- **Полностью закрыто (код + мануал):** ~24.
- **Реализовано, но не в мануале:** D3, D5, E3-частично, F1-формат — код опередил документацию.

### Топ-gaps

1. **G-3 [СРЕДНИЙ] — Рабочая суббота (WI-03) не имеет своего типа дня.** `WORKDAY_TYPE_OPTIONS` = 4 типа (WORKDAY/WEEKEND/HOLIDAY/SHORT), `WORKING_WEEKEND` НЕ реализован. Решение W5B.5 оставлено открытым (вариант а/б/в). Механически перенос работает записью `dayType=WORKDAY` на дату субботы (норма/ёмкость её учтут), но визуального отличия в календаре/сетке нет и нигде не описано, как оператору заводить перенос. **Файл:** `constants/select-options.ts:212-216`.

2. **G-1 [СРЕДНИЙ] — Рассинхрон reveal-дефолта в user-мануале.** Код: `revealEmployeeNames defaultValue: true` (user-direct 2026-06-22, RISK_REGISTER подтверждает). Мануал `docs/user/04-reports.md:15,47` всё ещё пишет «Имена сотрудников скрыты до завершения RBAC… намеренно по безопасности». Вводит пользователя в заблуждение. **Файлы:** `objects/credos-time-settings.object.ts:226-232` vs `docs/user/04-reports.md`.

3. **G-4 [НИЗКИЙ-СРЕДНИЙ] — developer/02-data-model: верхняя таблица связей Entry устарела.** Строки 121-122 и таблица связей (310-327) показывают `Entry.employee`/`Entry.project` = **CASCADE**, хотя в коде уже **RESTRICT** и нижняя секция «Объекты планирования/аудита» (357-358) это правильно описывает. Документ внутренне противоречив. **Файл:** `docs/developer/02-data-model.md`.

4. **G-2 [НИЗКИЙ] — Нет user-мануала по экрану «Настройки модуля».** UI реализован (`front-components/settings/*`: general-section, dept-section, num-field), но ни один `docs/user/*` не описывает норму/capacityFactor/пороги переработки/lockdown-дату как настройку администратора. Пороги валидации (overtimeWarnHours/maxHoursPerDay/minHoursPerWeek) — только косвенно в 02-timesheet.

5. **G-5 [НИЗКИЙ] — ПДн-КОД описан в user-доках, но не в developer/04-security.** Формат `Сотрудник·<deptCode>·<4hex>` и его свойства (детерминизм, риск смены при смене отдела W5C.16, коллизия 4hex W5C.17) нигде в security-доках не зафиксированы. user/02,03 упоминают «код сотрудника» без объяснения.

### Целостность-фиксы — статус в коде vs доки
Большинство рисков целостности из W5C **закрыты в коде** (часто после самого аудита):
- ✅ CASCADE→RESTRICT (W5C.23/24) — код + 04-security.
- ✅ Нормализация date к полночи UTC (W5C.2/6) — `normalizeEntryDate`, но НЕ в developer-доках.
- ✅ 0ч = ERROR (W5C.27) — `validatePositiveHours`, не в доках.
- ✅ detail-CSV reveal (W5C.19) — guard есть, CISO-016 CLOSED.
- ✅ Единый capacityFactor (W5B.9/10) — `resolveCapacityFactor`.
- 🟡 Открытые края (не баги, признаны): снапшот нормы (B4), SET_NULL×unique по workType (E3), employeeCode при смене отдела (F5), корзина (G2), полнота календаря (C5).

**Вывод:** доменная реализация зрелая, ключевые риски целостности закрыты в коде. Главный системный gap — **документация отстаёт от кода** (date-нормализация, 0ч-ERROR, RESTRICT в верхней таблице, ПДн-код в security, reveal-дефолт в user-мануале). Единственный функциональный пробел — **рабочая суббота как отдельный тип дня (WI-03)**, по которому решение заказчика ещё не зафиксировано.
