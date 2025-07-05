import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/dbConnect';
import { Message, MessageDelivery, User } from '@/models';
import { getValidAccessTokenBySlackUserId } from '@/lib/slackTokenManager';
import { getMongoClient } from '@/lib/mongoClient';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const session = getSession(request);
    console.log('[MessageSend] Session:', session);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, message, scheduledTime } = body;

    if (!channelId || !message) {
      return NextResponse.json({ error: 'Channel ID and message are required' }, { status: 400 });
    }

    const user = await User.findOne({ slackUserId: session.slackUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!scheduledTime) {
      try {
        const accessToken = await getValidAccessTokenBySlackUserId(session.slackUserId);
        if (!accessToken) {
          throw new Error('Unable to get valid access token. Please sign out and sign in again.');
        }

        const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: channelId,
            text: message,
          }),
        });

        const responseData = await slackResponse.json();
        console.log('[MessageSend] Slack API response:', responseData);

        if (responseData.ok) {
          const messageRecord = new Message({
            userId: user._id,
            text: message,
          });
          await messageRecord.save();

          const deliveryRecord = new MessageDelivery({
            messageId: messageRecord._id,
            userId: user._id,
            slackUserId: session.slackUserId,
            slackChannelId: channelId,
            type: 'immediate',
            scheduledTime: null,
            status: 'sent',
            attempts: [{
              timestamp: new Date(),
              status: 'success',
              response: responseData
            }]
          });
          await deliveryRecord.save();

          return NextResponse.json({ 
            success: true, 
            messageId: messageRecord._id,
            deliveryId: deliveryRecord._id,
            ts: responseData.ts 
          });
        } else {
          let errorMessage = responseData.error || 'Failed to send message';
          if (responseData.error === 'missing_scope') {
            errorMessage = 'Your Slack app needs additional permissions. Please sign out and sign in again to grant the required permissions.';
          } else if (responseData.error === 'channel_not_found') {
            errorMessage = 'Channel not found. Please check the channel ID and ensure the app is added to the channel.';
          } else if (responseData.error === 'not_in_channel') {
            errorMessage = 'The app is not in this channel. Please add the app to the channel first.';
          } else if (responseData.error === 'token_expired') {
            errorMessage = 'Your Slack connection has expired. Please sign out and sign in again.';
          }
          return NextResponse.json({ 
            error: errorMessage 
          }, { status: 400 });
        }
      } catch (error) {
        throw error;
      }
    } else {
      const messageRecord = new Message({
        userId: user._id,
        text: message,
      });
      await messageRecord.save();

      const deliveryRecord = new MessageDelivery({
        messageId: messageRecord._id,
        userId: user._id,
        slackUserId: session.slackUserId,
        slackChannelId: channelId,
        type: 'scheduled',
        scheduledTime: new Date(scheduledTime),
        status: 'queued',
      });
      await deliveryRecord.save();

      const client = await getMongoClient();
      const db = client.db();
      await db.collection('agendaJobs').insertOne({
        name: 'send-scheduled-message',
        data: { deliveryId: deliveryRecord._id.toString() },
        type: 'normal',
        priority: 0,
        nextRunAt: new Date(scheduledTime),
        lastModifiedBy: null,
        lockedAt: null,
        lastRunAt: null,
        lastFinishedAt: null,
        repeatInterval: null,
        repeatTimezone: null,
        failReason: null,
        failCount: 0,
        failedAt: null,
        disabled: false,
      });

      console.log('[ScheduledMessage] Queued:', {
        userId: user._id.toString(),
        channelId,
        message,
        scheduledTime
      });

      return NextResponse.json({ 
        success: true, 
        messageId: messageRecord._id,
        deliveryId: deliveryRecord._id,
        scheduled: true,
        scheduledTime: scheduledTime
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 