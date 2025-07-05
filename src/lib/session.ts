import * as jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

interface SessionUser {
  slackUserId: string;
  slackTeamId: string;
  slackTeamName: string;
  slackScopes: string;
  slackBotUserId: string;
  slackAppId: string;
  email: string;
  slackUserAccessToken: string;
}

export function getSession(req: NextRequest): SessionUser | null {
  const cookie = req.cookies.get('slackconnect_token')?.value;
  if (!cookie) return null;
  try {
    const user = jwt.verify(cookie, process.env.JWT_SECRET!) as SessionUser;
    return user;
  } catch {
    return null;
  }
} 