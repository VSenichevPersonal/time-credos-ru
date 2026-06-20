# Twenty CRM - AI Feature Activation Plan for Google Cloud

## Overview

This document provides step-by-step instructions to activate ALL AI/agent capabilities in your Google Cloud Twenty deployment.

---

## Phase 1: Environment Configuration

### 1.1 Configure AI Provider API Keys

Add these environment variables to your Google Cloud deployment:

```bash
# Required: At least ONE AI provider API key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxx

# Optional: OpenAI-compatible providers (Ollama, etc.)
OPENAI_COMPATIBLE_BASE_URL=https://your-ollama-instance.com/v1
OPENAI_COMPATIBLE_MODEL_NAMES=llama3.1,mistral,codellama
OPENAI_COMPATIBLE_API_KEY=optional-api-key
```

**For Google Cloud Run:**
```bash
gcloud run services update twenty-server \
  --set-env-vars="OPENAI_API_KEY=sk-proj-xxx,ANTHROPIC_API_KEY=sk-ant-xxx"
```

**For Google Kubernetes Engine:**
```yaml
# Add to your deployment secrets
apiVersion: v1
kind: Secret
metadata:
  name: twenty-ai-secrets
type: Opaque
stringData:
  OPENAI_API_KEY: "sk-proj-xxx"
  ANTHROPIC_API_KEY: "sk-ant-xxx"
```

---

### 1.2 Configure Code Interpreter

For Python code execution in AI chat:

```bash
# Option 1: E2B (Recommended for production)
CODE_INTERPRETER_DRIVER=e2b
E2B_API_KEY=e2b_xxxxxxxxxxxxxxxxxxxxx

# Option 2: Local (Development only - NOT for production)
CODE_INTERPRETER_DRIVER=local
```

**Get E2B API Key:** https://e2b.dev/

---

### 1.3 Configure Serverless Functions

For custom code execution and triggers:

```bash
# Serverless function execution
SERVERLESS_DRIVER=local  # Options: local, lambda

# For AWS Lambda integration:
SERVERLESS_DRIVER=lambda
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

---

### 1.4 Configure Model Defaults

```bash
# Speed-optimized (used for quick operations)
DEFAULT_AI_SPEED_MODEL_ID=gpt-4.1-mini,claude-haiku-4-5-20251001,grok-3-mini

# Performance-optimized (used for complex tasks)
DEFAULT_AI_PERFORMANCE_MODEL_ID=gpt-4.1,claude-sonnet-4-5-20250929,grok-4
```

---

## Phase 2: Enable Feature Flags

### 2.1 Connect to Database

```bash
# Connect to your Cloud SQL instance
gcloud sql connect twenty-db --user=postgres --database=twenty
```

### 2.2 Check Current Feature Flags

```sql
-- List all workspaces
SELECT id, "displayName" FROM core."workspace" WHERE "deletedAt" IS NULL;

-- Check current feature flags for your workspace
SELECT key, value
FROM core."featureFlag"
WHERE "workspaceId" = 'YOUR_WORKSPACE_ID';
```

### 2.3 Enable Required Feature Flags

```sql
-- Replace 'YOUR_WORKSPACE_ID' with your actual workspace ID

-- Enable AI (CRITICAL)
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_AI_ENABLED', 'YOUR_WORKSPACE_ID', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;

-- Enable Dashboard Layouts
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_PAGE_LAYOUT_ENABLED', 'YOUR_WORKSPACE_ID', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;

-- Enable Record Page Layouts
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_RECORD_PAGE_LAYOUT_ENABLED', 'YOUR_WORKSPACE_ID', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;

-- Enable Dashboard V2
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_DASHBOARD_V2_ENABLED', 'YOUR_WORKSPACE_ID', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;

-- Enable Workflow If/Else Conditionals
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_IF_ELSE_ENABLED', 'YOUR_WORKSPACE_ID', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;

-- Enable Workflow Run Stoppage
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_WORKFLOW_RUN_STOPPAGE_ENABLED', 'YOUR_WORKSPACE_ID', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;

-- Enable Row-Level Permission Predicates
INSERT INTO core."featureFlag" ("id", "key", "workspaceId", "value")
VALUES (gen_random_uuid(), 'IS_ROW_LEVEL_PERMISSION_PREDICATES_ENABLED', 'YOUR_WORKSPACE_ID', true)
ON CONFLICT ("key", "workspaceId") DO UPDATE SET value = true;
```

---

## Phase 3: Configure Permissions

### 3.1 Check Role Permissions

```sql
-- Find roles in your workspace
SELECT r.id, r.name, r.label
FROM metadata."role" r
WHERE r."workspaceId" = 'YOUR_WORKSPACE_ID';

-- Check permission flags for a role
SELECT pf.key, pf.value
FROM metadata."permissionFlag" pf
WHERE pf."roleId" = 'YOUR_ROLE_ID';
```

### 3.2 Grant AI Permissions to Roles

Via Twenty UI:
1. Go to **Settings > Security > Roles**
2. Select a role (e.g., "Admin", "Member")
3. In the permissions tab, enable:
   - **AI** - Basic AI chat access
   - **AI Settings** - Agent/skill management
   - **Tools > Code Interpreter** - Python execution
   - **Tools > HTTP Request** - HTTP tool
   - **Tools > Send Email** - Email tool
   - **Workflows** - Workflow management
   - **Layouts** - Dashboard management
   - **Data Model** - Schema management

---

## Phase 4: Create Standard Skills

Skills teach the AI how to perform tasks. Create these in **Settings > AI > Skills**:

### 4.1 Workflow Building Skill

```markdown
Name: workflow-building
Label: Workflow Building
Content:
# Workflow Building Instructions

When building workflows, follow this process:

1. **Understand the Goal**: Ask what the workflow should accomplish
2. **Choose Trigger Type**:
   - DATABASE_EVENT: On record create/update/delete
   - CRON: On schedule
   - MANUAL: User-triggered
   - WEBHOOK: External HTTP trigger

3. **Design Steps**:
   - CODE: Custom JavaScript execution
   - AI_AGENT: AI-powered processing
   - SEND_EMAIL: Email notifications
   - CREATE_RECORD/UPDATE_RECORD/DELETE_RECORD: Database operations
   - IF_ELSE: Conditional branching

4. **Use Variables**: Reference previous step outputs with {{steps.stepName.output}}

5. **Test Before Activating**: Always test with sample data first
```

### 4.2 Data Analysis Skill

```markdown
Name: data-manipulation
Label: Data Analysis
Content:
# Data Manipulation Instructions

When analyzing CRM data:

1. **Use find_* tools** for searching records
2. **Apply filters** for specific criteria:
   - eq: equals
   - neq: not equals
   - like: contains (use % wildcards)
   - gt/gte/lt/lte: comparisons
   - in: multiple values

3. **Code Interpreter** for advanced analysis:
   - Import pandas for DataFrames
   - Use matplotlib/seaborn for charts
   - Export results as CSV/Excel

4. **Respect permissions**: Only access data the user can view
```

### 4.3 Dashboard Building Skill

```markdown
Name: dashboard-building
Label: Dashboard Building
Content:
# Dashboard Building Instructions

When creating dashboards:

1. **Widget Types**:
   - AGGREGATE: Single number KPI
   - VERTICAL_BAR/HORIZONTAL_BAR: Bar charts
   - LINE: Time series
   - PIE: Distribution
   - IFRAME: Embedded content
   - STANDALONE_RICH_TEXT: Text/notes

2. **Grid Layout**: 12-column grid
   - Full width: col=1, colSpan=12
   - Half width: col=1/7, colSpan=6
   - Third width: colSpan=4

3. **Data Configuration**:
   - Select object (company, person, opportunity)
   - Choose field for grouping
   - Select aggregation (COUNT, SUM, AVG, MIN, MAX)

4. **Best Practices**:
   - Group related KPIs together
   - Use consistent color schemes
   - Add descriptive titles
```

---

## Phase 5: Create Standard Agents

Create these AI agents in **Settings > AI > Agents**:

### 5.1 CRM Assistant Agent

```yaml
Name: crm-assistant
Label: CRM Assistant
Prompt: |
  You are a helpful CRM assistant for Twenty. Your role is to help users:

  1. Find and manage records (companies, contacts, opportunities)
  2. Answer questions about their data
  3. Create and update CRM records
  4. Generate reports and summaries

  Always confirm before making changes. Be concise and helpful.

  When searching, use filters to find exactly what the user needs.
  When creating records, ask for required fields if not provided.
Model: default-smart-model
Response Format: text
```

### 5.2 Data Analyst Agent

```yaml
Name: data-analyst
Label: Data Analyst
Prompt: |
  You are a data analyst specializing in CRM data analysis. Your role is:

  1. Analyze sales pipelines and conversion rates
  2. Identify trends in customer data
  3. Generate insights from activity history
  4. Create visualizations using code interpreter

  When analyzing data:
  - Use code_interpreter for complex calculations
  - Create charts with matplotlib/seaborn
  - Provide actionable insights
  - Explain findings in business terms
Model: default-smart-model
Response Format: text
```

### 5.3 Workflow Automation Agent

```yaml
Name: workflow-builder
Label: Workflow Builder
Prompt: |
  You are a workflow automation specialist. Your role is to:

  1. Design automated workflows based on user requirements
  2. Configure triggers (database events, schedules, webhooks)
  3. Set up action steps (code, email, record operations)
  4. Test and validate workflows

  Before building:
  - Clarify the trigger condition
  - Confirm all required actions
  - Identify error handling needs

  Use load_skill to load workflow-building knowledge when needed.
Model: default-smart-model
Response Format: text
```

---

## Phase 6: Verification Testing

### 6.1 Test AI Chat

1. Open Twenty in browser
2. Press **Cmd+K** (or Ctrl+K on Windows)
3. Select **"Ask AI"** or click the AI icon
4. Send: "Hello, what can you help me with?"
5. **Expected**: Streaming response about CRM capabilities

### 6.2 Test Tool Execution

In AI chat, send:
```
Find all companies created in the last 7 days
```
**Expected**: AI calls `find_companies` tool with date filter

### 6.3 Test Code Interpreter

In AI chat, send:
```
Use Python to create a simple bar chart showing 5 random data points
```
**Expected**: AI uses code_interpreter, generates chart, returns image

### 6.4 Test Agent Execution

1. Go to **Settings > AI > Agents**
2. Select an agent
3. Go to **Logs** tab
4. Click **Run Evaluation**
5. Enter test input
6. **Expected**: Agent executes and shows evaluation score

### 6.5 Test Serverless Function

1. Go to **Settings > Functions**
2. Create new function
3. Add code:
```typescript
import { main } from 'src/index';

export async function main(event, context) {
  return { message: 'Hello from serverless!', timestamp: new Date().toISOString() };
}
```
4. **Publish** the function
5. Add a **Route Trigger** with path `/test`
6. Call: `https://your-domain.com/s/test`
7. **Expected**: JSON response with message

### 6.6 Test Workflow

1. Go to **Workflows**
2. Create new workflow
3. Add **Manual Trigger**
4. Add **AI Agent** step
5. Configure agent and prompt
6. **Activate** workflow
7. Run manually
8. **Expected**: Workflow executes AI step

---

## Phase 7: Monitoring & Optimization

### 7.1 Monitor AI Usage

Check chat threads for usage:
```sql
SELECT
  ct.id,
  ct.title,
  ct."totalInputTokens",
  ct."totalOutputTokens",
  ct."totalInputCredits",
  ct."totalOutputCredits",
  ct."createdAt"
FROM metadata."agentChatThread" ct
WHERE ct."workspaceId" = 'YOUR_WORKSPACE_ID'
ORDER BY ct."createdAt" DESC
LIMIT 20;
```

### 7.2 Review Agent Evaluations

```sql
SELECT
  e.id,
  e.score,
  e.comment,
  t."createdAt"
FROM metadata."agentTurnEvaluation" e
JOIN metadata."agentTurn" t ON t.id = e."turnId"
WHERE t."workspaceId" = 'YOUR_WORKSPACE_ID'
ORDER BY t."createdAt" DESC;
```

### 7.3 Check Tool Usage

Review which tools are being called most frequently through the chat logs and agent turns.

---

## Troubleshooting

### AI Chat Not Available

1. Check `IS_AI_ENABLED` feature flag
2. Verify at least one API key is set
3. Check browser console for errors
4. Verify user role has `AI` permission

### Code Interpreter Failing

1. Check `CODE_INTERPRETER_DRIVER` is set
2. Verify E2B API key if using E2B
3. Check `CODE_INTERPRETER_TOOL` permission

### Workflows Not Executing

1. Check workflow is **activated**
2. Verify trigger conditions are met
3. Check `WORKFLOWS` permission
4. Review workflow run logs

### Serverless Functions Not Working

1. Check `SERVERLESS_DRIVER` configuration
2. Verify function is **published** (not draft)
3. Check trigger configuration
4. Review function logs in settings

---

## Summary Checklist

- [ ] AI provider API keys configured (OPENAI/ANTHROPIC/XAI)
- [ ] Code interpreter driver configured (E2B recommended)
- [ ] Serverless driver configured
- [ ] Feature flags enabled in database
- [ ] User roles have AI permissions
- [ ] Standard skills created
- [ ] Standard agents created
- [ ] AI chat tested and working
- [ ] Tool execution tested
- [ ] Code interpreter tested
- [ ] Workflows with AI tested
- [ ] Serverless functions tested

---

## Need Help?

- Twenty Documentation: https://docs.twenty.com
- GitHub Issues: https://github.com/twentyhq/twenty/issues
- Community Discord: https://discord.gg/twenty
