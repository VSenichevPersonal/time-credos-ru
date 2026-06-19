# Kimai — Разведка (Intel 02)

**Дата:** 2026-06-20 | **Репозиторий:** github.com/kimai/kimai
**Лицензия:** AGPL-3.0 | **Звёзды:** 4,749 | **Язык:** PHP 8.2+

---

## 1. Общая информация

| Параметр | Значение |
|----------|----------|
| **Продукт** | Kimai — #1 Open-Source Time-Tracker |
| **Слоган** | Professional grade time-tracking, free and open-source |
| **Автор** | Kevin Papst + сообщество |
| **Стек** | PHP 8.2+ / Symfony 7 / Doctrine ORM / MariaDB/MySQL |
| **Фронтенд** | Bootstrap 5 + Tabler UI + Webpack |
| **API** | JSON REST (JMS Serializer + OpenAPI/Swagger) |
| **Лицензия** | AGPL-3.0 (копилефт, требует открытия производных) |
| **Релизный цикл** | Каждые несколько недель |
| **Плагины** | KimaiPlugin namespace + marketplace (kimai.org/store) |

---

## 2. Технический стек

### Бэкенд
- **Фреймворк:** Symfony 7 (src/ — 1141 файлов)
- **ORM:** Doctrine ORM 2.8+ (85 Entity классов)
- **БД:** MariaDB >= 10.6 или MySQL >= 8.4
- **API:** JSON REST (JMS Serializer + OpenAPI атрибуты)
- **Аутентификация:** SAML, LDAP, Database, TOTP (2FA)
- **Роли:** Role + RolePermission + Team-based ACL
- **Миграции:** 76 Doctrine migrations (migrations/)

### Фронтенд
- **UI Kit:** Bootstrap 5 + Tabler (tabler.io)
- **Сборка:** Webpack (webpack.config.js)
- **Шаблоны:** Twig (templates/ — 223 файла)
- **Ассеты:** assets/ — 84 файла
- **Переводы:** 30+ языков (translations/ — 602 файла)

### Инфраструктура
- **PHP:** 8.2 minimum, поддержка 8.3/8.4/8.5
- **Расширения PHP:** gd, intl, json, mbstring, pdo, tokenizer, xml, xsl, zip
- **Веб-сервер:** Apache / Caddy / Nginx
- **Docker:** Dockerfile + docker-compose (kimai/kimai2)
- **Cloud:** SaaS-версия kimai.cloud

### Тестирование
- **Тесты:** 832 файла (PHPUnit)
- **CI:** GitHub Actions
- **Покрытие:** Codecov (codecov.io)

---

## 3. Модель данных

### Иерархия
```
Customer → Project → Activity → Timesheet
                ↑                    ↑
              Team                 User
              (many-to-many)      (FK)
```

### Таблицы БД (префикс `kimai2_`)

| Таблица | Ключевые поля | Связи |
|---------|--------------|-------|
| `kimai2_users` | id, username, email, password, api_token, roles, timezone, **hourly_rate**, **internal_rate**, language | - |
| `kimai2_customers` | id, name, number, company, vat_id, contact, address, country, **currency**, timezone, **budget**, **time_budget**, color, visible, billable | - |
| `kimai2_projects` | id, customer_id(FK), name, number, order_number, order_date, **start**, **end**, **budget**, **time_budget**, color, visible, billable, global_activities | → Customer |
| `kimai2_activities` | id, project_id(FK nullable), name, **budget**, **time_budget**, color, visible, billable | → Project (null = global) |
| `kimai2_timesheet` | id, user_id(FK), activity_id(FK), project_id(FK), **begin** (datetime), **end** (datetime), **duration** (int seconds), **rate** (decimal), **internal_rate**, exported (bool), billable, description, date_tz | → User, Activity, Project |
| `kimai2_tags` | id, name | - |
| `kimai2_timesheet_tags` | timesheet_id(FK), tag_id(FK) | M:N Timesheet↔Tag |
| `kimai2_teams` | id, name, teamlead_id(FK) | → User |
| `kimai2_team_members` | team_id(FK), user_id(FK) | M:N Team↔User |
| `kimai2_customers_teams` | customer_id(FK), team_id(FK) | Team-based ACL |
| `kimai2_projects_teams` | project_id(FK), team_id(FK) | Team-based ACL |
| `kimai2_activities_teams` | activity_id(FK), team_id(FK) | Team-based ACL |
| `kimai2_invoices` | id, customer_id(FK), invoice_number, total, tax, currency, status, created_at | → Customer |
| `kimai2_customers_rates` | customer_id(FK), user_id(FK nullable), rate | Почасовые ставки |
| `kimai2_projects_rates` | project_id(FK), user_id(FK nullable), rate | Почасовые ставки |
| `kimai2_activities_rates` | activity_id(FK), user_id(FK nullable), rate | Почасовые ставки |
| `kimai2_users_rates` | user_id(FK), rate | Почасовые ставки |

### Meta Fields (расширяемость без миграций)
Все ключевые сущности имеют таблицы `*_meta` для key-value:
`kimai2_customers_meta`, `kimai2_projects_meta`, `kimai2_activities_meta`, `kimai2_timesheet_meta`, `kimai2_invoices_meta`

### Типы данных
- **PK:** INT AUTO_INCREMENT (не GUID!)
- **Деньги:** DECIMAL
- **Время (длительность):** INT (секунды!)
- **Даты:** DATETIME_MUTABLE (begin/end), DATE_IMMUTABLE (date_tz)
- **Часовые пояса:** PHP DateTimeZone, колонка `date_tz` для статистики

### Traits (поведение сущностей)
- `BudgetTrait` — `$budget` (float) + `$timeBudget` (int секунды)
- `ColorTrait` — `$color` (hex)
- `CreatedTrait` — `$createdAt`
- `ModifiedTrait` — `$modifiedAt`

---

## 4. API

### REST API контроллеры (12)
```
src/API/
├── ActionsController.php      — действия (статистика, действия)
├── ActivityController.php     — CRUD активностей
├── BaseApiController.php      — базовый класс
├── ConfigurationController.php — конфигурация
├── CustomerController.php     — CRUD клиентов
├── ExportController.php       — экспорт данных
├── InvoiceController.php      — инвойсы
├── ProjectController.php      — CRUD проектов
├── StatusController.php       — статус, версия, пинг
├── TagController.php          — CRUD тегов
├── TeamController.php         — CRUD команд
├── TimesheetController.php    — CRUD таймшитов
└── UserController.php         — пользователи
```

### Формат API
- JSON (JMS Serializer)
- OpenAPI/Swagger-атрибуты на entity-классах
- `swagger.json` (25KB) — полная спека
- Сериализация: `Serializer\Groups(['Default', 'Expanded', 'Not_Expanded'])`
- Виртуальные свойства: `CustomerAsId`, `ProjectAsId`, `TagsAsArray`

---

## 5. Бизнес-фичи

### Трекинг времени
- **3 режима:** duration-only, start/end times, punch-in/punch-out
- **Мульти-таймер:** несколько одновременных таймеров
- **Экспорт:** после экспорта (`exported = true`) запись блокируется
- **Billable:** auto/yes/no/default на каждом уровне (Customer→Project→Activity→Timesheet)

### Инвойсинг
- **Форматы:** PDF, HTML, DOCX, ODS, XLSX, CSV
- **Шаблоны:** Twig + кастомные плейсхолдеры
- **Нумерация:** авто (по количеству записей в БД — есть риск дубликатов при удалении)
- **Налоги:** Tax + TaxType сущности
- **Calculator:** TimesheetInvoiceItemRepository (конвертация времени → деньги)

### Бюджеты
- **Денежный:** `budget` (float)
- **Временной:** `timeBudget` (int секунды)
- **Уровни:** Customer, Project, Activity
- **Отображение:** процент выполнения, прогресс-бары

### Отчёты
- **Weekly/monthly/yearly** — представления пользователя
- **Project details** — сводка по проекту
- **Customer overview** — обзор клиента
- **Reporting:** `src/Reporting/` (CustomerMonthlyProjects и др.)

### Команды и права
- **Team:** Team → TeamMember (many-to-many с User)
- **Team lead:** teamlead_id
- **ACL:** Team → Customer/Project/Activity через `*_teams` таблицы
- **Роли:** Role → RolePermission (гибкая система прав)
- **Voter:** EntityMultiRoleVoter (Symfony Voter для проверки прав)

### Плагины
- **Marketplace:** kimai.org/store
- **Архитектура:** `KimaiPlugin` namespace
- **Примеры:** Audit trail, Expense management, Kiosk mode, Custom CSS/JS

---

## 6. Сравнение с Timetta

| Характеристика | Kimai | Timetta |
|---------------|-------|---------|
| **Лицензия** | AGPL-3.0 (открытый) | Проприетарная |
| **Язык** | PHP 8.2+ | C#/.NET |
| **Фреймворк** | Symfony 7 | Неизвестен (закрыт) |
| **БД** | MariaDB/MySQL | PostgreSQL |
| **PK** | INT AUTO_INCREMENT | GUID (UUID v4) |
| **Время** | INT (секунды) | Decimal (часы) |
| **Модель** | Customer→Project→Activity→Timesheet | Organization→Project→ProjectTask→TimeSheet→Line→Allocation |
| **Сложность** | Проще (3 уровня) | Сложнее (6 уровней) |
| **Таймшиты** | Поштучные записи (begin→end) | Недельная сетка (Line→Allocation) |
| **Инвойсы** | ✅ Встроенные (5 форматов) | ✅ (PDF, через OData) |
| **Бюджеты** | Деньги + время | Деньги + время (P&L) |
| **API** | JSON REST (Swagger) | OData V4 REST |
| **Auth** | SAML/LDAP/DB/2FA | OIDC (IdentityServer4) |
| **Плагины** | ✅ Marketplace | ❌ Закрытая экосистема |
| **Мобильный** | Responsive (Tabler) | Responsive (Bootstrap) |
| **AI** | ❌ Нет | ✅ AI-агенты + промпты |
| **CRM** | ❌ Только Customer | ✅ Полноценный CRM |
| **Ресурсы** | ❌ Нет планирования | ✅ ResourceRequest + Booking |
| **GitLab** | ❌ Нет | ✅ Интеграция |
| **1С** | ❌ Нет | ✅ Интеграция |
| **152-ФЗ** | ❌ Зарубежный | ✅ Реестр ПО РФ |

---

## 7. Файлы-источники

| Файл | Размер | Описание |
|------|--------|----------|
| `README.md` | 5.6KB | GitHub README |
| `kimai-homepage.html` | 77KB | Главная страница |
| `kimai-docs.html` | 66KB | Документация |
| `kimai-api-docs.html` | 27KB | REST API документация |
| `swagger.json` | 25KB | OpenAPI спецификация |
| `entity-Customer.php` | 18.5KB | Исходник Customer |
| `entity-Project.php` | 14.7KB | Исходник Project |
| `entity-Activity.php` | 9.7KB | Исходник Activity |
| `entity-Timesheet.php` | 19.3KB | Исходник Timesheet |
| `entity-User.php` | 43.5KB | Исходник User |
| `entity-Team.php` | 11KB | Исходник Team |
| `entity-Invoice.php` | 14KB | Исходник Invoice |
| `entity-Tag.php` | 2.3KB | Исходник Tag |
| `entity-Rate.php` | 2.6KB | Исходник Rate |
| `entity-Role.php` | 1.4KB | Исходник Role |
| `entity-Tax.php` | 0.9KB | Исходник Tax |
| `entity-Configuration.php` | 2.1KB | Исходник Configuration |
| Списки | - | `entity-list.txt` (85), `controller-list.txt` (127) |
