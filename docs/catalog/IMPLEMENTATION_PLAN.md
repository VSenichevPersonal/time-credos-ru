# Каталог услуг — план реализации на Twenty SDK

**Дата:** 2026-06-22
**Статус:** Phase 0 СТАРТОВАЛ (AITEAM: Dev2/Dev1/аналитик); time-app стабилен v1.0.0
**Назначение:** каталог = **модуль стыковки продаж и производства**. Услуга — общий язык. Продажи: что продаём + можем ли оказать (gap). Производство: кто/ёмкость/факт. Дорастает до **производственной CRM** (лог хода работ + 1С, см. Phase 7).
**Связано:** [SDK_DESIGN.md](SDK_DESIGN.md) · [OSS_REFERENCES.md](OSS_REFERENCES.md) · [RECON.md](RECON.md) · [ADR-0003](../adr/0003-catalog-separate-app-shared-master-data.md) · [ADR-0009](../adr/0009-cross-app-object-references.md)

## Принципы (стандарты, которым план следует)

| Стандарт | Как соблюдаем |
|---|---|
| **ADR-0002** изолированный app | каталог = отдельный `apps/catalog/`, свой package.json/CI |
| **ADR-0003** Service-мост | каталог владеет Service; time/CRM ссылаются |
| **ADR-0004** префикс + UUID-SSOT | все объекты `credosCatalog*`; UUID в `constants/`, неизменны |
| **ADR-0009** cross-app refs | оргмастер (Employee/Department) не дублируем — ссылка по UUID |
| **ADR-0008** change-log | аудит компетенций (level/expiry) через паттерн журнала |
| **SDK-грабли** (память) | SELECT без запятых (тире); slugs `name`/`role`/`status`/`probability` зарезервированы; labelIdentifier НЕ в том же sync; DROP падает; FOLDER-nav two-phase; apply ≠ dry-run; apply не транзакционен |
| **Зоны Dev1/Dev2** | back (objects/fields/logic) = Dev2; front (components/views/layouts/nav) = Dev1; constants — согласовывать |
| **keep-it-simple** | iteration-1 = минимум; компетенции-gap и Wiki — отдельными фазами |
| **Gate каждой фазы** | `lint` 0 + `test:unit` 0 failed + `dry-run` clean → commit точечно → `yarn twenty dev --once` |

---

## Архитектура (итог)

```
            Twenty workspace (один)
  ┌─ time (credosTime*) ─────────────────────────────────┐
  │  Employee · Department · Project · Booking · PlanSlot │
  └──▲──────▲────────────▲─────────▲──────────▲──────────┘
     │ ref  │ ref        │ catalog РАСШИРЯЕТ time-объекты │
     │(owner)(department) │ полем →service (ADR-0009 §1a) │
  ┌─ catalog (credosCatalog*, отдельный app) ─────────────┐
  │  Service ─▶ Category ─▶ (Department)                  │
  │     │  └─owner─▶ (Employee)                           │
  │     ├─ ServiceProduct ─▶ Product ─▶ Vendor            │
  │     ├─ ServiceCompetency ─▶ Competency ◀─ EmployeeComp│
  │     ├─ ServiceRelation (typed, cross-sell)            │
  │     └─ ServiceDocument ─▶ Document                    │
  └───────────────────────────────────────────────────────┘

  Услуга = разрез по всему time:
   Project.service  → факт-часы по услуге (что реально делали)
   PlanSlot.service → план/спрос по услуге (что собираемся)
   Booking.service  → бронь ресурса под услугу
   + Employee↔Competency gap → можем ли услугу оказать
```

---

## Фазы (волны)

### Phase 0 — Каркас + PoC cross-app (риск-бёрндаун) 🔴 ПЕРВЫМ
**Цель:** доказать, что cross-app relation реально применяется в workspace (не только в теории).
- Scaffold: `npx create-twenty-app@latest apps/catalog` → application-config (свой UUID), role.config, tsconfig, CI-зеркало time.
- `constants/shared-identifiers.ts` — UUID оргмастера time + guard-тест-инвариант (ADR-0009).
- `constants/universal-identifiers.ts` — свои UUID каталога (SSOT).
- **PoC:** минимальный `credosCatalogService` (name, slug, status) + 1 relation `owner → credosTimeEmployee` → **dry-run → apply → проверить в workspace, что связь резолвится.**
- **Gate:** apply прошёл, объект+связь видны в Settings, обратная сторона на Employee есть.
- ❗ Если PoC падает — стоп, репланируем (вся модель зависит).

**Зона:** Dev2 + arch. **Выход:** работающий app-каркас, подтверждённый cross-app ref.

---

### Phase 1 — Ядро модели (объекты + связи)
**Цель:** структурированный каталог услуг без компетенций.
- Объекты: `credosCatalogCategory` (→department, name, sortOrder, status), `credosCatalogService` (rich: name/shortName/slug/description/status/version/deliverables/estimatedDuration, →category, owner→Employee), `credosCatalogVendor`, `credosCatalogProduct` (→vendor, productCategory).
- SELECT-опции из SSOT `constants/select-options.ts`: serviceStatus (draft/active/…), productCategory (СЗИ-НСД/VPN/SIEM/…), **тире вместо запятых**.
- Junctions: `ServiceProduct`, `ServiceRelation` (relationType: related/prerequisite/followup/alternative).
- Reverse-relation поля (`src/fields/`).
- **Связь проект↔услуга (явная, по запросу заказчика):** каталог расширяет `credosTimeProject` полем `service → credosCatalogService` (ADR-0009 §1a). Проект классифицируется услугой → факт-часы аккумулируются по услуге. Это самая ценная и простая интеграция — делаем сразу.
- View: список услуг + базовая карточка (проверить рендер).

**Зона:** Dev2 (объекты/поля) → Dev1 (базовый view). **Gate:** стандартный + проверка что поле `service` появилось на карточке проекта time.

---

### Phase 2 — Компетенции + gap-светофор (главный приём CASS) ⭐
**Цель:** «знать что можем продавать» (ядро VISION).
- `credosCatalogCompetency` (name, category: skill/cert/technology, issuingOrg) + самосвязь `requires` (M:N на себя).
- `credosCatalogEmployeeCompetency` (→Employee[cross-app], →Competency, **level** SELECT, **expiresOn** DATE, certificateNumber, issuedBy) — надстройка над плоским прототипом.
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
- Каталог расширяет time-объекты полем `→service` (ADR-0009 §1a):
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
