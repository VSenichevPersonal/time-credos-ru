# План консолидации и упрощения — time.credos.ru

**Автор:** arch-аудитор консолидации AITEAM
**Дата:** 2026-06-21
**Скоуп:** `apps/time/src/` — осмысление накопленного за марафон. Цель — единообразие (консистентность), объединение дублей, упрощение. **НОВЫХ ФИЧ НЕТ.**
**База:** полное чтение токенов, дубль-компонентов, дубль-логики, REST-хелперов, резолва юзера, мёртвого кода, размеров файлов.
**Сверено с:** `docs/analysis/ANALYST_FINDINGS.md` (B1/B2/B4/T2/T6 аналитика). Здесь — **углубление** этих пунктов конкретикой file:line + новые находки, не покрытые аналитиком. Дубли не повторяю, дополняю.

> Принцип (память проекта): минимальное решение, без gold-plating. Низкий риск вперёд. Что работает и не дублируется — не трогать.

---

## Связь с находками аналитика (что уже намечено, что добавляю)

| ID аналитика | Что | Статус | Этот док |
|---|---|---|---|
| B1 / СЛОЙ2-2 / T6 | Слить 3 токена → shared/tokens | 🔴 ВЗЯТ | **дополняю**: 4-й токен (cal-tokens), tag-color-hex, инлайн-хексы, конкретные дубли hex (R1) |
| B2 / СЛОЙ2-3 / T6 | PeriodNav один компонент | 🔴 ВЗЯТ | **дополняю**: 4 места реинкарнации + Segmented×2 + MetricCard (R2, R3, R4) |
| B4 | Мёртвый проп lastWorkTypeByProject | 🔴 ВЗЯТ | **уточняю**: мёртв ТОЛЬКО в project-view.tsx:23, в day-view/add-row он живой (G1) |
| T2 | Норма — один источник | 🔴 ВЗЯТ | **переоткрываю как незакрытый**: фронт=8ч фикс vs сервер=сумма календаря. Дубль концептуально ОСТАЁТСЯ (Y1) |
| T6 | shared/ui + Segmented/токены/PeriodNav | 🔴 = B1/B2 | развёрнуто в R1-R4 |

**Новое (аналитик не покрыл):** date-утилиты дубль (Y2), REST-boilerplate (Y3), resolveSelfIsManager мёртвый (G2), round2/format дубль (Y4), крупные файлы calc-load/reports-calc (Y5), нейминг fields (N1).

---

## 🔴 ЯВНЫЕ ДУБЛИ — объединить

| # | Что дублируется | Файлы (file:line) | Предложение | Эффект | Усилие | Приоритет |
|---|---|---|---|---|---|---|
| **R1** | **Цвета между токенами и инлайн.** `#3b6fe0` (grid `T.accent` = `tag-color-hex.blue.solid`), `#eaf0fd` (`T.accentSoft` = `blue.tint`); инлайн `#fff/#ffffff` мимо `T.surface` в 4 местах; `#15803d` инлайн = `T.ok`; warn-палитра `#92400e/#fef3c7` нигде в токенах | `grid/tokens.ts`, `shared/tag-color-hex.ts`; инлайн: `shared/error-state.tsx:67`, `grid/approval-bar.tsx:122,160`, `capacity/board-toolbar.tsx:102`, `capacity/dept-row.tsx:78`, `capacity/dept-plan-row.tsx:47,48` | Свести базовую палитру (accent/surface/ok/warn/text) в `shared/tokens.ts` (часть B1). tag-color-hex `blue` ссылается на `T.accent`. Добавить `T.warnSolid/warnTint`. Инлайн-хексы → токены | Единая точка цвета, нет дрейфа между экранами; -13 разрозненных значений | S | P1 (часть B1) |
| **R2** | **Segmented/переключатель режимов ×2** — почти идентичны (~95%) | `grid/mode-switcher.tsx:14-53` vs `capacity/mode-switcher.tsx:15-59` | `shared/segmented.tsx` (дженерик). grid-версия — обёртка для совместимости | -1 копия, единый вид сегмент-контролов | S | P2 (часть B2/T6) |
| **R3** | **PeriodNav реинкарнирован инлайн** | `grid/period-nav.tsx:5-77` (канон) vs инлайн в `reports/reports-dashboard.tsx:21-70`; своя nav-шапка в `my-time/my-hours.tsx:36-67` | Переиспользовать `grid/period-nav.tsx` (или поднять в `shared/period-nav.tsx`) в reports + my-time. `capacity/period-header.tsx` — НЕ трогать (специфичен: месячные банды, now-edge) | -2 инлайн-копии навигации периода | M | P2 (= B2) |
| **R4** | **Карточка метрики ×2** (~90%) | `reports/kpi-cards.tsx:10-47` vs `my-time/my-hours.tsx:28-34` (Card) | `shared/metric-card.tsx`, использовать в обоих | -1 копия, единый KPI-вид | S | P2 |
| **Y2** | **Date-утилиты дубль** — `mondayOf`, `dateKey/toIso` (YYYY-MM-DD), `DAY_MS` (86400000) | `grid/use-week.ts:30,37` vs `capacity/calc-load.ts:15,22,25`; `DAY_MS` hardcoded в `grid/use-timesheet-actions.ts:31,45`; `dayKey` в `reports-calc.ts:117` | `shared/date.ts`: `mondayOf`, `dateToIso`, `DAY_MS`. Re-export в местах вызова | SSOT дат, нет рассинхрона недель | S | P1 (низкий риск, тесты есть) |
| **Y4** | **round2 / toFixed(2)** разбросан | `my-time/use-my-hours.ts:23` vs `reports-calc.ts:239,240,266,308` (inline) | `shared/format.ts: round2(n, d=2)` (или дополнить grid/format) | Единое округление часов | S | P1 |
| **G2** | **Мёртвый экспорт `resolveSelfIsManager`** — @deprecated, нигде в проде, только определение + тесты. Fallback давал ложный `true` всем | `capacity/capacity-rest.ts:188-203` (+ тесты в `capacity-rest.test.ts`) | Удалить функцию + её тесты. Канон — `shared/use-self-employee.ts` | -22 строки мёртвого кода + убрать ловушку (ложный true) | S | P1 |

---

## 🟡 УПРОЩЕНИЯ

| # | Что усложнено | Файлы | Предложение | Эффект | Усилие | Приоритет |
|---|---|---|---|---|---|---|
| **Y3** | **REST-boilerplate ~160 строк (38% от 11 rest-файлов).** Повторяется `const client() + type ListResp<T> + pickList<T>` (×8), fetch+map (×10), cursor-пагинация (×2), filter-строки (×15), `useEffect+alive-flag+error` (×4) | `capacity/capacity-rest.ts`, `grid/time-rest.ts`, `reports/reports-rest.ts`, `project-team/team-rest.ts`, `project-summary/summary-rest.ts`, `calendar/calendar-rest.ts`, `settings/settings-rest.ts`; хуки: `my-time/use-my-entries.ts`, `use-my-hours.ts`, `project-budget/use-project-budget.ts` | `shared/rest-client.ts`: тонкая обёртка `list/get/create/update/delete/paginate` + `pickList`. Опционально `useFetch` хук для alive-flag паттерна | -160 строк, тесты централизованы, единый стиль фильтров/пагинации | M | P3 (делать ПОСЛЕ токенов/date — больше связей) |
| **Y1** | **Норма часов — концептуальный дубль (T2 не закрыт).** Фронт `DAILY_NORM_HOURS=8` фикс (`grid/format.ts:6`), сервер считает из календаря: `baseNorm = Σ часов рабочих дней` (`reports-calc.ts:128-130,478-479`). Сетка(8ч) ≠ дашборд(календарь) при праздниках/сокращ. дне | `grid/format.ts:6`, `reports-calc.ts:128-130,187-195,478-516` | Решение arch: фронт-сетка для подсветки «недобора» может оставить 8ч (UX-ориентир дня), но **отчётная норма — только сервер**. Зафиксировать ADR: где какая норма легитимна, чтобы не «чинили» расхождение вслепую | Убрать риск «сетка врёт vs дашборд», доверие к цифрам | S (ADR) / M (если выравнивать) | P2 |
| **Y5** | **Файлы >200 строк (DEV_STANDARDS <200).** Логика-ядро: `reports-calc.ts` (608), `calc-load.ts` (424), `time-entry-api.logic.ts` (285). Компонент: `weekly-grid.tsx` (251) — 3 режима + фильтры + approval + клавиатура в одном | см. колонку | `reports-calc.ts` → period-calc / norm-calc / absence-calc. `calc-load.ts` → 4 модуля (capacity/projects/periods/absences). `weekly-grid.tsx` → вынести режим-ветки в контейнеры + logic в хуки | Соответствие стандарту, тестируемость | M (calc-load/reports-calc), High (weekly-grid) | P3 |
| **Y6** | **Bar-логика бюджета продублирована инлайн в таблице** (~85% от `Bar`) | `reports/bar.tsx:12-38` vs `reports/breakdown-table.tsx:33-41` (инлайн бар) | Параметризовать `Bar` (цвет/стиль) и переиспользовать в breakdown-table | -1 инлайн-копия | S | P3 |

---

## 🟢 МЁРТВЫЙ КОД / ЧИСТКА

| # | Что | Файл:line | Подтверждение | Действие | Усилие |
|---|---|---|---|---|---|
| **G1** | Мёртвый проп `lastWorkTypeByProject` | `grid/project-view.tsx:23` | Объявлен в Props, НЕ деструктурируется, помечен «не используется (добавляем новый вид работ)». В `day-view.tsx`/`add-row.tsx`/`week-grid.tsx` проп ЖИВОЙ — не трогать там | Удалить ТОЛЬКО строку 23 в project-view (= B4 аналитика, уточнённый) | S |
| **G2** | `resolveSelfIsManager` (см. R-таблицу) | `capacity/capacity-rest.ts:188-203` | @deprecated, прод-вызовов нет | Удалить функцию + тесты | S |
| **N1** | Нейминг fields непоследователен | `fields/`: `company-credos-time-projects.field.ts` (с префиксом) vs `project-billing-links`, `project-stages`, `workspace-member-*` (без `credosTime`) | objects/ единообразны (`credos-time-*`), fields/ — нет | Зафиксировать конвенцию (имя поля = от родительского object, без принудит. префикса) в DEV_STANDARDS. Файлы НЕ переименовывать (риск > польза) | S (только запись правила) |

---

## Что НЕ трогать (работает, не дублируется)

- `capacity/period-header.tsx` — специфичен (месячные банды, now-edge), НЕ кандидат в shared PeriodNav.
- `reports/category-bar.tsx` vs `bar.tsx` — разные логики (stacked vs simple), объединение усложнит.
- `shared/error-state.tsx` vs `grid/center.tsx` — разные роли (восстановление ошибки vs спиннер).
- `shared/error-boundary.tsx` + `error-state.tsx` — хорошая пара (класс-краш ловит / load-ошибку показывает). Оставить.
- **DataTable-абстракция** (общая таблица для breakdown/my-hours/month-table/board-rows) — соблазнительно, но требования разные (30-50% общего), риск High. НЕ делать. `shared/sort-header.tsx` + `use-sortable.ts` уже переиспользуемы — достаточно.
- `resolveEmployeeId` (фронт `grid/time-rest.ts:23` + сервер `time-entry-api.logic.ts`) — живой; серверный `resolveActor` (`approval.logic.ts`) — боевая RBAC-защита. Консолидацию серверных версий вынести в отдельный бэкенд-тикет (Dev2), НЕ в эту волну фронта.
- Норма SSOT `WEEKLY_NORM_HOURS` в `constants/labels.ts` — корректна, не дублируется. Проблема только в Y1 (фронт-фикс 8 vs сервер-календарь).
- absence/plannedHoursInPeriod в `calc-load.ts` — специфичные контракты периодов, общий хелпер хрупок. Оставить (кроме базовых date-утилит Y2).

---

## Рекомендованный порядок рефактор-волны (низкий риск → выше)

**Волна 1 — копеечная чистка (S, риск минимальный, без поведения):**
1. G2 удалить `resolveSelfIsManager` + тесты.
2. G1 удалить мёртвый проп `project-view.tsx:23`.
3. N1 записать конвенцию нейминга fields в DEV_STANDARDS.

**Волна 2 — SSOT базовых примитивов (S, тесты прикрывают):**
4. Y2 `shared/date.ts` (mondayOf/dateToIso/DAY_MS) + re-export.
5. Y4 `round2` в shared/format.
6. R1 базовая палитра в `shared/tokens.ts` + инлайн-хексы → токены (это и есть ядро B1).

**Волна 3 — shared/ui компоненты (S/M, визуальная регрессия — прогнать глазами):**
7. R4 `shared/metric-card.tsx`.
8. R2 `shared/segmented.tsx`.
9. R3 PeriodNav переиспользовать в reports + my-time (= B2).
10. Y6 параметризовать Bar для breakdown-table.

**Волна 4 — ADR + декомпозиция (M/High, требует ревью):**
11. Y1 ADR по норме (где фронт-8 легитимен, где только сервер).
12. Y3 `shared/rest-client.ts` (после стабилизации shared).
13. Y5 разбить calc-load / reports-calc / weekly-grid (High — отдельным заходом, под тесты).

**Зоны (память проекта): Dev1=фронт (R1-R4, Y2/Y4/Y6, G1), Dev2=бэк/logic (Y1 ADR, Y5 reports-calc, серверный resolveEmployeeId). Y3 REST — фронт. Не писать одни файлы разом.**

---

## Метрики потенциала

- Мёртвый код к удалению: ~25 строк (G1+G2).
- REST-boilerplate сжимаемый: ~160 строк (Y3).
- Дубль-токены/цвета: ~13 значений → единая палитра (R1).
- Дубль-компоненты: 3-4 копии (Segmented, PeriodNav×2, MetricCard) → 200-300 строк.
- Файлы >200 строк: 3 ядра логики + weekly-grid (Y5).
