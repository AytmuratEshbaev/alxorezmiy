import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import NewsCard from '@/components/news/NewsCard';
import type { Locale, News } from '@/types';

export default async function LatestNews({ items, locale }: { items: News[]; locale: Locale }) {
  if (items.length === 0) return null;
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
          {items.map((item, i) => (
            <NewsCard
              key={item.id}
              item={item}
              locale={locale}
              className={`animate-on-scroll animate-delay-${i + 1}`}
            />
          ))}
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
