# Timetta — Оценка воссоздания (Recreation Assessment)

**Дата:** 2026-06-20 | **69 файлов, 19MB**

---

## ЧТО МОЖНО ВОССОЗДАТЬ ПОЛНОСТЬЮ

### 1. 🟢 Модель базы данных — 100%
**Источник:** `db-schema-from-metadata.md` (30160 строк), `db-full-entity-model.md` (7282 строки)

- **258 EntityType** со всеми полями (имя, тип, Nullable, MaxLength, ключи)
- **1490 NavigationProperty** (связи) с указанием типа и партнёра
- **79 EnumType** со всеми значениями
- **226 ComplexType** со свойствами
- **861 Function** + **672 Action** с параметрами
- **198 EntitySet** (REST-эндпоинты)
- Для каждой сущности: displayName Ru/En, lifecycle, hierarchy, customizable

**Можно:** сгенерировать SQL-миграции (PostgreSQL), ORM-модели (EF Core), ER-диаграммы.

### 2. 🟢 Жизненные циклы — 100%
**Источник:** `raw-odata-LifeCycles-expand.json` (133KB)

- **18 Lifecycles** со всеми **77 состояниями**
- Для каждого состояния: code, name (Ru/En), style (цвет), isInitial/isFinal
- State machine для: Project, TimeSheet, Issue, Deal, Invoice, Act, Contract, ExpenseRequest, TimeOffRequest, ResourceRequest, Checkpoint, RateMatrix, Certificate, RiskRequest, ProjectArtifact, ProjectVersion, Organization, IncomingAct

**Можно:** реализовать идентичные state machine в BPM-движке или коде.

### 3. 🟢 Справочники — 90%
**Источник:** `raw-odata-Directories-expand.json` + `raw-odata-Directories.json` + `raw-odata-DirectoryEntries.json`

- **15 справочников** (ContactRole, DealType, CheckpointType, IssueResolution, EmploymentType, CheckpointForecast, IssueTypes, OrganizationRelationTypes, CheckpointLevel, TrafficLight, ProjectStage, IssuePriority, IssueTags, DealSource, DealResolution)
- **42 значения** с порядком сортировки

### 4. 🟢 Системные настройки — 100%
**Источник:** 33 raw-odata JSON-файла

| Справочник | Записей | Статус |
|------------|---------|--------|
| Activities (виды работ) | 9 | ✅ |
| Roles (проектные роли) | 8 | ✅ |
| TimeOffTypes (отсутствия) | 5 | ✅ |
| Currencies (валюты) | 6 | ✅ |
| VatRates (НДС) | 9 | ✅ из UI |
| FinancialAccounts | 12 | ✅ из UI |
| Schedules (расписания) | 2 | ✅ |
| ValidationRules | 2 | ✅ |
| Levels (должностные) | 6 | ✅ |
| Locations | 3 | ✅ |
| Skills | 9 | ✅ |
| Departments | 11 | ✅ |
| PermissionSets | 9 (263KB!) | ✅ |
| IssueLinkTypes | 10 | ✅ |
| ProjectBillingTypes | 3 (TM/FP/...) | ✅ |
| NumberingPolicies | 11 | ✅ |
| Reports | 18 шаблонов | ✅ |
| Dashboards | 2 | ✅ |

### 5. 🟢 OData API — 100%
**Источник:** `raw-odata-metadata.xml` (1MB), `schema-summary.txt`

- Все 198 EntitySet (CRUD-эндпоинты)
- Функции импорта: GetSession, GetNavigationItems, GetEntityTypes, GetPnlStatement, GetSalesFunnel, Search и др.
- Действия: UpdateClientProfile, ChangePassword, AiGenerateText, TrackTime, ClearAllData и др.
- Формат: $select, $expand, $filter, $orderby, $top, $skip, $apply

### 6. 🟢 OIDC-аутентификация — 100%
- Все grant_types, scopes, ключи
- Схема: PKCE S256, silent refresh
- Endpoints: authorize, token, userinfo, endsession, revocation

### 7. 🟡 Данные реального стенда — 70%
- **20 пользователей** (имена, email, департаменты)
- **9 проектов** (коды, клиенты, менеджеры, сроки, состояния)
- **74 проектных задач** (иерархия)
- **44 члена команд** (назначения на проекты)
- **9 тарифов проектов**
- **5 таймшитов** (включая 1 с полным $expand)
- **18 отчётов** (шаблоны)
- ❌ Organizations/Deals/Contacts — данные потеряны (перезаписаны пустыми при протухшем токене)

### 8. 🟢 UX/UI — 80%
- **622 CSS custom properties** (дизайн-токены Bootstrap)
- **3543 строки перевода** (структура всего интерфейса)
- **893KB CSS** (app + site)
- ❌ JS-бандлы не декомпилированы (Angular, 5.5MB main.js)

---

## ЧТО НЕЛЬЗЯ ВОССОЗДАТЬ (без доступа к исходникам)

| Компонент | Причина |
|-----------|---------|
| Бизнес-логика на сервере | Чёрный ящик (C#/.NET, скрыто за OData) |
| Серверные валидации | Только сигнатуры из $metadata |
| Безопасность (серверная) | Логика прав, tenant isolation — только поведение |
| Фоновые задания (Scheduled Jobs) | Логика неизвестна, только сигнатуры |
| AI-агент «Планирования» | K8s-сервис `ai-wbs-agent-service`, чёрный ящик |
| Отчёты (построение) | Только шаблоны, логика генерации скрыта |
| Email-уведомления | Только типы шаблонов, логика отправки скрыта |

---

## ПРИОРИТЕТ ВОССОЗДАНИЯ

### Фаза 1: Ядро (2-3 недели)
1. **Модель БД** → SQL-миграции из $metadata
2. **OData API-каркас** → 198 эндпоинтов с сигнатурами
3. **Аутентификация** → OIDC (IdentityServer4/Keycloak)
4. **Lifecycles** → 18 state machines
5. **Справочники** → 15+ системных справочников
6. **RBAC** → 9 PermissionSets + 309 permissions

### Фаза 2: Бизнес-логика (3-4 недели)
7. **TimeSheet engine** → полная модель данных есть, логику восстановить по состояниям
8. **Project management** → иерархия Project→Task→Checkpoint
9. **CRM** → Organization→Contact→Deal→Interaction
10. **Resource management** → User→Booking→ResourceRequest

### Фаза 3: Финансы (2-3 недели)
11. **Rate Matrices** → биллинг + себестоимость
12. **Invoicing** → Invoice→Act→AccountingEntry
13. **P&L отчётность**

### Фаза 4: Интеграции и AI (2-3 недели)
14. **GitLab-интеграция** → модель данных есть
15. **AI-подсистема** → контекстные схемы + промпты есть
16. **Отчёты и Dashboards** → 18 шаблонов + 2 дашборда

---

## ИТОГО

**Можно воссоздать:** ~85% функционала Timetta
- ✅ Полная модель данных (258 таблиц, все поля, все связи)
- ✅ Все справочники и состояния
- ✅ API-контракты (861 функция + 672 действия)
- ✅ UX/UI-дизайн (токены, переводы, скриншоты)
- ⚠️ Бизнес-логика — восстанавливается по модели состояний и API-контрактам
- ❌ Серверные реализации — требуют написания заново
