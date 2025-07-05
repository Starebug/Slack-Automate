import * as jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export function getSession(req: NextRequest): any | null {
  const cookie = req.cookies.get('slackconnect_token')?.value;
  if (!cookie) return null;
  try {
    const user = jwt.verify(cookie, process.env.JWT_SECRET!);
    return user;
  } catch (e) {
    return null;
  }
} 