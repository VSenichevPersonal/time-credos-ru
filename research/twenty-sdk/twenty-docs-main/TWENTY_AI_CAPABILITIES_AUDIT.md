# Twenty CRM - AI & Automation Capabilities Audit

## Executive Summary

This audit documents all AI, agent, tool, and automation capabilities in the Twenty CRM codebase (`/packages/twenty-server/src/engine/metadata-modules/`) and identifies features that may not be fully utilized in your Google Cloud deployment.

---

## 1. AI Modules Overview

### 1.1 AI Agent System (`ai/ai-agent/`)

**Backend Capabilities:**
- Full CRUD for AI agents (create, read, update, delete)
- Custom agent prompts and configurations
- Response format support (text or JSON schema)
- Model selection per agent (OpenAI, Anthropic, xAI)
- Extended thinking/reasoning for supported models
- Agent execution with 25-step limit

**GraphQL API:**
| Operation | Type | Permission Required |
|-----------|------|---------------------|
| `findManyAgents` | Query | `AI` |
| `findOneAgent` | Query | `AI` |
| `createOneAgent` | Mutation | `AI_SETTINGS` |
| `updateOneAgent` | Mutation | `AI_SETTINGS` |
| `deleteOneAgent` | Mutation | `AI_SETTINGS` |

**Frontend Status:** ✅ Fully integrated (`/pages/settings/ai/`)

---

### 1.2 AI Chat System (`ai/ai-chat/`)

**Backend Capabilities:**
- Thread-based conversation management
- Streaming responses via REST endpoint (`/rest/agent-chat/stream`)
- Dynamic tool loading via `load_tools`
- Dynamic skill loading via `load_skill`
- File upload support for code interpreter
- Context-aware responses (record page, list view)
- AI-generated thread titles
- Usage tracking (tokens, credits)

**REST API:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rest/agent-chat/stream` | POST | Stream chat response |

**GraphQL API:**
| Operation | Type | Description |
|-----------|------|-------------|
| `chatThreads` | Query | Get all threads |
| `chatThread(id)` | Query | Get single thread |
| `chatMessages(threadId)` | Query | Get messages |
| `createChatThread` | Mutation | Create new thread |

**Frontend Status:** ✅ Fully integrated (`/modules/ai/`, command menu)

---

### 1.3 AI Agent Monitor (`ai/ai-agent-monitor/`)

**Backend Capabilities:**
- Turn-by-turn evaluation scoring (0-100)
- AI-based quality assessment with criteria:
  - Task completion
  - Tool usage correctness
  - Response quality
  - Error handling
- Background job processing for evaluations
- Test input execution for agent validation

**GraphQL API:**
| Operation | Type | Description |
|-----------|------|-------------|
| `agentTurns(agentId)` | Query | Get all turns for agent |
| `evaluateAgentTurn(turnId)` | Mutation | Evaluate a turn |
| `runEvaluationInput(agentId, input)` | Mutation | Run test input |

**Frontend Status:** ✅ Integrated (`/pages/settings/ai/SettingsAgentTurnDetail.tsx`)

---

### 1.4 AI Agent Role (`ai/ai-agent-role/`)

**Backend Capabilities:**
- Assign workspace roles to AI agents
- Permission-based tool access for agents
- Role validation (must have `canBeAssignedToAgents`)

**Frontend Status:** ✅ Integrated in role assignment settings

---

### 1.5 AI Billing (`ai/ai-billing/`)

**Backend Capabilities:**
- Per-token cost calculation by model
- Credit-based billing system ($0.000001 = 1 credit)
- Usage event emission for metered billing
- Model-specific pricing

**Billing Formula:**
```
inputCost = (inputTokens / 1000) * model.inputCostPer1kTokensInCents
outputCost = (outputTokens / 1000) * model.outputCostPer1kTokensInCents
credits = (totalCents / 100) * 1,000,000
```

**Frontend Status:** ⚠️ Token usage displayed in chat, but detailed billing UI may be limited

---

### 1.6 AI Models Registry (`ai/ai-models/`)

**Supported Models:**

| Provider | Model | Context | Thinking | Web Search |
|----------|-------|---------|----------|------------|
| OpenAI | GPT-4.1 | 1M | No | Yes |
| OpenAI | GPT-4.1 Mini | 1M | No | Yes |
| OpenAI | o3 | 200K | Yes | Yes |
| OpenAI | o4-mini | 200K | Yes | Yes |
| Anthropic | Claude Opus 4.5 | 200K | Yes | Yes |
| Anthropic | Claude Sonnet 4.5 | 1M | Yes | Yes |
| Anthropic | Claude Haiku 4.5 | 200K | No | Yes |
| xAI | Grok-4.1 Fast | 2M | Yes | Yes + Twitter |
| xAI | Grok-4 | 256K | No | Yes + Twitter |

**Configuration Required:**
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
DEFAULT_AI_SPEED_MODEL_ID=gpt-4.1-mini,claude-haiku-4-5-20251001,grok-3-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4.1,claude-sonnet-4-5-20250929,grok-4
```

---

## 2. Tools Inventory

### 2.1 ACTION Tools (Core)

| Tool | Purpose | Permission Flag |
|------|---------|-----------------|
| `code_interpreter` | Execute Python code in sandbox | `CODE_INTERPRETER_TOOL` |
| `http_request` | Make HTTP requests | `HTTP_REQUEST_TOOL` |
| `send_email` | Send emails via connected accounts | `SEND_EMAIL_TOOL` |
| `search_help_center` | Search Twenty documentation | None (always available) |

**Code Interpreter Features:**
- Python execution in sandboxed environment
- File upload/download support
- Real-time stdout/stderr streaming
- Chart and report generation
- CSV/data analysis

**HTTP Request Features:**
- All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Custom headers and body
- Safe mode blocks private IPs

**Frontend Status:** ✅ Tools table in settings (`/pages/settings/ai/components/SettingsToolsTable.tsx`)

---

### 2.2 DATABASE_CRUD Tools (Per-Object)

For each CRM object, these tools are dynamically generated:
- `find_{objectNamePlural}` - Search records with filtering
- `find_one_{objectNameSingular}` - Get single record by ID
- `create_{objectNameSingular}` - Create new record
- `update_{objectNameSingular}` - Update existing record
- `soft_delete_{objectNameSingular}` - Soft delete record

**Frontend Status:** ✅ Used by AI chat automatically

---

### 2.3 METADATA Tools

| Tool | Purpose |
|------|---------|
| `get_object_metadata` | List objects in workspace |
| `create_object_metadata` | Create custom object |
| `update_object_metadata` | Update object properties |
| `delete_object_metadata` | Delete object |
| `get_field_metadata` | List fields |
| `create_field_metadata` | Create new field |
| `update_field_metadata` | Update field |
| `delete_field_metadata` | Delete field |

**Permission Required:** `DATA_MODEL`

---

### 2.4 VIEW Tools

| Tool | Purpose |
|------|---------|
| `get_views` | List views in workspace |
| `get_view_query_parameters` | Get filter/sort from view |
| `create_view` | Create new view |
| `update_view` | Update view |
| `delete_view` | Delete view |

**Permission Required:** `VIEWS` (for write operations)

---

### 2.5 DASHBOARD Tools

| Tool | Purpose |
|------|---------|
| `create_complete_dashboard` | Create dashboard with widgets |
| `list_dashboards` | List all dashboards |
| `get_dashboard` | Get dashboard with layout |
| `add_dashboard_widget` | Add widget to dashboard |
| `update_dashboard_widget` | Update widget |
| `delete_dashboard_widget` | Delete widget |

**Widget Types:**
- `GRAPH` (AGGREGATE, VERTICAL_BAR, HORIZONTAL_BAR, LINE, PIE)
- `IFRAME`
- `STANDALONE_RICH_TEXT`

**Permission Required:** `LAYOUTS`

---

### 2.6 WORKFLOW Tools

| Tool | Purpose |
|------|---------|
| `create_complete_workflow` | Create workflow with trigger and steps |
| `create_workflow_version_step` | Add step to workflow |
| `update_workflow_version_step` | Update step configuration |
| `delete_workflow_version_step` | Remove step |
| `create_workflow_version_edge` | Create connection between steps |
| `delete_workflow_version_edge` | Delete connection |
| `create_draft_from_workflow_version` | Create draft copy |
| `update_workflow_version_positions` | Update layout |
| `activate_workflow_version` | Activate workflow |
| `deactivate_workflow_version` | Deactivate workflow |
| `compute_step_output_schema` | Get step output schema |

**Permission Required:** `WORKFLOWS`

**Frontend Status:** ✅ Full workflow builder (`/modules/workflow/`)

---

### 2.7 Utility Tools

| Tool | Purpose |
|------|---------|
| `load_tools` | Dynamically load tools by name |
| `load_skill` | Load specialized skills |

---

## 3. Skills System

Skills are **instructional content** that teach the AI how to perform tasks. They are NOT executable - they provide knowledge.

**Built-in Skills:**
- `workflow-building` - Workflow creation guidance
- `data-manipulation` - Data handling instructions
- `dashboard-building` - Dashboard creation help
- `metadata-building` - Schema management guidance
- `research` - Research methodology
- `code-interpreter` - Python coding guidance
- `xlsx` - Excel file processing
- `pdf` - PDF document handling
- `docx` - Word document processing
- `pptx` - PowerPoint processing

**GraphQL API:**
| Operation | Type | Description |
|-----------|------|-------------|
| `skills` | Query | List all skills |
| `skill(id)` | Query | Get single skill |
| `createSkill` | Mutation | Create skill |
| `updateSkill` | Mutation | Update skill |
| `deleteSkill` | Mutation | Delete skill |
| `activateSkill` | Mutation | Activate skill |
| `deactivateSkill` | Mutation | Deactivate skill |

**Frontend Status:** ✅ Fully integrated (`/pages/settings/ai/SettingsSkillForm.tsx`)

---

## 4. Trigger System

### 4.1 Cron Triggers

Execute serverless functions on a schedule.

**Cron Pattern Examples:**
- `0 * * * *` - Every hour
- `0 9 * * *` - Daily at 9 AM
- `0 0 * * 1` - Weekly on Monday

**Frontend Status:** ✅ Integrated in serverless function settings

---

### 4.2 Database Event Triggers

Execute when records change.

**Event Name Patterns:**
- `company.created` - Specific object and operation
- `*.created` - Any object, specific operation
- `company.*` - Specific object, any operation
- `*.*` - All events

**Frontend Status:** ✅ Integrated in serverless function settings

---

### 4.3 Route Triggers (HTTP Endpoints)

Execute via HTTP requests to custom endpoints.

**Path Pattern:** `/s/{path}`

**HTTP Methods:** GET, POST, PUT, PATCH, DELETE

**Frontend Status:** ✅ Integrated in serverless function settings

---

## 5. Serverless Functions

Custom Node.js/TypeScript code execution.

**Features:**
- Version management (draft, published versions)
- Shared dependency layers (npm packages)
- Timeout configuration (1-900 seconds)
- Can be exposed as AI tools (`isTool: true`)
- Input schema definition for tools

**Runtimes:**
- `nodejs22.x` (default)
- `nodejs18.x`

**Frontend Status:** ✅ Full editor (`/pages/settings/serverless-functions/`)

---

## 6. Feature Flags

| Flag | Purpose |
|------|---------|
| `IS_AI_ENABLED` | Main AI functionality toggle |
| `IS_PAGE_LAYOUT_ENABLED` | Dashboard page layouts |
| `IS_RECORD_PAGE_LAYOUT_ENABLED` | Record detail layouts |
| `IS_DASHBOARD_V2_ENABLED` | New dashboard features |
| `IS_IF_ELSE_ENABLED` | Workflow conditionals |
| `IS_WORKFLOW_RUN_STOPPAGE_ENABLED` | Workflow run stopping |
| `IS_ROW_LEVEL_PERMISSION_PREDICATES_ENABLED` | Row-level permissions |

---

## 7. POTENTIALLY UNDERUTILIZED CAPABILITIES

### 7.1 CRITICAL - Check These First

1. **Feature Flag `IS_AI_ENABLED`**
   - Must be enabled for workspace
   - Check in database: `featureFlag` table

2. **API Keys Configuration**
   - `OPENAI_API_KEY` - Required for OpenAI models
   - `ANTHROPIC_API_KEY` - Required for Claude models
   - `XAI_API_KEY` - Required for Grok models
   - At least ONE must be configured

3. **Code Interpreter Driver**
   - Check `CODE_INTERPRETER_DRIVER` environment variable
   - Options: `e2b` (E2B sandbox), `local` (development only)
   - E2B requires `E2B_API_KEY`

4. **Serverless Driver**
   - Check `SERVERLESS_DRIVER` environment variable
   - Required for custom code and triggers

### 7.2 Features That May Need Activation

| Feature | Activation Method | Notes |
|---------|-------------------|-------|
| AI Chat | Feature flag + API key | Check `IS_AI_ENABLED` |
| Agent Creation | Settings > AI | Requires `AI_SETTINGS` permission |
| Skills | Settings > AI > Skills | Custom skills per workspace |
| Serverless Functions | Settings > Functions | Full code editor available |
| Cron Triggers | Functions > Triggers | Scheduled automation |
| Database Event Triggers | Functions > Triggers | Record change automation |
| Route Triggers | Functions > Triggers | Custom HTTP endpoints |
| Dashboards | Create dashboard | Requires `LAYOUTS` permission |
| AI in Workflows | Workflow editor | AI Agent action step |

### 7.3 Advanced Capabilities Often Missed

1. **Dynamic Tool Loading**
   - AI can load additional tools on-demand via `load_tools`
   - Reduces initial prompt size, improves efficiency

2. **Skill-Based Guidance**
   - AI loads specialized knowledge via `load_skill`
   - Custom skills can be created for domain expertise

3. **Agent Monitoring & Evaluation**
   - Turn-by-turn scoring
   - Test input execution
   - Quality metrics

4. **Native Model Capabilities**
   - Web search (OpenAI, Anthropic)
   - Twitter/X search (xAI Grok)
   - Extended thinking (o3, o4-mini, Claude 4.5)

5. **Serverless Functions as AI Tools**
   - Set `isTool: true` on function
   - Define `toolInputSchema`
   - AI can call custom code

---

## 8. Deployment Checklist

### Environment Variables Required

```env
# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...

# Model Defaults
DEFAULT_AI_SPEED_MODEL_ID=gpt-4.1-mini,claude-haiku-4-5-20251001,grok-3-mini
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4.1,claude-sonnet-4-5-20250929,grok-4

# Code Interpreter
CODE_INTERPRETER_DRIVER=e2b
E2B_API_KEY=e2b_...

# Serverless
SERVERLESS_DRIVER=local  # or your serverless provider

# HTTP Tool Safety
HTTP_TOOL_SAFE_MODE_ENABLED=true
```

### Database Feature Flags

Enable in `featureFlag` table for your workspace:
```sql
-- Check current flags
SELECT * FROM core."featureFlag" WHERE "workspaceId" = 'your-workspace-id';

-- Enable AI
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_AI_ENABLED', 'your-workspace-id', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;

-- Enable Dashboards
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_PAGE_LAYOUT_ENABLED', 'your-workspace-id', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;
```

### Permissions to Grant

Ensure roles have these permission flags:
- `AI` - Basic AI chat access
- `AI_SETTINGS` - Agent/skill management
- `CODE_INTERPRETER_TOOL` - Python execution
- `HTTP_REQUEST_TOOL` - HTTP requests
- `SEND_EMAIL_TOOL` - Email sending
- `WORKFLOWS` - Workflow management
- `LAYOUTS` - Dashboard management
- `DATA_MODEL` - Schema management

---

## 9. Verification Steps

1. **Test AI Chat:**
   - Open command menu (Cmd+K)
   - Select "Ask AI"
   - Send a message
   - Verify streaming response

2. **Test Agent Creation:**
   - Go to Settings > AI
   - Create a new agent
   - Test execution

3. **Test Tools:**
   - In AI chat, ask to create a record
   - Verify tool calls are visible

4. **Test Serverless Functions:**
   - Go to Settings > Functions
   - Create a test function
   - Add a trigger
   - Verify execution

5. **Test Workflows:**
   - Go to Workflows
   - Create a workflow with AI Agent step
   - Activate and test

---

## 10. Summary Statistics

| Category | Backend Items | Frontend Integration |
|----------|---------------|---------------------|
| AI Modules | 7 modules | ✅ Full |
| Core Tools | 4 tools | ✅ Full |
| CRUD Tools | 5 per object | ✅ Auto |
| Metadata Tools | 8 tools | ✅ Full |
| View Tools | 5 tools | ✅ Full |
| Dashboard Tools | 6 tools | ✅ Full |
| Workflow Tools | 11 tools | ✅ Full |
| Skills | ~10 built-in | ✅ Full |
| Triggers | 3 types | ✅ Full |
| Feature Flags | 8+ flags | Check DB |

**Total Backend Capabilities:** 50+ distinct tools and modules
**Frontend Coverage:** ~95% integrated

The main gaps are typically **configuration** rather than missing features. Ensure environment variables and feature flags are properly set for your Google Cloud deployment.
