# Twenty CRM AI-Native Deployment

## AI-Native Architecture

This Twenty CRM deployment is designed for **full AI agent control**. Instead of manually entering data or creating views, you chat with an AI agent that can:

- **Create/Update/Delete any record** (companies, people, opportunities, tasks, notes)
- **Build workflows and automations** programmatically
- **Create views and dashboards** on demand
- **Query and analyze data** with natural language
- **Manage pipelines** and move deals between stages
- **Send emails** and manage calendar

### MCP Server Tools (37 tools)

#### Record Operations
| Tool | Description |
|------|-------------|
| `twenty_list_records` | List any object with filtering, sorting, pagination |
| `twenty_get_record` | Get single record by ID |
| `twenty_create_record` | Create new records |
| `twenty_update_record` | Update existing records |
| `twenty_delete_record` | Delete records |
| `twenty_batch_create` | Bulk create up to 60 records |
| `twenty_restore_record` | Restore soft-deleted records |
| `twenty_find_duplicates` | Find potential duplicate records |
| `twenty_merge_records` | Merge duplicate records |

#### Workflow & Automation
| Tool | Description |
|------|-------------|
| `twenty_create_workflow` | Build automation workflows |
| `twenty_run_workflow` | Trigger workflow execution |
| `twenty_activate_workflow` | Activate a workflow |
| `twenty_deactivate_workflow` | Deactivate a workflow |
| `twenty_list_workflow_triggers` | List automated triggers |
| `twenty_get_workflow_runs` | View workflow execution history |

#### Pipeline & Opportunities
| Tool | Description |
|------|-------------|
| `twenty_list_pipeline_stages` | View pipeline stages |
| `twenty_move_opportunity_stage` | Move deals between stages |

#### Dashboards
| Tool | Description |
|------|-------------|
| `twenty_create_dashboard` | Create dashboards |
| `twenty_duplicate_dashboard` | Clone dashboards |

#### Search & Analytics
| Tool | Description |
|------|-------------|
| `twenty_search` | Cross-object search |
| `twenty_aggregate` | Analytics (count, sum, avg, min, max) |
| `twenty_get_timeline` | Get activity timeline for a record |

#### Tasks & Notes
| Tool | Description |
|------|-------------|
| `twenty_create_task` | Create tasks with due dates |
| `twenty_create_note` | Create notes linked to records |

#### Messaging & Email
| Tool | Description |
|------|-------------|
| `twenty_list_message_threads` | List email threads |
| `twenty_get_messages_in_thread` | Get messages in a thread |
| `twenty_send_email` | Send email (via workflow) |
| `twenty_add_to_blocklist` | Block email/domain from sync |
| `twenty_list_blocklist` | List blocked emails/domains |

#### Calendar & Events
| Tool | Description |
|------|-------------|
| `twenty_list_calendar_events` | View upcoming events |

#### Favorites
| Tool | Description |
|------|-------------|
| `twenty_add_favorite` | Add to favorites |

#### Workspace & Members
| Tool | Description |
|------|-------------|
| `twenty_list_workspace_members` | List all users |
| `twenty_get_workspace_member` | Get user details |
| `twenty_list_connected_accounts` | List OAuth connections |

#### Custom Objects & Metadata (AI Schema Control)
| Tool | Description |
|------|-------------|
| `twenty_list_objects` | List all objects (standard + custom) |
| `twenty_get_object_schema` | Get full schema with fields |
| `twenty_create_custom_object` | Create new object types |
| `twenty_add_field_to_object` | Add custom fields |

#### Webhooks
| Tool | Description |
|------|-------------|
| `twenty_create_webhook` | Create real-time webhooks |
| `twenty_list_webhooks` | List all webhooks |
| `twenty_delete_webhook` | Remove webhooks |

---

# Deployment Status

## Current Deployment (GCloud - Cloud Run)

### Infrastructure
| Component | Service | Status | Cost |
|-----------|---------|--------|------|
| Server | Cloud Run (`twenty-server`) | Running | ~$0-20/mo |
| Worker | Compute Engine (`twenty-worker` e2-micro) | Running | ~$5/mo |
| Database | Cloud SQL PostgreSQL (`twenty-postgres` db-g1-small) | Running | ~$30/mo |
| Cache | Memorystore Redis (`twenty-redis`) | Running | ~$35/mo |
| Storage | Cloud Storage (`twenty-crm-split-storage`) | Active | ~$1/mo |
| Network | VPC Connector (`twenty-connector`) | Active | ~$7/mo |
| **Total** | | | **~$70-85/mo** |

### URLs
- **Production**: https://crm.split-llc.com (SSL Active)
- **Direct**: https://twenty-server-20872127372.us-central1.run.app
- **GraphQL API**: https://crm.split-llc.com/graphql
- **REST API**: https://crm.split-llc.com/rest
- **Metadata API**: https://crm.split-llc.com/metadata

### Connection Details
- **Cloud SQL IP**: 104.198.72.168
- **Redis IP**: 10.3.107.75
- **Project**: split-12-08-25
- **Region**: us-central1

---

## Deployed Twenty Apps (9 Apps)

| App | Purpose | Trigger |
|-----|---------|---------|
| stripe-synchronizer-main | Sync Stripe payments | Webhook |
| fireflies-main | Meeting transcript sync | Webhook |
| rollup-engine-main | Aggregate data calculations | Database event |
| last-email-interaction-main | Track last email per contact | Database event |
| meeting-transcript-main | Store meeting transcripts | Webhook |
| ai-meeting-transcript-main | AI analysis of meetings | Database event |
| mailchimp-synchronizer-main | Mailchimp audience sync | Webhook |
| webmetic-main | Website visitor tracking | Webhook |
| activity-summary-main | Summarize contact activity | Cron |

---

## AI Automation Priorities

### Phase 1: Autonomous Record Processing
1. **Auto-Pipeline Assignment** - When opportunity created, assign to pipeline based on deal size/source
2. **Auto-Task Generation** - Create follow-up tasks when records are created/updated
3. **Auto-Contact Enrichment** - Enrich people records with AI-gathered data
4. **Auto-Opportunity Scoring** - Score opportunities based on signals

### Phase 2: Intelligent Workflows
5. **Smart Follow-up Sequences** - AI-driven email sequences based on engagement
6. **Deal Health Monitoring** - Alert on stale deals, suggest actions
7. **Activity Summarization** - Daily/weekly AI summaries per account
8. **Dashboard Auto-Generation** - Create dashboards based on user behavior

### Phase 3: Predictive Intelligence
9. **Win Probability Prediction** - ML-based deal forecasting
10. **Next Best Action** - AI recommends actions per record
11. **Churn Risk Detection** - Identify at-risk accounts
12. **Revenue Forecasting** - Predictive revenue models

---

## Google OAuth Configuration

**Client ID**: `20872127372-kkbdf5aq5ohfsgqtlkkgroqj37amgm43.apps.googleusercontent.com`

**Authorized JavaScript Origins**:
```
https://twenty-server-20872127372.us-central1.run.app
https://crm.split-llc.com
```

**Authorized Redirect URIs**:
```
https://twenty-server-20872127372.us-central1.run.app/auth/google/redirect
https://twenty-server-20872127372.us-central1.run.app/auth/google-apis/get-access-token
https://crm.split-llc.com/auth/google/redirect
https://crm.split-llc.com/auth/google-apis/get-access-token
```

---

## API Access

**API Key**: Create in Twenty UI → Settings → APIs & Webhooks

**GraphQL Endpoint**:
```
POST https://twenty-server-20872127372.us-central1.run.app/graphql
Authorization: Bearer YOUR_API_KEY
```

**Example Query**:
```graphql
query GetCompanies {
  companies(first: 10) {
    edges {
      node {
        id
        name
        domainName
      }
    }
  }
}
```

---

## Workflow Templates Needed

### 1. New Company → Auto Pipeline
```
Trigger: company.created
Actions:
  1. AI: Analyze company (size, industry, potential)
  2. Code: Calculate pipeline assignment
  3. Update Record: Set pipeline stage
  4. Create Task: "Initial outreach" for owner
```

### 2. New Person → Auto Enrichment
```
Trigger: person.created
Actions:
  1. HTTP: Call enrichment API (Clearbit/Apollo)
  2. AI: Generate engagement strategy
  3. Update Record: Add enriched data
  4. Create Task: "Review new contact"
```

### 3. Opportunity Stage Change → Auto Tasks
```
Trigger: opportunity.updated (stage changed)
Actions:
  1. Filter: Check if stage changed
  2. Code: Determine required tasks per stage
  3. Iterator: Create all required tasks
  4. Send Email: Notify stakeholders
```

### 4. Daily Activity Summary
```
Trigger: Cron (0 9 * * *)
Actions:
  1. Search: All activities from last 24h
  2. AI: Summarize by account
  3. Iterator: For each account with activity
  4. Create Note: Attach AI summary
  5. Send Email: Daily digest to owners
```

---

## Commands Reference

### Cloud Run
```bash
# View logs
gcloud run services logs read twenty-server --region=us-central1 --limit=50

# Update env var
gcloud run services update twenty-server --region=us-central1 --update-env-vars="KEY=value"

# Check status
gcloud run services describe twenty-server --region=us-central1
```

### Worker VM
```bash
# SSH into worker
gcloud compute ssh twenty-worker --zone=us-central1-a

# Check container
gcloud compute ssh twenty-worker --zone=us-central1-a --command="docker ps"

# View logs
gcloud compute ssh twenty-worker --zone=us-central1-a --command="docker logs \$(docker ps -q)"
```

### Database
```bash
# Connect to Cloud SQL
gcloud sql connect twenty-postgres --user=postgres

# Backup
gcloud sql export sql twenty-postgres gs://twenty-crm-split-storage/backup.sql --database=default
```

---

## Completed

- [x] SSL certificate for crm.split-llc.com
- [x] Google OAuth redirect URIs configured
- [x] MCP Server with 37 AI tools
- [x] Database upgraded (db-g1-small, max_connections=100)
- [x] VPC egress configured for reliable DB connectivity
- [x] 5 AI automation functions created

## AI Configuration (Azure OpenAI)

| Setting | Value |
|---------|-------|
| Provider | Azure OpenAI |
| Model | gpt-5.2 |
| Reasoning | high |
| Max Tokens | 400,000 |
| Endpoint | https://jacob-4552-resource.openai.azure.com |

### AI Agents Deployed (5)

| Agent | Purpose |
|-------|---------|
| `helper` | Help users learn Twenty CRM |
| `crm-assistant` | Manage companies, contacts, opportunities |
| `data-analyst` | Analyze data, provide insights |
| `workflow-builder` | Create automated workflows |
| `email-composer` | Compose professional emails |

---

## Troubleshooting

### Feature Flag Issues

If `IS_AI_ENABLED` flag shows as disabled despite being set in database:

**Root Cause:** Feature flags are cached in Redis. Direct database changes don't invalidate the cache.

**Solution:** Flush Redis cache via worker VM:
```bash
gcloud compute ssh twenty-worker --zone=us-central1-a --command="docker run --rm redis:alpine redis-cli -h 10.3.107.75 FLUSHALL"
```

### Verify Feature Flags
```bash
# Check database flag
PGPASSWORD='<REDACTED>' psql -h 104.198.72.168 -U postgres -d default -c "SELECT key, value FROM core.\"featureFlag\" WHERE key = 'IS_AI_ENABLED';"
```

---

## MCP Server for AI Agents (Claude Code, etc.)

The MCP server provides 37 tools for AI agent control of Twenty CRM.

### Local Setup (Claude Code / AI Agents)

Add to your Claude Code MCP settings (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "twenty-crm": {
      "command": "node",
      "args": ["/path/to/twenty-docs/mcp-server/dist/index.js"],
      "env": {
        "TWENTY_API_URL": "https://crm.split-llc.com/rest",
        "TWENTY_API_KEY": "YOUR_API_KEY_FROM_TWENTY_SETTINGS"
      }
    }
  }
}
```

### Get API Key

1. Go to https://crm.split-llc.com
2. Settings > APIs & Webhooks
3. Create new API key
4. Copy the key (shown only once)

### Available Tools

Once configured, AI agents can use all 37 MCP tools:
- Record CRUD: `twenty_list_records`, `twenty_create_record`, `twenty_update_record`, `twenty_delete_record`
- Search: `twenty_search`, `twenty_aggregate`
- Workflows: `twenty_create_workflow`, `twenty_run_workflow`, `twenty_activate_workflow`
- Tasks/Notes: `twenty_create_task`, `twenty_create_note`
- Pipeline: `twenty_move_opportunity_stage`
- Schema: `twenty_list_objects`, `twenty_get_object_schema`, `twenty_create_custom_object`

---

## Next Steps - ALL COMPLETED

1. [x] Configure Azure OpenAI credentials
2. [x] Enable IS_AI_ENABLED feature flag
3. [x] Deploy 5 AI agents with gpt-5.2
4. [x] MCP Server ready (37 tools) - Configure in Claude Code
5. [x] AI model settings updated (gpt-5.2, high reasoning)
6. [x] AI automation workflows created (see WORKFLOW_TEMPLATES.md)
7. [x] Webhook integrations configured (9 apps deployed)
8. [x] Calendar/messaging sync cron jobs created

## Deployed Webhook Integrations

| App | Webhook Endpoint | Purpose |
|-----|------------------|---------|
| stripe-synchronizer | `/s/stripe-webhook` | Sync Stripe payments to CRM |
| fireflies | `/s/fireflies-webhook` | Meeting transcript sync |
| mailchimp | `/s/mailchimp-webhook` | Mailchimp audience sync |
| webmetic | `/s/webmetic-webhook` | Website visitor tracking |

All webhook URLs follow pattern: `https://crm.split-llc.com/s/{function-path}`

## Cron Jobs (Scheduled Functions)

| Function | Schedule | Purpose |
|----------|----------|---------|
| `daily-activity-summary` | 8 AM daily | AI-powered CRM summary, stale deal alerts |
| `calendar-sync-refresh` | Every 30 min (9-6 M-F) | Monitor calendar sync, alert on issues |
| `messaging-sync-refresh` | Every 15 min (8-7 M-F) | Monitor email sync, alert on failures |
| `activity-summary-main` | Cron | Summarize contact activity |

### Deploy Cron Functions

```bash
cd ai-automations
export TWENTY_API_KEY=your-api-key
node scripts/deploy-all.js
```

This deploys 7 automation functions:
- 5 database-triggered (record create/update)
- 2 cron-scheduled (sync monitoring)
