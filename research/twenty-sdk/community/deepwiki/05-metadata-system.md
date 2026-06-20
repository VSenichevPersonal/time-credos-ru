# Twenty CRM — Metadata System

> Источник: https://deepwiki.com/twentyhq/twenty/4-data-model + /4.1-metadata-system + /4.2-caching

---

## Object Metadata

### Key Fields

| Field | Назначение |
|-------|-----------|
| `nameSingular` | Имя объекта (ед.ч.) |
| `labelSingular` | Label для UI |
| `isCustom` | Custom object? |
| `isSystem` | System object? |

---

## Field Metadata

### 25+ Field Types

```
TEXT, UUID, BOOLEAN, NUMBER, DATE_TIME, DATE,
FULL_NAME, ADDRESS, CURRENCY, LINKS, EMAILS, PHONES,
RELATION, MORPH, SELECT, MULTI_SELECT, RATING, FILE,
RICH_TEXT, RAW_JSON, TS_VECTOR, POSITION, ACTOR
```

### Auto-Generated System Fields

Каждый объект автоматически получает:
```
id, name, createdAt, updatedAt, createdBy,
updatedBy, deletedAt, position
```

---

## Standard Objects (available for extension)

```
attachment, blocklist, calendarChannel, calendarEvent,
company, connectedAccount, dashboard, favorite,
message, messageChannel, messageParticipant, messageThread,
note, opportunity, person, task, timelineActivity,
workflow, workspaceMember
```

---

## ObjectMetadataService

### CRUD Pipeline

1. Retrieve metadata
2. Transpile input
3. Create default views
4. Execute migrations
5. Create workspace favorites
6. Update cache

---

## GraphQL Metadata API — Full Mutation List

### Object CRUD
- `createOneObject`, `updateOneObject`, `deleteOneObject`

### Field CRUD
- `createOneField`, `updateOneField`, `deleteOneField`

### Relations
- `createRelation`, `updateRelation`, `deleteRelation`

### Indexes
- `createIndex`, `updateIndex`, `deleteIndex`

### Applications
- `createApplication`, `updateApplication`, `deleteApplication`
- `installApplication`, `uninstallApplication`

### Logic Functions
- `createLogicFunctionFromSource`, `updateLogicFunction`
- `deleteLogicFunction`, `executeLogicFunction`

### AI
- `createAgent`, `updateAgent`, `deleteAgent`
- `createSkill`, `updateSkill`

### Views
- `createView`, `updateView`, `deleteView`, `duplicateView`
- `createViewField`, `createViewFilter`, `createViewSort`, `createViewGroup`

### Page Layouts
- `createPageLayout`, `updatePageLayout`, `createPageLayoutWidget`

### Roles & Permissions
- `createRole`, `updateRole`, `deleteRole`
- `updateRoleTarget`
- `createRowLevelPermissionPredicate`, `updateRowLevelPermissionPredicate`
- `deleteRowLevelPermissionPredicate`

### Feature Flags
- `updateFeatureFlag`

All mutations require `DATA_MODEL` settings permission.

---

## Index Types

| Type | Назначение |
|------|-----------|
| `BTREE` | Default, general-purpose |
| `GIN` | Arrays, full-text search |
| `GIST` | Spatial data |

---

## View Metadata

- `CoreView` — view definition
- `CoreViewField` — columns/fields
- `CoreViewFilter` — filters
- `CoreViewSort` — sorting

---

## Relations

- Standard `RELATION` — one-to-one, one-to-many
- Polymorphic `MORPH_RELATION` — references to multiple object types
- DataLoaders for batched field/relation loading

---

## Migration Pipeline

```
Validation → SQL DDL generation → Atomic execution → Cache update
```

Single coordinated transaction.

---

## Metadata Caching (FlatEntityMaps)

### Services

| Service | Назначение |
|---------|-----------|
| `WorkspaceCacheService` | Cache orchestration |
| `WorkspaceManyOrAllFlatEntityMapsCacheService` | Bulk loading |
| `MetadataVersionService` | Version tracking |

### Available Maps

```
flatObjectMetadataMaps, flatFieldMetadataMaps,
flatViewMaps, flatViewFieldMaps, flatIndexMaps, ...
```

### Lookup Indexes

- By ID
- By name (singular)
- By universal identifier

### Performance

| Scenario | Latency |
|----------|---------|
| Cache hit | O(1), <1ms |
| Cache miss | 10-100ms, O(n) flattening |
| DataLoader batching | 10-100x improvement |

### Cache Isolation

Per-workspace, keys include `workspaceId`.

### Version Management

Metadata version increments trigger cache invalidation.

### ORMWorkspaceContext

Propagates cached metadata through async local storage.
