# Каталог услуг (Knowledge Hub) — разбор прототипа CredosITCatalog

**Дата:** 2026-06-20
**Источник:** `/Users/vsenichev/Documents/GitHub/CredosITCatalog` (прототип Next.js+Prisma, статус — Pre-MVP/«фантазии»)
**Исходные доки прототипа:** `../../research/credos-it-catalog/`

---

## 1. Что это

Не просто список услуг, а **система управления знаниями**: `Услуги ↔ Люди ↔ Компетенции ↔ Документы ↔ Продукты/Вендоры`.

Аудитория (по VISION):
- **Руководители отделов** — управление услугами отдела, актуальность регламентов.
- **Отдел продаж** (ключевой) — что продавать, что можем внедрить (есть компетенции), копирование в КП, cross-sell, консультирование.
- Редакторы — наполнение. Специалисты — просмотр инструкций.

4 режима контента: Wiki (инструкции) · Landing (карточка услуги) · Database (справочники) · Docs (файлы с версиями).

Стек прототипа: Next.js App Router + TipTap (rich-редактор) + shadcn/ui + (план) PostgreSQL+Prisma. Отдельное приложение.

---

## 2. Полная модель данных прототипа

### Ядро
```
Direction (Отдел) → Category (Категория) → Service (Услуга)
```

| Сущность | Ключевые поля |
|---|---|
| **Direction** | name, shortName («ОИБ»), iconName, sortOrder, status(active/archived) |
| **Category** | directionId, name («Аудит»), sortOrder, status |
| **Service** | categoryId, name, shortName, slug, description, **content (TipTap rich)**, status(6), version, **ownerId→Employee**, **deliverables[]**, **estimatedDuration** («10-15 дней») |

`ServiceStatus`: draft · pending_review · active · suspended · deprecated · archived

### Продукты/вендоры
| Сущность | Поля |
|---|---|
| **Product** | vendorId, name («ViPNet Client»), version, category(13: vpn/ngfw/siem/dlp/…), documentationUrl, **certificates[]** (ФСТЭК/ФСБ: number, validUntil), status |
| **Vendor** | name («ИнфоТеКС»), website, partnershipLevel, logoUrl, status |
| **ServiceProduct** | serviceId × productId, usage — какие продукты в услуге |

### Компетенции
| Сущность | Поля |
|---|---|
| **Competency** | name («CISSP»,«ViPNet»), category(skill/certification/technology), issuingOrganization |
| **EmployeeCompetency** | employeeId × competencyId, level(beginner→expert), certifiedAt, expiresAt, certificateNumber |
| **ServiceCompetency** | serviceId × competencyId, requiredLevel, isRequired — что нужно для услуги |

### Документы
| Сущность | Поля |
|---|---|
| **Document** | title, type(regulation/instruction/template/specification/checklist), fileUrl\|externalUrl\|content, version, status |
| **ServiceDocument** | serviceId × documentId, section, sortOrder |

### Связи услуг (cross-sell)
| **ServiceRelation** | serviceId × relatedServiceId, type: related/prerequisite/followup/alternative |

### Люди и доступ
| **Employee** | firstName/lastName/middleName, email, phone, **directionId**, position, avatarUrl, bio, status |
| **User** | email, passwordHash, employeeId, role(admin/department_head/editor/sales_manager/employee/guest) |

---

## 3. Пересечение с time-приложением (что ОБЩЕЕ)

| Каталог | time | Статус |
|---|---|---|
| **Direction** | Department | ★ ОБЩИЙ мастер-объект |
| **Employee** | Employee | ★ ОБЩИЙ |
| **Service** | Service-классификатор проекта (отложен) | ★ ОБЩИЙ (каталог владеет, time ссылается) |
| Category | — | каталог-only |
| Product/Vendor | — | каталог-only |
| Competency/EmployeeCompetency | — | каталог-only |
| Document | (у time свои attachments) | каталог-only |
| ServiceRelation | — | каталог-only |

---

## 4. Что ЗАБИРАЕМ в архитектуру time (для роста)

1. **Service как общий объект** — time ссылается на ту же Услугу (один id), не заводит свой список. Loose-FK, фаза 2.
2. **`Service.estimatedDuration`** → кормит `plannedHours` планёрки загрузки (типовая трудоёмкость услуги).
3. **`Service.deliverables[]`** («Отчёт об аудите») — пригодится в карточке проекта/этапа.
4. **Lifecycle-статусы** (draft→active→deprecated→archived) — единый стиль с нашими статусами.
5. **Direction/Employee** — уже общие (Битрикс/CRM).

**НЕ забираем в time:** Category, Product, Vendor, Competency, Document, ServiceRelation, TipTap-контент — домен каталога.

---

## 5. Выводы

- Каталог — **отдельный домен** (знания/услуги/компетенции), не учёт часов. → отдельный SDK-app (ADR-0003).
- Размещение — **контур CRM** (первичный пользователь — продажи; интеграция с КП/Quotes, сделками).
- **Service** — мост трёх контуров (каталог владеет; продажи и time ссылаются).
- Мастер-данные (Direction/Employee/Service) — определяются один раз в Twenty, не дублируются.

Связано: `SDK_DESIGN.md`, `../adr/0003-catalog-separate-app-shared-master-data.md`, `../data-model/DATA_MODEL_SYNTHESIS.md`.
