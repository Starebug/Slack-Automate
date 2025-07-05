import Agenda from 'agenda';
import dotenv from 'dotenv';
import path from 'path';
import { ObjectId } from 'mongodb';
import http from 'http';

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

agenda.on('ready', () => {
  console.log('[Worker] Agenda ready!');
  agendaReady = true;
});
agenda.on('error', (err) => {
  console.error('[Worker] Agenda error:', err);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processScheduledMessageJob(job: any, agenda: Agenda) {
  const { deliveryId } = job.attrs.data as { deliveryId: string };
  if (!deliveryId) return;

  const db = agenda._mdb;
  const delivery = await db.collection('messagedeliveries').findOne({ _id: new ObjectId(deliveryId) }) as MessageDelivery | null;
  if (!delivery || delivery.status !== 'queued') return;

  const user = await db.collection('users').findOne({ _id: delivery.userId }) as User | null;
  const message = await db.collection('messages').findOne({ _id: delivery.messageId }) as Message | null;

  if (!user || !user.slackUserId || !user.slackUserAccessToken) {
    await db.collection('messagedeliveries').updateOne(
      { _id: delivery._id },
      {
        $set: { status: 'failed' },
        $push: {
          attempts: { $each: [ {
            timestamp: new Date(),
            status: 'failure',
            error: 'User or slackUserId or access token not found',
          } ] }
        },
      }
    );
    return;
  }

  try {
    const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.slackUserAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: delivery.slackChannelId,
        text: message!.text,
      }),
    });

    const responseData = await slackResponse.json();
    const failCount = (delivery.attempts?.length || 0) + 1;

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
      console.log('[Worker] Message sent successfully for delivery', deliveryId);
    } else {
      if (failCount < 3) {
        await agenda.schedule(new Date(Date.now() + 60 * 1000), 'send-scheduled-message', { deliveryId });
        console.log(`[Worker] Retry scheduled for delivery ${deliveryId} (attempt ${failCount})`);
      }
      await db.collection('messagedeliveries').updateOne(
        { _id: delivery._id },
        {
          $set: { status: 'failed' },
          $push: {
            attempts: { $each: [ {
              timestamp: new Date(),
              status: 'failure',
              error: responseData.error,
              response: responseData,
            } ] }
          },
        }
      );
      console.log('[Worker] Message failed for delivery', deliveryId, 'Error:', responseData.error);
    }
  } catch (error) {
    const failCount = (delivery.attempts?.length || 0) + 1;
    if (failCount < 3) {
      await agenda.schedule(new Date(Date.now() + 60 * 1000), 'send-scheduled-message', { deliveryId });
      console.log(`[Worker] Retry scheduled for delivery ${deliveryId} (attempt ${failCount})`);
    }
    await db.collection('messagedeliveries').updateOne(
      { _id: delivery._id },
      {
        $set: { status: 'failed' },
        $push: {
          attempts: { $each: [ {
            timestamp: new Date(),
            status: 'failure',
            error: error instanceof Error ? error.message : 'Unknown error',
          } ] }
        },
      }
    );
    console.error('[Worker] Error processing delivery', deliveryId, error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
agenda.define('send-scheduled-message', { concurrency: 2 }, async (job: any) => {
  await processScheduledMessageJob(job, agenda);
});

// Create a simple HTTP server for Render health checks
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
    
    // Start HTTP server after Agenda is ready
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Worker] HTTP server listening on port ${PORT}`);
      console.log(`[Worker] Health check available at http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[Worker] Agenda failed to start:', err);
    process.exit(1);
  }
})();

// Graceful shutdown
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