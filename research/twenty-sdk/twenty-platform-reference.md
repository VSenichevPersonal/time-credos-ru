# Справочник платформы Twenty CRM

> Сводная документация по внутреннему устройству Twenty CRM, извлечённая из конфигурационных файлов, cursor rules и документации проекта.

---

## Содержание

1. [Переменные окружения](#1-переменные-окружения)
2. [Docker-конфигурация для production](#2-docker-конфигурация-для-production)
3. [Архитектура Twenty](#3-архитектура-twenty)
4. [Работа с миграциями БД](#4-работа-с-миграциями-бд)
5. [Создание syncable entities](#5-создание-syncable-entities)
6. [Локализация и переводы](#6-локализация-и-переводы)

---

## 1. Переменные окружения

Источники: `packages/twenty-server/.env.example`, `packages/twenty-docker/.env.example`

### 1.1. Обязательные переменные

| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `NODE_ENV` | `development` | Режим работы: `development` / `production` |
| `PG_DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/default` | Строка подключения к PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | Строка подключения к Redis |
| `APP_SECRET` | — (необходимо задать) | Секретный ключ приложения. Генерировать: `openssl rand -base64 32` |
| `FRONTEND_URL` | `http://localhost:3001` | URL фронтенда (для CORS и редиректов) |
| `SERVER_URL` | `http://localhost:3000` | URL бэкенда (для API) |

### 1.2. Серверные настройки

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` / `NODE_PORT` | `3000` | Порт сервера |
| `SIGN_IN_PREFILLED` | `true` | Предзаполнение формы входа (только для dev) |
| `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS` | `false` | Ограничить создание workspace только админами |
| `IS_MULTIWORKSPACE_ENABLED` | `false` | Мультиворкспейс режим |
| `DISABLE_DB_MIGRATIONS` | — | Отключить автоматические миграции при старте |
| `DISABLE_CRON_JOBS_REGISTRATION` | — | Отключить регистрацию cron-задач |
| `MUTATION_MAXIMUM_AFFECTED_RECORDS` | `100` | Максимум записей за одну мутацию |
| `IS_CONFIG_VARIABLES_IN_DB_ENABLED` | `false` | Хранить конфигурацию в БД |

### 1.3. Токены и сессии

| Переменная | По умолчанию | Описание |
|---|---|---|
| `ACCESS_TOKEN_EXPIRES_IN` | `30m` | Время жизни access-токена |
| `LOGIN_TOKEN_EXPIRES_IN` | `15m` | Время жизни токена входа |
| `REFRESH_TOKEN_EXPIRES_IN` | `90d` | Время жизни refresh-токена |
| `FILE_TOKEN_EXPIRES_IN` | `1d` | Время жизни токена для файлов |
| `PASSWORD_RESET_TOKEN_EXPIRES_IN` | `5m` | Время жизни токена сброса пароля |
| `EMAIL_VERIFICATION_TOKEN_EXPIRES_IN` | `1h` | Время жизни токена подтверждения email |

### 1.4. Аутентификация

| Переменная | Описание |
|---|---|
| `AUTH_PASSWORD_ENABLED` | Включить вход по паролю |
| `AUTH_GOOGLE_ENABLED` | Включить вход через Google |
| `AUTH_GOOGLE_CLIENT_ID` | Client ID Google OAuth |
| `AUTH_GOOGLE_CLIENT_SECRET` | Client Secret Google OAuth |
| `AUTH_GOOGLE_CALLBACK_URL` | URL обратного вызова Google (`/auth/google/redirect`) |
| `AUTH_GOOGLE_APIS_CALLBACK_URL` | URL обратного вызова Google APIs (`/auth/google-apis/get-access-token`) |
| `AUTH_MICROSOFT_ENABLED` | Включить вход через Microsoft |
| `AUTH_MICROSOFT_CLIENT_ID` | Client ID Azure AD |
| `AUTH_MICROSOFT_CLIENT_SECRET` | Client Secret Azure AD |
| `AUTH_MICROSOFT_CALLBACK_URL` | URL обратного вызова Microsoft (`/auth/microsoft/redirect`) |
| `AUTH_MICROSOFT_APIS_CALLBACK_URL` | URL обратного вызова Microsoft APIs |

### 1.5. Почта (Email / IMAP / SMTP)

| Переменная | Описание |
|---|---|
| `MESSAGING_PROVIDER_GMAIL_ENABLED` | Включить Gmail как провайдер сообщений |
| `MESSAGING_PROVIDER_MICROSOFT_ENABLED` | Включить Microsoft как провайдер сообщений |
| `IS_IMAP_SMTP_CALDAV_ENABLED` | Включить IMAP/SMTP/CalDAV |
| `IS_EMAIL_VERIFICATION_REQUIRED` | Требовать подтверждение email |
| `EMAIL_FROM_ADDRESS` | Адрес отправителя (напр. `contact@yourdomain.com`) |
| `EMAIL_SYSTEM_ADDRESS` | Системный адрес (напр. `system@yourdomain.com`) |
| `EMAIL_FROM_NAME` | Имя отправителя |
| `EMAIL_DRIVER` | Драйвер отправки: `LOGGER` (лог) / `smtp` |
| `EMAIL_SMTP_HOST` | SMTP-хост |
| `EMAIL_SMTP_PORT` | SMTP-порт |
| `EMAIL_SMTP_USER` | SMTP-пользователь |
| `EMAIL_SMTP_PASSWORD` | SMTP-пароль |

### 1.6. Календарь

| Переменная | Описание |
|---|---|
| `CALENDAR_PROVIDER_GOOGLE_ENABLED` | Включить Google Calendar |
| `CALENDAR_PROVIDER_MICROSOFT_ENABLED` | Включить Microsoft Calendar |

### 1.7. Хранилище файлов

| Переменная | По умолчанию | Описание |
|---|---|---|
| `STORAGE_TYPE` | `local` | Тип хранилища: `local` или `s3` |
| `STORAGE_LOCAL_PATH` | `.local-storage` | Путь для локального хранилища |
| `STORAGE_S3_REGION` | — | Регион S3 (напр. `eu-west3`) |
| `STORAGE_S3_NAME` | — | Имя S3-бакета |
| `STORAGE_S3_ENDPOINT` | — | Эндпоинт S3 (для S3-совместимых хранилищ) |

### 1.8. Биллинг

| Переменная | Описание |
|---|---|
| `IS_BILLING_ENABLED` | Включить биллинг |
| `BILLING_PLAN_REQUIRED_LINK` | Ссылка на тарифный план (Stripe) |

### 1.9. Логирование и мониторинг

| Переменная | Описание |
|---|---|
| `LOGGER_DRIVER` | Драйвер логирования: `CONSOLE` |
| `LOGGER_IS_BUFFER_ENABLED` | Включить буферизацию логов |
| `LOG_LEVELS` | Уровни логирования: `error,warn` |
| `EXCEPTION_HANDLER_DRIVER` | Драйвер обработки исключений: `sentry` |
| `SENTRY_DSN` | DSN для Sentry (бэкенд) |
| `SENTRY_FRONT_DSN` | DSN для Sentry (фронтенд) |
| `SENTRY_ENVIRONMENT` | Окружение Sentry |
| `METER_DRIVER` | Драйвер метрик: `opentelemetry,console` |
| `ANALYTICS_ENABLED` | Включить аналитику |
| `CLICKHOUSE_URL` | URL ClickHouse для аналитики |

### 1.10. Безопасность и rate limiting

| Переменная | Описание |
|---|---|
| `CAPTCHA_DRIVER` | Драйвер капчи |
| `CAPTCHA_SITE_KEY` | Site key капчи |
| `CAPTCHA_SECRET_KEY` | Secret key капчи |
| `API_RATE_LIMITING_TTL` | TTL для rate limiting |
| `API_RATE_LIMITING_LIMIT` | Лимит запросов |
| `PG_SSL_ALLOW_SELF_SIGNED` | Разрешить самоподписанные SSL-сертификаты для PG |
| `SSL_KEY_PATH` | Путь к SSL-ключу |
| `SSL_CERT_PATH` | Путь к SSL-сертификату |

### 1.11. Прочее

| Переменная | Описание |
|---|---|
| `CODE_INTERPRETER_TYPE` | Тип интерпретатора кода: `LOCAL` |
| `LOGIC_FUNCTION_TYPE` | Тип логических функций: `LOCAL` |
| `LOGIC_FUNCTION_LOGS_ENABLED` | Логирование логических функций |
| `SUPPORT_DRIVER` | Драйвер поддержки: `front` |
| `SUPPORT_FRONT_HMAC_KEY` | HMAC-ключ для Front chat |
| `SUPPORT_FRONT_CHAT_ID` | ID чата Front |
| `CHROME_EXTENSION_ID` | ID Chrome-расширения |
| `ENTERPRISE_KEY` | Ключ enterprise-лицензии |
| `CLOUDFLARE_API_KEY` | API-ключ Cloudflare |
| `CLOUDFLARE_ZONE_ID` | ID зоны Cloudflare |
| `CLOUDFLARE_WEBHOOK_SECRET` | Секрет вебхука Cloudflare |
| `HTTP_TOOL_SAFE_MODE_ENABLED` | Безопасный режим HTTP-инструментов |
| `ALLOW_REQUESTS_TO_TWENTY_ICONS` | Разрешить запросы к иконкам Twenty |
| `WORKSPACE_INACTIVE_DAYS_BEFORE_NOTIFICATION` | Дней до уведомления о неактивности (7) |
| `WORKSPACE_INACTIVE_DAYS_BEFORE_SOFT_DELETION` | Дней до мягкого удаления (14) |
| `WORKSPACE_INACTIVE_DAYS_BEFORE_DELETION` | Дней до полного удаления (21) |

### 1.12. Docker-специфичные переменные

| Переменная | По умолчанию | Описание |
|---|---|---|
| `TAG` | `latest` | Версия Docker-образа |
| `PG_DATABASE_USER` | `postgres` | Пользователь PostgreSQL |
| `PG_DATABASE_PASSWORD` | `postgres` | Пароль PostgreSQL |
| `PG_DATABASE_HOST` | `db` | Хост PostgreSQL (имя сервиса в docker-compose) |
| `PG_DATABASE_PORT` | `5432` | Порт PostgreSQL |
| `PG_DATABASE_NAME` | `default` | Имя базы данных |

---

## 2. Docker-конфигурация для production

Источник: `packages/twenty-docker/docker-compose.yml`

### 2.1. Сервисы

Docker-compose определяет **4 сервиса**:

#### Server (основной API-сервер)
- **Образ:** `twentycrm/twenty:${TAG:-latest}`
- **Порт:** `3000:3000`
- **Volume:** `server-local-data` -> `/app/packages/twenty-server/.local-storage`
- **Healthcheck:** `curl --fail http://localhost:3000/healthz` (интервал 5с, 20 попыток)
- **Зависимости:** `db` (healthy), `redis` (healthy)
- **Перезапуск:** always

#### Worker (фоновые задачи)
- **Образ:** тот же `twentycrm/twenty:${TAG:-latest}`
- **Команда:** `yarn worker:prod`
- **Volume:** общий с server (`server-local-data`)
- **Ключевое:** `DISABLE_DB_MIGRATIONS=true`, `DISABLE_CRON_JOBS_REGISTRATION=true` (миграции и cron запускаются на server)
- **Зависимости:** `db` (healthy), `server` (healthy)
- **Перезапуск:** always

#### Database (PostgreSQL)
- **Образ:** `postgres:16`
- **Volume:** `db-data` -> `/var/lib/postgresql/data`
- **Healthcheck:** `pg_isready`
- **Перезапуск:** always

#### Redis
- **Образ:** `redis`
- **Политика памяти:** `noeviction` (не удалять ключи при заполнении памяти)
- **Healthcheck:** `redis-cli ping`
- **Перезапуск:** always

### 2.2. Volumes

- `db-data` — данные PostgreSQL (persistent)
- `server-local-data` — локальное файловое хранилище (общий для server и worker)

### 2.3. Порядок запуска

```
db (healthy) + redis (healthy) → server (healthy) → worker
```

### 2.4. Минимальная конфигурация для запуска

Создать `.env` файл:
```bash
TAG=latest
SERVER_URL=https://crm.yourdomain.com
APP_SECRET=$(openssl rand -base64 32)
STORAGE_TYPE=local
# Для production рекомендуется задать собственные пароли:
PG_DATABASE_PASSWORD=strong_password_here
```

Запуск:
```bash
docker compose up -d
```

---

## 3. Архитектура Twenty

Источник: `.cursor/rules/architecture.mdc`

### 3.1. Технологический стек

| Слой | Технологии |
|---|---|
| **Фронтенд** | React 18, TypeScript, Jotai (state management), Styled Components / Linaria, Vite |
| **Бэкенд** | NestJS, TypeORM, PostgreSQL 16, Redis, GraphQL (Yoga) |
| **Монорепо** | Nx workspace + Yarn 4 |
| **Node.js** | ^24.5.0 |

### 3.2. Структура пакетов

```
packages/
├── twenty-front/     # React-приложение (фронтенд)
├── twenty-server/    # NestJS API (бэкенд + worker)
├── twenty-ui/        # Переиспользуемые UI-компоненты
├── twenty-shared/    # Общие типы и утилиты
├── twenty-emails/    # Шаблоны email
└── twenty-docs/      # Документация (Mintlify)
```

### 3.3. Ключевые принципы разработки

1. **Только functional components** — class components запрещены
2. **Только named exports** — default exports запрещены
3. **Types вместо interfaces** — кроме расширения сторонних типов
4. **String literals вместо enum** — кроме GraphQL-перечислений
5. **Тип `any` запрещён**
6. **Event handlers вместо useEffect** для обновлений состояния
7. **Тонкие компоненты:** рендер -> хуки (оркестрация) -> сервисы (логика)
8. **SSOT:** типы в `types.ts`, константы в `constants.ts`

---

## 4. Работа с миграциями БД

Источник: `.cursor/rules/server-migrations.mdc`

### 4.1. Типы миграций

В Twenty два уровня миграций:

1. **Core-миграции (TypeORM)** — изменения в системных таблицах (metadata, auth и т.д.)
2. **Workspace-миграции** — изменения в таблицах workspace (через систему syncable entities)

### 4.2. Core-миграции (TypeORM)

#### Когда нужна миграция
При любом изменении файла `*.entity.ts` в `packages/twenty-server/src` необходимо сгенерировать миграцию.

#### Генерация миграции

```bash
npx nx run twenty-server:typeorm migration:generate \
  src/database/typeorm/core/migrations/common/[name] \
  -d src/database/typeorm/core/core.datasource.ts
```

Заменить `[name]` на описательное имя в kebab-case (напр. `add-agent-turn-evaluation`).

#### Правила

| Правило | Описание |
|---|---|
| Генерация, не ручное редактирование | TypeORM сам определяет изменения из entity-файлов |
| Ручные правки — только при необходимости | Для бэкфилов данных или сложных constraint'ов |
| DDL отдельно от data-миграций | Не смешивать изменения схемы с массовыми миграциями данных |
| `up` и `down` обязательны | Миграция должна быть обратимой |
| Не удалять закоммиченные миграции | Кроме pre-release веток |

#### Применение миграций

```bash
# Разработка: сброс БД с применением всех миграций
npx nx database:reset twenty-server

# Production: применить только новые миграции
npx nx run twenty-server:database:migrate:prod
```

---

## 5. Создание syncable entities

Источник: `.cursor/rules/creating-syncable-entity.mdc`

### 5.1. Что такое syncable entity

Syncable entity — это метаданная сущность, которая:
- Имеет **`universalIdentifier`** — уникальный идентификатор для синхронизации между workspace'ами
- Имеет **`applicationId`** — привязка к приложению (Twenty Standard или Custom)
- Участвует в **системе workspace-миграций** — создание/обновление/удаление через пайплайн миграций
- **Кешируется как flat entity** — денормализованное представление для валидации и обнаружения изменений

Примеры: `skill`, `agent`, `view`, `viewField`, `role`, `pageLayout` и т.д.

### 5.2. Архитектура

```
Input DTO → Transform → Universal Flat Entity → Builder/Validator → Runner → Database
                              ↓
                        Cache Service
```

**Ключевые компоненты:**
- **TypeORM Entity** — модель БД, наследует `SyncableEntity`
- **Flat Entity** — денормализованный тип (без связей, даты как строки) — для кеширования
- **Universal Flat Entity** — flat entity с FK, замаппленными на universal identifiers — для миграций
- **Transform Utils** — конвертация DTO в universal flat entities
- **Builder/Validator** — валидация и создание действий миграции
- **Runner** — выполнение действий над БД

### 5.3. Шаги реализации

#### Шаг 1. Фундамент: типы и константы
- Создать TypeORM entity (extends `SyncableEntity`)
- Определить flat entity types
- Определить action types (universal + flat)
- Зарегистрировать в **5 центральных константах**

#### Шаг 2. Data layer: кеш и трансформация
- Создать cache service
- Создать конвертацию entity -> flat
- Создать transform utils для input
- Обработать разрешение foreign keys

#### Шаг 3. Бизнес-логика: builder и валидация
- Создать validator service (никогда не бросает исключений, никогда не мутирует данные)
- Создать builder service
- **Подключить в orchestrator** (критически важно!)

#### Шаг 4. Выполнение: runner и actions
- Создать обработчики действий (create/update/delete)
- Реализовать методы транспиляции
- Создать утилиты конвертации universal -> flat

#### Шаг 5. Сборка: интеграция
- Зарегистрировать в **3 NestJS-модулях**
- Создать service и resolver слои
- Использовать exception interceptor

#### Шаг 6. Тестирование (ОБЯЗАТЕЛЬНО)
- Создать тестовые утилиты
- Написать failing-тесты (все исключения валидатора)
- Написать success-тесты (все CRUD-операции)
- Использовать snapshot-тестирование

### 5.4. Принципы проектирования слоёв

| Слой | Ответственность | Может бросать исключения? | Может мутировать? |
|---|---|---|---|
| Transform Utils | Трансформация данных | Да (валидация input) | Нет (создаёт новое) |
| Validator | Валидация бизнес-правил | **Нет** (возвращает ошибки) | **Нет** |
| Builder | Создание actions | **Нет** (возвращает ошибки) | **Нет** |
| Runner | Операции с БД | Да (ошибки БД) | Да (через TypeORM) |

### 5.5. Расположение файлов

```
packages/twenty-shared/src/metadata/
└── all-metadata-name.constant.ts        # Регистрация имени

packages/twenty-server/src/engine/metadata-modules/
├── my-entity/                           # Шаг 1: entity
│   └── entities/
├── flat-my-entity/                      # Шаги 1-2: flat entity
│   ├── types/
│   ├── constants/
│   ├── services/
│   └── utils/
└── flat-entity/constant/               # Шаг 1: центральные реестры
    ├── all-entity-properties-configuration-by-metadata-name.constant.ts
    ├── all-one-to-many-metadata-relations.constant.ts
    ├── all-many-to-one-metadata-foreign-key.constant.ts
    └── all-many-to-one-metadata-relations.constant.ts

packages/twenty-server/src/engine/workspace-manager/workspace-migration/
├── workspace-migration-builder/         # Шаг 3: builder + validator
│   ├── builders/my-entity/
│   └── validators/services/
└── workspace-migration-runner/          # Шаг 4: runner
    └── action-handlers/my-entity/
```

### 5.6. Частые ошибки

1. Забыть подключить builder в orchestrator service
2. Не зарегистрировать во всех 3 модулях (builder, validators, action handlers)
3. Неправильно задать `universalIdentifier` в конвертации entity -> flat
4. Использовать обычные ID вместо universal identifiers в transform utils
5. Бросать исключения в validators/builders
6. Мутировать entity maps в validators/builders
7. Забыть обработать JSONB-свойства с `SerializedRelation`

---

## 6. Локализация и переводы

Источники: `.cursor/rules/translations.mdc`, `package.json`

### 6.1. Библиотека i18n

В Twenty используется **Lingui** (не react-i18next, несмотря на cursor rules). Актуальные зависимости:
- `@lingui/core` ^5.1.2
- `@lingui/react` ^5.1.2
- `@lingui/cli` ^5.1.2
- `@lingui/swc-plugin` ^5.11.0
- `@lingui/vite-plugin` ^5.1.2
- `@lingui/detect-locale` ^5.2.0

### 6.2. Поддерживаемые языки

- Английский (en) — основной
- Французский (fr) — вторичный
- Немецкий (de) — планируется
- Испанский (es) — планируется
- Русский — будет добавлен для CredosCRM

### 6.3. Структура файлов переводов

```
src/locales/
├── en/                        # Английские переводы
│   ├── common.json           # Общие UI-строки
│   ├── auth.json             # Аутентификация
│   ├── dashboard.json        # Дашборд
│   ├── forms.json            # Формы и валидация
│   └── errors.json           # Сообщения об ошибках
├── fr/                       # Французские переводы
│   └── ...
└── index.ts                  # Конфигурация i18n
```

### 6.4. Правила именования ключей

Использовать вложенные объекты с описательными иерархическими ключами:

```json
{
  "auth": {
    "login": {
      "title": "Sign In",
      "email": "Email Address",
      "password": "Password",
      "submit": "Sign In",
      "forgotPassword": "Forgot Password?"
    }
  }
}
```

**Запрещено:**
- Сокращения в ключах (`dash_title`, `newBtn`)
- Конкатенация переведённых строк (`statusPrefix + statusOnline`)
- Хардкод строк в компонентах

### 6.5. Интерполяция и плюрализация

**Интерполяция:**
```json
{
  "welcome": {
    "message": "Welcome back, {{name}}!"
  }
}
```

**Плюрализация:**
```json
{
  "items": {
    "count_one": "{{count}} item",
    "count_other": "{{count}} items"
  }
}
```

### 6.6. Рабочий процесс добавления переводов

1. Разработать фичу с английскими переводами
2. Использовать placeholder-ключи во время разработки
3. Финализировать ключи перед завершением фичи
4. Добавить переводы для всех поддерживаемых языков
5. Протестировать UI с разными языками
6. Предоставить контекст и скриншоты для переводчиков

### 6.7. Валидация

- Использовать TypeScript для проверки ключей переводов
- Автоматически проверять отсутствующие переводы
- Валидировать параметры интерполяции
- Тестировать с самыми длинными возможными переводами

---

## Приложение: Процесс контрибьюции

Источник: `.github/CONTRIBUTING.md`

1. Форкнуть репозиторий
2. Клонировать форк: `git clone https://github.com/yourusername/twenty.git`
3. Создать ветку: `git checkout -b your-branch-name`
4. Внести изменения согласно стандартам кода
5. Протестировать локально
6. Закоммитить: `git commit -m "Описание изменений"`
7. Запушить: `git push origin your-branch-name`
8. Создать Pull Request с подробным описанием
9. Пройти code review
10. Merge

**Для CredosCRM:** используем conventional commits (`feat(credos):`, `fix(credos):`) и ветки `feature/credos-<модуль>-<описание>`.
