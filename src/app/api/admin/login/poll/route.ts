import { NextResponse } from 'next/server';
import { isSameOrigin, readJson, jsonError, NO_STORE } from '@/lib/http';
import { pollApproval } from '@/lib/auth/approval';

/** Brauzer tasdiq so'rovining holatini kuzatadi (kirish va qayta tasdiqlash uchun umumiy). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('Forbidden', 403);
  const body = await readJson<{ id?: unknown }>(req);
  if (typeof body?.id !== 'string' || !/^[\w-]{10,64}$/.test(body.id)) {
    return jsonError('Invalid request ID', 400);
  }
  return NextResponse.json({ status: await pollApproval(body.id) }, { headers: NO_STORE });
}
