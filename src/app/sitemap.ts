import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getNewsSitemapEntries } from '@/lib/db/queries';
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

  let news: Pick<News, 'id' | 'publishedAt' | 'updatedAt'>[] = [];
  try {
    news = await getNewsSitemapEntries();
  } catch (err) {
    console.warn('[sitemap] news query failed:', err);
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
        lastModified: toDate(item.updatedAt || item.publishedAt),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  return entries;
}
