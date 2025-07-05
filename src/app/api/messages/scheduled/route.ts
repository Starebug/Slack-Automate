import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/dbConnect';
import { MessageDelivery, Message, User } from '@/models';
import { agenda } from '@/lib/agenda';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ slackUserId: session.slackUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const scheduledMessages = await MessageDelivery.find({
      slackUserId: session.slackUserId,
      type: 'scheduled',
      status: { $in: ['queued', 'sent', 'failed'] }
    })
    .populate('messageId')
    .sort({ scheduledTime: 1 });

    const formattedMessages = scheduledMessages.map(delivery => ({
      id: delivery._id,
      messageId: delivery.messageId._id,
      text: delivery.messageId.text,
      channelId: delivery.slackChannelId,
      scheduledTime: delivery.scheduledTime,
      status: delivery.status,
      createdAt: delivery.createdAt,
      attempts: delivery.attempts
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('id');

    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID is required' }, { status: 400 });
    }

    const user = await User.findOne({ slackUserId: session.slackUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const delivery = await MessageDelivery.findOne({
      _id: deliveryId,
      slackUserId: session.slackUserId,
      type: 'scheduled',
      status: 'queued'
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Scheduled message not found or cannot be cancelled' }, { status: 404 });
    }

    if (delivery.agendaJobId) {
      await agenda.cancel({ _id: delivery.agendaJobId });
    }

    await MessageDelivery.deleteOne({ _id: deliveryId });
    await Message.deleteOne({ _id: delivery.messageId });

    return NextResponse.json({ 
      success: true, 
      message: 'Scheduled message cancelled and deleted successfully' 
    });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 