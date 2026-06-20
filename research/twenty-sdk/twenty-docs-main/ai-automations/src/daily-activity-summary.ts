/**
 * Daily Activity Summary
 *
 * Generates AI-powered daily summaries of CRM activity:
 * - New records created
 * - Opportunities updated
 * - Tasks completed
 * - Upcoming deadlines
 *
 * Trigger: Cron (daily at 8 AM)
 */

import { FunctionConfig } from 'twenty-sdk';

interface ActivitySummary {
  newCompanies: number;
  newPeople: number;
  newOpportunities: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  totalPipelineValue: number;
  tasksCompleted: number;
  tasksDue: number;
  topOpportunities: Array<{ name: string; amount: number; stage: string }>;
  staleDeals: Array<{ name: string; daysStale: number; amount: number }>;
}

async function getActivitySummary(client: any, since: Date): Promise<ActivitySummary> {
  const sinceISO = since.toISOString();

  // Query new companies
  const companiesResult = await client.query({
    companies: {
      __args: {
        filter: { createdAt: { gte: sinceISO } }
      },
      totalCount: true
    }
  });

  // Query new people
  const peopleResult = await client.query({
    people: {
      __args: {
        filter: { createdAt: { gte: sinceISO } }
      },
      totalCount: true
    }
  });

  // Query opportunities
  const opportunitiesResult = await client.query({
    opportunities: {
      __args: { first: 100 },
      edges: {
        node: {
          id: true,
          name: true,
          amount: true,
          stage: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  const opportunities = opportunitiesResult.opportunities.edges.map((e: any) => e.node);

  // Calculate metrics
  const newOpportunities = opportunities.filter((o: any) =>
    new Date(o.createdAt) >= since
  );

  const wonOpportunities = opportunities.filter((o: any) =>
    o.stage === 'WON' && new Date(o.updatedAt) >= since
  );

  const lostOpportunities = opportunities.filter((o: any) =>
    o.stage === 'LOST' && new Date(o.updatedAt) >= since
  );

  const openOpportunities = opportunities.filter((o: any) =>
    !['WON', 'LOST'].includes(o.stage)
  );

  const totalPipelineValue = openOpportunities.reduce((sum: number, o: any) =>
    sum + (o.amount?.amountMicros || 0) / 1000000, 0
  );

  // Find stale deals (no update in 14+ days)
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 14);

  const staleDeals = openOpportunities
    .filter((o: any) => new Date(o.updatedAt) < staleThreshold)
    .map((o: any) => ({
      name: o.name,
      daysStale: Math.floor((Date.now() - new Date(o.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
      amount: (o.amount?.amountMicros || 0) / 1000000
    }))
    .sort((a: any, b: any) => b.amount - a.amount)
    .slice(0, 5);

  // Top opportunities by value
  const topOpportunities = openOpportunities
    .sort((a: any, b: any) => (b.amount?.amountMicros || 0) - (a.amount?.amountMicros || 0))
    .slice(0, 5)
    .map((o: any) => ({
      name: o.name,
      amount: (o.amount?.amountMicros || 0) / 1000000,
      stage: o.stage
    }));

  // Query tasks
  const tasksResult = await client.query({
    tasks: {
      __args: { first: 100 },
      edges: {
        node: {
          id: true,
          status: true,
          dueAt: true,
          updatedAt: true
        }
      }
    }
  });

  const tasks = tasksResult.tasks.edges.map((e: any) => e.node);

  const tasksCompleted = tasks.filter((t: any) =>
    t.status === 'DONE' && new Date(t.updatedAt) >= since
  ).length;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasksDue = tasks.filter((t: any) =>
    t.status !== 'DONE' && t.dueAt && new Date(t.dueAt) <= tomorrow
  ).length;

  return {
    newCompanies: companiesResult.companies.totalCount || 0,
    newPeople: peopleResult.people.totalCount || 0,
    newOpportunities: newOpportunities.length,
    opportunitiesWon: wonOpportunities.length,
    opportunitiesLost: lostOpportunities.length,
    totalPipelineValue,
    tasksCompleted,
    tasksDue,
    topOpportunities,
    staleDeals
  };
}

function formatSummaryEmail(summary: ActivitySummary, date: string): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return `
# Daily CRM Summary - ${date}

## Overview
| Metric | Count |
|--------|-------|
| New Companies | ${summary.newCompanies} |
| New Contacts | ${summary.newPeople} |
| New Opportunities | ${summary.newOpportunities} |
| Opportunities Won | ${summary.opportunitiesWon} |
| Opportunities Lost | ${summary.opportunitiesLost} |
| Tasks Completed | ${summary.tasksCompleted} |
| Tasks Due Today/Tomorrow | ${summary.tasksDue} |

## Pipeline
**Total Value:** ${formatCurrency(summary.totalPipelineValue)}

### Top Opportunities
${summary.topOpportunities.map((o, i) =>
  `${i + 1}. **${o.name}** - ${formatCurrency(o.amount)} (${o.stage})`
).join('\n')}

### Attention Required - Stale Deals
${summary.staleDeals.length > 0
  ? summary.staleDeals.map(d =>
      `- **${d.name}** - ${formatCurrency(d.amount)} - ${d.daysStale} days without update`
    ).join('\n')
  : 'No stale deals! Great job keeping things moving.'}

---
*Generated automatically by Twenty CRM AI*
  `.trim();
}

export const main = async (event: { client: any }) => {
  const { client } = event;

  // Get activity since yesterday
  const since = new Date();
  since.setDate(since.getDate() - 1);
  since.setHours(0, 0, 0, 0);

  const summary = await getActivitySummary(client, since);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emailContent = formatSummaryEmail(summary, dateStr);

  // Create a note with the summary
  await client.mutation({
    createNote: {
      __args: {
        data: {
          title: `Daily Summary - ${dateStr}`,
          body: emailContent
        }
      },
      id: true
    }
  });

  // If there are stale deals, create alert tasks
  for (const staleDeal of summary.staleDeals) {
    if (staleDeal.daysStale >= 21) { // 3+ weeks stale
      await client.mutation({
        createTask: {
          __args: {
            data: {
              title: `URGENT: Update stale deal "${staleDeal.name}" (${staleDeal.daysStale} days)`,
              status: 'TODO',
              dueAt: new Date().toISOString()
            }
          },
          id: true
        }
      });
    }
  }

  return {
    success: true,
    date: dateStr,
    summary: {
      newRecords: summary.newCompanies + summary.newPeople + summary.newOpportunities,
      pipelineValue: summary.totalPipelineValue,
      staleDealsCount: summary.staleDeals.length,
      tasksDue: summary.tasksDue
    }
  };
};

export const config: FunctionConfig = {
  universalIdentifier: 'daily-activity-summary-001',
  name: 'daily-activity-summary',
  description: 'Generates daily AI-powered summaries of CRM activity with alerts for stale deals',
  timeoutSeconds: 60,
  triggers: [
    { type: 'cron', pattern: '0 8 * * *' } // Daily at 8 AM
  ]
};
