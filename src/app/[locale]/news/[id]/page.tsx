import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNewsById, getNewsIds, getNewsList } from '@/lib/firebase/server-queries';
import { getLocalizedField, formatDate, formatDateISO, readingTimeMinutes } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import { routing } from '@/i18n/routing';
import { buildPageMetadata } from '@/lib/seo';
import NewsCard from '@/components/news/NewsCard';
import NewsShareButtons from '@/components/news/NewsShareButtons';
import type { Locale, News } from '@/types';

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const ids = await getNewsIds();
    return routing.locales.flatMap((locale) => ids.map((id) => ({ locale, id })));
  } catch (err) {
    console.warn('[news/[id]] generateStaticParams failed:', err);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  try {
    const item = await getNewsById(id);
    if (!item) return {};
    const title = getLocalizedField(item, 'title', locale as Locale);
    const content = getLocalizedField(item, 'content', locale as Locale);
    const image = item.image ? transformImage(item.image, { width: 1200 }) : undefined;
    return buildPageMetadata({
      locale,
      title,
      description: content.substring(0, 160),
      path: `/news/${id}`,
      image
    });
  } catch (err) {
    console.warn('[news/[id]] generateMetadata failed:', err);
    return {};
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let item: News | null = null;
  try {
    item = await getNewsById(id);
  } catch (err) {
    console.warn('[news/[id]] getNewsById failed:', err);
  }
  if (!item || item.status !== 'published') notFound();

  const title = getLocalizedField(item, 'title', locale as Locale);
  const content = getLocalizedField(item, 'content', locale as Locale);
  const minutes = readingTimeMinutes(content);
  const catLabel =
    item.category === 'events' || item.category === 'announcements'
      ? t(`news_page.category.${item.category}` as never)
      : item.category;

  // Related news — same category, exclude self, up to 3
  let related: News[] = [];
  try {
    const all = await getNewsList(20);
    related = all
      .filter((n) => n.id !== item!.id && n.status === 'published' && n.category === item!.category)
      .slice(0, 3);
  } catch (err) {
    console.warn('[news/[id]] related fetch failed:', err);
  }

  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <Link href={'/news' as never}>{t('nav.news')}</Link>
        </div>
      </div>

      <article className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <header
            style={{
              marginBottom: 'var(--s-8)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--s-3)'
            }}
          >
            <span className="card-category">{catLabel}</span>
            <time
              dateTime={formatDateISO(item.createdAt)}
              style={{ color: 'var(--text-tertiary)' }}
            >
              {formatDate(item.createdAt, locale as Locale)}
            </time>
            <span aria-hidden="true" style={{ color: 'var(--ink-4)' }}>·</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '.9375rem' }}>
              {t('news_page.read_time', { minutes })}
            </span>
          </header>
          {item.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={transformImage(item.image, { width: 1200 })}
              alt={title}
              style={{ width: '100%', borderRadius: 'var(--r-lg)' }}
            />
          )}
          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.7,
              marginTop: 'var(--s-6)',
              color: 'var(--text-secondary)',
              fontSize: '1.05rem'
            }}
          >
            {content}
          </div>

          <NewsShareButtons title={title} path={`/${locale}/news/${id}`} />

          <div style={{ marginTop: 'var(--s-8)' }}>
            <Link
              href={'/news' as never}
              className="btn btn-ghost"
              style={{ color: 'var(--primary)' }}
            >
              {t('news_page.back_to_list')}
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-secondary)', paddingTop: 'var(--s-12)' }}>
          <div className="container">
            <div className="section-header" style={{ marginBottom: 'var(--s-8)' }}>
              <h2 style={{ fontSize: '1.75rem' }}>{t('news_page.related_title')}</h2>
            </div>
            <div className="grid grid-3">
              {related.map((n) => (
                <NewsCard key={n.id} item={n} locale={locale as Locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
