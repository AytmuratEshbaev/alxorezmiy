import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getLocalizedField, formatDate, formatDateISO, escapeHtml } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import type { Locale, News } from '@/types';

export default async function LatestNews({ items, locale }: { items: News[]; locale: Locale }) {
  const t = await getTranslations();
  const catLabel = (cat: string): string =>
    cat === 'events' || cat === 'announcements'
      ? t(`news_page.category.${cat}` as never)
      : cat;
  return (
    <section className="section" id="latestNews">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">{t('sections.news_label')}</span>
          <h2>{t('sections.news_title')}</h2>
          <p>{t('sections.news_text')}</p>
        </div>
        <div className="grid grid-3" id="newsGrid">
          {items.length === 0 ? (
            <div
              role="status"
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                padding: 'var(--s-12) var(--s-4)',
                color: 'var(--ink-3)'
              }}
            >
              <div aria-hidden="true" style={{ fontSize: '2.5rem', marginBottom: 'var(--s-3)', opacity: 0.5 }}>📰</div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2)' }}>
                {t('news_page.empty_title')}
              </p>
              <p style={{ margin: 'var(--s-2) 0 0', fontSize: '0.9375rem' }}>
                {t('news_page.empty_text')}
              </p>
            </div>
          ) : (
            items.map((item, i) => {
              const title = getLocalizedField(item, 'title', locale);
              const content = getLocalizedField(item, 'content', locale);
              const img = item.image ? transformImage(item.image, { width: 600 }) : '';
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.id}` as never}
                  className={`card card-hover news-card animate-on-scroll animate-delay-${i + 1}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: 0, overflow: 'hidden' }}
                >
                  {img && (
                    <div className="card-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={escapeHtml(title)} loading="lazy" />
                    </div>
                  )}
                  <div className="news-card-body" style={{ padding: 'var(--s-6)' }}>
                    <div className="card-meta">
                      <span className="card-category">{catLabel(item.category)}</span>
                      <time className="card-date" dateTime={formatDateISO(item.createdAt)}>
                        {formatDate(item.createdAt, locale)}
                      </time>
                    </div>
                    <h3>{title}</h3>
                    <p>{(content || '').substring(0, 100)}...</p>
                    <span className="read-more">{t('common.read_more')} →</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        <div className="text-center animate-on-scroll" style={{ marginTop: 'var(--space-xl)' }}>
          <Link href={'/news' as never} className="btn btn-secondary">{t('sections.news_all')}</Link>
        </div>
      </div>
    </section>
  );
}
