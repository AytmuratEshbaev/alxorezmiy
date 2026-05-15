import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz',
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : [])
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500, headers });
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600;
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

  return NextResponse.json({ token, expire, signature }, { headers });
}
