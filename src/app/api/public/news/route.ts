import { NextResponse } from 'next/server';
import { getNewsPage } from '@/lib/db/queries';
import { jsonError } from '@/lib/http';

/** "Ko'proq yuklash" uchun: ?before=<ISO createdAt>&limit=12 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const before = url.searchParams.get('before') || '';
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 12, 1), 48);
  if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(before)) return jsonError('Invalid cursor', 400);

  try {
    const items = await getNewsPage(before, limit);
    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } }
    );
  } catch (err) {
    console.error('[public/news]', err);
    return jsonError('Server error', 500);
  }
}
