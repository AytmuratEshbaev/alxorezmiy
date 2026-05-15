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
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 60 }}>
              {t('news_page.empty')}
            </p>
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
