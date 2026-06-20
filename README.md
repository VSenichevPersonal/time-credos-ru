# time.credos.ru — Разведка и проектирование

**Дата:** 2026-06-20
**Задача:** Спроектировать систему учёта проектов и времени для Кредо-С

---

## Источники

| Система | Тип | Что взяли |
|---------|------|-----------|
| **Timetta** (timetta.com) | Проприетарная PPM/PSA, РФ | Модель данных (258 таблиц), Lifecycles (18 стейт-машин), CRM, AI, 152-ФЗ |
| **Kimai** (github.com/kimai/kimai) | Open-source (AGPL-3.0), PHP/Symfony | Исходный код (85 Entity), инвойсинг, Team ACL, Meta Fields, плагины |
| **Twenty CRM** (github.com/twentyhq/twenty) | Open-source CRM-платформа, TypeScript/NestJS | Фундамент: metadata-engine, GraphQL, AI-агенты, UI-библиотека |

---

## Структура репозитория

```
time-credos-ru/
├── README.md                          ← этот файл
├── Intel 01 Timetta/                  ← разведка Timetta
│   ├── RECON.md                       # общая разведка (компания, стек, цены)
│   ├── TARGET_MODEL.md                # модель учёта проектов и времени
│   ├── DATA_MODEL_BLUEPRINT.md        # полный blueprint (схемы, справочники)
│   ├── ASSESSMENT.md                  # оценка воссоздания
│   ├── db-schema-from-metadata.md     # 30160 строк — схема БД из $metadata
│   ├── db-full-entity-model.md        # 186 сущностей с полями и связями
│   ├── integration-model.md           # модель интеграций (OData, OIDC, AI, GitLab)
│   ├── raw-odata-*.json               # 36 дампов API (справочники, lifecycle, users)
│   ├── raw-odata-metadata.xml         # 1MB OData $metadata
│   ├── raw-session.json               # 1.2MB сессия + метамодель
│   ├── ux-*.css, ux-i18n-ru.json      # UX/UI: CSS-токены, переводы
│   └── *.png                          # 15 скриншотов
│
├── Intel 02 Kimai/                    ← разведка Kimai + сравнение с Timetta
│   ├── RECON.md                       # разведка Kimai
│   ├── BEST_PRACTICES.md              # Timetta vs Kimai — лучшие практики
│   ├── CAN_WE_BUILD_IT.md             # можем ли написать без ошибок?
│   ├── ON_TWENTY_CRM.md               # оценка Twenty CRM как фундамента
│   ├── UX_UI_PLAN.md                  # план UX/UI (отдельный модуль)
│   ├── SEPARATE_APP_PLAN.md           # план отдельного приложения (time.credos.ru)
│   ├── entity-*.php                   # 12 исходников Entity-классов Kimai
│   ├── swagger.json                   # OpenAPI-спецификация Kimai
│   └── *.html, README.md              # документация Kimai
```

---

## Ключевые выводы

### 1. Модель данных
- **Timetta:** 258 таблиц (EntityType), 1490 связей (NavigationProperty), 79 enum'ов
- **Kimai:** 85 Entity (Doctrine), чёткая иерархия Customer→Project→Activity→Timesheet
- **Вывод:** Начинаем с Kimai-простоты (4 уровня), расширяем до Timetta-глубины (6 уровней)

### 2. Фундамент
- **Twenty CRM** (форк CredosCRM1) — идеальная основа
- Metadata-driven: объекты создаются через REST API без кода
- Уже работает в продакшене: https://credoscrm1.up.railway.app
- Репозиторий CRM: https://github.com/VSenichevPersonal/CredosCRM1

### 3. Архитектура time.credos.ru
- Отдельный домен, отдельный UI, общая БД с CRM
- `time.credos.ru` — недельная сетка + таймер
- `crm.credos.ru` — Twenty CRM
- Единый JWT, общий PostgreSQL 16 на Railway

### 4. Сроки
- На Twenty CRM: **1-2 недели** (metadata-объекты)
- Отдельное приложение: **8-10 дней**
- С нуля: 4-6 недель

---

## Связанные репозитории

| Репозиторий | Назначение |
|-------------|------------|
| [CredosCRM1](https://github.com/VSenichevPersonal/CredosCRM1) | Twenty CRM форк — фундамент для time.credos.ru |
| [Kimai](https://github.com/kimai/kimai) | #1 Open-Source Time-Tracker — источник лучших практик |

---

## Карта документов (что читать)

| Вопрос | Документ |
|--------|----------|
| **Архитектурные вопросы и разборы (6 вопросов)** | `ARCHITECTURE_QA.md` |
| **Принятые решения (ADR)** | `docs/adr/` |
| → Платформа / данные / auth | `docs/adr/0001-platform-and-data.md` |
| → SDK-app в изолированном репо | `docs/adr/0002-sdk-app-isolated-repo.md` |
| **Как разрабатываем и устанавливаем (workflow)** | `docs/DEV_WORKFLOW.md` |
| **Синтез модели данных (все источники)** | `docs/DATA_MODEL_SYNTHESIS.md` |
| План сид-данных (реальные ОВ + мок) | `docs/SEED_DATA_PLAN.md` |
| Реальные трудозатраты Директум 5 | `Intel 03 Directum5/RECON.md` |
| Каталог услуг 4 отделов | `Intel 03 Directum5/katalog-uslug-otdelov-2025.md` |
| Что такое Timetta и как устроена? | `Intel 01 Timetta/RECON.md` |
| Как смоделировать таймшиты и проекты? | `Intel 01 Timetta/TARGET_MODEL.md` |
| Полная схема БД? | `Intel 01 Timetta/db-schema-from-metadata.md` |
| Что можно воссоздать? | `Intel 01 Timetta/ASSESSMENT.md` |
| Что такое Kimai? | `Intel 02 Kimai/RECON.md` |
| Что взять из Timetta, а что из Kimai? | `Intel 02 Kimai/BEST_PRACTICES.md` |
| Можем ли написать без ошибок? | `Intel 02 Kimai/CAN_WE_BUILD_IT.md` |
| Реально ли на Twenty CRM? | `Intel 02 Kimai/ON_TWENTY_CRM.md` |
| Как сделать UI не засоряя CRM? | `Intel 02 Kimai/UX_UI_PLAN.md` |
| Как сделать отдельный домен с общей БД? | `Intel 02 Kimai/SEPARATE_APP_PLAN.md` |
