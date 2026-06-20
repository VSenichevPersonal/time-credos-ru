/**
 * Deploy All AI Automation Functions
 *
 * This script deploys all automation functions to Twenty CRM
 * via the GraphQL API.
 *
 * Usage:
 *   TWENTY_API_KEY=xxx TWENTY_API_URL=xxx node scripts/deploy-all.js
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.TWENTY_API_URL || 'https://twenty-server-20872127372.us-central1.run.app/graphql';
const API_KEY = process.env.TWENTY_API_KEY;

if (!API_KEY) {
  console.error('Error: TWENTY_API_KEY environment variable is required');
  console.error('Usage: TWENTY_API_KEY=your-api-key node scripts/deploy-all.js');
  process.exit(1);
}

const FUNCTIONS = [
  {
    name: 'auto-pipeline-assignment',
    file: 'auto-pipeline-assignment.ts',
    description: 'Automatically assigns opportunities to pipelines based on deal characteristics'
  },
  {
    name: 'auto-task-generator',
    file: 'auto-task-generator.ts',
    description: 'Creates follow-up tasks when records are created or updated'
  },
  {
    name: 'auto-opportunity-scoring',
    file: 'auto-opportunity-scoring.ts',
    description: 'Calculates opportunity scores based on multiple signals'
  },
  {
    name: 'auto-contact-enrichment',
    file: 'auto-contact-enrichment.ts',
    description: 'Enriches new contacts with role analysis and engagement strategy'
  },
  {
    name: 'daily-activity-summary',
    file: 'daily-activity-summary.ts',
    description: 'Generates daily AI-powered summaries of CRM activity'
  },
  {
    name: 'calendar-sync-refresh',
    file: 'calendar-sync-refresh.ts',
    description: 'Monitors calendar sync status and alerts on issues (every 30 min)'
  },
  {
    name: 'messaging-sync-refresh',
    file: 'messaging-sync-refresh.ts',
    description: 'Monitors email/messaging sync status and alerts on failures (every 15 min)'
  }
];

async function deployFunction(func) {
  const filePath = path.join(__dirname, '..', 'src', func.file);
  const code = fs.readFileSync(filePath, 'utf8');

  const mutation = `
    mutation CreateServerlessFunction($input: CreateServerlessFunctionInput!) {
      createOneServerlessFunction(input: $input) {
        id
        name
        description
      }
    }
  `;

  const variables = {
    input: {
      name: func.name,
      description: func.description,
      code: {
        'src/index.ts': code
      }
    }
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const result = await response.json();

    if (result.errors) {
      console.error(`❌ Failed to deploy ${func.name}:`, result.errors[0].message);
      return false;
    }

    console.log(`✅ Deployed ${func.name} (ID: ${result.data.createOneServerlessFunction.id})`);
    return true;
  } catch (error) {
    console.error(`❌ Error deploying ${func.name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Deploying AI Automation Functions to Twenty CRM');
  console.log(`📍 API URL: ${API_URL}`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const func of FUNCTIONS) {
    const success = await deployFunction(func);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Deployed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
