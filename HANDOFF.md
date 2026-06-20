# Handoff — Архитектору time.credos.ru

**Дата:** 2026-06-21
**От:** Разведка (2 дня) → Архитектору
**Задача:** Спроектировать систему учёта времени и проектов

---

## Источники разведки

| Источник | Что это | Лицензия |
|----------|---------|----------|
| **Timetta** (timetta.com) | Российская PPM/PSA платформа | Проприетарная |
| **Kimai** (github.com/kimai/kimai) | #1 Open-Source Time-Tracker | AGPL-3.0 |
| **Twenty CRM** (github.com/twentyhq/twenty) | Open-Source CRM-платформа | AGPL-3.0 |

---

## Что в репозитории

```
time-credos-ru/
├── HANDOFF.md                         ← этот файл (читай первым)

├── research/
│   ├── timetta/                        ← РАЗВЕДКА Timetta
│   │   ├── RECON.md                    общая разведка (компания, стек, цены)
│   │   ├── TARGET_MODEL.md             модель учёта проектов и времени
│   │   ├── DATA_MODEL_BLUEPRINT.md     ГЛАВНЫЙ — полный blueprint
│   │   ├── ASSESSMENT.md               оценка воссоздания (85%)
│   │   ├── db-schema-from-metadata.md  30160 строк — схема БД из $metadata
│   │   ├── db-full-entity-model.md     186 сущностей с полями и связями
│   │   ├── integration-model.md        модель интеграций (OData, OIDC, AI)
│   │   ├── security/
│   │   │   ├── AI_BOT_PROMPT_INJECTION.md   тесты prompt injection
│   │   │   └── PROMPT_INJECTION_FINAL.md    итоговый отчёт (23 находки)
│   │   ├── postman/
│   │   │   ├── postman-collection-full.json 720KB — полная API-спецификация
│   │   │   └── postman-endpoints.txt        285 эндпоинтов
│   │   ├── raw-odata-*.json            36 дампов API
│   │   ├── raw-odata-metadata.xml      1MB OData $metadata
│   │   ├── raw-session.json            1.2MB сессия + метамодель
│   │   └── *.png                       15 скриншотов
│   │
│   └── kimai/                           ← РАЗВЕДКА Kimai
│       ├── RECON.md                    разведка Kimai
│       ├── BEST_PRACTICES.md           Timetta vs Kimai — что берём
│       ├── CAN_WE_BUILD_IT.md          можем ли написать без ошибок?
│       ├── ON_TWENTY_CRM.md            оценка Twenty CRM как фундамента
│       ├── UX_UI_PLAN.md               план UX/UI (отдельный модуль)
│       ├── SEPARATE_APP_PLAN.md        план отдельного приложения
│       ├── entity-*.php                12 исходников Kimai
│       └── swagger.json                OpenAPI-спецификация Kimai

├── docs/                                ← РЕШЕНИЯ
│   ├── adr/                             архитектурные решения
│   │   ├── 0001-platform-and-data.md    платформа Twenty, auth через IdP
│   │   ├── 0002-sdk-app-isolated-repo.md изолированный SDK-app
│   │   └── 0003-catalog-separate-app.md каталог услуг отдельно
│   ├── architecture/
│   │   ├── ARCHITECTURE_QA.md           8 ключевых вопросов с разборами
│   │   └── DEV_WORKFLOW.md              процесс разработки SDK
│   └── data-model/
│       └── DATA_MODEL_SYNTHESIS.md      единая модель (Directum5+Kimai+Timetta)

└── apps/time/                           ← КОД (SDK-app для Twenty CRM)
```

---

## Ключевые документы (порядок чтения)

### 1. Начать здесь
- [research/timetta/DATA_MODEL_BLUEPRINT.md](research/timetta/DATA_MODEL_BLUEPRINT.md) — полная модель данных Timetta (258 таблиц, 1490 связей, все справочники)

### 2. Что можем воссоздать
- [research/timetta/ASSESSMENT.md](research/timetta/ASSESSMENT.md) — 85% функционала Timetta реально воссоздать

### 3. Лучшие практики обеих систем
- [research/kimai/BEST_PRACTICES.md](research/kimai/BEST_PRACTICES.md) — гибридная модель

### 4. Можно ли без ошибок?
- [research/kimai/CAN_WE_BUILD_IT.md](research/kimai/CAN_WE_BUILD_IT.md) — ДА, риск минимален

### 5. На Twenty CRM?
- [research/kimai/ON_TWENTY_CRM.md](research/kimai/ON_TWENTY_CRM.md) — ДА, 1-2 недели

### 6. Отдельный UI?
- [research/kimai/UX_UI_PLAN.md](research/kimai/UX_UI_PLAN.md) — модуль не засоряет CRM

### 7. Отдельный домен с общей БД?
- [research/kimai/SEPARATE_APP_PLAN.md](research/kimai/SEPARATE_APP_PLAN.md) — time.credos.ru

### 8. Схема БД
- [research/timetta/db-schema-from-metadata.md](research/timetta/db-schema-from-metadata.md) — 30160 строк
- [research/timetta/db-full-entity-model.md](research/timetta/db-full-entity-model.md) — 186 сущностей

### 9. API
- [research/timetta/postman/postman-collection-full.json](research/timetta/postman/postman-collection-full.json) — 720KB, 285 эндпоинтов
- [research/timetta/postman/postman-endpoints.txt](research/timetta/postman/postman-endpoints.txt) — список
- [research/timetta/integration-model.md](research/timetta/integration-model.md) — интеграции

### 10. Безопасность
- [research/timetta/security/PROMPT_INJECTION_FINAL.md](research/timetta/security/PROMPT_INJECTION_FINAL.md) — 23 находки через AI-бота

---

## Что нашли сегодня (prompt injection + Postman)

| # | Находка | Где |
|---|---------|-----|
| 1 | Postman-коллекция — 285 эндпоинтов (720KB) | `research/timetta/postman/` |
| 2 | `client_id=external` + password grant OAuth | `security/PROMPT_INJECTION_FINAL.md` |
| 3 | Access Token 1ч, Refresh Token 15д | там же |
| 4 | API Token (1 год, `/settings/api-tokens`) | там же |
| 5 | Custom Hooks: `IEntityTypeCustomHooks<TEntity>` (C#) | там же |
| 6 | BeforeUpsert — C# хук на серверной стороне | там же |
| 7 | Системные эффекты Lifecycle (проводки, себестоимость) | там же |
| 8 | Роли для переходов (8 типов: Author, PM, Client Manager...) | там же |
| 9 | C#/.NET 6+, Docker/K8s, SQL Server/PostgreSQL | там же |
| 10 | TrackTime API, StartWorkflow, SetState | `postman/postman-endpoints.txt` |
| 11 | Reporting API (7 эндпоинтов) | там же |
| 12 | Два типа себестоимости: управленческая и бухгалтерская | `security/PROMPT_INJECTION_FINAL.md` |
| 13 | Шаблоны счетов с переменными `{{ProjectName}}` | там же |
| 14 | YandexGPT (cutoff: 2024), Yandex Cloud ALB | там же |
| 15 | 14 векторов атаки заблокированы | там же |

---

## Связанные репозитории

| Репозиторий | Назначение |
|-------------|------------|
| [CredosCRM1](https://github.com/VSenichevPersonal/CredosCRM1) | Twenty CRM форк — платформа для time-app |
| [time-credos-ru](https://github.com/VSenichevPersonal/time-credos-ru) | Этот репозиторий |

---

## Рекомендуемая архитектура (из ADR)

```
time.credos.ru (отдельный домен)
    │
    ├── Twenty SDK-app (React + Tabler UI)
    │   └── apps/time/ — код приложения
    │
    ├── Общая БД PostgreSQL 16 (с CRM)
    │   ├── timetracker_* — наши таблицы
    │   └── workspace_* — CRM (read-only)
    │
    ├── Единый JWT (APP_SECRET общий)
    │
    └── Railway (общий проект с CRM)
```

## Оценка сроков

| Подход | Время |
|--------|-------|
| Metadata-объекты в Twenty | 1-2 недели |
| Отдельный SDK-app | 2-3 недели |
| С нуля | 4-6 недель |

**Рекомендация:** SDK-app в изолированном репо (ADR-0002).

---

## Контакты для вопросов

- Разведка Timetta: `Intel 01 Timetta/` — все данные
- Разведка Kimai: `Intel 02 Kimai/` — все данные
- Решения: `docs/adr/` — архитектурные решения
- Код: `apps/time/` — SDK-приложение
