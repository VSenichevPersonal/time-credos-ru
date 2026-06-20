/**
 * Auto Contact Enrichment
 *
 * Automatically enriches new contacts with data from external sources
 * and AI-generated insights.
 *
 * Trigger: person.created
 */

import { FunctionConfig, DatabaseEventPayload } from 'twenty-sdk';

interface PersonData {
  id: string;
  name: { firstName: string; lastName: string };
  email?: string;
  phone?: string;
  company?: { id: string; name: string; domainName?: string };
  jobTitle?: string;
  linkedinLink?: string;
}

interface EnrichmentResult {
  jobTitle?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  bio?: string;
  seniority?: string;
  department?: string;
  companyRole?: string;
}

// Simulated enrichment - in production, call Clearbit, Apollo, or similar
async function enrichFromEmail(email: string): Promise<EnrichmentResult | null> {
  // Extract domain for company matching
  const domain = email.split('@')[1];

  // In production: call enrichment API
  // const response = await fetch('https://api.clearbit.com/v2/people/find', {
  //   headers: { Authorization: `Bearer ${process.env.CLEARBIT_API_KEY}` },
  //   body: JSON.stringify({ email })
  // });

  // Return mock data structure
  return {
    seniority: 'unknown',
    department: 'unknown'
  };
}

// AI-powered role analysis based on job title
function analyzeRole(jobTitle: string): { seniority: string; department: string; isDecisionMaker: boolean } {
  const title = jobTitle.toLowerCase();

  // Seniority detection
  let seniority = 'Individual Contributor';
  if (title.includes('chief') || title.includes('ceo') || title.includes('cto') || title.includes('cfo') || title.includes('coo')) {
    seniority = 'C-Level';
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('president')) {
    seniority = 'VP';
  } else if (title.includes('director')) {
    seniority = 'Director';
  } else if (title.includes('manager') || title.includes('head of') || title.includes('lead')) {
    seniority = 'Manager';
  } else if (title.includes('senior') || title.includes('sr.')) {
    seniority = 'Senior';
  }

  // Department detection
  let department = 'Other';
  if (title.includes('sales') || title.includes('account') || title.includes('business development')) {
    department = 'Sales';
  } else if (title.includes('marketing') || title.includes('growth') || title.includes('brand')) {
    department = 'Marketing';
  } else if (title.includes('engineer') || title.includes('developer') || title.includes('architect') || title.includes('technical')) {
    department = 'Engineering';
  } else if (title.includes('product') || title.includes('pm')) {
    department = 'Product';
  } else if (title.includes('finance') || title.includes('accounting') || title.includes('controller')) {
    department = 'Finance';
  } else if (title.includes('hr') || title.includes('human') || title.includes('people') || title.includes('talent')) {
    department = 'HR';
  } else if (title.includes('operations') || title.includes('ops')) {
    department = 'Operations';
  } else if (title.includes('customer') || title.includes('support') || title.includes('success')) {
    department = 'Customer Success';
  }

  // Decision maker detection
  const isDecisionMaker = ['C-Level', 'VP', 'Director'].includes(seniority) ||
    title.includes('founder') || title.includes('owner') || title.includes('partner');

  return { seniority, department, isDecisionMaker };
}

// Generate engagement strategy based on role
function generateEngagementStrategy(roleAnalysis: ReturnType<typeof analyzeRole>): string {
  const { seniority, department, isDecisionMaker } = roleAnalysis;

  if (isDecisionMaker) {
    return `High-priority contact. ${seniority} in ${department}. Focus on ROI and strategic value. Executive-level communication.`;
  }

  if (seniority === 'Manager' || seniority === 'Senior') {
    return `Key influencer. ${seniority} in ${department}. Focus on operational benefits and team impact. May champion internally.`;
  }

  return `Individual contributor in ${department}. Focus on day-to-day benefits. Can provide valuable user perspective.`;
}

export const main = async (event: DatabaseEventPayload<PersonData>) => {
  const { record, client } = event;

  if (!record) {
    return { success: false, error: 'No record provided' };
  }

  const enrichmentData: Record<string, any> = {};

  // 1. Enrich from email if available
  if (record.email) {
    const emailEnrichment = await enrichFromEmail(record.email);
    if (emailEnrichment) {
      Object.assign(enrichmentData, emailEnrichment);
    }
  }

  // 2. Analyze job title if available
  let roleAnalysis = null;
  let engagementStrategy = null;
  if (record.jobTitle) {
    roleAnalysis = analyzeRole(record.jobTitle);
    engagementStrategy = generateEngagementStrategy(roleAnalysis);
  }

  // 3. Create a note with enrichment insights
  if (roleAnalysis || engagementStrategy) {
    const noteContent = [
      '## Auto-Enrichment Results',
      '',
      roleAnalysis ? `**Seniority:** ${roleAnalysis.seniority}` : '',
      roleAnalysis ? `**Department:** ${roleAnalysis.department}` : '',
      roleAnalysis ? `**Decision Maker:** ${roleAnalysis.isDecisionMaker ? 'Yes' : 'No'}` : '',
      '',
      engagementStrategy ? `**Engagement Strategy:** ${engagementStrategy}` : '',
      '',
      `*Auto-generated on ${new Date().toISOString()}*`
    ].filter(Boolean).join('\n');

    await client.mutation({
      createNote: {
        __args: {
          data: {
            title: 'Contact Enrichment',
            body: noteContent,
            // Link to person record
          }
        },
        id: true
      }
    });
  }

  // 4. Create prioritized task if decision maker
  if (roleAnalysis?.isDecisionMaker) {
    await client.mutation({
      createTask: {
        __args: {
          data: {
            title: `Priority: Connect with ${record.name.firstName} ${record.name.lastName} (${roleAnalysis.seniority})`,
            status: 'TODO',
            dueAt: new Date().toISOString(), // Today
          }
        },
        id: true
      }
    });
  }

  return {
    success: true,
    personId: record.id,
    personName: `${record.name.firstName} ${record.name.lastName}`,
    enrichment: {
      roleAnalysis,
      engagementStrategy,
      isDecisionMaker: roleAnalysis?.isDecisionMaker || false
    }
  };
};

export const config: FunctionConfig = {
  universalIdentifier: 'auto-contact-enrichment-001',
  name: 'auto-contact-enrichment',
  description: 'Automatically enriches new contacts with role analysis and engagement strategy',
  timeoutSeconds: 30,
  triggers: [
    { type: 'databaseEvent', eventName: 'person.created' }
  ]
};
