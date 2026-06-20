# Twenty CRM — Permission System

> Источник: https://deepwiki.com/twentyhq/twenty/3.2

---

## Permission Validation Pipeline

```
validateQueryIsPermittedOrThrow
  → validateOperationIsPermittedOrThrow
    → field validation
```

---

## Object-Level Permissions

### Operations and Required Permissions

| Operation | Required Permission |
|-----------|-------------------|
| `select` | `canReadObjectRecords` |
| `insert` | N/A (no check) |
| `update` | `canUpdateObjectRecords` |
| `delete` | `canDestroyObjectRecords` |
| `soft-delete` | `canSoftDeleteObjectRecords` |
| `restore` | `canSoftDeleteObjectRecords` |

### Global Overrides (на все объекты)

- `canReadAllObjectRecords`
- `canUpdateAllObjectRecords`
- `canSoftDeleteAllObjectRecords`
- `canDestroyAllObjectRecords`

---

## RBAC (Role-Based Access Control)

- `Role` entity с `userWorkspaceRoleMap`
- Object-level permissions per role
- Settings > Roles UI: `SettingsRolePermissionsObjectLevelObjectForm`
- Frontend Recoil atoms for permission state

---

## Field-Level Permissions

### RestrictedFieldsPermissions Map

```typescript
{
  [fieldId: string]: {
    canReadFieldValue: boolean;
    canUpdateFieldValue: boolean;
    overrideType: 'grant' | 'revoke' | 'inherited';
  }
}
```

### Override Types

| Type | UI Color | Meaning |
|------|----------|---------|
| `grant` | Green | Explicitly allowed |
| `revoke` | Red | Explicitly denied |
| `inherited` | Default | Inherited from role |

### Composite Fields

Handled through `getColumnNameToFieldMetadataIdMap`.

### Exception Codes

- `FORBIDDEN_FIELD_READ`
- `FORBIDDEN_FIELD_UPDATE`
- `FORBIDDEN_OPERATION`

---

## Row-Level Security (RLS)

### Feature Flag

Controlled by `IS_ROW_LEVEL_PERMISSION_PREDICATES_ENABLED` + `BillingEntitlementKey.RLS`.

### Predicate Structure

```typescript
{
  fieldMetadataId: string;
  operand: string;
  value: unknown;
  workspaceMemberFieldMetadataId: string;
  predicateGroupId: string;
}
```

### Predicate Groups

```typescript
{
  logicalOperator: 'AND' | 'OR' | 'NOT';
  parentGroupId: string | null;
}
```

### Processing Pipeline

1. `buildRowLevelPermissionRecordFilter()` → nested filters
2. `applyObjectRecordFilterToQueryBuilder()` → SQL WHERE clauses
3. Insert validation: `validateRLSPredicatesForInsert()`
4. Update validation: `validateRLSPredicatesForUpdate()`

### Query Builder Coverage

All five builders apply RLS. Bypass via `shouldBypassPermissionChecks` flag.

### Performance Optimization

- Cache predicates in flat maps
- Index filtered fields
- Use workspace member fields for dynamic predicates

---

## Permissions for Apps (defineRole)

### Global Permissions

| Permission | Назначение |
|-----------|-----------|
| `canReadAllObjectRecords` | Чтение всех объектов |
| `canUpdateAllObjectRecords` | Обновление всех объектов |
| `canSoftDeleteAllObjectRecords` | Soft delete всех объектов |
| `canDestroyAllObjectRecords` | Hard delete всех объектов |
| `canUpdateAllSettings` | Изменение настроек |
| `canBeAssignedToAgents` | Назначение AI агентам |
| `canBeAssignedToUsers` | Назначение пользователям |
| `canBeAssignedToApiKeys` | Назначение API ключам |

### Object Permissions (per universalIdentifier)

- `canCreateObjectRecords`
- `canReadObjectRecords`
- `canUpdateObjectRecords`
- `canDeleteObjectRecords`

### Permission Flags

- `PermissionFlag.APPLICATIONS`
- `PermissionFlag.WORKFLOW`

### Evaluation Order

1. **Global** (1st, short-circuits) → если есть глобальное разрешение, пропускаем
2. **Object** (2nd) → проверка на уровне объекта
3. **Field** (3rd) → проверка на уровне поля
4. **Permission Flags** (independent) → независимые флаги
