# Twenty CRM — GraphQL API Layer

> Источник: https://deepwiki.com/twentyhq/twenty/6.1-graphql-api + /7-api

---

## Dual Schema Architecture

| Schema | Тип | Назначение |
|--------|-----|-----------|
| Metadata API | Static (TypeScript decorators) | Object/field/relation management |
| Workspace Data API | Dynamic (runtime generation) | CRUD на записях |

Powered by GraphQL Yoga + NestJS.

---

## Metadata API Resolvers

### ObjectMetadataResolver

`createOneObject` triggers:
1. Field creation
2. View generation
3. Database migrations
4. Cache invalidation

### FieldMetadataResolver

`createOneField` triggers:
1. Type validation
2. Column generation
3. Index updates
4. Cache invalidation

### DataLoaders

Prevent N+1 queries for related metadata.

---

## Dynamic Workspace Schema

Generated per ObjectMetadata:
- Types
- Queries (findMany, findOne)
- Mutations (create, update, delete)
- Input types
- Filter types

Permission enforcement via `WorkspaceRepository`.

### Mutation Events

`DatabaseBatchEvent` emitted for workflows/auditing.

---

## Guards

| Guard | Назначение |
|-------|-----------|
| `WorkspaceAuthGuard` | JWT validation |
| `SettingsPermissionGuard` | Role-specific settings access |

---

## Feature Flag-Controlled Schema

| Flag | Controls |
|------|---------|
| `IS_AI_ENABLED` | AI features in schema |
| `IS_APPLICATION_ENABLED` | Application management |
| `IS_ROW_LEVEL_PERMISSION_PREDICATES_ENABLED` | RLS predicates |
| `IS_RECORD_PAGE_LAYOUT_EDITING_ENABLED` | Page layout editing |
| `IS_COMMAND_MENU_ITEM_ENABLED` | Command menu items |
| `IS_NAVIGATION_MENU_ITEM_ENABLED` | Navigation menu items |

---

## Multi-Level Caching

| Level | Scope | Storage |
|-------|-------|---------|
| DataLoader | Per-request | In-memory |
| Metadata | Per-workspace | Redis |
| Permission | Per-role | In-memory |
| Feature Flag | Per-workspace | In-memory |

---

## Authentication System

### Providers

| Provider | Тип |
|----------|-----|
| Password | Email + password |
| Google OAuth | Social login |
| Microsoft OAuth | Social login |
| SAML/SSO | Enterprise SSO |
| Magic Link | Email-based |
| API Keys | Programmatic |

### JWT Tokens

| Token | TTL |
|-------|-----|
| Access | 30 min |
| Refresh | 90 days |

### WorkspaceAuthContext

```typescript
{
  user: { id: string };
  workspace: { id: string };
  workspaceMemberId: string;
}
```

---

## REST API Endpoints

### `/client-config` (GET, public)

Returns:
- `appVersion`
- `authProviders`
- `billing`
- `aiModels`
- `signInPrefilled`
- `isMultiWorkspaceEnabled`
- `support`
- `sentry`
- `captcha`
- API limits
- `publicFeatureFlags`

### `/healthz` (GET, public)

Container health check.

### File Access Endpoints

Local or S3 storage, JWT required.

---

## Server Startup Sequence

```
1. Schema check
2. setup-db.ts
3. database:migrate:prod
4. cache flush
5. upgrade
6. cache flush
7. cron registration
8. node dist/main
```

### Default Ports

| Service | Port |
|---------|------|
| Server | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| ClickHouse | 8123 / 9000 |

---

## Rate Limiting

| Variable | Назначение |
|----------|-----------|
| `API_RATE_LIMITING_TTL` | Time window |
| `API_RATE_LIMITING_LIMIT` | Max calls per window |
| `MUTATION_MAXIMUM_AFFECTED_RECORDS` | Max records per mutation (default: 100) |
