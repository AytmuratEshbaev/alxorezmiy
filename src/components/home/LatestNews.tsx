import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import NewsCard from '@/components/news/NewsCard';
import Icon from '@/components/ui/Icon';
import type { Locale, News } from '@/types';

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
            <div
              role="status"
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                padding: 'var(--s-12) var(--s-4)',
                color: 'var(--ink-3)',
              }}
            >
              <Icon
                name="newspaper"
                size={44}
                style={{ color: 'var(--ink-4)', marginBottom: 'var(--s-3)' }}
              />
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2)' }}>
                {t('news_page.empty_title')}
              </p>
              <p style={{ margin: 'var(--s-2) 0 0', fontSize: '0.9375rem' }}>
                {t('news_page.empty_text')}
              </p>
            </div>
          ) : (
            items.map((item, i) => (
              <NewsCard
                key={item.id}
                item={item}
                locale={locale}
                className={`animate-on-scroll animate-delay-${i + 1}`}
              />
            ))
          )}
        </div>
        <div className="text-center animate-on-scroll" style={{ marginTop: 'var(--s-12)' }}>
          <Link href={'/news' as never} className="btn btn-secondary">
            {t('sections.news_all')}
          </Link>
        </div>
      </div>
    </section>
  );
}
