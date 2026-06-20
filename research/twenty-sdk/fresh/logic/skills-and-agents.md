> Источник: https://docs.twenty.com/developers/extend/apps/logic/skills-and-agents.md — скачано 2026-06-20

# Skills & Agents

## Overview

Apps can define AI capabilities within the workspace through reusable skill instructions and agents with custom system prompts. **Note:** Skills and agents are currently in alpha.

## defineSkill

Define reusable instructions using `defineSkill()`:

```ts
import { defineSkill } from 'twenty-sdk/define';

export default defineSkill({
  universalIdentifier: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'sales-outreach',
  label: 'Sales Outreach',
  description: 'Guides the AI agent through a structured sales outreach process',
  icon: 'IconBrain',
  content: `You are a sales outreach assistant. When reaching out to a prospect:
1. Research the company and recent news
2. Identify the prospect's role and likely pain points
3. Draft a personalized message referencing specific details
4. Keep the tone professional but conversational`,
});
```

**Key properties:**
- `name`: unique identifier (kebab-case)
- `label`: human-readable display name
- `content`: instructions the AI agent uses
- `icon` (optional): UI icon
- `description` (optional): context about purpose

## defineAgent

Create agents with custom system prompts using `defineAgent()`:

```ts
import { defineAgent } from 'twenty-sdk/define';

export default defineAgent({
  universalIdentifier: 'b3c4d5e6-f7a8-9012-bcde-f34567890123',
  name: 'sales-assistant',
  label: 'Sales Assistant',
  description: 'Helps the sales team draft outreach emails and research prospects',
  icon: 'IconRobot',
  prompt: 'You are a helpful sales assistant. Help users with their questions and tasks.',
});
```

**Key properties:**
- `name`: unique identifier (kebab-case)
- `label`: display name
- `prompt`: system prompt defining behavior
- `description` (optional): context
- `icon` (optional): UI icon
- `modelId` (optional): override default AI model
- `responseFormat` (optional): control output shape

### Structured Output

Force JSON output with schema:

```ts
import { defineAgent } from 'twenty-sdk/define';

export default defineAgent({
  universalIdentifier: 'c4d5e6f7-a8b9-0123-cdef-456789012345',
  name: 'lead-scorer',
  label: 'Lead Scorer',
  prompt: 'Score the lead and explain your reasoning.',
  responseFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', description: 'Lead score from 0 to 100' },
        summary: { type: 'string', description: 'Short reasoning for the score' },
      },
      required: ['score', 'summary'],
      additionalProperties: false,
    },
  },
});
```

**Schema constraints:**
- Properties must use primitive types: `string`, `number`, or `boolean`
- Nested objects and arrays unsupported
- `description` guides model output
- `required` lists mandatory properties
- `additionalProperties: false` forbids undeclared properties

## runAgent

Execute agents from logic functions using `runAgent()`:

```ts
import { runAgent } from 'twenty-sdk/logic-function';

const { result, error, success } = await runAgent({
  agentUniversalIdentifier: 'b3c4d5e6-f7a8-9012-bcde-f34567890123',
  prompt: 'Enrich House Ad <recordId>: fill empty fields from its listing URL.',
});
```

**Key points:**
- Agents run synchronously and can read/update records via built-in tools
- Only apps can run their own agents
- Default app role must include `SystemPermissionFlag.AI` permission
- Set generous `timeoutSeconds` on logic functions
- `success: true` and non-null `result` on completion; `success: false` on failure with `error` details

**Default role example:**
```ts
import { defineApplicationRole, SystemPermissionFlag } from 'twenty-sdk/define';

export default defineApplicationRole({
  universalIdentifier: 'b648f87b-1d26-4961-b974-0908fd991061',
  label: 'Default function role',
  permissionFlagUniversalIdentifiers: [SystemPermissionFlag.AI],
});
```

**Warning:** Avoid loops by scoping database-event triggers to fields agents never write, or guard on whether target fields remain empty before calling `runAgent()`.
