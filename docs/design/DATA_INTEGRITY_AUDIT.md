# Аудит целостности данных — модуль трудозатрат (credosTime*)

**Автор:** Dev 1 · **Дата:** 2026-06-22 · **Повод:** заказчик — пустые Факт/Остаток в списке проектов → «перепроверь по всей системе, чтобы не повторялось».

## Класс-первопричина: «derived-stored поле без полного жизненного цикла»

**Определение.** Поле, чьё значение ВЫЧИСЛЯЕТСЯ из других записей, но ХРАНИТСЯ (stored), а не считается на лету. Такое поле корректно **только** при ВСЕХ трёх инвариантах:

| Инвариант | Что | Чем грозит нарушение |
|---|---|---|
| **(A) Backfill** | post-install пересчитывает поле для СУЩЕСТВУЮЩИХ данных при установке | пусто/устарело на проде до первой мутации источника |
| **(B) Полное инкрементальное сопровождение** | пересчёт на КАЖДОМ пути мутации источника (create/update/delete/смена родителя) | дрейф значения от истины |
| **(C) Единый источник (SSOT)** | НЕ считать то же значение ещё и «на лету» в другом месте | расхождение stored vs live |

**Правило для ревью (DoD любого derived-stored поля):** A ∧ B ∧ C. Нет хотя бы одного — поле некорректно.

## Реестр derived-stored полей + статус

| Поле | Объект | Источник | A backfill | B сопровождение | C SSOT | Вердикт |
|---|---|---|---|---|---|---|
| `factHours` | project | Σ entry.hours проекта | ❌ нет | ✅ recalc на upsert/delete | ✅ | 🔴 **БАГ** (пусто на существующих) |
| `budgetRemaining` | project | plannedEffort − factHours | ❌ нет | ✅ (вместе с factHours) | ✅ | 🔴 **БАГ** (то же) |
| `headcount` | department | count активных сотрудников | — | ❌ не сопровождается | ❌ дублирует live-расчёт (`capacity-rest`, `reports-calc`) | 🟡 **SSOT-нарушение** (stored vs live расходятся) |
| `ftePercent` | employeeDepartment | ВВОД (REQ-0011) | n/a | n/a | n/a | ✅ input, не derived |

## Находки (severity)

- **🔴 P1 — factHours/budgetRemaining без backfill.** Колонки списка проектов пусты на всех проектах, чьи записи созданы до появления поля. Фронт-колонки корректны (рендерят поле) — пусто само поле.
  **Фикс (Dev2):** `backfill-project-fact-hours.post-install.ts` — по всем проектам Σ entry.hours → patch `factHours` + `budgetRemaining` (логика `recalcProjectFactHours`, но батчем). Образец — `backfill-project-departments.post-install.ts`.

- **🟡 P2 — `department.headcount` нарушает SSOT.** Stored-поле есть, но численность считается ЖИВО (`capacity-rest.activeHeadcountByDept`, `reports-calc`). Stored-значение никем не сопровождается → если что-то его прочитает, получит устаревшее. **Решение (Dev2):** либо удалить stored-поле (живой расчёт = SSOT), либо сопровождать на смену employee.active/department. Рекомендую — **удалить stored** (живой count уже работает).

- **🟡 P2 — onDelete CASCADE на `entry.employee` и `entry.project`.** Hard-delete сотрудника/проекта стирает ВСЮ историю записей (табель/1С/152-ФЗ аудит). Сейчас смягчено `canDestroyAllObjectRecords=false` (CISO) → hard-delete отключён, CASCADE не срабатывает. **Латентная мина:** если destroy когда-то включат — тихая потеря. **Решение:** задокументировать связку «объекты с записями = только soft-delete» как инвариант ролей; либо SET_NULL (но ломает rollup/отчёты — хуже). Оставить CASCADE + вечный `canDestroy=false`.

## Что ЦЕЛО (проверено) ✅

- **Server-lock согласованных** (`time-entry-api` upsert+delete): `status===APPROVED → cannot_modify_approved`. Не только UI (W6-2), но и сервер (CISO-011).
- **Approval SoD**: нельзя согласовать свою запись (`entry.employeeId === actor.employeeId` → skip), isManager-guard, `approvedBy/approvedAt` фиксируются.
- **factHours инкрементально** (B) — покрыт все пути (upsert/delete/смена проекта `projectIdsToRecalc`).
- **Filter-injection** (CISO-006): id/params валидируются UUID перед REST.

## Вектор на доисследование (QA/Dev2)

- **Дубли записей**: нет DB-уникальности (employee+project+workType+date). Два клиента/импорт → дубль → factHours двойной счёт. Связано с backlog D1 (детект аномалий). Проверить: гарантирует ли грид-upsert единственность по (rowKey, day)?

## Действие

1. Dev2: backfill factHours (P1) + решение по headcount (P2).
2. Все будущие derived-stored поля — через DoD (A∧B∧C) этого документа.
3. QA: тест backfill + тест «дубль не задваивает factHours».
