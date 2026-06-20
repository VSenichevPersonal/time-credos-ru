# Руководство по Self-Hosting Twenty CRM

> Документ составлен на основе официальной документации Twenty CRM и исходного кода проекта.
> Применим к CredosCRM (форк Twenty CRM) с учётом наших специфик деплоя на Railway.

---

## Содержание

1. [Обзор и преимущества](#1-обзор-и-преимущества)
2. [Системные требования](#2-системные-требования)
3. [Установка через Docker Compose](#3-установка-через-docker-compose)
4. [Конфигурация docker-compose.yml](#4-конфигурация-docker-composeyml)
5. [Переменные окружения (Environment Variables)](#5-переменные-окружения-environment-variables)
6. [Настройка SSL и обратного прокси](#6-настройка-ssl-и-обратного-прокси)
7. [Резервное копирование и восстановление](#7-резервное-копирование-и-восстановление)
8. [Обновление версий](#8-обновление-версий)
9. [Устранение неполадок (Troubleshooting)](#9-устранение-неполадок-troubleshooting)
10. [Облачные провайдеры](#10-облачные-провайдеры)
11. [Рекомендации для CredosCRM](#11-рекомендации-для-credoscrm)

---

## 1. Обзор и преимущества

Twenty CRM поддерживает self-hosted развёртывание, которое даёт:

- **Контроль над данными** — все данные CRM хранятся на ваших серверах
- **Соответствие требованиям** — выполнение регуляторных требований по локализации данных (актуально для ФЗ-152)
- **Кастомизация** — полный доступ к модификации и расширению платформы

Варианты развёртывания:
- **Docker Compose** — быстрый запуск в одну команду
- **Облачные провайдеры** — AWS, GCP, Azure, Railway и другие

---

## 2. Системные требования

| Параметр | Минимум | Рекомендация |
|----------|---------|-------------|
| RAM | 2 GB | 4+ GB |
| CPU | 1 ядро | 2+ ядра |
| Диск | 10 GB | 20+ GB (зависит от объёма данных) |
| ПО | Docker + Docker Compose (актуальные версии) | — |
| Node.js | ^24.5.0 (для сборки из исходников) | — |
| PostgreSQL | 16 | 16 |
| Redis | Последняя стабильная версия | — |

> **Важно:** При объёме RAM менее 2 GB процессы могут аварийно завершаться (crash).

---

## 3. Установка через Docker Compose

### Вариант 1: Быстрая установка (one-line script)

```bash
bash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)
```

Для конкретной версии:
```bash
VERSION=vx.y.z BRANCH=branch-name bash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)
```

### Вариант 2: Ручная установка

#### Шаг 1. Настройка окружения (.env)

Скачайте пример конфигурации:
```bash
curl -o .env https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/.env.example
```

Сгенерируйте секретный ключ:
```bash
openssl rand -base64 32
```

Отредактируйте `.env`:
```ini
APP_SECRET=<сгенерированная_строка>
PG_DATABASE_PASSWORD=<надёжный_пароль_без_спецсимволов>
SERVER_URL=http://localhost:3000
```

> **Важно:** Пароль БД (`PG_DATABASE_PASSWORD`) не должен содержать спецсимволы — это может привести к ошибкам парсинга URL подключения.

#### Шаг 2. Скачайте docker-compose.yml

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/docker-compose.yml
```

#### Шаг 3. Запуск сервисов

```bash
docker compose up -d
```

#### Шаг 4. Проверка доступности

Локально: откройте http://localhost:3000

На сервере:
```bash
curl http://localhost:3000
```

---

## 4. Конфигурация docker-compose.yml

Полный файл `docker-compose.yml` включает 4 сервиса:

### Сервисы

```yaml
name: twenty

services:
  # === Основной сервер (Server) ===
  server:
    image: twentycrm/twenty:${TAG:-latest}
    volumes:
      - server-local-data:/app/packages/twenty-server/.local-storage
    ports:
      - "3000:3000"
    environment:
      NODE_PORT: 3000
      PG_DATABASE_URL: postgres://${PG_DATABASE_USER:-postgres}:${PG_DATABASE_PASSWORD:-postgres}@${PG_DATABASE_HOST:-db}:${PG_DATABASE_PORT:-5432}/default
      SERVER_URL: ${SERVER_URL}
      REDIS_URL: ${REDIS_URL:-redis://redis:6379}
      DISABLE_DB_MIGRATIONS: ${DISABLE_DB_MIGRATIONS}
      DISABLE_CRON_JOBS_REGISTRATION: ${DISABLE_CRON_JOBS_REGISTRATION}
      STORAGE_TYPE: ${STORAGE_TYPE}
      STORAGE_S3_REGION: ${STORAGE_S3_REGION}
      STORAGE_S3_NAME: ${STORAGE_S3_NAME}
      STORAGE_S3_ENDPOINT: ${STORAGE_S3_ENDPOINT}
      APP_SECRET: ${APP_SECRET:-replace_me_with_a_random_string}
      # --- Google интеграция (раскомментировать при необходимости) ---
      # MESSAGING_PROVIDER_GMAIL_ENABLED: ${MESSAGING_PROVIDER_GMAIL_ENABLED}
      # CALENDAR_PROVIDER_GOOGLE_ENABLED: ${CALENDAR_PROVIDER_GOOGLE_ENABLED}
      # AUTH_GOOGLE_CLIENT_ID: ${AUTH_GOOGLE_CLIENT_ID}
      # AUTH_GOOGLE_CLIENT_SECRET: ${AUTH_GOOGLE_CLIENT_SECRET}
      # AUTH_GOOGLE_CALLBACK_URL: ${AUTH_GOOGLE_CALLBACK_URL}
      # AUTH_GOOGLE_APIS_CALLBACK_URL: ${AUTH_GOOGLE_APIS_CALLBACK_URL}
      # --- Microsoft интеграция ---
      # CALENDAR_PROVIDER_MICROSOFT_ENABLED: ${CALENDAR_PROVIDER_MICROSOFT_ENABLED}
      # MESSAGING_PROVIDER_MICROSOFT_ENABLED: ${MESSAGING_PROVIDER_MICROSOFT_ENABLED}
      # AUTH_MICROSOFT_ENABLED: ${AUTH_MICROSOFT_ENABLED}
      # AUTH_MICROSOFT_CLIENT_ID: ${AUTH_MICROSOFT_CLIENT_ID}
      # AUTH_MICROSOFT_CLIENT_SECRET: ${AUTH_MICROSOFT_CLIENT_SECRET}
      # AUTH_MICROSOFT_CALLBACK_URL: ${AUTH_MICROSOFT_CALLBACK_URL}
      # AUTH_MICROSOFT_APIS_CALLBACK_URL: ${AUTH_MICROSOFT_APIS_CALLBACK_URL}
      # --- Email (SMTP) ---
      # EMAIL_FROM_ADDRESS: ${EMAIL_FROM_ADDRESS:-contact@yourdomain.com}
      # EMAIL_FROM_NAME: ${EMAIL_FROM_NAME:-"John from YourDomain"}
      # EMAIL_SYSTEM_ADDRESS: ${EMAIL_SYSTEM_ADDRESS:-system@yourdomain.com}
      # EMAIL_DRIVER: ${EMAIL_DRIVER:-smtp}
      # EMAIL_SMTP_HOST: ${EMAIL_SMTP_HOST:-smtp.gmail.com}
      # EMAIL_SMTP_PORT: ${EMAIL_SMTP_PORT:-465}
      # EMAIL_SMTP_USER: ${EMAIL_SMTP_USER:-}
      # EMAIL_SMTP_PASSWORD: ${EMAIL_SMTP_PASSWORD:-}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: curl --fail http://localhost:3000/healthz
      interval: 5s
      timeout: 5s
      retries: 20
    restart: always

  # === Фоновый обработчик (Worker) ===
  worker:
    image: twentycrm/twenty:${TAG:-latest}
    volumes:
      - server-local-data:/app/packages/twenty-server/.local-storage
    command: ["yarn", "worker:prod"]
    environment:
      # Те же переменные, что и у server, плюс:
      DISABLE_DB_MIGRATIONS: "true"          # миграции уже выполнены на server
      DISABLE_CRON_JOBS_REGISTRATION: "true"  # cron уже запущен на server
    depends_on:
      db:
        condition: service_healthy
      server:
        condition: service_healthy
    restart: always

  # === База данных (PostgreSQL 16) ===
  db:
    image: postgres:16
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${PG_DATABASE_NAME:-default}
      POSTGRES_PASSWORD: ${PG_DATABASE_PASSWORD:-postgres}
      POSTGRES_USER: ${PG_DATABASE_USER:-postgres}
    healthcheck:
      test: pg_isready -U ${PG_DATABASE_USER:-postgres} -h localhost -d postgres
      interval: 5s
      timeout: 5s
      retries: 10
    restart: always

  # === Кэш (Redis) ===
  redis:
    image: redis
    restart: always
    command: ["--maxmemory-policy", "noeviction"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  db-data:
  server-local-data:
```

### Порядок запуска

1. **db** (PostgreSQL) и **redis** запускаются первыми
2. **server** стартует после прохождения health check БД и Redis
3. **worker** стартует после прохождения health check server

### Volumes (постоянное хранилище)

| Volume | Назначение |
|--------|-----------|
| `db-data` | Данные PostgreSQL |
| `server-local-data` | Локальное хранилище файлов (вложения, аватары и т.д.) |

---

## 5. Переменные окружения (Environment Variables)

### 5.1. Основные (обязательные для self-hosting)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `APP_SECRET` | — | Секретный ключ приложения. Генерировать: `openssl rand -base64 32` |
| `SERVER_URL` | `http://localhost:3000` | Базовый URL сервера (включая протокол и порт) |
| `NODE_PORT` | `3000` | Порт Node.js сервера |
| `NODE_ENV` | `production` | Окружение: `development`, `production` |
| `FRONTEND_URL` | — | URL фронтенд-приложения (если отличается от SERVER_URL) |
| `APP_VERSION` | — | Версия сервера Twenty |

### 5.2. База данных (PostgreSQL)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `PG_DATABASE_URL` | — | **[sensitive]** Полный URL подключения: `postgres://user:pass@host:port/dbname` |
| `PG_DATABASE_REPLICA_URL` | — | **[sensitive]** URL реплики БД (для read-only нагрузки) |
| `PG_SSL_ALLOW_SELF_SIGNED` | `false` | Разрешить самоподписанные SSL-сертификаты БД |
| `PG_ENABLE_POOL_SHARING` | `true` | Общий пул соединений между tenant-ами |
| `PG_POOL_MAX_CONNECTIONS` | `10` | Максимум клиентов в пуле соединений |
| `PG_POOL_IDLE_TIMEOUT_MS` | `600000` | Таймаут простоя соединения в пуле (мс) |
| `PG_POOL_ALLOW_EXIT_ON_IDLE` | `true` | Разрешить закрытие простаивающих соединений |
| `PG_DATABASE_PRIMARY_TIMEOUT_MS` | `10000` | Таймаут запросов к primary БД (мс) |
| `PG_DATABASE_REPLICA_TIMEOUT_MS` | `10000` | Таймаут запросов к реплике БД (мс) |
| `DATABASE_STATEMENT_TIMEOUT_MS` | `15000` | Клиентский таймаут запросов к core пулу (мс) |

Для Docker Compose используются также вспомогательные переменные:

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `PG_DATABASE_USER` | `postgres` | Пользователь БД |
| `PG_DATABASE_PASSWORD` | `postgres` | Пароль БД (без спецсимволов!) |
| `PG_DATABASE_HOST` | `db` | Хост БД |
| `PG_DATABASE_PORT` | `5432` | Порт БД |

### 5.3. Redis

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `REDIS_URL` | `redis://redis:6379` | **[sensitive]** URL подключения Redis (кэш + очереди) |
| `REDIS_QUEUE_URL` | — | **[sensitive]** Отдельный Redis для очередей (с другой eviction policy). Для большинства self-hosted установок не требуется |
| `CACHE_STORAGE_TTL` | `604800` (7 дней) | TTL кэша в секундах |

### 5.4. Хранилище файлов (Storage)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `STORAGE_TYPE` | `local` | Тип хранилища: `local` или `s3` |
| `STORAGE_LOCAL_PATH` | `.local-storage` | Путь для локального хранилища |
| `STORAGE_S3_REGION` | — | Регион S3 (напр. `eu-west-3`) |
| `STORAGE_S3_NAME` | — | Имя S3 bucket |
| `STORAGE_S3_ENDPOINT` | — | Endpoint S3 (для MinIO, Yandex Object Storage и др.) |
| `STORAGE_S3_ACCESS_KEY_ID` | — | **[sensitive]** Access Key ID для S3 |
| `STORAGE_S3_SECRET_ACCESS_KEY` | — | **[sensitive]** Secret Access Key для S3 |

### 5.5. Аутентификация

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `AUTH_PASSWORD_ENABLED` | `true` | Включить/выключить аутентификацию по паролю |
| `IS_EMAIL_VERIFICATION_REQUIRED` | `false` | Требовать подтверждение email при регистрации |
| `SIGN_IN_PREFILLED` | `false` | Предзаполнять email в форме логина (только для разработки) |

#### Токены

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `ACCESS_TOKEN_EXPIRES_IN` | `30m` | Время жизни access token |
| `REFRESH_TOKEN_EXPIRES_IN` | `60d` | Время жизни refresh token |
| `REFRESH_TOKEN_REUSE_GRACE_PERIOD` | `1m` | Grace period для параллельного использования refresh token |
| `LOGIN_TOKEN_EXPIRES_IN` | `15m` | Время жизни login token |
| `FILE_TOKEN_EXPIRES_IN` | `1d` | Время жизни file token |
| `INVITATION_TOKEN_EXPIRES_IN` | `30d` | Время жизни invitation token |
| `SHORT_TERM_TOKEN_EXPIRES_IN` | `5m` | Время жизни short-term token |
| `WORKSPACE_AGNOSTIC_TOKEN_EXPIRES_IN` | `30m` | Время жизни workspace-agnostic token |
| `EMAIL_VERIFICATION_TOKEN_EXPIRES_IN` | `1h` | Время жизни токена подтверждения email |
| `PASSWORD_RESET_TOKEN_EXPIRES_IN` | `5m` | Время жизни токена сброса пароля |
| `APPLICATION_ACCESS_TOKEN_EXPIRES_IN` | `30m` | Время жизни application access token |
| `APPLICATION_REFRESH_TOKEN_EXPIRES_IN` | `60d` | Время жизни application refresh token |

### 5.6. Google интеграция

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `AUTH_GOOGLE_ENABLED` | `false` | Включить Google SSO |
| `AUTH_GOOGLE_CLIENT_ID` | — | Client ID из Google Console |
| `AUTH_GOOGLE_CLIENT_SECRET` | — | **[sensitive]** Client Secret |
| `AUTH_GOOGLE_CALLBACK_URL` | — | Callback URL для аутентификации |
| `AUTH_GOOGLE_APIS_CALLBACK_URL` | — | Callback URL для Google APIs |
| `MESSAGING_PROVIDER_GMAIL_ENABLED` | `false` | Включить интеграцию с Gmail |
| `CALENDAR_PROVIDER_GOOGLE_ENABLED` | `false` | Включить интеграцию с Google Calendar |

### 5.7. Microsoft интеграция

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `AUTH_MICROSOFT_ENABLED` | `false` | Включить Microsoft SSO |
| `AUTH_MICROSOFT_CLIENT_ID` | — | Client ID из Azure AD |
| `AUTH_MICROSOFT_CLIENT_SECRET` | — | **[sensitive]** Client Secret |
| `AUTH_MICROSOFT_CALLBACK_URL` | — | Callback URL для аутентификации |
| `AUTH_MICROSOFT_APIS_CALLBACK_URL` | — | Callback URL для Microsoft APIs |
| `MESSAGING_PROVIDER_MICROSOFT_ENABLED` | `false` | Включить интеграцию с Microsoft почтой |
| `CALENDAR_PROVIDER_MICROSOFT_ENABLED` | `false` | Включить интеграцию с Microsoft Calendar |

### 5.8. Email (SMTP)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `EMAIL_DRIVER` | `logger` | Драйвер email: `logger` (лог в консоль) или `smtp` |
| `EMAIL_FROM_ADDRESS` | `noreply@yourdomain.com` | Адрес отправителя |
| `EMAIL_FROM_NAME` | `Felix from Twenty` | Имя отправителя |
| `EMAIL_SYSTEM_ADDRESS` | `system@yourdomain.com` | Адрес для системных уведомлений |
| `EMAIL_SMTP_HOST` | — | SMTP хост (напр. `smtp.gmail.com`) |
| `EMAIL_SMTP_PORT` | `587` | SMTP порт |
| `EMAIL_SMTP_USER` | — | **[sensitive]** SMTP логин |
| `EMAIL_SMTP_PASSWORD` | — | **[sensitive]** SMTP пароль |
| `EMAIL_SMTP_NO_TLS` | `false` | Отключить TLS для SMTP (небезопасно) |

### 5.9. IMAP/SMTP/CalDAV

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `IS_IMAP_SMTP_CALDAV_ENABLED` | `true` | Включить/выключить IMAP/SMTP/CalDAV интеграцию |

### 5.10. AI / LLM

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `DEFAULT_AI_SPEED_MODEL_ID` | — | Список моделей AI для быстрых операций (через запятую, приоритет) |
| `DEFAULT_AI_PERFORMANCE_MODEL_ID` | — | Список моделей AI для качественных операций (через запятую, приоритет) |
| `OPENAI_API_KEY` | — | **[sensitive]** API ключ OpenAI |
| `ANTHROPIC_API_KEY` | — | **[sensitive]** API ключ Anthropic |
| `OPENAI_COMPATIBLE_BASE_URL` | — | Base URL для OpenAI-совместимых провайдеров (напр. Ollama) |
| `OPENAI_COMPATIBLE_MODEL_NAMES` | — | Имена моделей через запятую (напр. `llama3.1, mistral`) |
| `OPENAI_COMPATIBLE_API_KEY` | — | **[sensitive]** API ключ для OpenAI-совместимого провайдера |
| `XAI_API_KEY` | — | **[sensitive]** API ключ xAI |
| `GROQ_API_KEY` | — | **[sensitive]** API ключ Groq |
| `GOOGLE_API_KEY` | — | **[sensitive]** API ключ Google AI (Gemini) |
| `MISTRAL_API_KEY` | — | **[sensitive]** API ключ Mistral AI |
| `AI_AUTO_ENABLE_NEW_MODELS` | `true` | Автоматически включать новые модели для всех workspace |
| `AI_DISABLED_MODEL_IDS` | `[]` | ID моделей для отключения (при `AI_AUTO_ENABLE_NEW_MODELS=true`) |
| `AI_ENABLED_MODEL_IDS` | `[]` | ID моделей для включения (при `AI_AUTO_ENABLE_NEW_MODELS=false`) |

#### AWS Bedrock

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `AWS_BEDROCK_REGION` | — | Регион AWS для Bedrock (напр. `us-east-1`) |
| `AWS_BEDROCK_ACCESS_KEY_ID` | — | **[sensitive]** Access Key ID |
| `AWS_BEDROCK_SECRET_ACCESS_KEY` | — | **[sensitive]** Secret Access Key |
| `AWS_BEDROCK_SESSION_TOKEN` | — | **[sensitive]** Session Token (для IAM role-based auth) |

### 5.11. Workspace

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `IS_MULTIWORKSPACE_ENABLED` | `false` | Включить мультитенантность |
| `DEFAULT_SUBDOMAIN` | `app` | Субдомен по умолчанию (при мультитенантности) |
| `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS` | `true` | Только server admin может создавать workspace |
| `WORKSPACE_INACTIVE_DAYS_BEFORE_NOTIFICATION` | `7` | Дней неактивности до предупреждения об удалении |
| `WORKSPACE_INACTIVE_DAYS_BEFORE_SOFT_DELETION` | `14` | Дней неактивности до soft delete |
| `WORKSPACE_INACTIVE_DAYS_BEFORE_DELETION` | `21` | Дней неактивности до полного удаления |
| `MAX_NUMBER_OF_WORKSPACES_DELETED_PER_EXECUTION` | `5` | Макс. количество удалений workspace за одну итерацию |

### 5.12. API Rate Limiting

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `API_RATE_LIMITING_SHORT_TTL_IN_MS` | `1000` | Окно короткого rate limit (мс) |
| `API_RATE_LIMITING_SHORT_LIMIT` | `100` | Макс. запросов в коротком окне |
| `API_RATE_LIMITING_LONG_TTL_IN_MS` | `60000` | Окно длинного rate limit (мс) |
| `API_RATE_LIMITING_LONG_LIMIT` | `100` | Макс. запросов в длинном окне |
| `MUTATION_MAXIMUM_AFFECTED_RECORDS` | `100` | Макс. записей, затронутых одной мутацией |

### 5.13. GraphQL

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `GRAPHQL_MAX_FIELDS` | `2000` | Макс. полей в GQL-запросе |
| `GRAPHQL_MAX_ROOT_RESOLVERS` | `20` | Макс. root resolvers в GQL-запросе |
| `COMMON_QUERY_COMPLEXITY_LIMIT` | `2000` | Макс. complexity для Common API |

### 5.14. Workflow Throttling

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `WORKFLOW_EXEC_SOFT_THROTTLE_LIMIT` | `100` | Мягкий лимит (оставшиеся ставятся в очередь) |
| `WORKFLOW_EXEC_SOFT_THROTTLE_TTL` | `60000` | TTL мягкого лимита (мс) |
| `WORKFLOW_EXEC_HARD_THROTTLE_LIMIT` | `5000` | Жёсткий лимит (оставшиеся отмечаются как failed) |
| `WORKFLOW_EXEC_HARD_THROTTLE_TTL` | `3600000` | TTL жёсткого лимита (мс) |

### 5.15. Logic Functions / Serverless

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `LOGIC_FUNCTION_TYPE` | — | Тип исполнения: `local` или `lambda` |
| `LOGIC_FUNCTION_LOGS_ENABLED` | — | Показывать логи logic functions в терминале |
| `LOGIC_FUNCTION_EXEC_THROTTLE_LIMIT` | `1000` | Throttle limit для logic functions |
| `LOGIC_FUNCTION_EXEC_THROTTLE_TTL` | `60000` | TTL throttle для logic functions (мс) |
| `LOGIC_FUNCTION_LAMBDA_REGION` | — | Регион AWS Lambda |
| `LOGIC_FUNCTION_LAMBDA_ROLE` | — | IAM роль для Lambda |
| `LOGIC_FUNCTION_LAMBDA_ACCESS_KEY_ID` | — | **[sensitive]** Access Key для Lambda |
| `LOGIC_FUNCTION_LAMBDA_SECRET_ACCESS_KEY` | — | **[sensitive]** Secret Key для Lambda |

### 5.16. Логирование и мониторинг

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `LOG_LEVELS` | `['log', 'error', 'warn']` | Уровни логирования |
| `LOGGER_DRIVER` | `console` | Драйвер логирования |
| `LOGGER_IS_BUFFER_ENABLED` | `true` | Буферизация логов перед отправкой |
| `EXCEPTION_HANDLER_DRIVER` | — | Обработчик исключений: `console` или `sentry` |
| `SENTRY_DSN` | — | **[sensitive]** DSN для Sentry (backend) |
| `SENTRY_FRONT_DSN` | — | **[sensitive]** DSN для Sentry (frontend) |
| `SENTRY_ENVIRONMENT` | — | Имя окружения для Sentry |
| `METER_DRIVER` | `[]` | Драйвер метрик: `opentelemetry` или `console` |
| `OTLP_COLLECTOR_ENDPOINT_URL` | — | Endpoint OpenTelemetry Collector |
| `TYPEORM_LOGGING` | `['error']` | Опции логирования TypeORM |

### 5.17. Телеметрия

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `TELEMETRY_ENABLED` | `true` | Включить/выключить отправку телеметрии |
| `ANALYTICS_ENABLED` | `false` | Включить/выключить аналитику |
| `CLICKHOUSE_URL` | — | **[sensitive]** Хост ClickHouse для аналитики |

### 5.18. Безопасность

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `OUTBOUND_HTTP_SAFE_MODE_ENABLED` | `true` | Блокировка запросов к приватным IP (защита SSRF) |
| `ALLOW_REQUESTS_TO_TWENTY_ICONS` | `true` | Разрешить запросы к twenty-icons для иконок компаний |
| `CAPTCHA_DRIVER` | — | Драйвер captcha |
| `CAPTCHA_SITE_KEY` | — | **[sensitive]** Site key для captcha |
| `CAPTCHA_SECRET_KEY` | — | **[sensitive]** Secret key для captcha |
| `SSL_KEY_PATH` | — | Путь к SSL ключу (для local HTTPS) |
| `SSL_CERT_PATH` | — | Путь к SSL сертификату (для local HTTPS) |

### 5.19. Invitation Rate Limiting

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `INVITATION_SENDING_BY_WORKSPACE_THROTTLE_TTL_IN_MS` | `604800000` (7 дней) | TTL rate limit приглашений по workspace |
| `INVITATION_SENDING_BY_WORKSPACE_THROTTLE_LIMIT` | `500` | Макс. приглашений по workspace в окне |
| `INVITATION_SENDING_BY_EMAIL_THROTTLE_TTL_IN_MS` | `604800000` (7 дней) | TTL rate limit приглашений по email |
| `INVITATION_SENDING_BY_EMAIL_THROTTLE_LIMIT` | `10` | Макс. приглашений по email в окне |

### 5.20. Прочее

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `TAG` | `latest` | Docker image tag |
| `DISABLE_DB_MIGRATIONS` | — | Отключить автоматические миграции БД |
| `DISABLE_CRON_JOBS_REGISTRATION` | — | Отключить регистрацию cron job |
| `IS_CONFIG_VARIABLES_IN_DB_ENABLED` | `true` | Хранить config-переменные в БД |
| `IS_BILLING_ENABLED` | `false` | Включить биллинг (не нужно для self-hosted) |
| `CHROME_EXTENSION_ID` | — | ID расширения для Chrome |
| `IS_MAPS_AND_ADDRESS_AUTOCOMPLETE_ENABLED` | `false` | Включить Google Maps для автозаполнения адресов |
| `GOOGLE_MAP_API_KEY` | — | **[sensitive]** API ключ Google Maps |
| `IS_ATTACHMENT_PREVIEW_ENABLED` | `true` | Включить предпросмотр вложений |
| `PUBLIC_DOMAIN_URL` | — | Базовый URL для публичных доменов |
| `APP_REGISTRY_URL` | `https://registry.npmjs.org` | URL npm registry для app packages |
| `APP_REGISTRY_TOKEN` | — | **[sensitive]** Auth token для npm registry |
| `HEALTH_METRICS_TIME_WINDOW_IN_MINUTES` | `5` | Окно мониторинга здоровья (мин) |

### 5.21. AWS SES (для отправки email через Amazon SES)

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `AWS_SES_REGION` | — | Регион AWS SES |
| `AWS_SES_ACCESS_KEY_ID` | — | **[sensitive]** Access Key ID |
| `AWS_SES_SECRET_ACCESS_KEY` | — | **[sensitive]** Secret Access Key |
| `AWS_SES_SESSION_TOKEN` | — | **[sensitive]** Session Token |
| `AWS_SES_ACCOUNT_ID` | — | Account ID для ARN |

### 5.22. Enterprise

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `ENTERPRISE_KEY` | — | **[sensitive]** Лицензионный ключ Enterprise |
| `ENTERPRISE_VALIDITY_TOKEN` | — | **[sensitive]** Подписанный JWT токен валидности |
| `ENTERPRISE_API_URL` | `https://twenty.com/api/enterprise` | URL Enterprise API |

---

## 6. Настройка SSL и обратного прокси

SSL (HTTPS) **необходим** для корректной работы ряда браузерных API (clipboard, notifications и др.).

### Настройка SERVER_URL

**Без прокси (прямой доступ):**
```ini
SERVER_URL=http://your-domain-or-ip:3000
```

**С обратным прокси и SSL:**
```ini
SERVER_URL=https://your-domain.com
```

**С кастомным портом:**
```ini
SERVER_URL=https://your-domain.com:8443
```

### Требования к обратному прокси

- Проксировать запросы на порт `3000`
- Пробрасывать заголовки `X-Forwarded-For` и `X-Forwarded-Proto`
- Настроить SSL termination (Let's Encrypt / Cloudflare и т.д.)

После изменений перезапустить:
```bash
docker compose down
docker compose up -d
```

---

## 7. Резервное копирование и восстановление

### Создание бэкапа

```bash
docker exec twenty-postgres pg_dump -U postgres twenty > backup_$(date +%Y%m%d).sql
```

Полный бэкап всех баз (рекомендуется при обновлениях):
```bash
docker exec -it {db_container_name} pg_dumpall -U {postgres_user} > databases_backup.sql
```

### Автоматический ежедневный бэкап (crontab)

```bash
0 2 * * * docker exec twenty-postgres pg_dump -U postgres twenty > /backups/twenty_$(date +\%Y\%m\%d).sql
```

### Восстановление

```bash
docker compose stop twenty-server twenty-front
docker exec -i twenty-postgres psql -U postgres twenty < backup_20240115.sql
docker compose up -d
```

### Рекомендации

- Регулярно тестировать восстановление из бэкапов
- Хранить копии удалённо (S3, Yandex Object Storage)
- Шифровать чувствительные бэкапы
- Держать несколько поколений копий

---

## 8. Обновление версий

### Процедура обновления (Docker Compose)

1. Сделать бэкап БД (см. раздел выше)
2. Остановить сервисы:
   ```bash
   docker compose down
   ```
3. Обновить `TAG` в `.env` (рекомендуется формат `major.minor`, напр. `v0.53`):
   ```ini
   TAG=v0.60
   ```
4. Перезапустить:
   ```bash
   docker compose up -d
   ```

> **Важно:** Обновляться последовательно между версиями — не пропуская мажорные релизы. Начиная с v0.53, миграции выполняются автоматически внутри Docker-образа.

### Заметки по версиям

| Версия | Особенности |
|--------|------------|
| **v0.60** | Оптимизация metadata API. Может потребоваться: `yarn command:prod cache:flush` |
| **v0.55+** | Миграции автоматические, ручных команд не нужно |
| **v0.51-v0.52** | Требуется: `yarn database:migrate:prod` + `yarn command:prod upgrade` |
| **v0.50** | Обновить `docker-compose.yml` — worker нужен доступ к `server-local-data` volume |
| **v0.43** | Переход на `postgres:16`. При обновлении — dump/restore |
| **v0.42** | Удалены: `FRONT_PORT`, `FRONT_PROTOCOL`, `FRONT_DOMAIN`, `PORT`. Добавлены: `FRONTEND_URL`, `NODE_PORT` |
| **v0.35** | Добавлена: `IS_EMAIL_VERIFICATION_REQUIRED`. `ENABLE_DB_MIGRATIONS` заменён на `DISABLE_DB_MIGRATIONS` |
| **v0.32** | Redis-переменные объединены в `REDIS_URL`. Секреты объединены в `APP_SECRET` |
| **v0.24-v0.30** | Redis стал обязательным |

---

## 9. Устранение неполадок (Troubleshooting)

### Ошибка аутентификации БД (свежая установка)

1. Обновить `PG_DATABASE_PASSWORD` в `.env`
2. Пересоздать контейнеры с данными:
   ```bash
   docker compose down --volumes
   docker compose up -d
   ```
   > **Внимание:** `--volumes` удаляет ВСЕ данные БД безвозвратно!

### Ошибки входа (Login Failures)

```bash
docker exec -it twenty-server-1 yarn
docker exec -it twenty-server-1 npx nx database:reset --configuration=no-seed
docker compose down && docker compose up -d
```

### Проблемы с обратным прокси

- Убедиться, что `SERVER_URL` соответствует внешнему URL с правильным протоколом
- Проверить проброс заголовков `X-Forwarded-For` и `X-Forwarded-Proto`
- Перезапустить сервисы после изменения конфигурации

### Ошибка загрузки файлов (Permission Error)

Изменить владельца папки данных — с `root` на другого пользователя/группу.

### Не отправляются email

Проверить, что worker запущен:
```bash
npx nx worker twenty-server
```

### Ошибки памяти (Memory Errors)

- Запускать только необходимые сервисы
- Для WSL: `export NODE_OPTIONS="--max-old-space-size=8192"`
- Отключить ресурсоёмкие расширения VSCode
- Перезагрузить машину для очистки зависших процессов

### Доступ к Admin Panel

Выполнить SQL-запрос:
```sql
UPDATE core."user"
SET "canAccessFullAdminPanel" = TRUE
WHERE email = 'you@yourdomain.com';
```

### Microsoft 365

- Админ должен активировать лицензию через Microsoft 365 admin panel
- Личные аккаунты не поддерживаются (ошибка `AADSTS50020`)

### Просмотр логов

```bash
docker compose logs
docker compose logs server
docker compose logs worker
```

---

## 10. Облачные провайдеры

Помимо Docker Compose, Twenty поддерживает развёртывание через:

| Провайдер | Описание |
|-----------|----------|
| **Railway** | Community-шаблон (используется CredosCRM) |
| **Kubernetes** | Terraform + manifests (community) |
| **Coolify** | Деплой на серверы, ожидается официальный образ |
| **EasyPanel** | Community-шаблон |
| **Elest.io** | Managed hosting для OSS |
| **Sealos** | Community-шаблон в app store |

> Документация облачных провайдеров поддерживается сообществом и может содержать неточности.

---

## 11. Рекомендации для CredosCRM

### Минимальный .env для Railway

```ini
# === Обязательные ===
APP_SECRET=<openssl rand -base64 32>
SERVER_URL=https://your-credos-crm.up.railway.app
PG_DATABASE_URL=postgres://user:pass@host:port/dbname
REDIS_URL=redis://host:port

# === Хранилище (S3 для Railway, т.к. нет persistent storage) ===
STORAGE_TYPE=s3
STORAGE_S3_REGION=ru-central1
STORAGE_S3_NAME=credos-crm-storage
STORAGE_S3_ENDPOINT=https://storage.yandexcloud.net
STORAGE_S3_ACCESS_KEY_ID=<ключ>
STORAGE_S3_SECRET_ACCESS_KEY=<секрет>

# === Email (SMTP) ===
EMAIL_DRIVER=smtp
EMAIL_FROM_ADDRESS=crm@credos.ru
EMAIL_FROM_NAME=Кредо-С CRM
EMAIL_SYSTEM_ADDRESS=system@credos.ru
EMAIL_SMTP_HOST=smtp.yandex.ru
EMAIL_SMTP_PORT=465
EMAIL_SMTP_USER=crm@credos.ru
EMAIL_SMTP_PASSWORD=<пароль>

# === Отключить лишнее ===
IS_BILLING_ENABLED=false
TELEMETRY_ENABLED=false
SIGN_IN_PREFILLED=false

# === Безопасность ===
IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true
IS_MULTIWORKSPACE_ENABLED=false
```

### Рекомендации по безопасности

1. Всегда использовать HTTPS (`SERVER_URL` с `https://`)
2. Хранить `APP_SECRET` и пароли в секретах Railway, не в `.env` файлах в репозитории
3. Включить `IS_EMAIL_VERIFICATION_REQUIRED=true` для production
4. Установить `OUTBOUND_HTTP_SAFE_MODE_ENABLED=true` (по умолчанию)
5. Регулярно делать бэкапы БД
6. Обновляться последовательно, следуя release notes

---

> **Источники:**
> - [Twenty CRM Documentation](https://docs.twenty.com/developers/self-hosting)
> - [Twenty GitHub — docker-compose.yml](https://github.com/twentyhq/twenty/blob/main/packages/twenty-docker/docker-compose.yml)
> - [Twenty GitHub — .env.example](https://github.com/twentyhq/twenty/blob/main/packages/twenty-docker/.env.example)
> - Исходный код: `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`
