/**
 * Calendar Sync Refresh
 *
 * Periodically checks and refreshes calendar sync status.
 * Ensures calendar events are up-to-date and alerts on sync issues.
 *
 * Trigger: Cron (every 30 minutes during business hours)
 */

import { FunctionConfig } from 'twenty-sdk';

interface ConnectedAccount {
  id: string;
  handle: string;
  provider: string;
  lastSyncHistoryId?: string;
  authFailedAt?: string;
}

interface CalendarChannel {
  id: string;
  handle: string;
  syncStatus: string;
  syncStage: string;
  syncCursor?: string;
  connectedAccountId: string;
}

interface SyncStatus {
  accountId: string;
  handle: string;
  calendarChannels: number;
  lastSync: string | null;
  hasErrors: boolean;
  errorMessage?: string;
}

async function checkCalendarSync(client: any): Promise<SyncStatus[]> {
  // Get all connected accounts
  const accountsResult = await client.query({
    connectedAccounts: {
      __args: { first: 50 },
      edges: {
        node: {
          id: true,
          handle: true,
          provider: true,
          lastSyncHistoryId: true,
          authFailedAt: true
        }
      }
    }
  });

  const accounts = accountsResult.connectedAccounts.edges.map((e: any) => e.node);

  // Get calendar channels
  const channelsResult = await client.query({
    calendarChannels: {
      __args: { first: 100 },
      edges: {
        node: {
          id: true,
          handle: true,
          syncStatus: true,
          syncStage: true,
          syncCursor: true,
          connectedAccountId: true
        }
      }
    }
  });

  const channels = channelsResult.calendarChannels.edges.map((e: any) => e.node);

  // Build sync status for each account
  const statuses: SyncStatus[] = accounts.map((account: ConnectedAccount) => {
    const accountChannels = channels.filter(
      (c: CalendarChannel) => c.connectedAccountId === account.id
    );

    const hasAuthError = !!account.authFailedAt;
    const hasSyncError = accountChannels.some(
      (c: CalendarChannel) => c.syncStatus === 'FAILED'
    );

    let errorMessage: string | undefined;
    if (hasAuthError) {
      errorMessage = 'Authentication failed - reconnection required';
    } else if (hasSyncError) {
      errorMessage = 'Calendar sync failed - check channel settings';
    }

    return {
      accountId: account.id,
      handle: account.handle,
      calendarChannels: accountChannels.length,
      lastSync: account.lastSyncHistoryId ? new Date().toISOString() : null,
      hasErrors: hasAuthError || hasSyncError,
      errorMessage
    };
  });

  return statuses;
}

export const main = async (event: { client: any }) => {
  const { client } = event;

  const statuses = await checkCalendarSync(client);

  // Check for accounts with errors
  const errorAccounts = statuses.filter(s => s.hasErrors);

  // Create alert tasks for accounts with sync issues
  for (const account of errorAccounts) {
    await client.mutation({
      createTask: {
        __args: {
          data: {
            title: `Calendar sync issue: ${account.handle}`,
            body: account.errorMessage,
            status: 'TODO',
            dueAt: new Date().toISOString()
          }
        },
        id: true
      }
    });
  }

  return {
    success: true,
    totalAccounts: statuses.length,
    accountsWithErrors: errorAccounts.length,
    checkedAt: new Date().toISOString(),
    statuses: statuses.map(s => ({
      handle: s.handle,
      channels: s.calendarChannels,
      hasErrors: s.hasErrors
    }))
  };
};

export const config: FunctionConfig = {
  universalIdentifier: 'calendar-sync-refresh-001',
  name: 'calendar-sync-refresh',
  description: 'Monitors calendar sync status and alerts on issues',
  timeoutSeconds: 30,
  triggers: [
    // Every 30 minutes during business hours (9 AM - 6 PM, Mon-Fri)
    { type: 'cron', pattern: '*/30 9-18 * * 1-5' }
  ]
};
