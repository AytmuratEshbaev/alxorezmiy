import { NextResponse } from 'next/server';
import { getSearchIndex } from '@/lib/db/queries';
import { jsonError } from '@/lib/http';
import type { Locale } from '@/types';

const LOCALES: Locale[] = ['uz', 'ru', 'kk', 'en'];

/** Qidiruv oynasi (Ctrl+K) uchun ixcham, tilga moslangan indeks: ?locale=uz */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('locale') as Locale | null;
  const locale: Locale = raw && LOCALES.includes(raw) ? raw : 'uz';
  try {
    return NextResponse.json(await getSearchIndex(locale));
  } catch (err) {
    console.error('[public/search]', err);
    return jsonError('Server error', 500);
  }
}
