import { NextResponse } from 'next/server';
import { getNewsPage, newsCursor } from '@/lib/db/queries';
import { jsonError } from '@/lib/http';

/** "Ko'proq yuklash": ?before=<publishedAt>|<id>&limit=12 → { items, nextCursor } */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const before = url.searchParams.get('before') || '';
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 12, 1), 48);

  const sep = before.lastIndexOf('|');
  const at = before.slice(0, sep);
  if (sep < 1 || !Number.isFinite(Date.parse(at)) || before.length > 120) {
    return jsonError('Invalid cursor', 400);
  }

  try {
    const page = await getNewsPage(before, limit + 1);
    const items = page.slice(0, limit);
    const nextCursor =
      page.length > limit && items.length ? newsCursor(items[items.length - 1]) : null;
    return NextResponse.json({ items, nextCursor });
  } catch (err) {
    console.error('[public/news]', err);
    return jsonError('Server error', 500);
  }
}
