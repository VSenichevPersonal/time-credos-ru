# Twenty CRM MCP Server

AI-native control of Twenty CRM via Model Context Protocol (MCP).

**37 tools** for complete CRM automation.

## Features

This MCP server gives AI agents complete control over Twenty CRM:

### Record Operations (9 tools)
- `twenty_list_records` - List any object with filtering/sorting/pagination
- `twenty_get_record` - Get single record by ID
- `twenty_create_record` - Create new records
- `twenty_update_record` - Update existing records
- `twenty_delete_record` - Delete records
- `twenty_batch_create` - Bulk create up to 60 records
- `twenty_restore_record` - Restore soft-deleted records
- `twenty_find_duplicates` - Find potential duplicates
- `twenty_merge_records` - Merge duplicate records

### Workflow Automation (6 tools)
- `twenty_create_workflow` - Build automation workflows
- `twenty_run_workflow` - Trigger workflow execution
- `twenty_activate_workflow` - Activate a workflow
- `twenty_deactivate_workflow` - Deactivate a workflow
- `twenty_list_workflow_triggers` - List automated triggers
- `twenty_get_workflow_runs` - View execution history

### Pipeline Management
- `twenty_list_pipeline_stages` - View pipeline stages
- `twenty_move_opportunity_stage` - Move deals between stages

### Dashboards
- `twenty_create_dashboard` - Create new dashboards
- `twenty_duplicate_dashboard` - Clone existing dashboards

### Search & Analytics
- `twenty_search` - Cross-object search
- `twenty_aggregate` - Count, sum, avg, min, max operations
- `twenty_get_timeline` - Get activity timeline for any record

### Tasks & Notes
- `twenty_create_task` - Create tasks with due dates
- `twenty_create_note` - Create notes linked to records

### Messaging & Email (5 tools)
- `twenty_list_message_threads` - List email threads
- `twenty_get_messages_in_thread` - Get messages in a thread
- `twenty_send_email` - Send email via workflow
- `twenty_add_to_blocklist` - Block email/domain from sync
- `twenty_list_blocklist` - List blocked items

### Calendar
- `twenty_list_calendar_events` - View upcoming events

### Favorites
- `twenty_add_favorite` - Add records to favorites

### Workspace & Members (3 tools)
- `twenty_list_workspace_members` - List all users
- `twenty_get_workspace_member` - Get user details
- `twenty_list_connected_accounts` - List OAuth connections

### Custom Objects & Metadata (4 tools) - AI Schema Control
- `twenty_list_objects` - List all objects (standard + custom)
- `twenty_get_object_schema` - Get full schema with fields
- `twenty_create_custom_object` - Create new object types
- `twenty_add_field_to_object` - Add custom fields to objects

### Webhooks (3 tools)
- `twenty_create_webhook` - Create real-time webhooks
- `twenty_list_webhooks` - List all webhooks
- `twenty_delete_webhook` - Remove webhooks

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Set environment variables:
```bash
export TWENTY_API_URL=https://crm.split-llc.com/rest
export TWENTY_API_KEY=your-api-key
```

## Usage with Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "twenty-crm": {
      "command": "node",
      "args": ["/path/to/twenty-docs/mcp-server/dist/index.js"],
      "env": {
        "TWENTY_API_URL": "https://crm.split-llc.com/rest",
        "TWENTY_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Transport Options

### 1. Stdio Transport (Local AI Agents - Claude Code, etc.)

For local AI agent use with stdio transport:

```bash
npm start  # or: node dist/index.js
```

### 2. HTTP/SSE Transport (Remote/Production)

For production deployment with HTTP Server-Sent Events:

```bash
npm run start:http  # or: node dist/http-server.js
```

**Endpoints:**
- `GET /` or `GET /health` - Health check
- `GET /sse` - SSE endpoint for MCP connections
- `POST /message` - Message endpoint for SSE transport

## Production Deployment (Cloud Run)

### Quick Deploy

```bash
# Build and push Docker image
docker build -t gcr.io/split-12-08-25/twenty-mcp-server .
docker push gcr.io/split-12-08-25/twenty-mcp-server

# Deploy to Cloud Run
gcloud run deploy twenty-mcp-server \
  --image gcr.io/split-12-08-25/twenty-mcp-server \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3001 \
  --set-env-vars "TWENTY_API_URL=https://crm.split-llc.com/rest" \
  --set-secrets "TWENTY_API_KEY=twenty-api-key:latest"
```

### Production URL

Once deployed: `https://twenty-mcp-server-XXXXX.us-central1.run.app`

**SSE Connection:** `https://twenty-mcp-server-XXXXX.us-central1.run.app/sse`

## Example Conversations

**User:** "Create a new company called Acme Corp"
**AI uses:** `twenty_create_record` with object="companies", data={name: "Acme Corp"}

**User:** "Show me all opportunities over $50k"
**AI uses:** `twenty_list_records` with object="opportunities", filter={amount: {gte: 50000}}

**User:** "Move the TechStart deal to Proposal stage"
**AI uses:** `twenty_move_opportunity_stage` with opportunityId and stage="PROPOSAL"

**User:** "What's our total pipeline value?"
**AI uses:** `twenty_aggregate` with object="opportunities", operation="sum", field="amount"

**User:** "Create a workflow that sends welcome email when company is created"
**AI uses:** `twenty_create_workflow` with trigger and action configuration

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TWENTY_API_URL` | Yes | `https://crm.split-llc.com/rest` | Twenty CRM REST API URL |
| `TWENTY_API_KEY` | Yes | - | Twenty API key from Settings > APIs |
| `PORT` | No | `3001` | HTTP server port |
| `HOST` | No | `0.0.0.0` | HTTP server host |
