import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getMongoClient } from '@/lib/mongoClient';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db();

    const sentDeliveries = await db.collection('messagedeliveries')
      .find({
        slackUserId: session.slackUserId,
        status: 'sent'
      })
      .sort({ createdAt: -1 })
      .toArray();

    const messageIds = sentDeliveries.map(delivery => delivery.messageId);
    const messages = await db.collection('messages')
      .find({ _id: { $in: messageIds } })
      .toArray();

    const messageMap = new Map();
    messages.forEach(message => {
      messageMap.set(message._id.toString(), message);
    });

    const formattedMessages = sentDeliveries.map(delivery => {
      const message = messageMap.get(delivery.messageId.toString());
      const lastAttempt = delivery.attempts && delivery.attempts.length > 0 
        ? delivery.attempts[delivery.attempts.length - 1] 
        : null;

      return {
        id: delivery._id,
        messageId: delivery.messageId,
        text: message ? message.text : 'Message not found',
        channelId: delivery.slackChannelId,
        type: delivery.type,
        status: delivery.status,
        createdAt: delivery.createdAt,
        sentAt: lastAttempt ? lastAttempt.timestamp : delivery.createdAt,
        attempts: delivery.attempts || []
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 