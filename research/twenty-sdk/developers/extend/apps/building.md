# Building Apps with Twenty SDK

> Источник: https://docs.twenty.com/developers/extend/apps/building

## Core Helper Functions

The SDK provides typed building blocks:

| Function | Назначение |
|----------|-----------|
| `defineApplication` | Application metadata |
| `defineObject` | Custom objects with fields |
| `defineLogicFunction` | Logic functions with handlers |
| `definePreInstallLogicFunction` | Pre-installation logic |
| `definePostInstallLogicFunction` | Post-installation logic |
| `defineFrontComponent` | Custom React UI components |
| `defineRole` | Role permissions |
| `defineField` | Field extensions for existing objects |
| `defineView` | Saved views for objects |
| `defineNavigationMenuItem` | Sidebar navigation links |
| `defineSkill` | AI agent skill definitions |

---

## Custom Objects

Objects define both schema and behavior. Each object requires:

- Unique `universalIdentifier` (stable UUID)
- Singular and plural names with labels
- Field definitions with types, labels, descriptions
- Optional description and icon

The platform automatically creates standard fields: `id`, `name`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt`.

---

## Application Configuration (`application-config.ts`)

Every app must have this file:

- Application identifiers and display information
- `defaultRoleUniversalIdentifier` for function permissions
- Optional environment variables exposed to functions
- Optional pre/post-install function references

`universalIdentifier` values are deterministic IDs you generate once and maintain across syncs.

---

## Roles and Permissions

Define roles with object and field-level permissions:

- **Object-level:** read, update, soft delete, destroy
- **Field-level:** read, update
- **Platform-level:** capability flags

Follow **least-privilege** principles — create dedicated roles granting only necessary permissions.

---

## Logic Functions

Export configuration via `defineLogicFunction()`:

- Unique `universalIdentifier`
- Function name and timeout duration
- Handler function implementing the logic
- Optional triggers array

### Trigger Types

#### Route Triggers

Expose functions on HTTP paths under `/s/` endpoint:

- Supports GET, POST, PUT, PATCH, DELETE
- Can require or skip authentication
- Forward specific HTTP headers via `forwardedRequestHeaders`

#### Cron Triggers

Execute functions on schedules using CRON expressions.

#### Database Event Triggers

Run on object lifecycle events (e.g., `person.updated`) with optional specific field monitoring.

### Route Trigger Payload

```typescript
type RoutePayload = {
  headers: Record<string, string>;           // Forwarded HTTP headers (lowercase)
  queryStringParameters: Record<string, string>;
  pathParameters: Record<string, string>;
  body: unknown;                              // Parsed JSON body
  requestContext: {
    http: {
      method: string;
      path: string;
    };
  };
};
```

---

## Pre/Post-Install Functions

- **Pre-install:** Execute before app installation (validation, prerequisite checks)
- **Post-install:** Execute after installation (data seeding, setup)

Both receive `InstallLogicFunctionPayload` with previous version string.

---

## Tools and AI Integration

Make logic functions available to AI agents and workflows:

```typescript
defineLogicFunction({
  isTool: true,
  toolInputSchema: { /* JSON Schema */ },
  // ...
});
```

Tool names: `logic_function_<name>` (lowercase, underscores).

---

## Front Components

Custom React components rendering within Twenty's UI:

```typescript
defineFrontComponent({
  universalIdentifier: '...',
  name: 'my-component',
  description: '...',
  component: MyReactComponent,
});
```

---

## Skills (AI Agent)

```typescript
defineSkill({
  universalIdentifier: '...',
  name: 'my-skill',    // kebab-case
  label: 'My Skill',
  instruction: '...',  // AI guidance text
});
```

---

## Generated Typed Clients

`yarn twenty app:dev` auto-generates two typed clients:

### CoreApiClient

Queries the GraphQL endpoint for workspace data.

### MetadataApiClient

Queries the metadata endpoint for configuration and file uploads.

Both automatically read `TWENTY_API_URL` and `TWENTY_API_KEY` from runtime environment.

### File Upload

```typescript
const result = await metadataApiClient.uploadFile(
  fileBuffer,
  filename,
  contentType,
  fieldUniversalIdentifier
);
// Returns: { id, path, size, createdAt, signedUrl }
```
