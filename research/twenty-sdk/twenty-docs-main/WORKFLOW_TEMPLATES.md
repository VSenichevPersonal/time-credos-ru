# Twenty CRM Workflow Templates

Ready-to-deploy workflow templates for AI-native CRM automation.

## Quick Reference

### Trigger Types

| Trigger | Use Case |
|---------|----------|
| **Record Created** | New lead/company/opportunity notifications |
| **Record Updated** | Stage changes, field updates |
| **Manual** | On-demand actions via Cmd+K |
| **Scheduled (Cron)** | Daily reports, cleanup tasks |
| **Webhook** | External integrations (Stripe, Fireflies) |

### Action Types

| Action | Use Case |
|--------|----------|
| `Create Record` | Auto-create tasks, notes |
| `Update Record` | Stage progression, field updates |
| `Send Email` | Notifications, sequences |
| `Code` | Custom logic, AI integration |
| `HTTP Request` | External API calls |
| `Iterator` | Process multiple records |
| `Filter` | Conditional logic |

---

## Template 1: New Opportunity → Auto Tasks

**Trigger:** Record Created (Opportunity)

**Steps:**
1. **Create Task** - "Research company background" (Due: today)
2. **Create Task** - "Identify decision makers" (Due: +1 day)
3. **Create Task** - "Prepare outreach strategy" (Due: +2 days)
4. **Create Task** - "Schedule discovery call" (Due: +3 days)

**Variable Syntax:**
```
Task Title: "Research {{trigger.opportunity.company.name}}"
Due At: {{trigger.createdAt + 1 day}}
```

---

## Template 2: Stage Change → Email Notification

**Trigger:** Record Updated (Opportunity) - Field: `stage`

**Steps:**
1. **Filter** - Check if stage changed to specific value
2. **Code** - Generate email content
3. **Send Email** - Notify stakeholders

**Filter Condition:**
```javascript
{{trigger.opportunity.stage}} === "WON"
```

---

## Template 3: Daily Pipeline Report (Cron)

**Trigger:** On a Schedule - "0 8 * * 1-5" (8 AM weekdays)

**Steps:**
1. **Search Records** - Get all open opportunities
2. **Code** - Calculate metrics (total value, by stage, stale deals)
3. **Create Note** - Store summary
4. **Send Email** - Daily digest to team

**Code Action:**
```javascript
const opportunities = {{search.opportunities}};
const total = opportunities.reduce((sum, o) => sum + o.amount?.amountMicros / 1000000, 0);
const byStage = {};
opportunities.forEach(o => {
  byStage[o.stage] = (byStage[o.stage] || 0) + 1;
});
return { total, byStage, count: opportunities.length };
```

---

## Template 4: Webhook → CRM Record

**Trigger:** Webhook (POST)

**Steps:**
1. **Code** - Parse webhook payload
2. **Search Records** - Check for existing record
3. **Filter** - If not found, create new
4. **Create Record** - Company/Person from webhook data
5. **Create Task** - Follow-up task

**Example for Stripe webhook:**
```javascript
// Code step: Parse Stripe customer data
const customer = {{trigger.body.data.object}};
return {
  name: customer.name,
  email: customer.email,
  source: 'stripe'
};
```

---

## Template 5: New Contact → AI Enrichment

**Trigger:** Record Created (Person)

**Steps:**
1. **Code** - Build AI prompt
2. **HTTP Request** - Call AI API for role analysis
3. **Update Record** - Add enriched data
4. **Create Task** - Review enriched profile

**HTTP Request Configuration:**
```json
{
  "method": "POST",
  "url": "https://api.openai.com/v1/chat/completions",
  "headers": {
    "Authorization": "Bearer {{secrets.OPENAI_API_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "gpt-4.1-mini",
    "messages": [{
      "role": "user",
      "content": "Analyze this contact: {{trigger.person.name}}, {{trigger.person.jobTitle}}, {{trigger.person.company.name}}. Provide: 1) Likely seniority level 2) Recommended engagement approach"
    }]
  }
}
```

---

## Template 6: Iterator - Bulk Task Creation

**Trigger:** Manual (Bulk)

**Steps:**
1. **Iterator** - For each selected record
2. **Create Task** - Task for each item
3. **Code** - Summary output

**Iterator Configuration:**
- Input: `{{trigger.selectedRecords}}`
- Current Item: `{{iterator.currentItem}}`

**Task in Iterator:**
```
Title: "Follow up with {{iterator.currentItem.name}}"
Due At: {{now + 1 day}}
Linked Record: {{iterator.currentItem.id}}
```

---

## Deployed AI Automations (Serverless Functions)

These are deployed as Twenty serverless functions:

| Function | Trigger | Purpose |
|----------|---------|---------|
| `auto-pipeline-assignment` | opportunity.created | Assigns pipeline stage based on deal size |
| `auto-task-generator` | person/company/opportunity created/updated | Creates contextual follow-up tasks |
| `auto-opportunity-scoring` | opportunity.created/updated | Calculates deal scores (0-100) |
| `auto-contact-enrichment` | person.created | AI analysis of contact roles |
| `daily-activity-summary` | Cron (8 AM daily) | Daily CRM summary + stale deal alerts |

### Deployment

```bash
# Set environment variables
export TWENTY_API_URL=https://crm.split-llc.com/graphql
export TWENTY_API_KEY=your-api-key-from-twenty-settings

# Deploy all functions
cd ai-automations
node scripts/deploy-all.js
```

---

## Variable Reference

| Context | Syntax | Example |
|---------|--------|---------|
| Trigger data | `{{trigger.objectName.field}}` | `{{trigger.company.name}}` |
| Previous step | `{{stepName.field}}` | `{{searchStep.results[0].id}}` |
| Iterator item | `{{iterator.currentItem.field}}` | `{{iterator.currentItem.email}}` |
| Webhook body | `{{trigger.body.field}}` | `{{trigger.body.customer.email}}` |
| Environment | `{{secrets.VAR_NAME}}` | `{{secrets.API_KEY}}` |

---

## Best Practices

1. **Always test with draft** - Workflows should be tested before activation
2. **Use filters early** - Exit early for irrelevant triggers
3. **Rate limits** - 100 runs/min soft limit, 5,000/hour hard limit
4. **Search limits** - Max 200 records per search
5. **Error handling** - Use Code steps to catch and log errors
