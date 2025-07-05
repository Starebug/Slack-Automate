import { NextRequest, NextResponse } from 'next/server';
import { makeSlackApiCall } from '@/lib/slackTokenManager';

export async function GET(request: NextRequest) {
  try {
    const userInfo = await makeSlackApiCall(request, 'users.info', {
      method: 'POST',
      body: JSON.stringify({
      }),
    });

    if (!userInfo.ok) {
      return NextResponse.json({ error: userInfo.error }, { status: 400 });
    }

    return NextResponse.json({ user: userInfo.user });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 