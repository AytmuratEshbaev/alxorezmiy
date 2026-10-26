import { NextResponse } from 'next/server';
import { getNewsList, getTeachers, getFaq } from '@/lib/db/queries';
import { jsonError } from '@/lib/http';

/** Qidiruv oynasi (Ctrl+K) uchun ixcham indeks: nashr etilgan yangiliklar, ustozlar, FAQ. */
export async function GET() {
  try {
    const [news, teachers, faq] = await Promise.all([getNewsList(50), getTeachers(), getFaq()]);
    return NextResponse.json(
      { news, teachers, faq },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
    );
  } catch (err) {
    console.error('[public/search]', err);
    return jsonError('Server error', 500);
  }
}
