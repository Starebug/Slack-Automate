import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.AUTH_SLACK_ID!;
  const redirectUri = process.env.AUTH_REDIRECT_URI!;
  
  const scopes = [
    'channels:read',
    'groups:read',
    'mpim:read',
    'im:read',
    'chat:write',
    'users:read',
  ].join(',');

  const userScopes = [
    'chat:write',
    'channels:read',
    'groups:read',
    'im:read',
    'mpim:read',
  ].join(',');

  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&user_scope=${encodeURIComponent(userScopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(slackAuthUrl);
} 