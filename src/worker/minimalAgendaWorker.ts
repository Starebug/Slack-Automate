import Agenda from 'agenda';
import dotenv from 'dotenv';
import path from 'path';
import { ObjectId } from 'mongodb';
import http from 'http';
import { getValidAccessTokenBySlackUserId } from '../lib/slackTokenManager';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

interface DeliveryAttempt {
  timestamp: Date;
  status: 'success' | 'failure';
  error?: string;
  response?: unknown;
}

interface MessageDelivery {
  _id: ObjectId;
  userId: ObjectId;
  messageId: ObjectId;
  slackUserId: string;
  slackChannelId: string;
  type: 'immediate' | 'scheduled';
  scheduledTime?: Date;
  status: 'queued' | 'sent' | 'failed' | 'cancelled';
  attempts?: DeliveryAttempt[];
}

interface User {
  _id: ObjectId;
  slackUserId: string;
  slackUserAccessToken: string;
}

interface Message {
  _id: ObjectId;
  text: string;
}

const agenda = new Agenda({
  db: { address: process.env.MONGODB_URI!, collection: 'agendaJobs' },
  processEvery: '10 seconds',
  maxConcurrency: 10,
  defaultConcurrency: 2,
});

let agendaReady = false;
let lastQueueCheck = new Date();

agenda.on('ready', () => {
  console.log('[Worker] Agenda ready!');
  agendaReady = true;
});

agenda.on('error', (err) => {
  console.error('[Worker] Agenda error:', err);
});

agenda.on('start', (job) => {
  console.log(`[Worker] Job started: ${job.attrs.name} (ID: ${job.attrs._id})`);
});

agenda.on('complete', (job) => {
  console.log(`[Worker] Job completed: ${job.attrs.name} (ID: ${job.attrs._id})`);
});

agenda.on('fail', (job, err) => {
  console.error(`[Worker] Job failed: ${job.attrs.name} (ID: ${job.attrs._id})`, err);
});

async function logQueueStatus() {
  try {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - lastQueueCheck.getTime();
    
    if (timeSinceLastCheck >= 30000) {
      const jobs = await agenda.jobs({});
      const queuedJobs = jobs.filter(job => (job.attrs.failCount || 0) === 0);
      const failedJobs = jobs.filter(job => (job.attrs.failCount || 0) > 0);
      const runningJobs = jobs.filter(job => job.attrs.lastRunAt && !job.attrs.failedAt);
      
      console.log(`[Worker] Queue Status (${now.toISOString()}):`);
      console.log(`  - Total jobs: ${jobs.length}`);
      console.log(`  - Queued jobs: ${queuedJobs.length}`);
      console.log(`  - Failed jobs: ${failedJobs.length}`);
      console.log(`  - Running jobs: ${runningJobs.length}`);
      console.log(`  - Time since last check: ${Math.round(timeSinceLastCheck / 1000)}s`);
      
      if (queuedJobs.length > 0) {
        console.log(`  - Next job scheduled for: ${queuedJobs[0].attrs.nextRunAt?.toISOString()}`);
        
        const upcomingJobs = queuedJobs.slice(0, 3);
        upcomingJobs.forEach((job, index) => {
          const timeUntilRun = job.attrs.nextRunAt ? job.attrs.nextRunAt.getTime() - now.getTime() : 0;
          console.log(`    Job ${index + 1}: ${job.attrs.nextRunAt?.toISOString()} (in ${Math.round(timeUntilRun / 1000)}s)`);
        });
      }
      
      lastQueueCheck = now;
    }
  } catch (error) {
    console.error('[Worker] Error checking queue status:', error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processScheduledMessageJob(job: any, agenda: Agenda) {
  const { deliveryId } = job.attrs.data as { deliveryId: string };
  const startTime = new Date();
  let delivery: MessageDelivery | null = null;
  let user: User | null = null;
  let message: Message | null = null;
  let failCount = 0;
  try {
    console.log(`[Worker] Processing scheduled message job for delivery ${deliveryId} at ${startTime.toISOString()}`);
    
    const db = agenda._mdb;
    delivery = await db.collection('messagedeliveries').findOne({ _id: new ObjectId(deliveryId) }) as MessageDelivery | null;
    
    if (!delivery) {
      console.error(`[Worker] Delivery not found for ID: ${deliveryId}`);
      try {
        await db.collection('agendaJobs').deleteOne({ 
          name: 'send-scheduled-message',
          'data.deliveryId': deliveryId 
        });
        console.log(`[Worker] 🗑️ Deleted orphaned job from agendaJobs for delivery ${deliveryId}`);
      } catch (deleteError) {
        console.error(`[Worker] Failed to delete orphaned job from agendaJobs for delivery ${deliveryId}:`, deleteError);
      }
      return;
    }
    
    if (delivery.status !== 'queued') {
      console.log(`[Worker] Delivery ${deliveryId} is not queued (status: ${delivery.status}), skipping`);
      try {
        await db.collection('agendaJobs').deleteOne({ 
          name: 'send-scheduled-message',
          'data.deliveryId': deliveryId 
        });
        console.log(`[Worker] 🗑️ Deleted non-queued job from agendaJobs for delivery ${deliveryId}`);
      } catch (deleteError) {
        console.error(`[Worker] Failed to delete non-queued job from agendaJobs for delivery ${deliveryId}:`, deleteError);
      }
      return;
    }
    
    console.log(`[Worker] Found delivery ${deliveryId}:`, {
      slackUserId: delivery.slackUserId,
      slackChannelId: delivery.slackChannelId,
      type: delivery.type,
      scheduledTime: delivery.scheduledTime,
      attempts: delivery.attempts?.length || 0
    });

    user = await db.collection('users').findOne({ _id: delivery.userId }) as User | null;
    message = await db.collection('messages').findOne({ _id: delivery.messageId }) as Message | null;

    console.log(`[Worker] Lookup results for delivery ${deliveryId}:`, {
      userFound: !!user,
      userSlackId: user?.slackUserId,
      hasAccessToken: !!user?.slackUserAccessToken,
      messageFound: !!message,
      messageLength: message?.text?.length || 0
    });

    if (!user || !user.slackUserId) {
      const errorMsg = !user ? 'User not found' : 'User slackUserId not found';
      
      console.error(`[Worker] Failed to process delivery ${deliveryId}: ${errorMsg}`);
      
      await db.collection('messagedeliveries').updateOne(
        { _id: delivery._id },
        {
          $set: { status: 'failed' },
          $push: {
            attempts: { $each: [ {
              timestamp: new Date(),
              status: 'failure',
              error: errorMsg,
            } ] }
          },
        }
      );
      return;
    }

    console.log(`[Worker] Getting valid access token for user ${user.slackUserId}`);
    const accessToken = await getValidAccessTokenBySlackUserId(user.slackUserId);
    
    if (!accessToken) {
      const errorMsg = 'Unable to get valid access token. Token may be expired and refresh failed.';
      console.error(`[Worker] Failed to process delivery ${deliveryId}: ${errorMsg}`);
      
      await db.collection('messagedeliveries').updateOne(
        { _id: delivery._id },
        {
          $set: { status: 'failed' },
          $push: {
            attempts: { $each: [ {
              timestamp: new Date(),
              status: 'failure',
              error: errorMsg,
            } ] }
          },
        }
      );
      return;
    }

    try {
      console.log(`[Worker] Sending message to Slack for delivery ${deliveryId}:`, {
        channel: delivery.slackChannelId,
        messageLength: message!.text.length,
        userSlackId: user.slackUserId,
        hasValidToken: !!accessToken
      });
      
      const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: delivery.slackChannelId,
          text: message!.text,
        }),
      });

      const responseData = await slackResponse.json();
      failCount = (delivery.attempts?.length || 0) + 1;
      const processingTime = new Date().getTime() - startTime.getTime();
      
      console.log(`[Worker] Slack API response for delivery ${deliveryId} (${processingTime}ms):`, {
        ok: responseData.ok,
        error: responseData.error,
        ts: responseData.ts,
        channel: responseData.channel
      });

      if (responseData.ok) {
        await db.collection('messagedeliveries').updateOne(
          { _id: delivery._id },
          {
            $set: { status: 'sent' },
            $push: {
              attempts: { $each: [ {
                timestamp: new Date(),
                status: 'success',
                response: responseData,
              } ] }
            },
          }
        );
        
        console.log(`[Worker] ✅ Message sent successfully for delivery ${deliveryId} in ${processingTime}ms`);
      } else {
        console.log(`[Worker] ❌ Slack API error for delivery ${deliveryId}: ${responseData.error}`);
        
        let shouldRetry = true; 
        if (responseData.error === 'token_expired' || responseData.error === 'token_revoked') {
          console.log(`[Worker] 🔄 Token expired/revoked for delivery ${deliveryId}, will retry with token refresh`);
         } else if (responseData.error === 'missing_scope' || responseData.error === 'not_authed') {
          console.log(`[Worker] 🚫 Permanent error for delivery ${deliveryId}: ${responseData.error}`);
          shouldRetry = false;
         }
        
        if (shouldRetry && failCount < 3) {
          const retryTime = new Date(Date.now() + 60 * 1000);
          await agenda.schedule(retryTime, 'send-scheduled-message', { deliveryId });
          console.log(`[Worker] 🔄 Retry scheduled for delivery ${deliveryId} (attempt ${failCount}/3) at ${retryTime.toISOString()}`);
        } else {
          console.log(`[Worker] 🚫 Max retries reached or permanent error for delivery ${deliveryId}, deleting failed delivery`);
          
          try {
            await db.collection('messagedeliveries').deleteOne({ _id: delivery._id });
            console.log(`[Worker] 🗑️ Deleted failed delivery from messagedeliveries for delivery ${deliveryId}`);
          } catch (deleteError) {
            console.error(`[Worker] Failed to delete delivery from messagedeliveries for delivery ${deliveryId}:`, deleteError);
          }
          
          try {
            await db.collection('messages').deleteOne({ _id: delivery.messageId });
            console.log(`[Worker] 🗑️ Deleted associated message from messages for delivery ${deliveryId}`);
          } catch (deleteError) {
            console.error(`[Worker] Failed to delete message from messages for delivery ${deliveryId}:`, deleteError);
          }
        }
      }
    } catch (error) {
      const processingTime = new Date().getTime() - startTime.getTime();
      
      console.error(`[Worker] 💥 Exception processing delivery ${deliveryId} after ${processingTime}ms:`, error);
      
      if (failCount < 3) {
        const retryTime = new Date(Date.now() + 60 * 1000);
        await agenda.schedule(retryTime, 'send-scheduled-message', { deliveryId });
        console.log(`[Worker] 🔄 Retry scheduled for delivery ${deliveryId} (attempt ${failCount}/3) at ${retryTime.toISOString()}`);
      } else {
        console.log(`[Worker] 🚫 Max retries reached for delivery ${deliveryId}, deleting failed delivery`);
        try {
          await db.collection('messagedeliveries').deleteOne({ _id: delivery._id });
          console.log(`[Worker] 🗑️ Deleted failed delivery from messagedeliveries for delivery ${deliveryId}`);
        } catch (deleteError) {
          console.error(`[Worker] Failed to delete delivery from messagedeliveries for delivery ${deliveryId}:`, deleteError);
        }
        try {
          await db.collection('messages').deleteOne({ _id: delivery.messageId });
          console.log(`[Worker] 🗑️ Deleted associated message from messages for delivery ${deliveryId}`);
        } catch (deleteError) {
          console.error(`[Worker] Failed to delete message from messages for delivery ${deliveryId}:`, deleteError);
        }
      }
    }
  } catch (error) {
    console.error(`[Worker] 💥 Exception processing job:`, error);
  } finally {
    try {
      console.log(`[Worker] 🔍 [FINALLY] Attempting to remove job from Agenda.js queue for delivery ${deliveryId}`);
      if (typeof job.remove === 'function') {
        await job.remove();
        console.log(`[Worker] 🗑️ [FINALLY] Removed job from Agenda.js queue for delivery ${deliveryId}`);
      } else if (typeof job.delete === 'function') {
        await job.delete();
        console.log(`[Worker] 🗑️ [FINALLY] Deleted job from Agenda.js queue for delivery ${deliveryId}`);
      } else {
        console.log(`[Worker] ⚠️ [FINALLY] No remove/delete method found on job object`);
      }
    } catch (removeError) {
      console.error(`[Worker] [FINALLY] Failed to remove job from Agenda.js queue for delivery ${deliveryId}:`, removeError);
    }
    try {
      const deleteResult = await agenda._mdb.collection('agendaJobs').deleteOne({
        name: 'send-scheduled-message',
        'data.deliveryId': deliveryId
      });
      console.log(`[Worker] 🗑️ [FINALLY] Deleted job from agendaJobs collection for delivery ${deliveryId}. Result:`, deleteResult);
    } catch (deleteError) {
      console.error(`[Worker] [FINALLY] Failed to delete job from agendaJobs collection for delivery ${deliveryId}:`, deleteError);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
agenda.define('send-scheduled-message', { concurrency: 2 }, async (job: any) => {
  await processScheduledMessageJob(job, agenda);
});

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    service: 'slackconnect-worker',
    timestamp: new Date().toISOString(),
    agenda: agendaReady ? 'ready' : 'starting'
  }));
});

const PORT = parseInt(process.env.PORT || '3001', 10);

(async () => {
  console.log('[Worker] About to start Agenda...');
  try {
    const startPromise = agenda.start();
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Agenda start timed out')), 10000));
    await Promise.race([startPromise, timeout]);
    console.log('[Worker] Agenda started');
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Worker] HTTP server listening on port ${PORT}`);
      console.log(`[Worker] Health check available at http://0.0.0.0:${PORT}`);
    });
    
    setInterval(async () => {
      await logQueueStatus();
    }, 10000);
    
    console.log('[Worker] Queue monitoring started (every 10 seconds)');
    
  } catch (err) {
    console.error('[Worker] Agenda failed to start:', err);
    process.exit(1);
  }
})();

process.on('SIGTERM', async () => {
  console.log('[Worker] Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('[Worker] HTTP server closed');
  });
  await agenda.stop();
  console.log('[Worker] Agenda stopped');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('[Worker] HTTP server closed');
  });
  await agenda.stop();
  console.log('[Worker] Agenda stopped');
  process.exit(0);
}); 