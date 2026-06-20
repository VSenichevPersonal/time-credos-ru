# Twenty CRM — Apps Extensibility & AI Integration

> Источник: https://deepwiki.com/twentyhq/twenty/10-development-and-cicd + /10.3

---

## Twenty Apps CLI

| Command | Назначение |
|---------|-----------|
| `yarn twenty app:dev` | Development mode с continuous sync |
| `yarn twenty app:uninstall` | Удаление app из workspace |
| `yarn twenty entity:add` | Guided entity creation |
| `yarn twenty function:logs` | Логи logic functions |
| `yarn twenty function:execute` | Запуск function с параметрами |
| `yarn twenty auth:login` | Аутентификация |

### Scaffolding

```bash
npx create-twenty-app@latest my-app
```

Режимы: `--exhaustive` (default) или `--minimal`.

---

## Entity Detection (AST)

SDK сканирует TypeScript AST для паттернов:

```typescript
export default defineApplication({...})
export default defineObject({...})
export default defineField({...})
export default defineLogicFunction({...})
export default defineRole({...})
export default defineAgent({...})
export default defineSkill({...})
```

---

## App Directory Structure

```
src/
├── application-config.ts     # universalIdentifier, displayName, icon
├── roles/*.role.ts           # Access control
├── objects/*.object.ts       # Custom objects
├── fields/*.field.ts         # Field extensions
├── logic-functions/*.ts      # Business logic
├── front-components/*.tsx    # React UI
├── views/*.view.ts           # Pre-configured views
├── agents/*.agent.ts         # AI agents
├── skills/*.skill.ts         # AI skills
```

---

## Application Config

```typescript
defineApplication({
  universalIdentifier: 'uuid-here',  // Stable UUID
  displayName: 'My App',
  description: '...',
  icon: 'IconName',
  applicationVariables: { ... },     // Env vars for functions
  defaultRoleUniversalIdentifier: 'role-uuid',
})
```

---

## Logic Function Triggers (5 types)

### 1. Route Trigger (HTTP)

REST endpoints under `/s/` prefix.

```typescript
{
  type: 'route',
  httpMethod: 'POST',        // GET, POST, PUT, PATCH, DELETE
  pattern: '/my-endpoint',
  requiresAuthentication: true,
  forwardedRequestHeaders: ['content-type'],
}
```

**RoutePayload (AWS HTTP API v2 format):**

```typescript
{
  headers: Record<string, string>;        // lowercase
  queryStringParameters: Record<string, string>;
  pathParameters: Record<string, string>;
  body: unknown;                          // parsed JSON
  requestContext: {
    http: { method: string; path: string }
  };
}
```

### 2. Cron Trigger

```typescript
{ type: 'cron', pattern: '0 */6 * * *' }  // every 6 hours
```

### 3. Database Event Trigger

```typescript
{
  type: 'database-event',
  event: 'person.updated',        // created, updated, deleted
  fields: ['email', 'phone'],     // optional: specific fields
}
```

### 4. AI Tool Trigger

```typescript
{
  isTool: true,
  toolInputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
}
```

Tool naming: `logic_function_<name>` (lowercase, underscores).

### 5. Installation Hooks

- `definePreInstallLogicFunction()` — validation, prerequisite checks
- `definePostInstallLogicFunction()` — data seeding, setup

**InstallLogicFunctionPayload:** includes previous version string.

---

## Execution Environment

- Auto-generated API clients (`CoreApiClient`, `MetadataApiClient`)
- `TWENTY_API_KEY` injected automatically
- Application variables as env vars

---

## AI Integration

### defineAgent()

```typescript
defineAgent({
  universalIdentifier: 'uuid',
  displayName: 'My Agent',
  name: 'my-agent',
  systemPrompt: '...',
  skillUniversalIdentifiers: ['skill-uuid-1', 'skill-uuid-2'],
})
```

### defineSkill()

```typescript
defineSkill({
  universalIdentifier: 'uuid',
  name: 'my-skill',
  label: 'My Skill',
  instruction: '...',       // AI guidance
  toolCollections: [...],   // Logic functions as tools
})
```

### AI Invocation Points

- AI Chat
- Command Menu
- Workflow Actions

### Thinking Steps

Phase before tool execution for reasoning.

### Supported AI Providers

| Provider |
|----------|
| OpenAI |
| Anthropic |
| Google |
| Groq |
| Mistral |
| XAI |

### Tool Discovery

During app install/update, tools are registered automatically.

---

## Front Components

```typescript
defineFrontComponent({
  universalIdentifier: 'uuid',
  name: 'my-component',
  description: '...',
  component: MyReactComponent,
})
```

Renders within Twenty's UI.

---

## Views

Pre-configured filters, sorts, columns for objects.

---

## Navigation Menu Items

Sidebar links to custom pages/views.
