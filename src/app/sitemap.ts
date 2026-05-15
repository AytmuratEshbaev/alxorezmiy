import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getNewsIds } from '@/lib/firebase/server-queries';

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
  '/contact'
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz').replace(/\/$/, '');
  const now = new Date();

  let newsIds: string[] = [];
  try {
    newsIds = await getNewsIds();
  } catch (err) {
    console.warn('[sitemap] getNewsIds failed:', err);
    newsIds = [];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === '' || path === '/news' ? 'daily' : 'weekly',
        priority: path === '' ? 1 : 0.7
      });
    }
    for (const id of newsIds) {
      entries.push({
        url: `${base}/${locale}/news/${id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5
      });
    }
  }

  return entries;
}
