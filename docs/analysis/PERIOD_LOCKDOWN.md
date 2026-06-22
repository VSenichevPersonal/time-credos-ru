# Защита прошлых периодов от правки (lockdown) — анализ 6 конкурентов + дизайн

**Дата:** 2026-06-21
**Автор:** Аналитик AITEAM (итерация 130)
**Вопрос заказчика:** можно ли защищать прошлые периоды от изменения, даже если нет согласования? Да — и это индустриальный стандарт. Как применить — ниже.
**Разведка:** Kimai (lockdown, локал+офиц.доки) · Timetta (AccountingPeriod/isEntityProtected, локал) · Harvest/Clockify/Toggl (web).

---

## 0. Ответ: ДА. Два независимых механизма (у всех 6 конкурентов оба)

| Механизм | Триггер | Гранулярность | У нас |
|---|---|---|---|
| **1. Approval-lock** (status-lock) | по СТАТУСУ (approved/submitted) | по человеку/записи/периоду | **ЕСТЬ** (APPROVED-lock, cannot_modify_approved) |
| **2. Lock-by-date** (period-lockdown) | по ДАТЕ (период закрыт, независимо от статуса) | workspace-wide, одна граница | **НЕТ — это пробел** |

**Ключевое отличие:** status-lock защищает ОДИН документ когда он согласован. **Date-lock защищает ВСЁ за прошлый период независимо от статуса** — даже черновики, отклонённые И новые записи задним числом. Заказчик спрашивает именно про второе («защитить прошлый период даже без согласования»).

---

## 1. Что нашли у конкурентов

**Kimai (эталон реализации):**
- Config: `lockdown_period_start` / `_end` / `_grace_period` / `_timezone`. Окно [start,end] «катящееся» (PHP-строки `first/last day of last month`).
- Запись блокируется если `begin ∈ [start,end]` И `now > end+grace`. Grace = буфер дозаписи (напр. месяц закрывается 10-го).
- Обход: permission `lockdown_override_timesheet` (admin) / `lockdown_grace_timesheet`.
- Валидатор `TimesheetLockdown` на create/update (НЕ в entity). Сообщение «lockdown mode active».
- **3 независимых уровня (ИЛИ):** lockdown(дата) + exported(после выгрузки) + approval(после одобрения).

**Harvest:** company-wide lock-date + **auto-lock по расписанию** (дедлайн) + approval-lock. Lock-by-date — всем сразу. Reopen = admin двигает дату.

**Clockify:** lock-date вручную ИЛИ авто (weekly/monthly lock-day, либо «older than X дней» = встроенный grace). Workspace-wide. Admin правит запертое + вносит за сотрудника.

**Toggl:** lock-date (всё ≤ дата read-only обычным юзерам) + статус submit/approve. Admin обходит всегда.

**Timetta:** AccountingPeriod (isClosed, закрывает фин.менеджер) — проводка в закрытый период сдвигается на след.открытый. + isEntityProtected по статусу (=наш APPROVED-lock). Тяжелее (финансовый).

**Паттерн индустрии (6/6):** два механизма, оба присутствуют. Lock-by-date = грубый workspace-wide замок по граничной дате; обход = admin; grace = «older than N дней» ИЛИ дата позже конца периода; юзеру — disabled + «период закрыт администратором».

---

## 2. Дизайн для нас (в рамках существующих блоков)

### 2.1 Модель (минимум, MVP)
**Settings (singleton credosTimeSettings) — добавить поля:**
- `lockdownMode`: SELECT `OFF | OLDER_THAN_DAYS | BEFORE_DATE` (дефолт OFF).
- `lockdownDays`: NUMBER — для OLDER_THAN_DAYS (напр. 35 = «старше 35 дней заперто», даёт grace до ~5-го числа след.месяца).
- `lockdownBeforeDate`: DATE — для BEFORE_DATE (фикс-граница, ручной сдвиг админом).
- `lockdownTimezone`: TEXT (дефолт МСК) — расчёт границы.

Rolling считаем В КОДЕ (enum + compute), НЕ PHP-eval (Kimai-строки = инъекц-риск, нам не нужно).

### 2.2 Guard (где проверять)
**ОДИН хелпер `assertPeriodNotLocked(date, actor, settings)`** в logic-functions, зовётся из ВСЕХ мутаций по дате:
- `time-entry-api.logic.ts` (create/update/delete) — главное.
- `plan-slots.logic.ts` (upsert) — план прошлого периода тоже.
```
lockBoundary = resolveLockBoundary(settings, now, tz)   // дата-граница
if entry.date <= lockBoundary AND !actor.hasOverride:
    throw 'period_locked: период до DD.MM.YYYY закрыт. Обратитесь к администратору.'
```
- **Override = роль** (Twenty permission / isManager+admin). Не хардкод.
- Комбинируется с APPROVED-lock + (будущий) exported-флаг как ИЛИ — три уровня (DEEP_VALUE №2).

### 2.3 UX
- Ячейка/строка прошлого закрытого периода — disabled + 🔒 + title «Период закрыт (до DD.MM)». Тот же паттерн, что APPROVED-lock 🔒 (переиспользовать).
- В Settings — секция «Закрытие периодов» (рядом с согласованием): режим + дни/дата.
- Admin видит баннер «Период до DD.MM закрыт» + может править (override).

### 2.4 Связь с CISO-005
Guard живёт в time-entry-api.logic — ТО ЖЕ место, где нужен resolveActor (итер.128). **override-проверка требует надёжной identity** (кто admin) → lockdown-override завязан на server-identity. Делать lockdown-guard ПОСЛЕ/вместе с resolveActor-расширением на time-entry (иначе override спуфится client-ref). Связь P0 CISO-005.

---

## 3. Этапность

**Фаза 1 (MVP, дёшево, в существующих блоках):**
1. Settings +4 поля (lockdownMode/Days/BeforeDate/Timezone) — ADDITIVE.
2. `assertPeriodNotLocked` хелпер + вызов в time-entry-api create/update/delete.
3. UX: 🔒 disabled прошлых записей (переиспользовать APPROVED-lock паттерн) + сообщение.
4. Override по роли (после/с resolveActor).

**Фаза 2:**
5. Guard в plan-slots (план прошлого периода).
6. exported-флаг (после выгрузки в 1С) — 3-й уровень (DEEP_VALUE №2/G3.16).
7. Auto-schedule (Harvest/Clockify) — «закрывать автоматически N-го числа» — если ручного сдвига мало.

**Фаза 3:**
8. AccountingPeriod-сущность (Timetta) — если понадобится формальное «закрытие месяца» с аудитом кто/когда закрыл/переоткрыл. Для MVP избыточно (Settings-граница хватает).

---

## 4. Вопросы заказчику/арху

1. **Режим:** «старше N дней» (rolling, авто, рекомендую) ИЛИ фикс-дата (ручной сдвиг админом)? Большинство (Clockify/Kimai) — rolling.
2. **Grace:** сколько дней после конца месяца дозаполнять (напр. до 5-го = ~35 дней)?
3. **Кто закрывает/обходит:** только admin ИЛИ руководитель отдела для своего? (рекомендую admin глобально).
4. **Что с планом:** запирать ли план прошлого периода тоже (plan-slots) или только факт (time-entry)? (рекомендую и план — консистентность).
5. **Закрывать независимо от согласования** (даже несогласованные черновики прошлого месяца запереть)? — судя по вопросу заказчика, ДА. Это и есть смысл date-lock.

---

**Резюме:** date-lock (защита прошлого периода независимо от согласования) — индустриальный стандарт (6/6 конкурентов), у нас ПРОБЕЛ. MVP дёшев: Settings +4 поля + один guard `assertPeriodNotLocked` в time-entry-api (+ plan-slots фаза-2) + 🔒-UX (переиспользовать APPROVED-lock). Override по роли завязать на CISO-005 resolveActor. Комбинируется с APPROVED-lock + exported = 3 уровня защиты учёта. Всё в существующих блоках (Settings/time-entry-api/grid-lock), новых экранов нет.
