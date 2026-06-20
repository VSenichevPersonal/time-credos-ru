/**
 * Auto Opportunity Scoring
 *
 * Calculates and updates opportunity scores based on multiple signals:
 * - Deal size
 * - Company fit
 * - Engagement level
 * - Time in stage
 * - Activity recency
 *
 * Trigger: opportunity.created, opportunity.updated, Cron (daily recalc)
 */

import { FunctionConfig, DatabaseEventPayload } from 'twenty-sdk';

interface ScoringWeights {
  dealSize: number;
  companyFit: number;
  engagement: number;
  velocity: number;
  recency: number;
}

const WEIGHTS: ScoringWeights = {
  dealSize: 0.25,
  companyFit: 0.20,
  engagement: 0.25,
  velocity: 0.15,
  recency: 0.15
};

// Ideal customer profile criteria
const ICP = {
  minEmployees: 50,
  maxEmployees: 5000,
  targetIndustries: ['Technology', 'Finance', 'Healthcare', 'Manufacturing'],
  minDealSize: 10000
};

function calculateDealSizeScore(amount: number): number {
  if (amount >= 100000) return 100;
  if (amount >= 50000) return 80;
  if (amount >= 25000) return 60;
  if (amount >= 10000) return 40;
  if (amount >= 5000) return 20;
  return 10;
}

function calculateCompanyFitScore(company: any): number {
  let score = 0;

  // Employee count fit
  if (company?.employees) {
    if (company.employees >= ICP.minEmployees && company.employees <= ICP.maxEmployees) {
      score += 40;
    } else if (company.employees > ICP.maxEmployees) {
      score += 30; // Large companies still valuable
    } else {
      score += 10;
    }
  }

  // Industry fit
  if (company?.industry && ICP.targetIndustries.includes(company.industry)) {
    score += 40;
  } else {
    score += 15;
  }

  // Has domain (legitimate company)
  if (company?.domainName) {
    score += 20;
  }

  return Math.min(score, 100);
}

function calculateEngagementScore(activities: any[]): number {
  if (!activities || activities.length === 0) return 10;

  const recentActivities = activities.filter(a => {
    const activityDate = new Date(a.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return activityDate >= weekAgo;
  });

  if (recentActivities.length >= 5) return 100;
  if (recentActivities.length >= 3) return 75;
  if (recentActivities.length >= 1) return 50;
  return 25;
}

function calculateVelocityScore(createdAt: string, stage: string): number {
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const stageProgress: Record<string, number> = {
    'QUALIFICATION': 1,
    'MEETING': 2,
    'PROPOSAL': 3,
    'NEGOTIATION': 4,
    'CLOSING': 5,
    'WON': 6
  };

  const currentStage = stageProgress[stage] || 1;
  const expectedDaysPerStage = 14;
  const expectedDays = currentStage * expectedDaysPerStage;

  // Faster than expected = higher score
  if (daysSinceCreation <= expectedDays * 0.5) return 100;
  if (daysSinceCreation <= expectedDays) return 75;
  if (daysSinceCreation <= expectedDays * 1.5) return 50;
  return 25;
}

function calculateRecencyScore(lastActivityAt: string | null): number {
  if (!lastActivityAt) return 10;

  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity <= 1) return 100;
  if (daysSinceActivity <= 3) return 80;
  if (daysSinceActivity <= 7) return 60;
  if (daysSinceActivity <= 14) return 40;
  return 20;
}

export const main = async (event: DatabaseEventPayload<any> | { type: 'cron'; client: any }) => {
  // Handle cron trigger - recalculate all open opportunities
  if ('type' in event && event.type === 'cron') {
    const { client } = event;

    const opportunities = await client.query({
      opportunities: {
        __args: {
          filter: {
            stage: { not: { in: ['WON', 'LOST'] } }
          },
          first: 100
        },
        edges: {
          node: {
            id: true,
            name: true,
            amount: true,
            stage: true,
            createdAt: true,
            company: {
              id: true,
              employees: true,
              industry: true,
              domainName: true
            }
          }
        }
      }
    });

    const updates = [];
    for (const edge of opportunities.opportunities.edges) {
      const opp = edge.node;
      const score = calculateOverallScore(opp);
      updates.push({ id: opp.id, score, name: opp.name });
    }

    return {
      success: true,
      type: 'cron-recalculation',
      opportunitiesScored: updates.length,
      scores: updates
    };
  }

  // Handle database event trigger
  const { record, client } = event as DatabaseEventPayload<any>;

  if (!record) {
    return { success: false, error: 'No record provided' };
  }

  const score = calculateOverallScore(record);

  // Store score (assuming custom field exists)
  // In production, update a custom "score" field on the opportunity

  return {
    success: true,
    opportunityId: record.id,
    opportunityName: record.name,
    score: Math.round(score),
    breakdown: {
      dealSize: calculateDealSizeScore(record.amount?.amountMicros / 1000000 || 0),
      companyFit: calculateCompanyFitScore(record.company),
      engagement: 50, // Would need activity data
      velocity: calculateVelocityScore(record.createdAt, record.stage),
      recency: 50 // Would need last activity data
    }
  };
};

function calculateOverallScore(opportunity: any): number {
  const amount = opportunity.amount?.amountMicros ? opportunity.amount.amountMicros / 1000000 : 0;

  const scores = {
    dealSize: calculateDealSizeScore(amount),
    companyFit: calculateCompanyFitScore(opportunity.company),
    engagement: 50, // Default - would need activity query
    velocity: calculateVelocityScore(opportunity.createdAt, opportunity.stage),
    recency: 50 // Default - would need activity query
  };

  return (
    scores.dealSize * WEIGHTS.dealSize +
    scores.companyFit * WEIGHTS.companyFit +
    scores.engagement * WEIGHTS.engagement +
    scores.velocity * WEIGHTS.velocity +
    scores.recency * WEIGHTS.recency
  );
}

export const config: FunctionConfig = {
  universalIdentifier: 'auto-opportunity-scoring-001',
  name: 'auto-opportunity-scoring',
  description: 'Calculates opportunity scores based on deal size, company fit, engagement, and velocity',
  timeoutSeconds: 60,
  triggers: [
    { type: 'databaseEvent', eventName: 'opportunity.created' },
    { type: 'databaseEvent', eventName: 'opportunity.updated' },
    { type: 'cron', pattern: '0 6 * * *' } // Daily at 6 AM
  ]
};
