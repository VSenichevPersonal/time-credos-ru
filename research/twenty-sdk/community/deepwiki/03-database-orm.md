# Twenty CRM — Database and ORM Layer

> Источник: https://deepwiki.com/twentyhq/twenty/2.3 + /3-core-components + /3.1-custom-orm

---

## Three Database Systems

| Database | Назначение |
|----------|-----------|
| PostgreSQL | Core + workspace schemas |
| Redis | Cache + BullMQ queues |
| ClickHouse | Optional analytics |

---

## Schema Structure

### Core Schema Tables

| Table | Назначение |
|-------|-----------|
| `WorkspaceEntity` | Workspace metadata |
| `ObjectMetadataEntity` | Object definitions |
| `FieldMetadataEntity` | Field definitions |
| `FeatureFlagEntity` | Feature flags |
| `UserWorkspace` | User-workspace mapping |

### Workspace Schemas

- Naming: `workspace_<workspaceId>`
- Каждый workspace имеет изолированную схему

---

## Custom ORM (WorkspaceEntityManager)

Wraps TypeORM с permission-aware layer.

### Responsibilities

1. **Workspace Isolation** — изоляция данных
2. **Permission Enforcement** — проверка прав
3. **Context Propagation** — передача контекста
4. **Feature Flag Awareness** — учёт feature flags
5. **Event Emission** — генерация событий
6. **Data Formatting** — форматирование composite fields

---

## Five Custom Query Builders

| Builder | Назначение |
|---------|-----------|
| `WorkspaceSelectQueryBuilder` | SELECT с permissions + RLS |
| `WorkspaceInsertQueryBuilder` | INSERT с nested relations |
| `WorkspaceUpdateQueryBuilder` | UPDATE с batch support |
| `WorkspaceDeleteQueryBuilder` | Hard DELETE |
| `WorkspaceSoftDeleteQueryBuilder` | Soft DELETE |

Все builders: validate permissions, apply RLS predicates, format data, emit events.

### CRUD Methods with PermissionOptions

```typescript
find(), findOne(), insert(), upsert(), update(),
updateMany(), save(), delete(), softDelete(), restore()
```

### Select Builder Methods

```typescript
getMany(), getOne(), getOneOrFail(), getManyAndCount(),
getCount(), getRawOne(), getRawMany(), execute()
```

### Constants

- `QUERY_MAX_RECORDS = 5000`

### Exception Types

- `QUERY_READ_TIMEOUT`
- `DUPLICATE_ENTRY_DETECTED`

---

## Repository Permission Config

```typescript
// Union — any of these permissions
{ unionOf: string[] }

// Intersection — all of these permissions
{ intersectionOf: string[] }

// Bypass — skip permission checks
{ shouldBypassPermissionChecks: boolean }
```

---

## Data Formatting

- `formatData()` — flattens composite fields для SQL
- `formatResult()` — reconstructs composite fields из SQL

---

## Composite Field Types → Multiple Columns

| Field Type | Columns |
|-----------|---------|
| `FullNameFieldMetadata` | firstName, lastName |
| `CurrencyFieldMetadata` | amountMicros, currencyCode |
| `AddressFieldMetadata` | street, city, state, postcode, country, lat, lng |
| `LinksFieldMetadata` | primaryLinkLabel, primaryLinkUrl, secondaryLinks |
| `PhonesFieldMetadata` | primaryPhoneNumber, primaryPhoneCountryCode, additionalPhones |
| `EmailsFieldMetadata` | primaryEmail, additionalEmails |
| `FileFieldMetadata` | name, path, size |

---

## Feature Flags Controlling ORM

| Flag | Назначение |
|------|-----------|
| `IS_ROW_LEVEL_PERMISSION_PREDICATES_ENABLED` | RLS predicates |
| `IS_UNIQUE_INDEXES_ENABLED` | Unique indexes |
| `IS_JSON_FILTER_ENABLED` | JSON filtering |
| `IS_JUNCTION_RELATIONS_ENABLED` | Junction relations |

---

## Database Event Actions

```typescript
CREATED, UPDATED, DELETED, DESTROYED, UPSERTED
```

---

## Migration Systems

1. **TypeORM migrations** — schema DDL changes
2. **UpgradeCommand** — version-specific data transformations

---

## Insert Builder: Special Features

- **Nested relation processing:** `prepareNestedRelationQueries()`
- **File field sync:** `FilesFieldSync` для файловых полей
