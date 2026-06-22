# ADR-0009 — Cross-app ссылки между SDK-app (catalog ↔ time, общие мастер-данные)

> ⚠️ **SUPERSEDED by [ADR-0010](0010-single-app-logical-modules.md)** (2026-06-22, в тот же день). PoC опроверг основную посылку: Twenty 2.14 НЕ резолвит cross-app ссылку на чужой кастомный объект (`OBJECT_METADATA_NOT_FOUND` на apply). Решение — единый app + логические модули. Cross-app допустим ТОЛЬКО на стандартные объекты Twenty. Деталь механизма (relationTargetObjectMetadataUniversalIdentifier) верна для intra-app и для стандартных объектов.

**Статус:** SUPERSEDED (ADR-0010)
**Контекст-теги:** каталог, мульти-app, мастер-данные, relation
**Связано:** [ADR-0003](0003-catalog-separate-app-shared-master-data.md) (отдельный app + Service-мост), [ADR-0004](0004-naming-alignment-credos-crm.md) (префиксы/UUID-SSOT)

## Контекст

Каталог услуг — отдельный SDK-app (ADR-0003), но должен **видеть и ссылаться** на данные time-app: услуга → ответственный (Employee), категория → отдел (Department), услуга → организация (Company). Вопрос: как два SDK-app в одном Twenty workspace делят мастер-объекты?

**Факт из исследования SDK 2.14:**
- Объекты в workspace существуют **независимо** от того, какой app их создал; идентифицируются по `universalIdentifier` (UUID v4, стабилен между деплоями — ADR-0004).
- Relation-поле таргетит целевой объект через `relationTargetObjectMetadataUniversalIdentifier` (по UUID, не по имени/префиксу/app).
- Доки явно разрешают: «*Add fields to standard Twenty objects … **or to objects from other apps** using defineField*» (`research/twenty-sdk/fresh/data/extending-objects.md`).
- Прецедент в проде: time-app уже добавляет relation-поля на стандартные `Company` и `WorkspaceMember` (`apps/time/src/fields/company-credos-time-projects.field.ts`, `workspace-member-managed-projects.field.ts`).
- Сервер сериализует sync per-workspace → конкурентные деплои двух app безопасны.

**Реальность нейминга:** оргмастер уже определён time-app как `credosTimeEmployee` / `credosTimeDepartment` (исторически time строился первым). Концептуально это оргмастер, не «time-данные».

## Решение

1. **Не передекларировать оргмастер.** Каталог **ссылается** на существующие объекты time-app по `universalIdentifier`:
   - `credosCatalogService.owner → credosTimeEmployee`
   - `credosCatalogEmployeeCompetency.employee → credosTimeEmployee`
   - `credosCatalogCategory.department → credosTimeDepartment`
   - `credosCatalogService.client → Company` (стандартный Twenty, как в time)
1a. **Связь time↔услуга — каталог РАСШИРЯЕТ объекты time** (направление зависимости catalog→time, time остаётся чистым; прецедент — time расширяет Company/WorkspaceMember). Каталог объявляет relation-поля **на чужих объектах time**:
   - `credosTimeProject.service → credosCatalogService` (проект классифицируется услугой → факт-часы по услуге)
   - `credosTimeBooking.service → credosCatalogService` (бронь ресурса под услугу)
   - `credosTimePlanSlot.service → credosCatalogService` (план загрузки по услуге → спрос на услугу)
   - (опц.) `credosTimeDeptPlan.service` — план отдела в разрезе услуг
   > Каталог **владеет** этими linking-полями (deploy каталога их добавляет); time-app про них не знает → нет обратной зависимости, time не требует передеплоя.
2. **Префикс каталога — `credosCatalog*`** (ADR-0004): свои объекты не путаются с `credosTime*` и CRM.
3. **Доступ к чужим UUID.** Каталог держит `src/constants/shared-identifiers.ts` с UUID оргмастера time + Twenty-стандартных объектов. **SSOT остаётся в time** (`apps/time/src/constants/universal-identifiers.ts`); в каталоге — копия с пометкой источника + **guard-тест-инвариант** (значения совпадают; UUID неизменны по ADR-0004, поэтому копия безопасна).
4. **Оргмастер остаётся под префиксом `credosTime*`** (без миграции-переименования — keep-it-simple). Переименование в нейтральный `credosOrg*` НЕ делаем: UUID стабилен, ссылка идёт по UUID, рефактор имени рискован и не нужен.

## Последствия

**+** каталог переиспользует реальные данные сотрудников/отделов (нет дублей, нет рассинхрона) · cross-app связи навигируемы в обе стороны · деплои независимы · нулевая миграция time.
**−** мягкая связанность каталога с UUID time (закрыта guard-тестом + неизменностью UUID) · оргмастер живёт под `credosTime*` именем (косметика; концептуально оргмастер, документировано здесь).

**Инвариант:** UUID оргмастера time **никогда не менять** (их теперь читает и каталог). Изменение = ломает cross-app ссылки.
