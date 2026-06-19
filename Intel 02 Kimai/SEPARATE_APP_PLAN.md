# Time Tracking — отдельное приложение, общая БД

**Дата:** 2026-06-20

---

## АРХИТЕКТУРА

```
crm.credos.ru                          time.credos.ru
┌──────────────────────┐    ┌──────────────────────────┐
│  Twenty CRM           │    │  Timetracker (Новый)      │
│  React + NestJS       │    │  React + Node.js          │
│  GraphQL + REST       │    │  REST API                 │
│  packages/twenty-*    │    │  отдельный репозиторий     │
└──────────┬───────────┘    └──────────┬───────────────┘
           │                           │
           │    🔑 Единый JWT          │
           └──────────┬────────────────┘
                      │
           ┌──────────┴───────────┐
           │    PostgreSQL 16     │ ← ОБЩАЯ БД
           │    Redis              │ ← ОБЩИЙ КЭШ
           │    Railway            │ ← ОДИН ПРОЕКТ
           └──────────────────────┘
```

## КАК ЭТО ДЕЛАЕТСЯ

### Шаг 1: Новый Railway-сервис

В том же Railway-проекте добавить сервис `timetracker`:
```toml
# railway.toml (добавить)
[build.timetracker]
builder = "DOCKERFILE"
dockerfilePath = "packages/timetracker/Dockerfile"
watchPatterns = ["packages/timetracker/**"]

[deploy.timetracker]
restartPolicyType = "ALWAYS"
```

На Railway:
- `timetracker.up.railway.app` → DNS → `time.credos.ru`
- Переменные окружения: те же `PG_DATABASE_URL`, `REDIS_URL`, `APP_SECRET`

### Шаг 2: Общая БД

```typescript
// timetracker/src/database.ts
// Используем ТУ ЖЕ PG_DATABASE_URL, что и CRM

import { DataSource } from 'typeorm';

// Читаем существующие таблицы CRM (read-only)
const crmEntities = {
  company: 'kimai2_companies',     // или workspace_company из Twenty
  person: 'workspace_person',
  // ... читаем, но не пишем в CRM-таблицы
};

// Наши таблицы (read-write) — с префиксом timetracker_
const trackerEntities = {
  TimeSheet: 'timetracker_timesheets',
  TimeSheetEntry: 'timetracker_entries',  
  TimeAllocation: 'timetracker_allocations',
  Activity: 'timetracker_activities',
  Project: 'timetracker_projects',
  Rate: 'timetracker_rates',
};
```

### Шаг 3: Единая аутентификация

**Вариант А — тот же JWT:**
```typescript
// timetracker/src/auth.ts
// Проверяем JWT, выданный Twenty CRM
import jwt from 'jsonwebtoken';

function verifyToken(token: string) {
  // Тот же APP_SECRET, что у CRM
  return jwt.verify(token, process.env.APP_SECRET);
}
```

**Вариант Б — API-ключ:**
```typescript
// Пользователь в CRM → API-ключ → использует в Timetracker
// Так же как сейчас работает TWENTY_API_KEY
```

### Шаг 4: Технологический стек (свобода выбора!)

```
timetracker/
├── frontend/          — ЛЮБОЙ фреймворк
│   ├── Kimai-подобный UI на Tabler (как Twenty)
│   ├── или чистый React + Tailwind
│   ├── или Vue/Nuxt
│   └── или даже Svelte
├── backend/
│   ├── Node.js (как credos-integrations)
│   ├── или Python/FastAPI
│   ├── или PHP/Laravel (как Kimai)
│   └── или Go
└── Dockerfile
```

**Рекомендация:** Node.js + тот же стек что у интеграций (простота, тот же язык, те же разработчики).

---

## ЧТО ОБЩЕЕ (SHARED)

| Ресурс | Как делится |
|--------|-------------|
| **PostgreSQL** | `PG_DATABASE_URL` — общая переменная в Railway |
| **Redis** | `REDIS_URL` — общий кэш/сессии |
| **JWT/Сессии** | `APP_SECRET` — тот же ключ подписи |
| **Пользователи** | workspace_member таблица CRM (read-only для трекера) |
| **Компании** | company таблица CRM (read-only для трекера) |
| **Docker registry** | Railway shared |
| **Railway проект** | Один проект → общие переменные |

## ЧТО РАЗДЕЛЬНОЕ

| Ресурс | Трекер | CRM |
|--------|--------|-----|
| **Домен** | `time.credos.ru` | `crm.credos.ru` |
| **UI** | Свой дизайн (сетка + таймер) | Twenty CRM UI |
| **Репозиторий** | Отдельный или `packages/timetracker` | CredosCRM1 |
| **Деплой** | Свой Railway-сервис | Свой Railway-сервис |
| **Таблицы БД** | `timetracker_*` | `workspace_*`, `kimai2_*` |
| **API** | Свой REST/GraphQL | Twenty GraphQL |

## ПЛЮСЫ

- ✅ **Полная изоляция UI** — никакого засорения CRM
- ✅ **Свой домен** — `time.credos.ru` как отдельный продукт
- ✅ **Свобода стека** — можно выбрать лучший инструмент для трекера
- ✅ **Общие данные** — компании, контакты, пользователи не дублируются
- ✅ **Единый вход** — залогинился в CRM = залогинился в трекере
- ✅ **Независимый деплой** — обновление трекера не трогает CRM
- ✅ **Масштабирование** — можно развивать трекер в отдельный продукт

## МИНУСЫ

- ⚠️ **Два приложения** — больше кода поддерживать
- ⚠️ **Два деплоя** — CI/CD для каждого
- ⚠️ **DB Schema** — нельзя трогать CRM-таблицы (только read)

## СРОКИ

| Этап | Время |
|------|-------|
| Railway-сервис + Dockerfile | 2-3 часа |
| JWT-авторизация (общая с CRM) | 3-4 часа |
| Структура БД (новые таблицы) | 1 день |
| REST API (CRUD таймшитов) | 2-3 дня |
| UI: недельная сетка | 2-3 дня |
| UI: таймер | 1 день |
| Отправка/согласование | 1 день |
| Интеграция с CRM (чтение компаний) | 1 день |
| **ИТОГО** | **8-10 дней** |

---

## ДИАГРАММА ПОТОКА ДАННЫХ

```
Пользователь заходит на time.credos.ru
          │
          ▼
    ┌─────────────┐
    │  Tracker UI  │  React SPA (свой дизайн)
    │  time.credos │
    └──────┬───────┘
           │ REST / GraphQL
           ▼
    ┌─────────────┐
    │ Tracker API │  Node.js микросервис
    │ :4000       │
    └──┬──────┬───┘
       │      │
  ┌────┘      └────┐
  ▼                ▼
┌──────┐      ┌──────────┐
│  PG  │      │  Redis   │
│  DB  │      │  cache   │
└──────┘      └──────────┘
  │
  ├── timetracker_timesheets   (наши)
  ├── timetracker_entries      (наши)
  ├── timetracker_activities   (наши)
  ├── workspace_company        (CRM, read-only)
  ├── workspace_person         (CRM, read-only)
  └── workspace_member         (CRM, read-only)
```

## ИТОГО

**ДА, можно сделать `time.credos.ru` с полностью отдельным UI, но единой БД.**

Работает как Google Apps: разные домены, разные интерфейсы, общий аккаунт и данные.
