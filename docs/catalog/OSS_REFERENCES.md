# Каталог услуг — OSS-референсы: разбор + синтез под нас

**Дата:** 2026-06-22
**Статус:** референс для будущей итерации каталога (после time-app)
**Связано:** [README.md](README.md) · [SDK_DESIGN.md](SDK_DESIGN.md) · [RECON.md](RECON.md) · [ADR-0003](../adr/0003-catalog-separate-app-shared-master-data.md)

## Зачем

Искали open-source каталоги услуг как референс. Прямого двойника **нет** (B2B-каталог ИБ/ИТ-услуг для продаж — ниша, обычно проприетарный). Но наш каталог = **Knowledge Hub** (см. [VISION](../../research/credos-it-catalog/VISION.md)) — гибрид 3 жанров: услуги↔связи (cross-sell) · компетенции (кто что умеет) · wiki/landing/db/docs. Каждая грань имеет зрелый OSS-референс. Берём **паттерны модели + UX**, НЕ платформу (платформа решена — Twenty SDK, ADR-0003).

---

## 3 референса

| # | Проект | Жанр | Лицензия | Что берём |
|---|---|---|---|---|
| 1 | **Backstage** (CNCF, Spotify) [github](https://github.com/backstage/backstage) | software/entity catalog | Apache-2.0 | модель графа сущностей + связи + ownership |
| 2 | **CASS** — Competency & Skills System [github](https://github.com/cassproject/CASS) | competency management | Apache-2.0 | модель компетенций + assertions (кто/уровень/срок) |
| 3 | **NocoBase** [github](https://github.com/nocobase/nocobase) | data-model-driven no-code | AGPL-3.0 + commercial | подтверждение архитектуры: data-model ⟂ UI-блоки |

Поддержка (wiki-грань): **Outline / Docmost** (knowledge-base), **AppFlowy** (реляц. БД + блок-редактор) — как UX-референс rich-контента.

> Лицензии: берём **идеи/модель**, не код. AGPL (NocoBase) и любой код не вносим — как с Kimai (модель = референс, код = свой под SDK).

---

## 1. Backstage — граф сущностей

**Модель:** каталог = граф типизированных сущностей + связи.
- Сущности: `Component`, `System`, `API`, `Resource`, `Domain` + орг: `User`, `Group`.
- Связи (именованные, двунаправленные): `ownedBy`, `partOf`, `dependsOn`, `providesApi`/`consumesApi`.
- Иерархия группировки: `Domain ⊃ System ⊃ Component`.
- Каждая сущность имеет **владельца** (`ownedBy → Group/User`).

**Что ценно нам:** наш каталог — тоже граф (`Service ↔ Competency ↔ Product ↔ Vendor ↔ Document ↔ Employee`). Backstage показывает дисциплину: **связи именованные и навигируемые в обе стороны**, у каждого узла есть владелец, группировка иерархична (`Department ⊃ Category ⊃ Service`).

**Берём:**
- `Service.ownedBy → Employee` (ответственный за актуальность — уже в SDK_DESIGN как owner).
- Группировка `Department ⊃ Category ⊃ Service` (= их `Domain ⊃ System ⊃ Component`).
- Связь `ServiceRelation` как навигируемый граф cross-sell («с этой услугой берут…»), двунаправленно.
- Дисциплина: каждая M:N через явный junction-объект с типом связи (не безымянный массив).

**НЕ берём:** их предметные kinds (Component/API/Resource — про ПО, не про услуги).

---

## 2. CASS — компетенции + assertions

**Модель (база IEEE RCD / competency frameworks):**
- `Framework` — набор компетенций (напр. «ИБ-аудит», «Внедрение SIEM»).
- `Competency` — единица навыка; **иерархична** + связи: `narrows` (уточняет), `requires` (требует другую), `isRelatedTo`, `isEquivalentTo`.
- `Level` — уровень владения (шкала: novice→expert или 1-5).
- `Assertion` — **утверждение**: «субъект X владеет компетенцией Y на уровне Z», с полями: `evidence` (доказательство), `confidence`, `issuedBy` (кто подтвердил), `expires` (срок годности — сертификат истекает!).
- `Rollup Rule` — правило агрегации: владение набором под-компетенций ⇒ владение родительской.

**Что ценно нам:** прототип CredosITCatalog уже имеет `Competency` + `EmployeeCompetency` + `ServiceCompetency`, но **плоско** (есть/нет). CASS даёт зрелость:
1. **Уровень** владения, не булево (junior знает SIEM ≠ архитектор знает SIEM).
2. **Срок годности** компетенции = критично для ИБ (сертификаты ФСТЭК/вендоров истекают → услугу нельзя продавать legально).
3. **`requires`** между компетенциями → автоматический gap-анализ: «для услуги X нужны A+B+C, у команды нет C» (то самое «знать что продавать, а что нет» из VISION).
4. **`issuedBy` + evidence** = кто подтвердил компетенцию (аудируемо, ложится на наш [ADR-0008 change-log](../adr/0008-field-change-log-pattern.md)).

**Берём (надстройка над прототипом):**
- `EmployeeCompetency`: + `level` (SELECT), + `expiresOn` (DATE), + `evidence`/`certificateUrl`, + `issuedBy`.
- `ServiceCompetency`: + `requiredLevel` (минимум для оказания услуги).
- Gap-анализ услуги: `Σ требуемых компетенций vs Σ актуальных (не истёкших) у отдела` → светофор «можем оказывать / дефицит / просрочено».

**НЕ берём:** полный CASS-движок (репозиторий + interop-слой, xAPI/LRS) — избыточно. Берём только schema-идею level+expiry+requires.

---

## 3. NocoBase — data-model ⟂ UI

**Архитектура:**
- **Data-model-driven**: `collections` (= таблицы) + `fields` + `relations` объявляются отдельно от UI.
- Связи: `o2o`, `o2m`, `m2o`, `m2m` — first-class, с обратной стороной.
- **Blocks/Views**: одни и те же данные рендерятся разными блоками — `table`, `kanban`, `calendar`, `gallery`, `details`, `form`, `markdown`.
- **Плагины** — всё расширяется плагинами, ядро тонкое.

**Что ценно нам:** NocoBase = **доказательство, что наш выбор платформы верный.** Twenty SDK — тот же класс (metadata-движок + декларативный UI). `defineObject`/`defineField`/`defineView`/`definePageLayout` = их collections/fields/blocks. **Не нужен сторонний движок** — Twenty уже NocoBase-класс.

**Берём (как валидацию + паттерн):**
- Подтверждение: каталог строим на Twenty SDK, не тащим отдельный no-code.
- Паттерн «одна модель — много видов»: `Service` показываем разными view (карточка-Landing / список-DB / редактор-Wiki) — ровно режимы Wiki/Landing/DB/Docs из VISION ложатся на разные `defineView` + `definePageLayout` поверх одного объекта.
- Rich-контент (Wiki-режим): их markdown-block ⇒ нам нужен rich-editor во front-компоненте (открытый вопрос SDK_DESIGN §6 — TipTap в песочнице, PoC).

**НЕ берём:** саму платформу (AGPL, дубль Twenty).

---

## Синтез: что меняем в проекте каталога

Дельта к [SDK_DESIGN.md](SDK_DESIGN.md) (применить при старте каталог-итерации):

### Модель (надстройка к прототипу)
1. **Компетенции — не плоские** (от CASS):
   - `EmployeeCompetency` += `level`, `expiresOn`, `issuedBy`, `certificateUrl`.
   - `ServiceCompetency` += `requiredLevel`.
   - `Competency` += самосвязь `requires` (M:N на себя) для gap-цепочек.
2. **Граф связей именованный** (от Backstage):
   - все M:N через явный junction с типом (`ServiceRelation.relationType`: cross-sell / prerequisite / alternative).
   - `Service.ownedBy → Employee` (владелец актуальности).
3. **Один объект — много видов** (от NocoBase):
   - `Service` → 3 view: карточка-Landing (`definePageLayout`), список-DB (`defineView` table), редактор-Wiki (front-компонент rich-editor).

### Фичи, которые открывает CASS-модель
- **Gap-светофор услуги** для продаж: «можем оказывать (компетенции есть и не просрочены) / дефицит / просрочен сертификат» — прямой ответ на VISION «знать что продавать».
- **Алёрт истечения** компетенции/сертификата (ФСТЭК/вендор) → услуга авто-помечается «риск оказания».
- **Аудит компетенций** через [ADR-0008 change-log](../adr/0008-field-change-log-pattern.md) (кто/когда подтвердил, было→стало) — уже есть паттерн.

### Что НЕ делаем
- Не тащим Backstage/CASS/NocoBase как код или платформу (лицензии + дубль Twenty).
- Не строим полный CASS-движок (xAPI/LRS/rollup-engine) — берём только level+expiry+requires.
- Контент услуг — из нашего прототипа CredosITCatalog (точнее любого OSS под домен).

### Открытые вопросы (к итерации каталога)
- Rich-editor (Wiki-режим) во front-компоненте песочницы — PoC (TipTap?). См. SDK_DESIGN §6.
- Level-шкала компетенций: своя (1-5) vs привязка к грейдам HR.
- Gap-анализ: считать на сервере (logic-function) vs во front-компоненте.

---

## Итог одной строкой

Платформа уже верна (Twenty = NocoBase-класс) · граф связей дисциплинируем по Backstage · **главный приём — компетенции с уровнем+сроком+requires из CASS** → открывает gap-светофор «что можем продавать» (ядро VISION). Контент — наш прототип. Код OSS не вносим.
