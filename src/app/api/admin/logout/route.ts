import { NextResponse } from 'next/server';
import { isSameOrigin, jsonError } from '@/lib/http';
import { destroySession } from '@/lib/auth/session';

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('Forbidden', 403);
  await destroySession();
  return NextResponse.json({ ok: true });
}
