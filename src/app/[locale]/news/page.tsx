import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getNewsList } from '@/lib/db/queries';
import NewsCard from '@/components/news/NewsCard';
import NewsLoadMore from '@/components/news/NewsLoadMore';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { buildPageMetadata } from '@/lib/seo';
import { newsDate, safe } from '@/lib/utils';
import type { News, Locale } from '@/types';

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

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // Fetch one extra to know whether a "load more" is warranted.
  const fetched = await safe<News[]>(() => getNewsList(PAGE_SIZE + 1), [], 'news getNewsList');
  const hasMore = fetched.length > PAGE_SIZE;
  const items = fetched.slice(0, PAGE_SIZE);
  // Kursor API bilan bir xil: `${publishedAt}|${id}` (ORDER BY publishedAt DESC, id DESC).
  const last = items[items.length - 1];
  const cursor = hasMore && last ? `${newsDate(last)}|${last.id}` : null;

  return (
    <>
      <PageHeader title={t('news_page.title')} crumbs={[{ label: t('nav.news') }]} />

      <section className="section">
        <div className="container">
          {items.length === 0 ? (
            <EmptyState
              icon="newspaper"
              title={t('news_page.empty_title')}
              text={t('news_page.empty_text')}
            />
          ) : (
            <>
              <h2 className="visually-hidden">{t('nav.news')}</h2>
              <div className="grid grid-3">
                {items.map((item, i) => (
                  <NewsCard key={item.id} item={item} locale={locale as Locale} priority={i < 3} />
                ))}
              </div>
              <NewsLoadMore locale={locale as Locale} initialCursor={cursor} pageSize={PAGE_SIZE} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
