import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNewsList } from '@/lib/firebase/server-queries';
import NewsCard from '@/components/news/NewsCard';
import NewsLoadMore from '@/components/news/NewsLoadMore';
import Icon from '@/components/ui/Icon';
import { buildPageMetadata } from '@/lib/seo';
import type { News, Locale } from '@/types';

export const revalidate = 60;

const PAGE_SIZE = 12;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.news' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/news',
  });
}

async function safeGetNews(limit: number): Promise<News[]> {
  try {
    return await getNewsList(limit);
  } catch (err) {
    console.warn('[news] getNewsList failed:', err);
    return [];
  }
}

function toISO(ts: string | { toDate: () => Date } | undefined): string | null {
  if (!ts) return null;
  const d = typeof ts === 'object' && 'toDate' in ts ? ts.toDate() : new Date(ts);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // Fetch one extra to know whether a "load more" is warranted.
  const fetched = await safeGetNews(PAGE_SIZE + 1);
  const hasMore = fetched.length > PAGE_SIZE;
  const items = fetched.slice(0, PAGE_SIZE);
  const cursor = items.length > 0 ? toISO(items[items.length - 1].createdAt) : null;

  return (
    <>
      <div className="page-header">
        <h1>{t('news_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.news')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {items.length === 0 ? (
            <div
              role="status"
              style={{
                textAlign: 'center',
                color: 'var(--ink-3)',
                padding: 'var(--s-16) var(--s-4)',
                maxWidth: 480,
                margin: '0 auto',
              }}
            >
              <Icon
                name="newspaper"
                size={48}
                style={{ color: 'var(--ink-4)', marginBottom: 'var(--s-4)' }}
              />
              <h2
                style={{ fontSize: '1.25rem', marginBottom: 'var(--s-2)', color: 'var(--ink-2)' }}
              >
                {t('news_page.empty_title')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9375rem' }}>{t('news_page.empty_text')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-3">
                {items.map((item, i) => (
                  <NewsCard key={item.id} item={item} locale={locale as Locale} priority={i < 3} />
                ))}
              </div>
              <NewsLoadMore
                locale={locale as Locale}
                initialCursor={cursor}
                pageSize={PAGE_SIZE}
                hasMoreInitial={hasMore}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
