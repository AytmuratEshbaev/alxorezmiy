import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNewsById, getNewsIds } from '@/lib/firebase/server-queries';
import { getLocalizedField, formatDate } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import { routing } from '@/i18n/routing';
import type { Locale } from '@/types';

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
    return {
      title,
      description: content.substring(0, 160),
      openGraph: {
        title,
        description: content.substring(0, 200),
        images: item.image ? [transformImage(item.image, { width: 1200 })] : []
      }
    };
  } catch (err) {
    console.warn('[news/[id]] generateMetadata failed:', err);
    return {};
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let item = null;
  try {
    item = await getNewsById(id);
  } catch (err) {
    console.warn('[news/[id]] getNewsById failed:', err);
  }
  if (!item || item.status !== 'published') notFound();

  const title = getLocalizedField(item, 'title', locale as Locale);
  const content = getLocalizedField(item, 'content', locale as Locale);

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
          <header style={{ marginBottom: 'var(--s-8)' }}>
            <span className="card-category">{item.category}</span>
            <time style={{ marginLeft: 'var(--s-3)', color: 'var(--text-tertiary)' }}>
              {formatDate(item.createdAt)}
            </time>
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
        </div>
      </article>
    </>
  );
}
