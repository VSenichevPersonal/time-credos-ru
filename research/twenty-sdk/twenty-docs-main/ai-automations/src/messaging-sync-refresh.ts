/**
 * Messaging Sync Refresh
 *
 * Monitors email/messaging sync status and ensures messages are up-to-date.
 * Creates alerts for sync failures and tracks message activity.
 *
 * Trigger: Cron (every 15 minutes during business hours)
 */

import { FunctionConfig } from 'twenty-sdk';

interface MessageChannel {
  id: string;
  handle: string;
  type: string;
  syncStatus: string;
  syncStage: string;
  syncCursor?: string;
  connectedAccountId: string;
}

interface MessageStats {
  channelId: string;
  handle: string;
  type: string;
  syncStatus: string;
  recentMessages: number;
  lastMessageAt: string | null;
}

async function checkMessagingSync(client: any): Promise<{
  channels: MessageStats[];
  totalMessages24h: number;
}> {
  // Get message channels
  const channelsResult = await client.query({
    messageChannels: {
      __args: { first: 100 },
      edges: {
        node: {
          id: true,
          handle: true,
          type: true,
          syncStatus: true,
          syncStage: true,
          connectedAccountId: true
        }
      }
    }
  });

  const channels = channelsResult.messageChannels.edges.map((e: any) => e.node);

  // Get recent messages (last 24 hours)
  const since = new Date();
  since.setHours(since.getHours() - 24);

  const messagesResult = await client.query({
    messages: {
      __args: {
        filter: { receivedAt: { gte: since.toISOString() } },
        first: 100
      },
      edges: {
        node: {
          id: true,
          receivedAt: true,
          messageChannelId: true
        }
      },
      totalCount: true
    }
  });

  const messages = messagesResult.messages.edges.map((e: any) => e.node);
  const totalMessages24h = messagesResult.messages.totalCount || messages.length;

  // Build stats for each channel
  const channelStats: MessageStats[] = channels.map((channel: MessageChannel) => {
    const channelMessages = messages.filter(
      (m: any) => m.messageChannelId === channel.id
    );

    const lastMessage = channelMessages.length > 0
      ? channelMessages.sort((a: any, b: any) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        )[0]
      : null;

    return {
      channelId: channel.id,
      handle: channel.handle,
      type: channel.type,
      syncStatus: channel.syncStatus,
      recentMessages: channelMessages.length,
      lastMessageAt: lastMessage?.receivedAt || null
    };
  });

  return { channels: channelStats, totalMessages24h };
}

export const main = async (event: { client: any }) => {
  const { client } = event;

  const { channels, totalMessages24h } = await checkMessagingSync(client);

  // Check for channels with sync failures
  const failedChannels = channels.filter(
    c => c.syncStatus === 'FAILED' || c.syncStatus === 'FAILED_INSUFFICIENT_PERMISSIONS'
  );

  // Check for inactive channels (no messages in 48+ hours)
  const inactiveThreshold = new Date();
  inactiveThreshold.setHours(inactiveThreshold.getHours() - 48);

  const inactiveChannels = channels.filter(c => {
    if (!c.lastMessageAt) return true;
    return new Date(c.lastMessageAt) < inactiveThreshold;
  });

  // Create alerts for failed channels
  for (const channel of failedChannels) {
    await client.mutation({
      createTask: {
        __args: {
          data: {
            title: `Email sync failed: ${channel.handle}`,
            body: `Sync status: ${channel.syncStatus}. Please reconnect the account.`,
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
    totalChannels: channels.length,
    failedChannels: failedChannels.length,
    inactiveChannels: inactiveChannels.length,
    totalMessages24h,
    checkedAt: new Date().toISOString(),
    summary: {
      activeChannels: channels.length - failedChannels.length - inactiveChannels.length,
      syncIssues: failedChannels.map(c => c.handle)
    }
  };
};

export const config: FunctionConfig = {
  universalIdentifier: 'messaging-sync-refresh-001',
  name: 'messaging-sync-refresh',
  description: 'Monitors email/messaging sync status and alerts on failures',
  timeoutSeconds: 30,
  triggers: [
    // Every 15 minutes during business hours
    { type: 'cron', pattern: '*/15 8-19 * * 1-5' }
  ]
};
