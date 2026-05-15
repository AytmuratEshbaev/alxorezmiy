import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getLocalizedField, formatDate, escapeHtml } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import type { Locale, News } from '@/types';

const CAT_LABELS: Record<string, string> = {
  events: 'Tadbirlar',
  announcements: "E'lonlar"
};

export default async function LatestNews({ items, locale }: { items: News[]; locale: Locale }) {
  const t = await getTranslations();
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
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-xl)' }}>
              {t('common.loading')}
            </p>
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
                  <div className="news-card-body" style={{ padding: 'var(--space-lg)' }}>
                    <div className="card-meta">
                      <span className="card-category">{CAT_LABELS[item.category] || item.category}</span>
                      <span className="card-date">{formatDate(item.createdAt)}</span>
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
