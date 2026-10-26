import { NextResponse } from 'next/server';
import { requireAdmin, jsonError, NO_STORE } from '@/lib/http';
import { getCounts } from '@/lib/db/admin-crud';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  try {
    return NextResponse.json(await getCounts(), { headers: NO_STORE });
  } catch (err) {
    console.error('[admin/stats]', err);
    return jsonError('Server error', 500);
  }
}
