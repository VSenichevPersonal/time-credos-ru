# Timetta — Разведка (Intel 01)

**Дата:** 2026-06-20
**Цель:** https://timetta.com/
**Метод:** Black-box (браузер + curl + OIDC discovery + авторизованный обход API)

---

## 1. Общая информация

| Параметр | Значение |
|----------|----------|
| **Продукт** | Timetta — Unified PPM/PSA платформа |
| **Слоган** | Project Portfolio Management & Professional Services Automation |
| **Компания** | ООО «РЕД Лаб» (Red Lab) |
| **ИНН** | 7751022850 |
| **ОГРН** | 1167746555393 |
| **КПП** | 773101001 |
| **ОКВЭД** | 62.01 (Разработка ПО) |
| **Юр. адрес** | 121205, Москва, Сколково, Большой бульвар, д. 42, стр. 1 |
| **Год основания** | 2017 |
| **Реестр ПО РФ** | №18250 |
| **Исп. директор** | Виктор Золотов |
| **Директор по консалтингу** | Александр Спиридонов |
| **Тест. аккаунт** | vs@credos.ru |

---

## 2. Технический стек

### Фронтенд (app.timetta.com)
- **Фреймворк:** Angular (ngsw-bypass, chunk-\*, main-\*, polyfills-\*, service-worker.js)
- **Бандлы:** main-2OYKIUI3.js, polyfills-2RORRYVO.js, chunk-\*.js (lazy-loaded модули)
- **Стили:** styles-2VCZDS2S.css
- **Иконки:** Bootstrap Icons (bootstrap-icons-CVBWLLHT.woff2)
- **i18n:** `/assets/i18n/ru-RU.json?v=14625`
- **Аватар:** `/assets/images/avatar/avatar.svg` + `/avatar/{userId}?size=60`
- **Звуки уведомлений:** 10 mp3 (bright-notification, soft-chime, delicate-ping, gentle-bell, quick-alert, short-bleep, mellow-tone, crisp, airy, sparkle, icq-ooh)
- **Анимированный логотип:** `/assets/logo_animated.svg`

### Маркетинговый сайт (timetta.com)
- SPA (кастомный бандл: `dist/site.*.js`, `dist/site.*.css`)
- Изображения: imgix.net CDN
- Шрифты: PPObjectSans (Regular, Medium), Feather иконки

### Аутентификация
- **Провайдер:** OpenID Connect (IdentityServer4)
- **Issuer:** `https://auth.timetta.com`
- **UI:** Двухшаговый вход (email → пароль), «Оставаться в системе 30 дней»
- **Grant types:** authorization_code + PKCE, client_credentials, refresh_token, implicit, password, device_code, shared_grant, persistent_grant
- **Signing:** RS256 (ключ: `D9C8EBC9AE85DE0E9FAD95FC01CFD77CC70775AARS256`)
- **Scopes:** openid, profile, email, all, shared, agent-run, offline_access
- **Client ID:** `web_app` (SPA public client)
- PKCE S256, silent refresh через iframe

### API (api.timetta.com)
- **Протокол:** OData V4 REST
- **Аутентификация:** OAuth 2.0 Bearer token
- **Endpoint паттерн:** `/odata/{Entity}?$select=...&$expand=...`
- **Формат:** JSON

### Инфраструктура
- **Дата-центры:** РФ (152-ФЗ compliance)
- **ОС:** Linux
- **БД:** PostgreSQL
- **AI бот:** `ai-bot.timetta.com` → `ai-api.timetta.com`, версия 240
- **AI бот API:** `api.timetta.com`

### Аналитика
- Yandex Metrika: 35785775
- GA4: G-6S1BEPGXB6
- GTM: GTM-PZQ226N

---

## 3. Продуктовая линейка

### Решения (Solutions)
| Решение | URL |
|----------|-----|
| Timetta PPM (ИСУП) | `/solutions/ppm` |
| Timetta PSA | `/solutions/psa` |
| Timetta Projects Lite (Free) | `/solutions/freemium` |

### Приложения (Applications)
| Приложение | Цена ₽/чел/мес | Назначение | Заменяет |
|------------|----------------|------------|----------|
| **Timetta Projects** | 1,216 | Управление проектами, Gantt, программы, портфели, риски | MS Project, Monday, Jira |
| **Timetta Finance** | 1,309 | Бюджеты, расчёты с клиентами/субподрядчиками, P&L, cash flow | SAP, 1C, Tempo Budgets |
| **Timetta Resources** | 2,057 | Бронирование ресурсов, запросы на подбор, утилизация | Zoho Bookings, Matrix Booking |
| **Timetta Timesheets** | 524 | Таймшиты, учёт затрат, отпуска | Tempo Timesheets, SAP SF, Replicon |
| **Timetta Clients** | 1,075 | CRM: сделки, воронки, AI-ассистенты | Zoho CRM, Salesforce, Dynamics 365 |
| **Timetta Tasks** | 421 | Таск-трекер, Agile, backlog, спринты | Jira, Wrike, ClickUp |
| **Timetta Wiki** | — | База знаний, Markdown, enterprise access | Confluence, SharePoint, Wiki.js |
| **Timetta Expenses** | 327 | Заявки на расходы, согласование | Zoho Expense, Expensify, Harvest |
| **Timetta Corp** | 3,273 | Core: администрирование, dashboards, workflows | — |
| **AI Assistant** | — | AI чат, агенты, ассистенты | — |

### Тарифные планы
| План | Пользователи | Особенности |
|------|-------------|-------------|
| **Free** | до 10 | Projects + Tasks + Wiki + AI, базовый функционал |
| **Standard** | от 1 | Полный набор приложений, поддержка, конструктор цены |
| **Enterprise** | договор | On-premises опция, расширенная поддержка, индивидуальный договор |

Скидки: Annual -15%, 6 months -7%. Цены повышены на 10% с 01.06.2026.

---

## 4. Карта приложения (app.timetta.com) — из навигации

```
Моя работа
├── ВОРКФЛОУ
│   ├── Задания к исполнению (15)
│   ├── Все задания
│   └── Активные процессы (4)
├── ЗАДАЧИ
│   ├── Я исполнитель (0)
│   ├── Я инициатор (10)
│   └── Разработка ПО Сатурн (53)
├── УЧЁТ
│   ├── Текущий таймшит
│   ├── Таймшиты
│   ├── Заявки на отсутствия
│   └── Заявки на затраты
├── ВИКИ
│   └── Методология
└── ОБО МНЕ
    ├── Мои сертификаты
    └── Профиль

Команда
├── ТАЙМШИТЫ: Все, Просроченные
├── ОТСУТСТВИЯ: График, Балансы, Заявки
├── ЗАТРАТЫ: Заявки
└── КОМАНДА: Сотрудники, Сертификаты

Проекты
├── ПРОЕКТЫ: Мои, Активные, Все, Программы, Портфели
├── ЗАДАЧИ: Я исполнитель, Я инициатор, Все задачи
├── СОДЕРЖИМОЕ: Документы, Риски, Запросы на резерв
├── КТЧ: Контрольные точки, Сводка по КТч
└── АНАЛИТИКА: Сводка по проектам, Сводка по сотрудникам

Клиенты
├── ОРГАНИЗАЦИИ: Все, Мои, Контакты
├── ПРОДАЖИ: Мои сделки, Все сделки
├── ВЗАИМОДЕЙСТВИЯ: Мои просроченные, Все просроченные, Мои на сегодня, Все
├── КАМПАНИИ: Кампании
└── АНАЛИТИКА: Воронка продаж

Аналитика
├── DASHBOARDS: Обзор команды, Обзор Аудит Сибура
├── ОТЧЁТЫ: Конструктор, Все отчёты, Мои отчёты
├── ФИНАНСЫ: P&L
├── ШАБЛОНЫ: Шаблоны отчётов
└── НАСТРОЙКИ: Вычисляемые поля

Настройки
├── СИСТЕМА: Учётная запись, Настройки, Импорты, Журнал изменений, Журнал входа
├── ПОЛЬЗОВАТЕЛИ: Пользователи, Лицензии, Группы, Департаменты, Права
├── РЕСУРСЫ: Пулы, Уровни, Грейды, Локации, Роли, Компетенции, Навыки
├── УЧЁТ ВРЕМЕНИ: Графики, Исключения, Периоды, Активности, Типы отсутствий, Правила валидации, Шаблоны, Bill Codes
├── ФИНАНСЫ: Юрлица, Матрицы ставок, Валюты, Счета, Шаблоны счетов, Нормализация затрат, НДС
├── ЗАДАЧИ: GitLab репозитории, Типы связей задач
├── КЛИЕНТЫ: Шаблоны писем, Сценарии взаимодействий
├── AI: Схемы контекста, Промпты, Агенты, Запуски агентов
├── ПРОЕКТЫ: Типы документов, Типы рисков, Модели проектов
└── КОНФИГУРАЦИЯ: Представления, Wiki-пространства, Жизненные циклы, Воркфлоу, Справочники, Настраиваемые поля
```

---

## 5. API-эндпоинты (api.timetta.com/odata/)

### Сессия и конфигурация
| Endpoint | Описание |
|----------|----------|
| `GET /odata/GetSession?$expand=configuration/metamodel/entities` | Сессия: user, roles, permissions, timezone, products, metamodel |
| `GET /odata/GetClientProfile(clientType='web')` | Сохранённые настройки UI пользователя |
| `POST /odata/UpdateClientProfile` | Сохранить настройки UI (навигация, представления и т.д.) |
| `GET /odata/GetNavigationItems` | Структура навигации (area, group, route, viewEntityType) |
| `GET /odata/GetEntityTypes` | Реестр всех типов сущностей |

### Нотификации
| Endpoint | Описание |
|----------|----------|
| `GET /odata/Notifications?$top=50&$orderby=created desc` | Последние уведомления |
| `GET /odata/Notifications?$apply=filter(read eq false)/aggregate(id with countdistinct as count)` | Счётчик непрочитанных |

### Таймшиты
| Endpoint | Описание |
|----------|----------|
| `GET /odata/TimeSheets/GetIdForPeriod(date=...,userId=...)` | ID таймшита по дате и пользователю |
| `GET /odata/TimeSheets(id)?$expand=...` | Полный таймшит (строки, allocation, проекты, тарифы) |
| `GET /odata/TimeSheets(id)/GetLifeCycleInfo` | Жизненный цикл таймшита |

### Аватар
| Endpoint | Описание |
|----------|----------|
| `GET /avatar/{userId}?size=60` | Аватар пользователя |

---

## 6. Модель данных (EntityTypes из API)

```
CalculatedFields, Dashboards, Reports, Invoices, InvoiceTemplates,
Campaigns, CampaignEntries, Contacts, Deals, DealContacts,
EmailTemplates, Interactions, InteractionScenarios, InteractionTypes,
Organizations, OrganizationLegal, OrganizationRelations, OrganizationTariffs, OrganizationTotals,
Generics, Resources, Users, WorkflowInstances,
ProjectBillingTypes, ProjectTaskCategories, RateMatrixTypes,
ReportTypes, TimesheetPeriodScopes, TimesheetPeriodTypes,
ValidationRuleTypes, VatRates, ExpenseRequestLines, ...
```

### Сущности таймшита (из $expand)
```
TimeSheet
├── template (showActivity, showRole, showClient, showProjectCostCenter, showTariff, showBillCode)
├── user (id, name)
├── legalEntity (id, name)
├── state (id, name, code)
├── timeSheetLines
│   ├── project → billingType → organization
│   ├── projectTask (leadTaskId)
│   ├── projectCostCenter
│   ├── projectTariff
│   ├── billCode
│   ├── activity
│   └── role
├── timeOffRequests → state → timeOffType
└── timeAllocations
    ├── issue (code, key)
    ├── project → billingType → organization
    ├── projectTask, projectCostCenter, projectTariff
    ├── billCode, activity, role
    └── isBillable, stopwatchStarted
```

---

## 7. Данные тестового стенда (vs@credos.ru)

### Проекты (9 шт.)
| Код | Название | Клиент | Менеджер | Сроки |
|-----|----------|--------|----------|-------|
| CON-24-2026 | Оптимизация бизнес-процессов | Главстрой Корпорация | А. Нестеров | 19.04–22.06.2026 |
| SUP-02-2026 | Тех. поддержка Сибур 2024 | Сибур | vs@credos.ru | 01.05–19.08.2026 |
| CON-35-2026 | Аудит процессов управления | Регионы-Девелопмент | А. Нестеров | 19.05–22.07.2026 |
| AUD-02-2026 | Аудит Сибура 2026 | Главстрой Корпорация | vs@credos.ru | 01.03–19.09.2026 |
| IMP-01-2026 | Развертывание CRM | Адидас РУС | vs@credos.ru | 19.04–19.07.2026 |
| ADM-2026 | Внепроектные работы | — | vs@credos.ru | 01.01–31.12.2026 |
| IMP-03-2026 | Финансовый модуль ERP | Энергобезопасность ФГУ НТЦ | vs@credos.ru | 28.05–19.07.2026 |
| DEV-01-SOFT | Разработка ПО Сатурн | — | vs@credos.ru | 19.05–19.10.2026 |
| ARCH-PR-2026 | Проектирование ТЦ Спектрум | Регионы-Девелопмент | vs@credos.ru | 01.04–30.06.2026 |

### Организации (20 шт.)
Сибур, Главстрой Корпорация, Регионы-Девелопмент, Адидас РУС, Энергобезопасность ФГУ НТЦ, Тепловизор НПО, Мортон ГК, СвязьКомплектСервис, Одинцовская кондитерская фабрика, Хладокомбинат №13, ПИК ГК, Главпродукт, Восток-Сервис, РОЛЬФ, ИТАР-ТАСС, Русское море, X5 Retail Group, Лаборатория Касперского, Мосметрострой, Темп Московский радиозавод

### Виды работ
Документирование, Внедрение изменений, Программирование, Консалтинг, Обучение клиентов, Аудит, Тестирование и контроль, Поддержка

---

## 8. Конкуренты (упомянутые на сайте)

| Конкурент | Категория |
|-----------|-----------|
| MS Project | Проектное управление |
| Jira | Таск-трекинг, Agile |
| Confluence | База знаний |
| SAP | ERP/Финансы |
| Monday.com | Управление проектами |
| 1С | ERP/Финансы (РФ) |
| Salesforce | CRM |
| Zoho CRM/Expense/Bookings | CRM/Расходы/Ресурсы |
| Wrike, ClickUp | Таск-трекинг |
| Tempo (Timesheets/Budgets/Resources) | Таймшиты/Бюджеты |
| Replicon | Таймшиты |
| SharePoint, Wiki.js | База знаний |
| Harvest, Expensify | Расходы |
| Matrix Booking | Ресурсы |
| Microsoft Dynamics 365 | CRM |

---

## 9. Безопасность (на основе открытых данных)

- ✅ OIDC/OAuth 2.0 с PKCE (S256)
- ✅ ID токены: RS256 подпись
- ✅ Данные в дата-центрах РФ
- ✅ Реестр отечественного ПО №18250
- ✅ 152-ФЗ compliance заявлен
- ✅ Linux + PostgreSQL (нет vendor lock-in)
- ✅ Анти-CSRF: RequestVerificationToken на форме логина
- ⚠️ Password grant type включён в OIDC (legacy)
- ⚠️ Implicit grant type включён (не рекомендуется для SPA)
- ⚠️ RS256: один ключ, ротация не видна
- ⚠️ Access token в localStorage/памяти (Bearer в заголовках)

---

## 10. Отличия RU vs EN версий

| Элемент | EN | RU |
|---------|-----|-----|
| CTA кнопка | Get Trial / Get Started | Демо версия / Начать |
| Безопасность | Нет блока | Блок «Технологический суверенитет» |
| Калькуляторы | Нет | ROI, Рентабельность |
| Видео/Вебинары | Нет | Есть |
| Реестр ПО | Упоминание | Подробная страница |
| Вход | Нет кнопки «Войти» | Кнопка «Войти» |

---

## 11. Ключевые контакты

| Канал | Контакт |
|-------|---------|
| Продажи | sales@timetta.com |
| Поддержка | support@timetta.com |
| HR | hr@timetta.com |
| Telegram | @TimettaRUS |
| YouTube | @timetta-rus |

---

## 12. Доказательства

| Файл | Описание |
|------|----------|
| `landing-page-full.png` | EN лендинг (full page) |
| `ru-landing.png` | RU лендинг (full page) |
| `pricing-page.png` | EN страница цен + конструктор |
| `en-api-page.png` | EN API: OData V4 + OAuth 2.0 |
| `company-page.png` | RU страница компании + реквизиты |
| `api-page.png` | Редирект на регистрацию |
| `app-main-page.png` | App: Текущий таймшит (после логина) |
| `app-projects.png` | App: Список проектов (9 шт.) |
| `app-clients.png` | App: Организации (20 шт.) |
