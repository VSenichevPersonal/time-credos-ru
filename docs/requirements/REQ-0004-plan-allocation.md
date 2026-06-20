# REQ-0004 — credosTimePlanAllocation (план по неделям) + гейт правки плана

**Статус:** PROPOSED (v2 — план по неделям; гейт plannedEffort — решить сейчас)
**Источник:** arch P-D2 (волна-3)
**Затрагивает:** новый объект `credosTimePlanAllocation` (v2), `roles/*` (гейт правки плана), `objects/credos-time-project.object.ts` (plannedEffort)

> NB нумерация: arch назвал «REQ-0003», но REQ-0003 уже занят [контрактом /s/reports](REQ-0003-reports-aggregates-contract.md). Это **REQ-0004**.

## Часть A — гейт правки плана (сейчас, P-D2 п.2)

**Задача:** `plannedEffort`/`startDate`/`endDate` проекта правит только руководитель (isManager / руковод отдела), не рядовой сотрудник.

**Факты:**
- PATCH этих полей под app-ролью (`default-role`) работает (`canUpdateAllObjectRecords: true` + per-object) — подтверждено (P-D2 п.1). ✅
- SDK поддерживает **field-level RBAC**: `defineRole.fieldPermissions` = `Record<fieldId, {canRead?, canUpdate?}>`.

**Варианты гейта:**
1. **Native field-RBAC (рекомендую):** запретить `canUpdate` на `plannedEffort`/`startDate`/`endDate` для роли рядового сотрудника; руководителю — разрешить.
   - ⚠️ Требует **app-defined user-роль «Сотрудник»** (сейчас её нет: не-менеджеры получают базовую workspace-роль вне контроля app). Без неё запрет повесить не на кого.
2. **Logic-function гейт** (`/s/project-plan` PATCH через функцию с проверкой `actor.isManager`) — но упирается в **нерешённый actor-резолв** ([REQ-0001](REQ-0001-approval-rbac-sod.md): `userWorkspaceId→employee` спуфится через client-param). Тот же корневой блокер, что у approval.
3. **UI-only гейт** (Dev1 прячет правку плана у не-руковода) — НЕ безопасность (REST обходится).

**Рекомендация Dev 2:** вариант 1 (native field-RBAC) + завести роль «Сотрудник». Решает гейт без actor-резолва (платформа сама проверяет по назначенной роли). **@arch/@CISO: подтвердите подход** — тогда реализую роль + fieldPermissions.

### Известное ограничение dev (текущий статус — как approval-guard)

**Сейчас гейт «план правит только руководитель» = чисто фронтовый** (Dev 1, по `isManager`), аналогично approval до закрытия REQ-0001:
- роль app общая, право на PATCH `credosTimeProject` бинарное на объект → средствами роли не ограничить «только руководитель отдела проекта»;
- реальный per-field / per-owner гейт — либо native field-RBAC (вариант 1, нужна роль «Сотрудник»), либо logic-функция (вариант 2, нужен actor-резолв из REQ-0001) — **в SDK сейчас не реализовано**;
- для v1 принимаем фронтовый гейт достаточным для dev: план — не финансовая операция с разделением обязанностей, риск ниже approval. Зафиксировано здесь и в DEV2_LOG. Ужесточение (field-RBAC / logic-guard) — отдельный трек по подтверждению arch/CISO.

## Часть B — credosTimePlanAllocation (v2, resource allocation / прогноз занятости)

**Суть (уточнено arch 22:55):** это **resource allocation / прогноз занятости**, не просто план проекта. Из ёмкости человека (напр. 50 ч/нед) часть предварительно бронируется: «сотрудник X занят N ч на проекте Y в период Z». Руковод распределяет (booking) ёмкость людей по проектам.

**Модель:** `credosTimePlanAllocation = { employee, project, period (ISO-неделя), plannedHours }` — аллокация **по СОТРУДНИКУ** (не только project×period).

**Производные метрики:**
- **Загрузка человека** = Σ его аллокаций; свободно = личная ёмкость − Σ аллокаций («у Иванова свободно 20 из 50»).
- **Загрузка проекта** = Σ аллокаций на проект (кто и сколько выделен).
- **Загрузка отдела** = Σ по людям отдела.
- **Capacity-доска:** загрузка = Σ аллокаций если заданы, **иначе fallback** на `project.plannedEffort` (v1, равномерно по команде).

**Связь:** питает [REQ-0003](REQ-0003-reports-aggregates-contract.md) (план «по людям» — закрывает открытый вопрос «allocation») + capacity-доску + DP-0001 «когда освободится».

**Статус:** PROPOSED, **v2** — после v1 (P-D1: грубая правка `project.plannedEffort`, Dev1). Объект + сид + интеграция в reports/capacity — отдельная итерация.

## Открытые вопросы
- Роль «Сотрудник»: заводить сейчас (для гейта A) или ждать v2?
- Гранулярность allocation: неделя (ISO) vs произвольный интервал? Предлагаю ISO-неделя (стыкуется с capacity/reports period).
