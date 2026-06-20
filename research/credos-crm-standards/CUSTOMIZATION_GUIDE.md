# CredosCRM — Гайд по кастомизации Twenty CRM

> Мастер-документ для разработчиков и LLM-агентов.
> Описывает ВСЕ правила доработки форка: что можно, что нельзя, как именно.
> Уровень: Senior Architect. Дата: март 2026.

---

## Содержание

1. [Философия форка](#1-философия-форка)
2. [Два способа расширения](#2-два-способа-расширения)
3. [Стратегия именования и префиксов](#3-стратегия-именования-и-префиксов)
4. [Бэкенд: NestJS-модули в credos/ namespace](#4-бэкенд-nestjs-модули-в-credos-namespace)
5. [Фронтенд: React-модули в credos/ namespace](#5-фронтенд-react-модули-в-credos-namespace)
6. [База данных: миграции и схемы](#6-база-данных-миграции-и-схемы)
7. [Metadata API: Custom Objects без кода](#7-metadata-api-custom-objects-без-кода)
8. [Query Hooks: перехват операций](#8-query-hooks-перехват-операций)
9. [GraphQL: расширение схемы](#9-graphql-расширение-схемы)
10. [i18n: локализация кастомных модулей](#10-i18n-локализация-кастомных-модулей)
11. [Интеграции: credos-integrations микросервис](#11-интеграции-credos-integrations-микросервис)
12. [Карта безопасности: что трогать, что нет](#12-карта-безопасности-что-трогать-что-нет)
13. [Upstream merge: обновление Twenty](#13-upstream-merge-обновление-twenty)
14. [Чеклист перед коммитом](#14-чеклист-перед-коммитом)
15. [Anti-patterns: типичные ошибки](#15-anti-patterns-типичные-ошибки)

---

## 1. Философия форка

**Принцип #1: Минимальная инвазия**

Twenty CRM — активно развивающийся проект (40K+ звёзд, еженедельные релизы).
Каждое изменение файлов ядра Twenty = потенциальный merge conflict при обновлении.

```
ПРАВИЛО: Если задачу можно решить БЕЗ изменения файлов ядра Twenty —
решай БЕЗ изменения файлов ядра.
```

**Приоритет способов расширения (от лучшего к худшему):**

1. Metadata API (custom objects/fields через UI или API) — 0 кода
2. Workflows (автоматизация через встроенный визуальный редактор) — 0 кода
3. Query Hooks (перехват операций с данными) — код в credos/ namespace
4. Кастомные NestJS-модули в credos/ namespace — код в credos/ namespace
5. Кастомные React-модули в credos/ namespace — код в credos/ namespace
6. Изменение файлов ядра Twenty — **КРАЙНЯЯ МЕРА**, требует документирования

---

## 2. Два способа расширения

### Способ A: Metadata-driven (без кода)

Twenty — **metadata-driven** CRM. Все объекты, поля, связи хранятся как метаданные в БД.
GraphQL-схема генерируется автоматически из метаданных.

**Что можно сделать без единой строки кода:**
- Создать custom object (через UI: Settings → Data Model)
- Добавить поля любого из 18 типов
- Настроить связи между объектами (Relation fields)
- Создать views (Table, Kanban, Calendar) с фильтрами и сортировкой
- Настроить workflows (триггеры + действия)
- Настроить webhooks для уведомления внешних систем

**Когда использовать:** Всегда, когда достаточно стандартных типов полей и стандартного UI.

### Способ B: Code-driven (credos/ namespace)

Когда стандартных возможностей недостаточно:
- Кастомная бизнес-логика (валидация, трансформация, side-effects)
- Кастомный UI (компоненты, дашборды, отчёты)
- Интеграции с внешними системами через код
- Расширение GraphQL API кастомными resolvers

**Весь код — ТОЛЬКО в credos/ namespace:**
```
packages/twenty-server/src/credos/   # Бэкенд
packages/twenty-front/src/credos/    # Фронтенд
packages/credos-integrations/src/    # Интеграции (отдельный сервис)
```

---

## 3. Стратегия именования и префиксов

### 3.1. Зачем префиксы

Префиксы решают три задачи:
1. **Отличать наше от Twenty** — при чтении кода, БД, логов сразу ясно: «это наша доработка»
2. **Избежать коллизий** — Twenty может в будущем создать объект с тем же именем
3. **Упростить upstream merge** — grep по `credos` покажет ВСЕ наши изменения

### 3.2. Таблица префиксов

| Что | Префикс/Паттерн | Пример |
|-----|-----------------|--------|
| **Custom Objects** (Metadata API) | `credos` + PascalCase | `credosTender`, `credosProject` |
| **Custom Fields** на стандартных объектах | `credos` + camelCase | `credosContractNumber`, `credosTenderUrl` |
| **DB таблицы** (code-level миграции) | `credos_` + snake_case | `credos_pipeline_stage`, `credos_integration_log` |
| **DB индексы** | `idx_credos_` + описание | `idx_credos_tender_status` |
| **NestJS модули** | PascalCase + Module | `CredosPipelinesModule` |
| **NestJS сервисы** | PascalCase + Service | `CredosTenderService` |
| **React компоненты** | PascalCase | `CredosTenderCard` |
| **React хуки** | useCredos + PascalCase | `useCredosPipelines` |
| **i18n ключи** | `credos.<модуль>.<ключ>` | `credos.tenders.statusWon` |
| **GraphQL queries** | CREDOS_ + UPPER_SNAKE | `CREDOS_GET_TENDERS` |
| **Feature flags** | `credos-` + kebab-case | `credos-multi-pipeline` |
| **Env переменные** | CREDOS_ + UPPER_SNAKE | `CREDOS_EXCHANGE_CLIENT_ID` |
| **Git ветки** | `feature/credos-` | `feature/credos-tenders-kanban` |
| **Commits** | `feat(credos):` | `feat(credos): add tender status field` |

### 3.3. Именование Custom Objects через Metadata API

При создании объектов через Settings → Data Model:

```
Singular: Credos Tender       → nameSingular: credosTender
Plural:   Credos Tenders      → namePlural:   credosTenders
```

**ВАЖНО:** Twenty автоматически генерирует:
- Таблицу в workspace-схеме: `credosTender` (camelCase)
- GraphQL type: `CredosTender`
- GraphQL queries: `credosTenders`, `credosTender`
- GraphQL mutations: `createCredosTender`, `updateCredosTender`, `deleteCredosTender`

Префикс `credos` в имени объекта гарантирует отсутствие коллизий с будущими стандартными объектами Twenty.

### 3.4. Именование Custom Fields на стандартных объектах

При добавлении полей к Company, Person, Opportunity:

```
Field name:  credosContractNumber
Field label: Номер договора
```

Это предотвращает конфликт, если Twenty добавит поле `contractNumber` в будущем.

---

## 4. Бэкенд: NestJS-модули в credos/ namespace

### 4.1. Регистрация модуля

**Точка входа:** `packages/twenty-server/src/credos/credos.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CredosPipelinesModule } from './pipelines/credos-pipelines.module';

@Module({
  imports: [
    CredosPipelinesModule,
    // CredosProjectsModule,
    // CredosTendersModule,
  ],
})
export class CredosModule {}
```

**Регистрация в Twenty:** `CredosModule` импортируется в `ModulesModule`
(`packages/twenty-server/src/modules/modules.module.ts`):

```typescript
@Module({
  imports: [
    MessagingModule,
    CalendarModule,
    // ... стандартные модули Twenty
    CredosModule,  // ← ОДНА СТРОКА — единственное изменение ядра
  ],
})
export class ModulesModule {}
```

**ВАЖНО:** Это ЕДИНСТВЕННОЕ место, где мы трогаем файл ядра Twenty.
Документировать в `credos/docs/core-changes.md`.

### 4.2. Структура модуля

```
packages/twenty-server/src/credos/
├── credos.module.ts                    # Root module
├── index.ts                            # Barrel export
│
├── pipelines/                          # Модуль: мульти-воронки
│   ├── credos-pipelines.module.ts      # NestJS module
│   ├── types.ts                        # Типы модуля
│   ├── constants.ts                    # Константы
│   ├── standard-objects/
│   │   └── credos-pipeline.workspace-entity.ts
│   ├── query-hooks/
│   │   ├── credos-pipeline-query-hook.module.ts
│   │   └── credos-pipeline-create.pre-query.hook.ts
│   ├── services/
│   │   ├── credos-pipeline.service.ts
│   │   └── credos-pipeline.service.test.ts
│   └── repositories/
│       └── credos-pipeline.repository.ts
│
├── tenders/                            # Модуль: тендеры B2G
│   └── ...
└── projects/                           # Модуль: проекты
    └── ...
```

### 4.3. Workspace Entity (пример)

```typescript
// credos-pipeline.workspace-entity.ts
import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

export class CredosPipelineWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  description: string | null;
  pipelineType: 'b2b' | 'b2g' | 'support';
  isDefault: boolean;
  position: number;

  // Relations
  stages: CredosPipelineStageWorkspaceEntity[];
  opportunities: OpportunityWorkspaceEntity[];
}

export const SEARCH_FIELDS_FOR_CREDOS_PIPELINE: FieldTypeAndNameMetadata[] = [
  { name: 'name', type: FieldMetadataType.TEXT },
];
```

### 4.4. Сервис (пример)

```typescript
// credos-pipeline.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class CredosPipelineService {
  constructor(
    private readonly pipelineRepository: CredosPipelineRepository,
  ) {}

  async getDefaultPipeline(workspaceId: string): Promise<CredosPipeline> {
    return this.pipelineRepository.findDefault(workspaceId);
  }

  async validateStageTransition(
    pipelineId: string,
    fromStage: string,
    toStage: string,
  ): Promise<boolean> {
    // Business logic for stage transition validation
    const pipeline = await this.pipelineRepository.findById(pipelineId);
    const stages = pipeline.stages.sort((a, b) => a.position - b.position);
    const fromIndex = stages.findIndex((s) => s.id === fromStage);
    const toIndex = stages.findIndex((s) => s.id === toStage);
    return toIndex >= fromIndex - 1; // allow moving back max 1 stage
  }
}
```

---

## 5. Фронтенд: React-модули в credos/ namespace

### 5.1. Структура

```
packages/twenty-front/src/credos/
├── index.ts                            # Barrel export
│
├── pipelines/                          # Модуль: мульти-воронки
│   ├── index.ts                        # Public API
│   ├── types.ts                        # Типы
│   ├── constants.ts                    # Константы
│   ├── components/
│   │   ├── CredosPipelineSelector.tsx
│   │   ├── CredosPipelineSelector.test.tsx
│   │   ├── CredosPipelineKanban.tsx
│   │   └── CredosPipelineKanban.test.tsx
│   ├── hooks/
│   │   ├── useCredosPipelines.ts
│   │   └── useCredosPipelines.test.ts
│   ├── services/
│   │   └── credosPipelineService.ts
│   └── graphql/
│       ├── queries.ts                  # GraphQL queries
│       └── mutations.ts               # GraphQL mutations
│
├── tenders/
│   └── ...
└── shared/                             # Общие компоненты Credos
    ├── components/
    └── hooks/
```

### 5.2. Компонент (пример)

```typescript
// CredosPipelineSelector.tsx
import { Select } from 'twenty-ui';
import { useCredosPipelines } from '../hooks/useCredosPipelines';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

export const CredosPipelineSelector = ({
  selectedPipelineId,
  onSelect,
}: CredosPipelineSelectorProps) => {
  const { t } = useLingui();
  const { pipelines, isLoading } = useCredosPipelines();

  if (isLoading) return null;

  return (
    <Select
      value={selectedPipelineId}
      onChange={onSelect}
      options={pipelines.map((p) => ({
        value: p.id,
        label: p.name,
      }))}
      placeholder={t(msg`credos.pipelines.selectPipeline`)}
    />
  );
};
```

### 5.3. Правила UI-компонентов

1. **Проверь Twenty UI** — `twenty-ui` имеет Button, Input, Select, Table, Modal, etc.
2. **Проверь Twenty паттерны** — как аналогичная задача решена в `twenty-front/src/modules/`
3. **shadcn/ui** — если в Twenty нет подходящего компонента
4. **Кастом** — ПОСЛЕДНЯЯ инстанция, должен быть generic и переиспользуемый

---

## 6. База данных: миграции и схемы

### 6.1. Два типа миграций в Twenty

| Тип | Назначение | Расположение |
|-----|-----------|-------------|
| **Core (TypeORM)** | Изменение metadata-схемы | `packages/twenty-server/src/database/typeorm/metadata/migrations/` |
| **Workspace** | Изменение workspace-схемы (данные пользователей) | Генерируются автоматически из metadata |

### 6.2. Custom Objects через Metadata = БЕЗ миграций

Если вы создаёте custom objects через UI или Metadata API:
- Twenty **автоматически** создаёт таблицу в workspace-схеме
- **Автоматически** обновляет GraphQL-схему
- **НЕ нужны** файлы миграций в коде
- Это **рекомендуемый** способ

### 6.3. Code-level миграции (когда нужны)

Code-level миграции нужны ТОЛЬКО когда:
- Требуется нестандартная логика (триггеры, функции PostgreSQL)
- Нужны индексы, которые не создаёт Twenty автоматически
- Кастомные таблицы вне metadata-системы (например, `credos_integration_log`)

**Расположение:** `credos/migrations/`

**Именование:** `YYYYMMDDHHMMSS-credos-описание.ts`

```typescript
// 20260315120000-credos-add-integration-log.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CredosAddIntegrationLog20260315120000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS credos_integration_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_credos_integration_log_source
        ON credos_integration_log(source, created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS credos_integration_log');
  }
}
```

### 6.4. Правила для БД

| Правило | Обоснование |
|---------|-------------|
| Все кастомные таблицы — `credos_` префикс | Отличать от таблиц Twenty |
| Все кастомные индексы — `idx_credos_` | Отличать от индексов Twenty |
| Custom objects через Metadata API — `credos` префикс в имени | Отличать от стандартных объектов |
| Custom fields на стандартных объектах — `credos` префикс | Избежать коллизий с будущими полями Twenty |
| НЕ менять существующие таблицы Twenty напрямую | Сломает upstream merge |
| Миграции идемпотентны (`IF NOT EXISTS`) | Безопасный повторный запуск |

---

## 7. Metadata API: Custom Objects без кода

### 7.1. Создание через UI

Settings → Data Model → + New object:
- Singular: `Credos Tender`
- Plural: `Credos Tenders`
- Icon: `IconFileDescription`

Добавить поля:
- `tenderNumber` (Text) — номер тендера
- `tenderUrl` (Links) — ссылка на zakupki.gov.ru
- `federalLaw` (Select: 44-ФЗ / 223-ФЗ) — тип закупки
- `submissionDeadline` (DateTime) — дедлайн подачи
- `estimatedValue` (Currency) — НМЦК
- `status` (Select) — статус участия

Добавить связи:
- `company` → Relation с Companies
- `assignee` → Relation с Workspace Members

### 7.2. Создание через Metadata REST API

```bash
# Создание custom object
POST /rest/metadata/objects
Authorization: Bearer $API_KEY
Content-Type: application/json

{
  "nameSingular": "credosTender",
  "namePlural": "credosTenders",
  "labelSingular": "Тендер",
  "labelPlural": "Тендеры",
  "icon": "IconFileDescription",
  "description": "Тендеры и госзакупки (B2G)"
}
```

### 7.3. Когда Metadata API, когда код

| Задача | Metadata API | Код |
|--------|:---:|:---:|
| Новый объект со стандартными полями | **Да** | — |
| Новое поле стандартного типа | **Да** | — |
| Связь между объектами | **Да** | — |
| Views, фильтры, сортировка | **Да** | — |
| Кастомная валидация при создании | — | **Query Hook** |
| Side-effects при обновлении | — | **Query Hook** |
| Кастомный UI (дашборд, отчёт) | — | **React-модуль** |
| Интеграция с внешней системой | — | **credos-integrations** |
| Нестандартная бизнес-логика | — | **NestJS-сервис** |

---

## 8. Query Hooks: перехват операций

### 8.1. Концепция

Query Hooks позволяют перехватывать CRUD-операции над любым объектом
(стандартным или custom) БЕЗ изменения ядра Twenty.

```
Запрос клиента → Pre-Query Hook → Query Runner → Post-Query Hook → Ответ
```

### 8.2. Типы хуков

| Хук | Когда срабатывает | Применение |
|-----|-------------------|-----------|
| `createOne.pre` | Перед созданием записи | Валидация, обогащение данных |
| `createMany.pre` | Перед batch-созданием | Валидация, нормализация |
| `updateOne.pre` | Перед обновлением | Проверка прав, бизнес-правила |
| `deleteOne.pre` | Перед удалением | Проверка зависимостей |
| `deleteOne.post` | После удаления | Каскадная очистка, уведомления |
| `findMany.post` | После выборки | Фильтрация, обогащение |

### 8.3. Пример: валидация при создании тендера

```typescript
// credos-tender-create.pre-query.hook.ts
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-pre-query-hook.type';

@WorkspaceQueryHook('credosTender.createOne')
export class CredosTenderCreatePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    authContext: AuthContext,
    objectName: string,
    payload: CreateOneResolverArgs,
  ): Promise<CreateOneResolverArgs> {
    const { submissionDeadline } = payload.data;

    if (submissionDeadline && new Date(submissionDeadline) < new Date()) {
      throw new BadRequestException('Submission deadline cannot be in the past');
    }

    return payload;
  }
}
```

### 8.4. Регистрация хуков

Хуки регистрируются как NestJS providers в модуле:

```typescript
// credos-tender-query-hook.module.ts
@Module({
  providers: [
    CredosTenderCreatePreQueryHook,
    CredosTenderDeletePostQueryHook,
  ],
})
export class CredosTenderQueryHookModule {}
```

---

## 9. GraphQL: расширение схемы

### 9.1. Автоматическая генерация

Twenty **автоматически** генерирует GraphQL-схему для всех объектов (стандартных и custom).
При создании `credosTender` через Metadata API автоматически появятся:

```graphql
type CredosTender {
  id: ID!
  tenderNumber: String
  tenderUrl: Links
  federalLaw: String
  submissionDeadline: DateTime
  estimatedValue: Currency
  status: String
  company: Company
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  credosTender(id: ID!): CredosTender
  credosTenders(filter: CredosTenderFilterInput, orderBy: CredosTenderOrderByInput): CredosTenderConnection
}

type Mutation {
  createCredosTender(data: CredosTenderCreateInput!): CredosTender
  updateCredosTender(id: ID!, data: CredosTenderUpdateInput!): CredosTender
  deleteCredosTender(id: ID!): CredosTender
}
```

### 9.2. Кастомные resolvers (если нужны)

Для нестандартной бизнес-логики (агрегации, сложные запросы):

```typescript
// credos-pipeline-analytics.resolver.ts
@Resolver()
export class CredosPipelineAnalyticsResolver {
  constructor(
    private readonly analyticsService: CredosPipelineAnalyticsService,
  ) {}

  @Query(() => CredosPipelineAnalytics)
  async credosPipelineAnalytics(
    @Args('pipelineId') pipelineId: string,
    @AuthWorkspace() workspace: Workspace,
  ): Promise<CredosPipelineAnalytics> {
    return this.analyticsService.getAnalytics(pipelineId, workspace.id);
  }
}
```

### 9.3. Фронтенд: GraphQL-операции

```typescript
// packages/twenty-front/src/credos/tenders/graphql/queries.ts
import { gql } from '@apollo/client';

export const CREDOS_GET_TENDERS = gql`
  query CredosGetTenders($filter: CredosTenderFilterInput) {
    credosTenders(filter: $filter) {
      edges {
        node {
          id
          tenderNumber
          tenderUrl
          federalLaw
          submissionDeadline
          estimatedValue
          status
          company {
            id
            name
          }
        }
      }
    }
  }
`;
```

**После изменения схемы:**
```bash
npx nx run twenty-front:graphql:generate
```

---

## 10. i18n: локализация кастомных модулей

### 10.1. Фреймворк

Twenty использует **Lingui** для i18n. Все UI-строки — через макросы, не хардкод.

### 10.2. Бэкенд: `.po` файлы

**Файл:** `packages/twenty-server/src/engine/core-modules/i18n/locales/ru-RU.po`

Добавлять строки с `credos.` префиксом:

```po
msgid "credos.tenders.title"
msgstr "Тендеры"

msgid "credos.tenders.statusWon"
msgstr "Выигран"

msgid "credos.tenders.statusLost"
msgstr "Проигран"

msgid "credos.pipelines.selectPipeline"
msgstr "Выберите воронку"
```

### 10.3. Фронтенд: использование в компонентах

```typescript
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

export const CredosTenderStatus = ({ status }: Props) => {
  const { t } = useLingui();

  const statusLabels: Record<string, MessageDescriptor> = {
    won: msg`credos.tenders.statusWon`,
    lost: msg`credos.tenders.statusLost`,
    pending: msg`credos.tenders.statusPending`,
  };

  return <Badge label={t(statusLabels[status])} />;
};
```

### 10.4. Правила i18n

| Правило | Пример |
|---------|--------|
| Ключи: `credos.<модуль>.<описание>` | `credos.tenders.statusWon` |
| Строки — ТОЛЬКО через Lingui | НЕ `"Тендеры"`, а `t(msg\`credos.tenders.title\`)` |
| Даты/числа — через `Intl` | `new Intl.DateTimeFormat('ru-RU')` |
| Валюта — через `Intl.NumberFormat` | `{ style: 'currency', currency: 'RUB' }` |

---

## 11. Интеграции: credos-integrations микросервис

### 11.1. Архитектура

Отдельный Node.js микросервис, НЕ часть Twenty:

```
packages/credos-integrations/
├── Dockerfile
├── package.json
└── src/
    ├── main.ts                    # Entry point (Express/Fastify)
    ├── config/
    │   └── env.ts                 # Environment variables
    ├── exchange/                   # Microsoft Exchange
    │   ├── exchange.module.ts
    │   ├── exchange.service.ts
    │   └── exchange.types.ts
    ├── beeline/                    # АТС Билайн
    │   ├── beeline.module.ts
    │   ├── beeline.service.ts
    │   └── beeline.types.ts
    ├── oneC/                       # 1С УНФ
    │   ├── oneC.module.ts
    │   ├── oneC.service.ts
    │   └── oneC.types.ts
    ├── api/                        # REST API
    │   ├── routes.ts
    │   └── middleware/
    │       └── auth.ts             # API key validation
    └── shared/
        ├── twenty-client.ts        # Client for Twenty API
        └── logger.ts               # Structured logging
```

### 11.2. Коммуникация с Twenty

```
credos-integrations ←→ Twenty Server
     (port 3001)           (port 3000)
         │                      │
         ├── REST API ──────────┤  Twenty → Integrations (команды)
         ├── Webhooks ──────────┤  Twenty → Integrations (события)
         └── GraphQL API ───────┤  Integrations → Twenty (данные)
```

**Авторизация:** shared API key в `CREDOS_INTEGRATIONS_API_KEY` env var.

### 11.3. Env переменные

Все env переменные интеграций — с `CREDOS_` префиксом:

```env
CREDOS_INTEGRATIONS_PORT=3001
CREDOS_INTEGRATIONS_API_KEY=...
CREDOS_TWENTY_API_URL=http://credoscrm1.railway.internal:3000
CREDOS_TWENTY_API_KEY=...

CREDOS_EXCHANGE_CLIENT_ID=...
CREDOS_EXCHANGE_CLIENT_SECRET=...
CREDOS_EXCHANGE_TENANT_ID=...

CREDOS_BEELINE_PBX_HOST=...
CREDOS_BEELINE_PBX_API_KEY=...

CREDOS_ONEC_BASE_URL=...
CREDOS_ONEC_USERNAME=...
CREDOS_ONEC_PASSWORD=...
```

---

## 12. Карта безопасности: что трогать, что нет

### 12.1. Зелёная зона (свободно)

| Область | Расположение |
|---------|-------------|
| credos/ namespace (бэкенд) | `packages/twenty-server/src/credos/` |
| credos/ namespace (фронтенд) | `packages/twenty-front/src/credos/` |
| credos-integrations | `packages/credos-integrations/` |
| Документация | `credos/docs/` |
| i18n строки (добавление) | `ru-RU.po` (добавление новых msgid) |
| Custom objects через UI | Settings → Data Model |
| Workflows через UI | Workflows editor |

### 12.2. Жёлтая зона (осторожно, документировать)

| Область | Когда нужно | Риск merge conflict |
|---------|-------------|:---:|
| `modules.module.ts` (import CredosModule) | Один раз при подключении | Низкий |
| `app.module.ts` (если нужна ранняя инициализация) | Редко | Средний |
| Роуты/навигация (sidebar, routes) | Добавление страниц | Средний |
| `.env.example` (добавление наших переменных) | Один раз | Низкий |

**Каждое изменение жёлтой зоны → запись в `credos/docs/core-changes.md`:**

```markdown
### 2026-03-15 — Подключение CredosModule к ModulesModule
- **Файл:** packages/twenty-server/src/modules/modules.module.ts
- **Изменение:** Добавлен import CredosModule в массив imports
- **Причина:** Единая точка входа для всех кастомных бэкенд-модулей
- **Риск конфликта:** Низкий (одна строка в массиве)
- **При merge:** Добавить строку `CredosModule` в imports после разрешения конфликта
```

### 12.2.1. Маркеры правок ядра (ОБЯЗАТЕЛЬНО)

Каждая правка в файле ядра Twenty (жёлтая зона) должна быть обёрнута
маркер-комментарием `CREDOS`. Это даёт два свойства:

1. **Greppable** — все кастомные патчи находятся за одну команду:
   `grep -rn "CREDOS:" packages/ | grep -v credos/`
2. **Merge-friendly** — при обновлении upstream сразу видно где наши правки,
   конфликты резолвятся осознанно.

**Форматы:**

Однострочная правка:
```typescript
const result = useCredosOpenRecord(); // CREDOS: тумблер sidePanel/fullPage
```

Блочная правка:
```typescript
// CREDOS-BEGIN: тумблер режима открытия записи (настройка workspace)
if (openMode === 'fullPage') {
  navigate(`/object/${singular}/${id}`);
  return;
}
// CREDOS-END
```

**Правила:**
- Текст после `:` — краткое **ЗАЧЕМ**, не ЧТО (код и так видно)
- Парные маркеры `CREDOS-BEGIN:` и `CREDOS-END` для блоков из 2+ строк
- Каждый маркер = отдельная запись в `credos/docs/core-changes.md` (дата + файл + причина)
- Вся логика — в `credos/` namespace (хук, утилита, компонент). В файле ядра
  остаются только 1–3 строки: импорт и вызов нашего кода
- НЕ использовать `TODO CREDOS`, `FIXME CREDOS`, `HACK CREDOS` и прочие вариации —
  только `CREDOS:` / `CREDOS-BEGIN:` / `CREDOS-END`, чтобы grep находил всё

**Чеклист перед merge upstream:**
1. `grep -rn "CREDOS:" packages/ | grep -v credos/` — все маркеры на месте
2. Сверить количество маркеров с записями в `core-changes.md`
3. После merge — те же маркеры должны остаться (ни один не потерян при ресолве конфликтов)

---

### 12.3. Красная зона (НЕ ТРОГАТЬ)

| Область | Почему нельзя |
|---------|---------------|
| `engine/api/graphql/workspace-query-runner/` | Ядро выполнения запросов — сломает всё |
| `engine/metadata-modules/object-metadata/` | Система метаданных — сломает custom objects |
| `engine/metadata-modules/field-metadata/` | Система полей — сломает все формы |
| `engine/twenty-orm/` | ORM Twenty — сломает доступ к данным |
| `engine/api/graphql/workspace-schema-builder/` | Генерация GraphQL — сломает API |
| `engine/workspace-manager/workspace-migration/` | Миграции — сломает обновления схемы |
| `engine/core-modules/auth/` | Аутентификация — security risk |

**Если задача ТРЕБУЕТ изменения красной зоны:**
1. Обсудить с техлидом
2. Искать альтернативы (query hooks, custom module, workflow)
3. Если нет альтернатив — документировать подробно + написать тест
4. Отслеживать при каждом upstream merge

---

## 13. Upstream merge: обновление Twenty

### 13.1. Процедура

```bash
# 1. Убедиться что main чистый
git status  # должен быть чистый

# 2. Fetch upstream
git fetch upstream

# 3. Создать ветку для merge
git checkout -b merge/upstream-twenty-vX.Y.Z

# 4. Merge (без auto-commit)
git merge upstream/main --no-commit

# 5. Проверить конфликты
git diff --name-only --diff-filter=U  # список конфликтных файлов

# 6. Разрешить конфликты (наши credos/ файлы всегда приоритетнее)
# Для файлов ядра — аккуратно мержить оба изменения

# 7. Проверить
npx nx typecheck twenty-server
npx nx typecheck twenty-front
npx nx test twenty-server --passWithNoTests
npx nx test twenty-front --passWithNoTests

# 8. Commit
git commit -m "merge: upstream twenty vX.Y.Z"

# 9. PR в main
```

### 13.2. Что проверять после merge

1. `CredosModule` по-прежнему импортируется в `ModulesModule`
2. Все файлы из `credos/docs/core-changes.md` — изменения на месте
3. `ru-RU.po` — наши строки не потерялись
4. GraphQL-генерация работает: `npx nx run twenty-front:graphql:generate`
5. БД миграции проходят: `npx nx run twenty-server:database:migrate:prod`

### 13.3. Частота обновлений

Рекомендация: merge upstream **раз в 2-4 недели**.
Частые мелкие merge проще, чем редкие огромные.

---

## 14. Чеклист перед коммитом

```
□ Весь новый код в credos/ namespace (не в ядре Twenty)
□ Если менял файл ядра → записал в credos/docs/core-changes.md
□ Именование с credos-префиксами (объекты, поля, таблицы, компоненты)
□ Нет any в TypeScript
□ Нет хардкод-строк в UI (всё через Lingui)
□ Компонент < 150 строк, хук < 100, сервис < 200
□ Тесты рядом с файлом (module.ts + module.test.ts)
□ typecheck проходит: npx nx typecheck <package>
□ lint проходит: npx nx lint:diff-with-main <package>
□ Commit message: feat(credos): / fix(credos): / chore:
□ Ветка: feature/credos-<module>-<desc> или fix/credos-<desc>
```

---

## 15. Anti-patterns: типичные ошибки

### 15.1. НЕ делать

| Anti-pattern | Почему плохо | Что делать вместо |
|-------------|-------------|-------------------|
| Менять `company.workspace-entity.ts` для добавления поля | Merge conflict при каждом обновлении | Добавить custom field через Metadata API с `credos` префиксом |
| Создать custom object `Tender` без префикса | Twenty может добавить свой `Tender` | Называть `credosTender` |
| Писать SQL напрямую в сервисе | SQL injection, нет type safety | TypeORM parameterized queries |
| Дублировать компонент из Twenty вместо переиспользования | Рассинхронизация с обновлениями Twenty | Import из `twenty-ui` или `twenty-front/src/modules/` |
| Хардкодить `"Выигран"` в компоненте | Нет i18n, не работает для других языков | `t(msg\`credos.tenders.statusWon\`)` |
| Создать `__tests__/` директорию | Нарушает паттерн Twenty (co-located tests) | Тест рядом: `module.ts` + `module.test.ts` |
| Использовать Redux/Zustand для state | Нарушает паттерн Twenty | Jotai atoms + Apollo Client |
| Разместить интеграцию внутри Twenty server | Жёсткая связанность, общий деплой | Отдельный сервис `credos-integrations` |
| Коммит без `feat(credos):` префикса | Непонятно что наше, что upstream | Conventional commits с `(credos)` scope |
| Документация на английском | Нарушает правило проекта | Вся документация — ТОЛЬКО на русском |

### 15.2. Красные флаги в code review

Если видите в PR любой из этих файлов — **СТОП, нужна проверка:**

```
packages/twenty-server/src/engine/**          # Ядро Twenty
packages/twenty-server/src/modules/**/*.ts    # Стандартные модули (кроме modules.module.ts)
packages/twenty-front/src/modules/**          # Стандартные фронтенд-модули
packages/twenty-server/src/app.module.ts      # Root module
packages/twenty-ui/**                         # UI-библиотека
packages/twenty-shared/**                     # Shared-пакет
```

---

> **Источники:** Анализ исходного кода Twenty CRM (v2026), docs.twenty.com,
> архитектурные решения проекта CredosCRM.
> Документ подготовлен для проекта CredosCRM (форк Twenty CRM для ИТ-компании «Кредо-С»).
