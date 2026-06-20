# Сверка схемы CRM (credos*) с модулем time (tt*)

> Кросс-сверка кастомных объектов CredosCRM1 с объектами нашего модуля учёта времени.
> Цель: стыковка по неймингу, отсутствие конфликтов `nameSingular`, повторное использование стандартных объектов Twenty.
> Источник: `CredosCRM1/credos/docs/CREDOS_MODULES.md`, `CUSTOMIZATION_GUIDE.md`, page-layout константы, скрипты `setup-credos-*.sh`.
> Дата сверки: 2026-06-20.

---

## 1. Кастомные объекты CRM (credos*)

Twenty — metadata-driven. Все объекты создаются через Metadata API (без кода), кода-сущностей `*.workspace-entity.ts` для них нет — они живут как метаданные в БД. Ниже сведено из реестра модулей + page-layout констант + setup-скриптов.

### Реализованные (✅ в production / MVP)

| Объект (`nameSingular`) | Назначение | Ключевые поля | Связи |
|---|---|---|---|
| `credosContact` | Сделка/карточка контакта с клиентом (замена стандартного Opportunity, мульти-воронки) | `businessLine`(SELECT), `stage`(SELECT), `workDirection`, `leadSource`, `budget`(CURRENCY), `intermediateResult`, `legacyId` | company→Company, contactPerson→Person, owner→WorkspaceMember |
| `credosActivity` | Взаимодействие (звонок/встреча/email), в т.ч. автосоздание из АТС Билайн | `contactType`(SELECT), `result`(SELECT), `activityDate`(DATE_TIME), `budgetAmount`(CURRENCY), `notes`(RICH_TEXT) + поля звонка (`credosCallDirection`, `credosCallDuration`, `credosCallRecordingUrl`, `credosBeelineCallId`) | credosContact, contactPerson→Person, manager→WorkspaceMember, company→Company (denorm, auto-sync) |
| `credosLead` | Лид (предквалификация, до конвертации в credosContact) | `status`(SELECT), `qualificationType`, `businessLine`, `workDirection`, `leadSource`, `companyName`, `jobTitle`, `phone`(PHONES), `email`(EMAILS), `estimatedBudget`, `notes`, `qualificationDate`, `nextContactDate` | owner→WorkspaceMember, campaign→credosCampaign, convertedContact→credosContact, linkedCompany→Company, linkedPerson→Person |
| `credosCampaign` | Маркетинговая кампания (контейнер лидов) | `campaignType`(SELECT), `status`(SELECT), `businessLine`, `startDate`, `endDate`, `budget`, `description`, `expectedLeads` | owner→WorkspaceMember, leads→credosLead |
| `credosPresale` | Пресейл (подготовка решения, оценка трудозатрат, формирование КП) | `stage`(SELECT,10), `product`(SELECT,16), `priority`, `estimatedBudget`, `margin`, `plannedEffort`, `actualEffort` | credosContact, company→Company, owner, architect→WorkspaceMember |
| `credosPilot` | Пилот/POC (пробная эксплуатация у клиента) | `stage`(SELECT,7), `pilotType`(SELECT,5), `startDate`, `endDate`, `actualEndDate`, `pilotCost`, `plannedEffort`, `actualEffort` | credosContact, presale→credosPresale, company, owner, engineer→WorkspaceMember |
| `credosPresaleTeam` | Участник команды пресейла (join-объект) | 2 поля | →credosPresale, →WorkspaceMember |
| `credosPilotTeam` | Участник команды пилота (join-объект) | 2 поля | →credosPilot, →WorkspaceMember |
| `credosQuote` | Коммерческое предложение (КП-YYYY-NNN, автонумерация) | `quoteNumber`, `status`(SELECT), `workDirection`, `amount`(CURRENCY), `baseAmount`, `discountPercent`, `markupPercent`, `paymentTerms`, `validUntil`, `sentAt`, `breakdown`(JSON), `hours`(NUMBER) | credosContact, company→Company, owner→WorkspaceMember |
| `credosQuoteService` | Услуга в составе КП (мульти-услуги) — есть page-layout | — | →credosQuote |
| `credosSurveyResponse` | Ответ клиента на опросник (для формирования КП) | `serviceType`, `status`, `filledBy`, `answers`(JSON), `submittedAt` | — |
| `credosSurveyToken` | Одноразовый токен ссылки на портал-опросник | `token`, `portalUrl`, `expiresAt`, `consumed`(BOOLEAN) | — |
| `credosOneCLog` | Журнал интеграции 1С:УНФ | `credosDirection`(SELECT), `credosEntityType`, `credosEntityName`, `credosStatusCode`, `credosErrorMessage`, `credosRequestPayload` | credosCompany→Company |
| `credosReportSubscription` | Подписка на отчёт (Reporting-модуль) | — | — |
| `credosMailing` / `credosMailingRecipient` | ABM-рассылка и её получатель (Unisender) — есть page-layout | — | — |
| `credosUnisenderCampaign` / `credosUnisenderLog` | Справочник US-кампаний и лог рассылок | — | — |
| `credosCampaignMember` | Участник кампании (join) — есть page-layout | — | →credosCampaign |
| `credosOpportunity` | Кастомный layout поверх стандартного Opportunity (legacy/переходный) — есть page-layout | — | — |

### Спроектированные, но НЕ реализованные (статус «Не начат», только в документации, Фаза 4)

| Объект (план) | Назначение | Ключевые поля (план) |
|---|---|---|
| `credosProject` | **Управление проектами** — интеграционные проекты с этапами | `name`, `status`, `startDate`, `endDate`, `budget`, manager→WorkspaceMember |
| `credosProjectStage` | Этап проекта | `name`, `position`, `dueDate`, `status` → credosProject |
| `credosProjectTask` | Задача проекта | `name`, `assignee`, `dueDate`, `status` → credosProject, credosProjectStage |
| `credosTender` | Тендеры B2G (44-ФЗ/223-ФЗ) | `tenderNumber`, `tenderUrl`, `federalLaw`, `submissionDeadline`, `estimatedValue`, `status` → Company |
| `credosDocument` | Документооборот (КП/договор/акт/счёт) | `title`, `documentType`, `documentNumber`, `date`, `amount`, `status` → Opportunity, Company |

> ⚠️ Объекты `credosProject*` существуют **только на бумаге** (нет в коде/скриптах/Metadata). Но имена зарезервированы в roadmap — это будущий конфликт по смыслу с нашими `ttProject`/`ttStage`. См. §4 (риски).

### Кастомные поля на стандартных объектах (не наши объекты, но фон для понимания)

- **Company**: `credosInn`, `credosKpp`, `credosOgrn`, `credosLegalName`, `credosLegalAddress`, `credosCeo`, `credosOkved`, `credosSegment`, `credosOverallStatus`, `credosRegion`, `credosOneCGuid`, `credosPropertyForm`, `credosResponsible`, … (DaData + 1С)
- **Person**: `credosOneCGuid`
- **Activity**: поля звонка `credosCall*`, `credosAutoCreated`

---

## 2. Стандартные объекты Twenty (наследуем, НЕ дублируем)

CRM использует ванильные объекты Twenty, к которым крепит custom-поля. Для нашего модуля важно НЕ создавать дубликаты, а ссылаться на них:

| Стандартный объект | Что это | Наш интерес |
|---|---|---|
| `Company` | Контрагент/компания | `ttProject.client → Company` |
| `Person` | Контактное лицо | при необходимости |
| `WorkspaceMember` | Сотрудник = пользователь воркспейса | `ttEmployee` и/или прямая ссылка `owner → WorkspaceMember` |
| `Opportunity` | Стандартная сделка (в CRM почти вытеснена `credosContact`) | биллинг-ссылка |

---

## 3. Таблица сопоставления: наш tt-объект ↔ аналог в CRM

| Наш объект | Назначение | Аналог/конфликт в CRM | Способ стыковки |
|---|---|---|---|
| `ttDepartment` | Подразделение | Нет объекта. В CRM подразделение не моделируется как сущность | **Независимо.** Создаём свой объект. Конфликта нет |
| `ttEmployee` | Сотрудник (учёт времени) | Нет custom-объекта; смысловой аналог — стандартный `WorkspaceMember` | **Ссылка + опц. свой объект.** Связать `ttEmployee.workspaceMember → WorkspaceMember`. Не дублировать identity — WorkspaceMember остаётся SSOT по пользователю |
| `ttProject` | Проект (учёт времени) | **Конфликт по смыслу с зарезервированным `credosProject`** (Фаза 4, не реализован). По имени `nameSingular` сейчас НЕ конфликтует (`ttProject` ≠ `credosProject`) | **Независимо, имя развести.** См. §4 — оставить `ttProject` ИЛИ согласовать с CRM единый `credosProject`. Связать `ttProject.client → Company`, `ttProject.opportunity → credosContact/Opportunity` |
| `ttStage` | Этап проекта | Зарезервирован `credosProjectStage` (не реализован). У `credosPresale`/`credosPilot`/`credosContact` поле `stage` — это SELECT, не объект | **Независимо.** Конфликта имён нет. Учесть, что в CRM «stage» обычно SELECT-поле воронки, а не объект |
| `ttActivity` | Активность/работа по времени | **Высокий риск смешения с `credosActivity`** (взаимодействие CRM: звонки/встречи). Разное значение слова «активность» | **Имя обязательно развести.** `credosActivity` = коммуникация с клиентом; наша `ttActivity` = трудозатрата. Рекомендуется переименовать (см. §5) во избежание путаницы пользователя и в отчётах |
| `ttTimeEntry` | Запись о потраченном времени | Нет аналога-объекта. Близкие поля `plannedEffort`/`actualEffort`/`hours` живут как NUMBER-поля на `credosPresale`/`credosPilot`/`credosQuote` | **Независимо.** Наш объект — недостающий слой детального тайм-трекинга. Можно агрегировать в `hours` CRM-объектов через hook |
| `ttBillingLink` | Связка тайм-трекинга с биллингом CRM | Нет аналога | **Ссылка-мост.** Объект-связка: `ttTimeEntry`/`ttProject` ↔ `credosQuote`/`credosContact`/`Opportunity`. Это наш интеграционный слой |

---

## 4. Риски конфликтов

1. **`credosProject` зарезервирован** (roadmap Фаза 4, статус «Не начат»). Имя занято на уровне планов и упоминается в чеклистах апгрейда. Если CRM-команда реализует «Управление проектами» как `credosProject`, а мы параллельно имеем `ttProject` — будет **два разных «проекта»** в одном воркспейсе. Технического конфликта `nameSingular` нет (имена разные), но семантический конфликт высок.
   - Митигировать: либо договориться, что «проект» — это ОДИН объект на оба модуля (тогда наш модуль ссылается на `credosProject`, а не создаёт свой), либо чётко разграничить роли (CRM-проект = коммерческий/интеграционный, tt-проект = биллинговая единица учёта).

2. **`credosActivity` vs `ttActivity`** — главный риск UX/отчётности. Слово «Активность» уже занято коммуникациями с клиентом. Наша `ttActivity` (трудозатрата) в одном списке объектов и в i18n даст путаницу. Технически `nameSingular` разные — БД не сломается, но пользователь/отчёт перепутает.

3. **`stage` как термин** — в CRM это SELECT-поле воронок (`credosContact.stage`, `credosPresale.stage`). Наш `ttStage` — отдельный объект-этап. Не конфликтует технически, но термин перегружен.

4. **Технических коллизий `nameSingular` нет** ни по одному tt-объекту: префикс `tt` уникален, ни один существующий `credos*`/стандартный объект Twenty его не использует. Twenty генерирует таблицу/GraphQL-тип из `nameSingular`, поэтому уникальность префикса = гарантия отсутствия коллизий таблиц/типов/мутаций.

---

## 5. Рекомендации по неймингу

### 5.1. Префикс: оставить `tt` ИЛИ мигрировать на `credosTime*`?

**Рекомендация: мигрировать на `credosTime*`** (`credosTimeProject`, `credosTimeEntry`, …) ЕСЛИ модуль будет жить внутри того же воркспейса CredosCRM1. Обоснование:

- CRM-конвенция (CUSTOMIZATION_GUIDE §3.2) жёстко требует префикс `credos` для всех custom-объектов: «Префикс `credos` в имени объекта гарантирует отсутствие коллизий с будущими стандартными объектами Twenty» и «grep по `credos` покажет ВСЕ наши изменения». Префикс `tt` ломает эту единую конвенцию и не попадёт в grep `credos`.
- Все существующие объекты (18+ штук), поля, таблицы (`credos_*`), i18n-ключи (`credos.*`), env (`CREDOS_*`), ветки (`feature/credos-*`) следуют этому правилу. `tt`-объекты будут «инородными».

**Компромисс (если модуль — отдельный продукт/воркспейс/деплой):** оставить `tt` как самостоятельный продуктовый префикс, но тогда зафиксировать это решение в ADR и явно прописать мост-конвенцию для интеграции.

Маппинг при миграции:

| Наш (tt) | CRM-консистентный вариант |
|---|---|
| `ttDepartment` | `credosTimeDepartment` (или ссылка, если CRM добавит подразделения) |
| `ttEmployee` | `credosTimeEmployee` (либо вообще не создавать — ссылаться на `WorkspaceMember`) |
| `ttProject` | `credosTimeProject` (разводит с roadmap-`credosProject`) |
| `ttStage` | `credosTimeStage` |
| `ttActivity` | `credosTimeEntry`-семейство; см. 5.2 — **переименовать**, не «activity» |
| `ttTimeEntry` | `credosTimeEntry` |
| `ttBillingLink` | `credosTimeBillingLink` |

### 5.2. Обязательное переименование `ttActivity`

Не использовать слово «Activity» — оно занято `credosActivity` (коммуникации). Варианты:
- `ttWorkLog` / `credosTimeWorkLog` — журнал работ;
- `ttTask` — если это задача (но «task» тоже перегружен `credosProjectTask`);
- лучший вариант: схлопнуть в `ttTimeEntry`/`credosTimeEntry` — единая запись времени, а «вид работ» сделать SELECT-полем `workType` внутри неё (как CRM делает `contactType`/`result` селектами внутри `credosActivity`).

### 5.3. Поля — называть как в CRM для консистентности

Переиспользовать существующие имена CRM-полей, чтобы отчёты/маппинг были сквозными:

| Наше поле | Имя как в CRM | Где в CRM встречается |
|---|---|---|
| трудозатрата план/факт | `plannedEffort` / `actualEffort` (NUMBER) | `credosPresale`, `credosPilot` |
| часы суммарно | `hours` (NUMBER) | `credosQuote` |
| направление работ | `workDirection` (SELECT) | `credosContact`, `credosLead`, `credosQuote` |
| бизнес-линия | `businessLine` (SELECT) | `credosContact`, `credosLead`, `credosCampaign` |
| статус/стадия | `stage` / `status` (SELECT) | повсеместно |
| владелец/ответственный | `owner` → `WorkspaceMember` | повсеместно |
| компания | `company` → `Company` | повсеместно |
| дата | `*Date` (camelCase, DATE/DATE_TIME) | `activityDate`, `startDate`, `dueDate` |
| бюджет/сумма | `budget` / `amount` (CURRENCY) | повсеместно |

Связи на сотрудника делать через `owner`/`assignee`/`manager` → `WorkspaceMember` (как у всех credos-объектов), не выдумывать свой тип ссылки.

---

## 6. Конвенции нейминга CRM (выжимка из CUSTOMIZATION_GUIDE §3)

| Что | Префикс/Паттерн | Пример |
|---|---|---|
| Custom Objects (Metadata API) | `credos` + PascalCase | `credosTender`, `credosProject` |
| Custom Fields на стандартных объектах | `credos` + camelCase | `credosContractNumber` |
| Поля внутри custom-объектов | camelCase (без `credos`) | `businessLine`, `stage`, `hours` |
| DB таблицы (code-level миграции) | `credos_` + snake_case | `credos_integration_log` |
| DB индексы | `idx_credos_` + описание | `idx_credos_tender_status` |
| NestJS модули | PascalCase + `Module` | `CredosPipelinesModule` |
| NestJS сервисы | PascalCase + `Service` | `CredosTenderService` |
| React компоненты | PascalCase | `CredosTenderCard` |
| React хуки | `useCredos` + PascalCase | `useCredosPipelines` |
| i18n ключи | `credos.<модуль>.<ключ>` | `credos.tenders.statusWon` |
| GraphQL queries | `CREDOS_` + UPPER_SNAKE | `CREDOS_GET_TENDERS` |
| Feature flags | `credos-` + kebab-case | `credos-multi-pipeline` |
| Env переменные | `CREDOS_` + UPPER_SNAKE | `CREDOS_EXCHANGE_CLIENT_ID` |
| Git ветки | `feature/credos-` | `feature/credos-tenders-kanban` |
| Commits | `feat(credos):` | `feat(credos): add tender status field` |
| Page-layout константы | `DefaultCredos<Object>RecordPageLayout` | `DefaultCredosQuoteRecordPageLayout` |

Важно (§3.3): Twenty из `nameSingular` авто-генерирует таблицу (camelCase), GraphQL-тип (PascalCase), queries/mutations. Уникальность префикса = отсутствие коллизий на всех уровнях.

Философия форка (§1): приоритет расширения — Metadata API (0 кода) → Workflows → Query Hooks → NestJS/React в `credos/` namespace → изменение ядра (крайняя мера). Весь наш код — только в `credos/`-namespace.

---

## 7. Итоговые решения (что зафиксировать в ADR)

1. **Идентичность сотрудника** — НЕ дублировать: ссылаться на стандартный `WorkspaceMember` через `owner`/`assignee`. `ttEmployee` создавать только если нужны доп. поля учёта (ставка, норма часов).
2. **Проект** — развести с `credosProject`: либо единый объект на оба модуля (предпочтительно при общем воркспейсе), либо разные роли + разные имена. Не допустить двух «Project».
3. **Activity** — переименовать наш объект (НЕ «Activity»), чтобы не пересекаться с `credosActivity` (коммуникации). Идеально — схлопнуть в `*TimeEntry` + SELECT `workType`.
4. **Префикс** — при общем воркспейсе мигрировать `tt*` → `credosTime*` ради единой конвенции и grep `credos`. При отдельном продукте — оставить `tt`, но зафиксировать в ADR.
5. **Поля** — переиспользовать имена CRM: `plannedEffort`, `actualEffort`, `hours`, `workDirection`, `businessLine`, `owner`, `company`, `*Date`, `budget`/`amount`.
