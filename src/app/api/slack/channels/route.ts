import { NextRequest, NextResponse } from 'next/server';
import { makeSlackApiCall } from '@/lib/slackTokenManager';
interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_archived?: boolean;
  num_members?: number;
  topic?: { value: string };
  purpose?: { value: string };
  created?: number;
}

export async function GET(request: NextRequest) {
  try {
    const channelsResponse = await makeSlackApiCall(request, 'conversations.list', {
      method: 'POST',
      body: JSON.stringify({
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 1000,
      }),
    });
    console.log("channelsResponse",channelsResponse);
    if (!channelsResponse.ok) {
      return NextResponse.json({ error: channelsResponse.error }, { status: 400 });
    }

    const channels = channelsResponse.channels.map((channel: SlackChannel) => ({
      id: channel.id,
      name: channel.name,
      is_private: channel.is_private,
      is_archived: channel.is_archived,
      num_members: channel.num_members,
      topic: channel.topic?.value || '',
      purpose: channel.purpose?.value || '',
      created: channel.created,
    }));

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 