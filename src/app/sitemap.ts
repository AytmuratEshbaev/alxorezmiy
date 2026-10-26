import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getNewsList } from '@/lib/db/queries';
import type { News } from '@/types';

// D1'dan so'rov vaqtida o'qiladi (build paytida binding yo'q).
export const dynamic = 'force-dynamic';

const STATIC_PATHS = [
  '',
  '/about',
  '/admission',
  '/directions',
  '/teachers',
  '/news',
  '/achievements',
  '/gallery',
  '/faq',
  '/contact',
];

// Stable fallback for entries with no usable timestamp — avoids a churning
// lastModified that would otherwise change on every build.
const FALLBACK_DATE = new Date('2025-01-01T00:00:00.000Z');

function toDate(ts: string | undefined): Date {
  if (!ts) return FALLBACK_DATE;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? FALLBACK_DATE : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz').replace(/\/$/, '');
  const now = new Date();

  let news: News[] = [];
  try {
    news = await getNewsList(1000);
  } catch (err) {
    console.warn('[sitemap] getNewsList failed:', err);
    news = [];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' || path === '/news' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.7,
      });
    }
    for (const item of news) {
      entries.push({
        url: `${base}/${locale}/news/${item.id}`,
        lastModified: toDate(item.updatedAt || item.createdAt),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  return entries;
}
