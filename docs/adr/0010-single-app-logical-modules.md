# ADR-0010 — Единый app, логические модули (time + каталог)

**Статус:** Accepted (2026-06-22)
**Supersedes:** ADR-0003 (каталог — отдельный app), ADR-0009 (cross-app ссылки между app)
**Контекст-теги:** каталог, мульти-модуль, cross-app, SDK-ограничение

## Контекст

ADR-0003/0009 проектировали каталог как **отдельный SDK-app** рядом с time, со ссылками на кастомные объекты time (Service.owner → credosTimeEmployee, credosTimeProject.service → Service) по `universalIdentifier`. PoC Phase 0 это **опроверг на практике**:

**Twenty SDK 2.14 НЕ поддерживает cross-app ссылку на ЧУЖОЙ КАСТОМНЫЙ объект.** Отдельный app, объявляющий relation/field на кастомный объект другого app, падает на apply:
```
fieldMetadata: OBJECT_METADATA_NOT_FOUND (relation target object metadata not found)
objectPermission: OBJECT_METADATA_NOT_FOUND_PERMISSIONS
```
(typecheck/manifest проходят — видно только на реальном `dev --once`). Доки `extending-objects.md` в прозе допускают «objects from other apps», но ВСЕ примеры + `relations.md` — только СТАНДАРТНЫЕ объекты платформы (Person/Company/WorkspaceMember через `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS`). Объект существует в workspace (uid совпадает), но второй app его не резолвит.

**Проверено (PoC):** отдельный catalog-app со своим объектом + ссылкой на стандартные объекты — синкается; ссылка на `credosTimeEmployee` — падает. После переноса того же объекта в app time связь `Service.owner ↔ Employee` создалась штатно (intra-app).

Заказчику критично: услуга должна реально стыковаться с проектами/планом/сотрудниками («приложения видят данные друг друга»). Cross-app этого не даёт.

## Решение

**Один SDK-app (apps/time) хостит оба домена как логические модули.**

- **Модули — логические, не физические:**
  - папки навигации (`NavigationMenuItemType.FOLDER`): «Трудозатраты»/«Планирование»/«Отчёты»/«Настройки» (time) + «Каталог услуг» (каталог) + «Производство» (Phase 7);
  - префикс объектов: `credosTime*` (time) / `credosCatalog*` (каталог);
  - папки кода в `src/` (SDK находит файлы где угодно в `src/`).
- **Все связи intra-app** → резолвятся штатно: `Service.owner ↔ credosTimeEmployee`, `credosTimeProject.service ↔ Service`, `PlanSlot/Booking.service`, компетенции.
- Один install-юнит, один деплой (`yarn twenty dev --once`), одна `defineApplication` + одна default-role (каталог-объекты добавляются в её objectPermissions).
- Cross-app ссылки — **только на СТАНДАРТНЫЕ** объекты Twenty (как time → Company/WorkspaceMember).

## Последствия

**+** все кросс-доменные связи работают (ядро требования заказчика) · нет дубля мастер-данных · один деплой/гейт · логическая изоляция сохранена (меню/префикс/код).
**−** меньше физической изоляции, чем в ADR-0002/0003 (один app растёт) · общий test-suite/гейт (нагрузка на time-гейт) · нет раздельной установки модулей.

**Митигация:** дисциплина префиксов (`credosCatalog*`, ADR-0004 расширен на модули) + schema-guard допускает `credos(Time|Catalog)` + папки nav/кода держат модули различимыми. Если в будущем потребуется физическое разделение — мигрировать каталог в отдельный app только когда SDK даст cross-app кастом-ссылки.

**Применено (Phase 0):** `credosCatalogService` + `owner→credosTimeEmployee` (intra-app) + view + nav-папка «Каталог услуг» в apps/time. См. [IMPLEMENTATION_PLAN](../catalog/IMPLEMENTATION_PLAN.md), грабля [[twenty-sdk-apply-gotchas]] §6.
