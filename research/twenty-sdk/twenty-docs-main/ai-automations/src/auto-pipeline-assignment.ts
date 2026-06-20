/**
 * Auto Pipeline Assignment
 *
 * Automatically assigns opportunities to the correct pipeline and stage
 * based on deal size, source, and company attributes.
 *
 * Trigger: opportunity.created
 */

import { FunctionConfig, DatabaseEventPayload } from 'twenty-sdk';

interface OpportunityData {
  id: string;
  name: string;
  amount?: { amountMicros: number; currencyCode: string };
  stage?: string;
  company?: {
    id: string;
    name: string;
    employees?: number;
    domainName?: string;
  };
  createdBy?: { source: string };
}

// Pipeline rules based on deal characteristics
const PIPELINE_RULES = {
  enterprise: {
    minAmount: 50000,
    minEmployees: 500,
    stage: 'QUALIFICATION',
    tasks: ['Schedule discovery call', 'Research company', 'Identify stakeholders']
  },
  midMarket: {
    minAmount: 10000,
    minEmployees: 50,
    stage: 'MEETING',
    tasks: ['Send intro email', 'Schedule demo']
  },
  smb: {
    minAmount: 0,
    minEmployees: 0,
    stage: 'MEETING',
    tasks: ['Send product overview', 'Schedule call']
  }
};

function determineSegment(opportunity: OpportunityData): keyof typeof PIPELINE_RULES {
  const amount = opportunity.amount?.amountMicros ? opportunity.amount.amountMicros / 1000000 : 0;
  const employees = opportunity.company?.employees || 0;

  if (amount >= PIPELINE_RULES.enterprise.minAmount || employees >= PIPELINE_RULES.enterprise.minEmployees) {
    return 'enterprise';
  }
  if (amount >= PIPELINE_RULES.midMarket.minAmount || employees >= PIPELINE_RULES.midMarket.minEmployees) {
    return 'midMarket';
  }
  return 'smb';
}

export const main = async (event: DatabaseEventPayload<OpportunityData>) => {
  const { record, client } = event;

  if (!record) {
    return { success: false, error: 'No record provided' };
  }

  const segment = determineSegment(record);
  const rules = PIPELINE_RULES[segment];

  // Update opportunity with assigned stage
  await client.mutation({
    updateOpportunity: {
      __args: {
        id: record.id,
        data: {
          stage: rules.stage,
          // Add custom field for segment if exists
        }
      },
      id: true,
      stage: true
    }
  });

  // Create follow-up tasks
  const taskPromises = rules.tasks.map((taskTitle, index) =>
    client.mutation({
      createTask: {
        __args: {
          data: {
            title: taskTitle,
            status: 'TODO',
            dueAt: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
            // Link to opportunity
          }
        },
        id: true
      }
    })
  );

  await Promise.all(taskPromises);

  return {
    success: true,
    segment,
    stage: rules.stage,
    tasksCreated: rules.tasks.length,
    opportunityId: record.id
  };
};

export const config: FunctionConfig = {
  universalIdentifier: 'auto-pipeline-assignment-001',
  name: 'auto-pipeline-assignment',
  description: 'Automatically assigns opportunities to pipelines based on deal size and company attributes',
  timeoutSeconds: 30,
  triggers: [
    { type: 'databaseEvent', eventName: 'opportunity.created' }
  ]
};
