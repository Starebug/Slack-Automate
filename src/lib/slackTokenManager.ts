import { access } from 'fs/promises';
import { getMongoClient } from './mongoClient';
import { getSession } from './session';

export async function refreshSlackToken(refreshToken: string) {
  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.AUTH_SLACK_ID!,
        client_secret: process.env.AUTH_SLACK_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Token refresh failed:', data.error);
      return null;
    }

    return {
      access_token: data.authed_user?.access_token,
      access_token_bot: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}

export function isTokenNearExpiry(expiresAt: Date): boolean {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  return expiresAt <= oneHourFromNow;
}

export async function getValidAccessTokenBySlackUserId(slackUserId: string): Promise<string | null> {
  try {
    const client = await getMongoClient();
    const db = client.db();
    const user = await db.collection('users').findOne({ slackUserId });
    if (!user || !user.slackUserAccessToken) {
      console.log('No user or user access token found for slackUserId:', slackUserId);
      return null;
    }

    if (user.tokenExpiresAt && (isTokenExpired(user.tokenExpiresAt) || isTokenNearExpiry(user.tokenExpiresAt))) {
      console.log('User token expired or near expiry for user:', slackUserId);
      if (user.slackRefreshToken) {
        console.log('Attempting to refresh user token for user:', slackUserId);
        const refreshResult = await refreshSlackToken(user.slackRefreshToken);
        if (refreshResult) {
          const newExpiresAt = new Date(Date.now() + (refreshResult.expires_in * 1000));
          await db.collection('users').updateOne(
            { slackUserId },
            {
              $set: {
                slackUserAccessToken: refreshResult.access_token,
                slackAccessToken: refreshResult.access_token_bot,
                slackRefreshToken: refreshResult.refresh_token,
                tokenExpiresAt: newExpiresAt,
              }
            }
          );
          console.log('User token refreshed successfully for user:', slackUserId);
          return refreshResult.access_token;
        } else {
          console.log('User token refresh failed for user:', slackUserId);
          await db.collection('users').updateOne(
            { slackUserId },
            {
              $set: {
                slackUserAccessToken: null,
                slackAccessToken: null,
                slackRefreshToken: null,
                tokenExpiresAt: null,
              }
            }
          );
          return null;
        }
      } else {
        console.log('No refresh token available for user:', slackUserId);
        return null;
      }
    }

    console.log('User token is valid for user:', slackUserId);
    return user.slackUserAccessToken;
  } catch (error) {
    console.error('Error getting valid user access token for slackUserId:', slackUserId, error);
    return null;
  }
}

export async function getValidBotAccessTokenBySlackUserId(slackUserId: string): Promise<string | null> {
  try {
    const client = await getMongoClient();
    const db = client.db();
    const user = await db.collection('users').findOne({ slackUserId });
    if (!user || !user.slackAccessToken) {
      console.log('No user or bot access token found for slackUserId:', slackUserId);
      return null;
    }

    if (user.tokenExpiresAt && (isTokenExpired(user.tokenExpiresAt) || isTokenNearExpiry(user.tokenExpiresAt))) {
      console.log('Bot token expired or near expiry for user:', slackUserId);
      if (user.slackRefreshToken) {
        console.log('Attempting to refresh bot token for user:', slackUserId);
        const refreshResult = await refreshSlackToken(user.slackRefreshToken);
        if (refreshResult) {
          const newExpiresAt = new Date(Date.now() + (refreshResult.expires_in * 1000));
          await db.collection('users').updateOne(
            { slackUserId },
            {
              $set: {
                slackAccessToken: refreshResult.access_token_bot,
                slackRefreshToken: refreshResult.refresh_token,
                tokenExpiresAt: newExpiresAt,
              }
            }
          );
          console.log('Bot token refreshed successfully for user:', slackUserId);
          return refreshResult.access_token_bot;
        } else {
          console.log('Bot token refresh failed for user:', slackUserId);
          await db.collection('users').updateOne(
            { slackUserId },
            {
              $set: {
                slackAccessToken: null,
                slackRefreshToken: null,
                tokenExpiresAt: null,
              }
            }
          );
          return null;
        }
      } else {
        console.log('No bot refresh token available for user:', slackUserId);
        return null;
      }
    }

    console.log('Bot token is valid for user:', slackUserId);
    return user.slackAccessToken;
  } catch (error) {
    console.error('Error getting valid bot access token for slackUserId:', slackUserId, error);
    return null;
  }
}

export async function makeSlackApiCall(req: import('next/server').NextRequest, endpoint: string, options: RequestInit = {}) {
  const session = getSession(req);
  if (!session?.slackUserId) {
    throw new Error('No valid session or slackUserId available');
  }

  const userActionEndpoints = [
    'chat.postMessage',
    'chat.postEphemeral',
    'users.info',
    'conversations.list',
    'conversations.info',
    'conversations.members',
    'conversations.history',
    'conversations.replies',
    'files.upload',
    'files.info',
    'files.list',
    'files.delete',
    'reactions.add',
    'reactions.remove',
    'pins.add',
    'pins.remove',
    'pins.list',
    'stars.add',
    'stars.remove',
    'stars.list',
    'reminders.add',
    'reminders.complete',
    'reminders.delete',
    'reminders.list',
    'reminders.info'
  ];

  const isUserAction = userActionEndpoints.some(userEndpoint => endpoint.includes(userEndpoint));
  
  let accessToken: string | null;
  
  if (isUserAction) {
    accessToken = await getValidAccessTokenBySlackUserId(session.slackUserId);
  } else {
    accessToken = await getValidBotAccessTokenBySlackUserId(session.slackUserId);
  }

  if (!accessToken) {
    throw new Error('No valid access token available');
  }

  const response = await fetch(`https://slack.com/api/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response.json();
} 