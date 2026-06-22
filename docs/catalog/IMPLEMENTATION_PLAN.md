# Каталог услуг — план реализации на Twenty SDK

**Дата:** 2026-06-22
**Статус:** Phase 0 СТАРТОВАЛ (AITEAM: Dev2/Dev1/аналитик); time-app стабилен v1.0.0
**Назначение:** каталог = **модуль стыковки продаж и производства**. Услуга — общий язык. Продажи: что продаём + можем ли оказать (gap). Производство: кто/ёмкость/факт. Дорастает до **производственной CRM** (лог хода работ + 1С, см. Phase 7).
**Связано:** [SDK_DESIGN.md](SDK_DESIGN.md) · [OSS_REFERENCES.md](OSS_REFERENCES.md) · [RECON.md](RECON.md) · [ADR-0003](../adr/0003-catalog-separate-app-shared-master-data.md) · [ADR-0010](../adr/0010-single-app-logical-modules.md)

## Принципы (стандарты, которым план следует)

| Стандарт | Как соблюдаем |
|---|---|
| **ADR-0010** единый app, модули | каталог = логический модуль в app `apps/time` (cross-app кастом-ссылки не работают в 2.14); модули = nav-папки + префиксы; связи intra-app |
| **ADR-0003** Service-мост (контент) | модель Service, контур CRM/продаж — в силе (физ. разделение app — нет, см. 0010) |
| **ADR-0004** префикс + UUID-SSOT | объекты каталога `credosCatalog*`; UUID в `apps/time/src/constants/`, неизменны |
| **SDK-грабля §6** | cross-app ссылка только на СТАНДАРТНЫЕ объекты Twenty; общий кастом = один app |
| **ADR-0008** change-log | аудит компетенций (level/expiry) через паттерн журнала |
| **SDK-грабли** (память) | SELECT без запятых (тире); slugs `name`/`role`/`status`/`probability` зарезервированы; labelIdentifier НЕ в том же sync; DROP падает; FOLDER-nav two-phase; apply ≠ dry-run; apply не транзакционен |
| **Зоны Dev1/Dev2** | back (objects/fields/logic) = Dev2; front (components/views/layouts/nav) = Dev1; constants — согласовывать |
| **keep-it-simple** | iteration-1 = минимум; компетенции-gap и Wiki — отдельными фазами |
| **Gate каждой фазы** | `lint` 0 + `test:unit` 0 failed + `dry-run` clean → commit точечно → `yarn twenty dev --once` |

---

## Архитектура (итог)

```
  ОДИН app (apps/time) · ОДИН workspace · логические модули (ADR-0010)

  ┌─ Модуль ТРУДОЗАТРАТЫ (credosTime*) ──────────────────┐
  │  Employee · Department · Project · Booking · PlanSlot │
  └──▲──────▲────────────▲─────────▲──────────▲──────────┘
     │ owner│ department  │  все связи INTRA-app          │
     │      │             │  (резолвятся штатно)          │
  ┌─ Модуль КАТАЛОГ УСЛУГ (credosCatalog*) ───────────────┐
  │  Service ─▶ Category ─▶ (Department)                  │
  │     │  └─owner─▶ (Employee)   ← PoC Phase 0 ✓          │
  │     ├─ ServiceProduct ─▶ Product ─▶ Vendor            │
  │     ├─ ServiceCompetency ─▶ Competency ◀─ EmployeeComp│
  │     ├─ ServiceRelation (typed, cross-sell)            │
  │     └─ ServiceDocument ─▶ Document                    │
  └───────────────────────────────────────────────────────┘

  Услуга = разрез по всему модулю трудозатрат (intra-app поля):
   Project.service  → факт-часы по услуге (что реально делали)
   PlanSlot.service → план/спрос по услуге (что собираемся)
   Booking.service  → бронь ресурса под услугу
   + Employee↔Competency gap → можем ли услугу оказать
  Разделение в UI: nav-папки «Трудозатраты» / «Каталог услуг» / «Производство».
```

---

## Фазы (волны)

### Phase 0 — PoC связи Service↔Employee (риск-бёрндаун) ✅ ВЫПОЛНЕН
**Цель:** доказать, что услуга реально связывается с данными time в одном workspace.
**Что было:** сначала пробовали ОТДЕЛЬНЫЙ catalog-app + cross-app ссылку → `OBJECT_METADATA_NOT_FOUND` (Twenty 2.14 не резолвит чужой кастомный объект). Пивот на **единый app + логические модули** (ADR-0010).
- Модуль каталога в `apps/time/src/` (объекты/поля/views/nav с префиксом `credosCatalog*`), UUID — в общем `apps/time/src/constants/universal-identifiers.ts` (секция модуля каталога).
- **PoC применён на проде:** `credosCatalogService` (title/serviceSlug/serviceStatus) + intra-app relation `owner ↔ credosTimeEmployee.ownedServices` + index-view + nav-папка «Каталог услуг». labelIdentifier=title (two-phase).
- **Gate пройден:** lint 0 · test:unit 2792 · `dev --once` synced; обе стороны связи (owner на Service + ownedServices на Employee) подтверждены в метаданных workspace.

**Зона:** arch. **Выход:** доказана модель «единый app, связи intra-app» — фундамент для Phase 1+.

---

### Phase 1 — Ядро модели (объекты + связи)
**Цель:** структурированный каталог услуг без компетенций.
- Объекты: `credosCatalogCategory` (→department, name, sortOrder, status), `credosCatalogService` (rich: name/shortName/slug/description/status/version/deliverables/estimatedDuration, →category, owner→Employee), `credosCatalogVendor`, `credosCatalogProduct` (→vendor, productCategory).
- SELECT-опции из SSOT `constants/select-options.ts`: serviceStatus (draft/active/…), productCategory (СЗИ-НСД/VPN/SIEM/…), **тире вместо запятых**.
- Junctions: `ServiceProduct`, `ServiceRelation` (relationType: related/prerequisite/followup/alternative).
- Reverse-relation поля (`src/fields/`).
- **Связь проект↔услуга (явная, по запросу заказчика):** каталог-модуль добавляет на `credosTimeProject` поле `service → credosCatalogService` (intra-app, ADR-0010). Проект классифицируется услугой → факт-часы аккумулируются по услуге. Это самая ценная и простая интеграция — делаем сразу.
- View: список услуг + базовая карточка (проверить рендер).

**Зона:** Dev2 (объекты/поля) → Dev1 (базовый view). **Gate:** стандартный + проверка что поле `service` появилось на карточке проекта time.

---

### Phase 2 — Компетенции + gap-светофор (главный приём CASS) ⭐
**Цель:** «знать что можем продавать» (ядро VISION).
- `credosCatalogCompetency` (name, category: skill/cert/technology, issuingOrg) + самосвязь `requires` (M:N на себя).
- `credosCatalogEmployeeCompetency` (→credosTimeEmployee[intra-app], →Competency, **level** SELECT, **expiresOn** DATE, certificateNumber, issuedBy) — надстройка над плоским прототипом.
- `credosCatalogServiceCompetency` (→Service, →Competency, requiredLevel, isRequired).
- **logic-function `gap-analysis`**: для услуги Σ требуемых vs актуальных (не истёкших) у отдела → светофор «можем / дефицит / просрочено».
- **Аудит компетенций** (ADR-0008): `credosCatalogCompetencyLog` + onUpdate-триггер (кто/когда подтвердил, было→стало).

**Зона:** Dev2. **Gate:** стандартный + тесты gap-логики (граничные: пусто/истёкло/частично).

---

### Phase 3 — Документы
- `credosCatalogDocument` (title, type, fileUrl/externalUrl/content, version, status) + `ServiceDocument` junction.
- **Открытый вопрос → PoC:** свой объект vs поверх Twenty Attachment (file-upload в SDK).

**Зона:** Dev2. **Gate:** стандартный.

---

### Phase 4 — UI (Landing / DB / Wiki режимы)
- View/page-layout: карточка услуги (Landing — этапы/документы/продукты/кто выполняет), список (DB-режим), навигация по категориям.
- front-components: **gap-светофор** виджет, **подбор услуг для КП** (поиск/фильтр/экспорт — для продаж), матрица компетенций.
- `defineNavigationMenuItem` «Каталог услуг» — **контур CRM/продаж**, не «Трудозатраты».
- **Открытый вопрос → отдельный PoC:** rich-editor (Wiki) в песочнице Web Worker (TipTap?) — SDK_DESIGN §6.

**Зона:** Dev1. **Gate:** стандартный + impeccable-аудит UI.

---

### Phase 5 — Интеграция time↔услуга (план/бронь/факт по услуге) ⭐
**Цель:** услуга как сквозной разрез ресурсного учёта (по запросу заказчика).
- Каталог-модуль добавляет на time-объекты поле `→service` (intra-app, ADR-0010):
  - `credosTimePlanSlot.service` → **план/спрос по услуге** (сколько часов планируем на услугу).
  - `credosTimeBooking.service` → **бронь ресурса под услугу**.
  - (опц.) `credosTimeDeptPlan.service` → план отдела в разрезе услуг.
- **Аналитика разреза услуги** (front/logic): план vs факт по услуге, загрузка по услуге, спрос на услугу × gap-деливерабельность → «востребованную услугу можем/не можем закрыть командой».
- `Service.estimatedDuration → time` — типовая трудоёмкость услуги кормит планёрку (подсказка бюджета проекта).

**Зона:** Dev2 (поля/logic) + Dev1 (аналитика-виджет). **Gate:** стандартный + e2e cross-app.

---

### Phase 6 — Seed + RBAC + CRM
- **Seed** из прототипа `CredosITCatalog/src/data/` (~40 услуг, категории, вендоры, продукты, компетенции) через `scripts/`.
- `defineRole`: admin / department_head (CRUD своих услуг) / editor / sales_manager (просмотр+экспорт) / employee / guest.
- CRM: `Service ↔ Opportunity` (услуги в сделке), экспорт состава услуги в КП.

**Зона:** Dev2 + Dev1. **Gate:** стандартный.

---

### Phase 7 — Производственная CRM (лог хода работ + 1С) 🔮 v2
**Цель:** прозрачность производства для продаж и руководства (запрос заказчика).
- **Лог-фид производственных событий** по проекту/услуге: «встреча проведена», «работы начаты», «этап сдан в срок», «этап просрочен» и т.п. — timeline видимый продажам/руководству.
- Ложится на: объект событий проекта (паттерн [ADR-0008](../adr/0008-field-change-log-pattern.md) журнала) + `credosTimeStage` (этапы) + статусы/даты «план vs факт сдачи».
- **Интеграция 1С** — источник/синк производственных данных (проекты, этапы, акты, сроки). Двунаправленность и контракт — отдельный ADR при старте фазы.
- Дашборд хода работ: по проекту/услуге/отделу — что начато/сдано/в риске срока.

**Зона:** Dev2 (объекты/синк) + Dev1 (timeline/дашборд). **Открытые:** контракт 1С (REST/OData/обмен), какие события первичны, кто пишет (производство вручную vs синк).

---

## Порядок волн

```
Wave 0:  Phase 0 (каркас+PoC)                ← блокирует всё
Wave 1:  Phase 1 (ядро модели + проект↔услуга)
Wave 2:  Phase 2 (компетенции) ∥ Phase 3 (документы)   [независимы]
Wave 3:  Phase 4 (UI) ∥ Phase 5 (план/бронь↔услуга)
Wave 4:  Phase 6 (seed + RBAC + CRM)         ← зависит от всех
```

## Открытые вопросы (решить по ходу)
- Rich-editor в песочнице (Wiki-режим) — PoC TipTap.
- Document: свой объект vs Twenty Attachment — PoC.
- Level-шкала компетенций: своя 1-5 (beginner/intermediate/advanced/expert из прототипа) vs привязка к HR-грейдам.
- Gap-анализ: сервер (logic-function) vs front — рекомендуется сервер (одна правда, переиспользуемо в КП).

## Скоуп iteration-1 (рекомендация, keep-it-simple)
**MVP = Phase 0 + 1 + 2** (каркас + ядро + связь проект↔услуга + компетенции-gap). Даёт: каталог услуг, классификацию проектов услугой (факт-часы по услуге), ответ «что можем продавать». Документы (3), UI-лоск (4), план/бронь↔услуга (5), seed/RBAC/CRM (6) — следующими итерациями.
