import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ message: 'Signed out' });
  res.headers.append(
    'Set-Cookie',
    'slackconnect_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure'
  );
  return res;
} 