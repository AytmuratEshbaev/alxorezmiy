import Image from 'next/image';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getNewsById, getRelatedNews } from '@/lib/db/queries';
import {
  fallbackLang,
  formatDate,
  formatDateISO,
  getLocalizedField,
  htmlLang,
  newsDate,
  readingTimeMinutes,
  safe,
  toISO,
} from '@/lib/utils';
import { resizedImage } from '@/lib/image-loader';
import { LOGO_PATH, SITE_URL, absoluteUrl, buildPageMetadata, getSiteName } from '@/lib/seo';
import NewsCard from '@/components/news/NewsCard';
import NewsShareButtons from '@/components/news/NewsShareButtons';
import PageHeader from '@/components/ui/PageHeader';
import JsonLd from '@/components/ui/JsonLd';
import type { Locale, News } from '@/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  let item: News | null;
  try {
    item = await getNewsById(id);
  } catch (err) {
    // Sahifaning o'zi xatoni error.tsx'ga uzatadi; metadata faqat minimal bo'lib qoladi.
    console.warn('[news/[id]] generateMetadata failed:', err);
    return {};
  }
  if (!item) {
    const t = await getTranslations({ locale, namespace: 'not_found' });
    return { title: t('eyebrow'), robots: { index: false } };
  }
  const title = getLocalizedField(item, 'title', locale as Locale);
  const content = getLocalizedField(item, 'content', locale as Locale);
  const image = item.image ? absoluteUrl(resizedImage(item.image, 1200)) : undefined;
  return buildPageMetadata({
    locale,
    title,
    description: content.replace(/\s+/g, ' ').trim().substring(0, 160),
    path: `/news/${id}`,
    image,
    imageAlt: title,
    ogType: 'article',
    publishedTime: toISO(newsDate(item)),
    modifiedTime: toISO(item.updatedAt),
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const loc = locale as Locale;

  // Bazadagi xato notFound() EMAS — u error.tsx chegarasiga ko'tariladi (qayta urinish bilan).
  // Faqat haqiqatan mavjud bo'lmagan (yoki nashr qilinmagan) yozuv 404 beradi.
  const item = await getNewsById(id);
  if (!item || item.status !== 'published') notFound();

  // "Tegishli yangiliklar" ikkinchi darajali — uning xatosi maqolani to'smasin.
  const [related, siteName] = await Promise.all([
    safe<News[]>(() => getRelatedNews(item.id, item.category, 3), [], 'news getRelatedNews'),
    getSiteName(locale),
  ]);

  const title = getLocalizedField(item, 'title', loc);
  const titleLang = fallbackLang(item, 'title', loc);
  const content = getLocalizedField(item, 'content', loc);
  const contentLang = fallbackLang(item, 'content', loc);
  const minutes = readingTimeMinutes(content);
  const date = newsDate(item);
  const catLabel =
    item.category === 'events' || item.category === 'announcements'
      ? t(`news_page.category.${item.category}` as never)
      : item.category;

  const articleUrl = `${SITE_URL}/${locale}/news/${id}`;
  const publishedISO = toISO(date);
  const modifiedISO = toISO(item.updatedAt);
  const organization = {
    '@type': 'EducationalOrganization',
    name: siteName,
    url: `${SITE_URL}/${locale}`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${LOGO_PATH}`,
    },
  };
  const ldArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title.substring(0, 110),
    description: content.replace(/\s+/g, ' ').trim().substring(0, 200),
    image: item.image ? [absoluteUrl(resizedImage(item.image, 1200))] : [`${SITE_URL}${LOGO_PATH}`],
    datePublished: publishedISO,
    dateModified: modifiedISO || publishedISO,
    inLanguage: htmlLang(contentLang ?? locale),
    articleSection: catLabel,
    author: organization,
    publisher: organization,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };
  const ldBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('common.home'), item: `${SITE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: t('nav.news'), item: `${SITE_URL}/${locale}/news` },
      { '@type': 'ListItem', position: 3, name: title, item: articleUrl },
    ],
  };

  return (
    <>
      <JsonLd data={ldArticle} />
      <JsonLd data={ldBreadcrumb} />
      <PageHeader
        title={title}
        titleLang={titleLang}
        crumbs={[
          { label: t('nav.news'), href: '/news' },
          { label: title, lang: titleLang },
        ]}
      />

      <article className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <header className="article-meta">
            <span className="card-category">{catLabel}</span>
            {date && <time dateTime={formatDateISO(date)}>{formatDate(date, loc)}</time>}
            <span aria-hidden="true" className="article-meta-sep">
              ·
            </span>
            <span>{t('news_page.read_time', { minutes })}</span>
          </header>
          {item.image && (
            <div className="article-image">
              <Image
                src={item.image}
                alt={title}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 800px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <div className="article-body" lang={contentLang}>
            {content}
          </div>

          <NewsShareButtons title={title} url={articleUrl} path={`/${locale}/news/${id}`} />

          <div style={{ marginTop: 'var(--s-8)' }}>
            <Link href={'/news' as never} className="btn btn-outline">
              {t('news_page.back_to_list')}
            </Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section
          className="section"
          style={{ background: 'var(--bg-secondary)', paddingTop: 'var(--s-12)' }}
          aria-labelledby="related-news-heading"
        >
          <div className="container">
            <div className="section-header" style={{ marginBottom: 'var(--s-8)' }}>
              <h2 id="related-news-heading" style={{ fontSize: '1.75rem' }}>
                {t('news_page.related_title')}
              </h2>
            </div>
            <div className="grid grid-3">
              {related.map((n) => (
                <NewsCard key={n.id} item={n} locale={loc} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
