# Каталог услуг как SDK-app — проект (design)

**Дата:** 2026-06-20
**Статус:** черновик проектирования (каталог — следующая итерация после time)
**Решение:** ADR-0003 — отдельный SDK-app, контур CRM, общие мастер-данные, Service-мост.

---

## 1. Позиционирование

```
            Twenty / CRM (общие мастер-данные)
            Company · Employee · Department · Service
       ┌──────────┬───────────────────────┬──────────┐
  ┌────┴─────┐  ┌─┴──────────────┐   ┌─────┴────────┐
  │ time(SDK)│  │ catalog (SDK)   │   │ CRM/Quotes   │
  │ часы/план│  │ услуги/знания   │   │ продажи, КП  │
  └────┬─────┘  └──────┬──────────┘   └─────┬────────┘
       └── Service ────┴── владеет ──────────┘
          (ссылка)        каталог            ссылаются
```

- Каталог — **отдельный SDK-app** на той же Twenty.
- Первичный пользователь — **отдел продаж** (КП, cross-sell, подбор услуг в сделку).
- Владеет богатым определением **Service**; time и продажи ссылаются.

## 2. Маппинг модели на SDK `defineObject`

### Общие мастер-объекты (определить ОДИН раз; не дублировать)
| Объект | Где живёт | Кто использует |
|---|---|---|
| **Department** (Direction) | Twenty (общий) | catalog, time |
| **Employee** | Twenty (= workspaceMember) | catalog, time |
| **Service** (Услуга) | **catalog владеет** | catalog (rich), time (ссылка), CRM/КП (ссылка) |
| **Company** | CRM | все |

### Объекты каталога (`defineObject` в catalog-app)
| Объект | Поля (ядро) | Заметки |
|---|---|---|
| **Service** | name, shortName, slug, description, content(rich), status, version, →owner(Employee), deliverables[], estimatedDuration, →category | мастер, общий |
| **Category** | →department, name, sortOrder, status | иерархия услуг |
| **Product** | →vendor, name, version, category, certificates[], status | каталог-only |
| **Vendor** | name, website, partnershipLevel, logoUrl, status | каталог-only |
| **Competency** | name, category, issuingOrganization | каталог-only |
| **Document** | title, type, file/url/content, version, status | или поверх Twenty Attachment |
| junctions | ServiceProduct, ServiceCompetency, EmployeeCompetency, ServiceRelation, ServiceDocument | M:N связи |

### Front-компоненты (`defineFrontComponent`)
- Карточка услуги (Landing-режим) — rich-контент, этапы, документы, продукты, кто выполняет.
- Редактор услуги (Wiki-режим) — TipTap-подобный rich-editor.
- Матрица компетенций (кто что умеет, gap-анализ).
- Подбор услуг для КП (для продаж) — поиск, фильтр, экспорт.

### Навигация
`defineNavigationMenuItem` — раздел «Каталог услуг» (в контуре CRM/продаж). Не в раздел «Трудозатраты».

### RBAC (`defineRole`)
admin · department_head (CRUD своих услуг) · editor · sales_manager (просмотр+экспорт) · employee · guest. Ложится на роли Twenty.

## 3. Интеграции

| Связь | Что даёт |
|---|---|
| **Service ↔ Opportunity** (CRM) | продажи цепляют услуги к сделке |
| **Service → Quotes/КП** (есть в CredosCRM) | экспорт описания/состава в КП |
| **Service.estimatedDuration → time.plannedHours** | типовая трудоёмкость кормит планёрку загрузки |
| **Service ↔ Project** (time) | проект классифицируется услугой; факт-часы ↔ услуга |
| **Employee ↔ Competency** | кто может выполнять услугу (для планирования продаж) |

## 4. Что переиспользуем из прототипа CredosITCatalog

- **Модель данных** (сущности, поля, enum-ы) — как референс (см. `source-docs-CredosITCatalog/DATA_MODEL.md`).
- **UX-идеи** (карточка-лендинг, режимы Wiki/Landing/DB/Docs) — `UI_COMPONENTS.md`, `VISION.md`.
- **Scope/роли** — `SCOPE.md`.
- **НЕ переносим стек** (Next.js+Prisma) — переписываем под Twenty SDK (React-front-компоненты + defineObject). AGPL/стек-согласование как с Kimai: модель — референс, код — свой.

## 5. Порядок (не сейчас)

1. **Сначала — time-app** (есть данные, потребность, планёрка загрузки).
2. **Каталог — следующая итерация**: общие мастер-объекты (Service/Department/Employee) определяем при time, каталог достраивает поверх.
3. Конвергенцию прототипа CredosITCatalog → SDK оценить отдельно.

## 6. Открытые вопросы
- Владелец и RBAC мастер-объекта Service в Twenty.
- Document: свой объект или поверх Twenty Attachment.
- Rich-editor в SDK front-компоненте (TipTap внутри Twenty) — проверить на PoC.
- Связь Service ↔ Quotes/Opportunity — модель.

Связано: `RECON.md`, `../docs/adr/0003-catalog-separate-app-shared-master-data.md`.
