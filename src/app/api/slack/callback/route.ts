import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/UserModel';
import { isTokenNearExpiry, refreshSlackToken } from '@/lib/slackTokenManager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('[Slack OAuth Callback] Query params:', { code, error });

  if (error) {
    console.error('[Slack OAuth Callback] Error param received:', error);
    return NextResponse.redirect('/login?error=slack_oauth_denied');
  }

  if (!code) {
    console.error('[Slack OAuth Callback] No code param received.');
    return NextResponse.redirect('/login?error=missing_code');
  }

  const tokenRequestBody = new URLSearchParams({
    code,
    client_id: process.env.AUTH_SLACK_ID!,
    client_secret: process.env.AUTH_SLACK_SECRET!,
    redirect_uri: process.env.AUTH_REDIRECT_URI!,
  }).toString();

  console.log('[Slack OAuth Callback] Requesting token from Slack:', tokenRequestBody);

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenRequestBody,
  });

  const data = await response.json();
  console.log('[Slack OAuth Callback] Slack token response:', data);

  if (!data.ok) {
    console.error('[Slack OAuth Callback] Slack error:', data.error);
    return NextResponse.redirect('/login?error=slack_oauth_failed');
  }

  let email;
  const userId = data.authed_user?.id;
  const accessToken = data.authed_user?.access_token;
  if (userId && accessToken) {
    try {
      const userInfoResponse = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userInfo = await userInfoResponse.json();
      console.log('[Slack OAuth Callback] Slack user info response:', userInfo);
      
      // Try multiple locations for email
      email = userInfo.user?.profile?.email || 
              userInfo.user?.profile?.email_address ||
              userInfo.user?.email ||
              userInfo.user?.name; // fallback to username
              
      console.log('[Slack OAuth Callback] Extracted email:', email);
      
      if (!userInfo.user?.profile?.email) {
        console.warn('[Slack OAuth Callback] No email found in user profile. Available fields:', 
          Object.keys(userInfo.user?.profile || {}));
      }
    } catch (e) {
      console.error('[Slack OAuth Callback] Failed to fetch user email:', e);
    }
  }

  try {
    await dbConnect();

    const expiresIn = data.expires_in || 3600;
    let tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));

    let slackAccessToken = data.access_token;
    let slackRefreshToken = data.refresh_token;
    let slackUserAccessToken = data.authed_user?.access_token || null;

    if (slackRefreshToken && isTokenNearExpiry(tokenExpiresAt)) {
      const refreshed = await refreshSlackToken(slackRefreshToken);
      if (refreshed) {
        slackAccessToken = refreshed.access_token_bot;
        slackUserAccessToken = refreshed.access_token;
        slackRefreshToken = refreshed.refresh_token;
        tokenExpiresAt = new Date(Date.now() + (refreshed.expires_in * 1000));
      }
    }

    const userData = {
      email,
      slackUserId: userId,
      slackTeamId: data.team?.id,
      slackAccessToken,
      slackRefreshToken,
      slackUserAccessToken,
      tokenExpiresAt,
      scopes: data.scope ? data.scope.split(',') : [],
    };
    console.log('[Slack OAuth Callback] userData to save:', userData);

    const user = await User.findOneAndUpdate(
      { slackUserId: userId },
      { $set: userData },
      { upsert: true, new: true }
    );
    console.log('[Slack OAuth Callback] User DB result:', user);

    const userPayload = {
      slackUserId: userId,
      slackTeamId: data.team?.id,
      slackTeamName: data.team?.name,
      slackScopes: data.scope,
      slackBotUserId: data.bot_user_id,
      slackAppId: data.app_id,
      email,
      slackUserAccessToken,
    };
    console.log('[Slack OAuth Callback] JWT payload:', userPayload);

    const token = jwt.sign(userPayload, process.env.JWT_SECRET!, { expiresIn: '7d' });
    console.log('[Slack OAuth Callback] JWT created.');

    const cookie = serialize('slackconnect_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    console.log('[Slack OAuth Callback] Cookie set.');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    console.log('[Slack OAuth Callback] Redirecting to:', `${baseUrl}/dashboard`);
    const res = NextResponse.redirect(`${baseUrl}/dashboard`);
    res.headers.append('Set-Cookie', cookie);
    return res;

  } catch (error) {
    console.error('[Slack OAuth Callback] Database error:', error);
    return NextResponse.redirect('/login?error=database_error');
  }
} 