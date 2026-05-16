import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNewsList } from '@/lib/firebase/server-queries';
import NewsCard from '@/components/news/NewsCard';
import { buildPageMetadata } from '@/lib/seo';
import type { News, Locale } from '@/types';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.news' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '/news' });
}

async function safeGetNews(): Promise<News[]> {
  try {
    return await getNewsList(50);
  } catch (err) {
    console.warn('[news] getNewsList failed:', err);
    return [];
  }
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safeGetNews();

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
                margin: '0 auto'
              }}
            >
              <div aria-hidden="true" style={{ fontSize: '3rem', marginBottom: 'var(--s-4)', opacity: 0.5 }}>📰</div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--s-2)', color: 'var(--ink-2)' }}>
                {t('news_page.empty_title')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9375rem' }}>{t('news_page.empty_text')}</p>
            </div>
          ) : (
            <div className="grid grid-3">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} locale={locale as Locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
