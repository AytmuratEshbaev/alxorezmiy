import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import AchievementCard from '@/components/achievements/AchievementCard';
import EmptyState from '@/components/ui/EmptyState';
import CarouselScroller from './CarouselScroller';
import type { OlympiadResult } from '@/types';

export default async function AchievementsCarousel({ items }: { items: OlympiadResult[] }) {
  const t = await getTranslations();
  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }} id="achievements">
      <div className="container">
        <div className="section-header animate-on-scroll">
          <span className="section-label">{t('sections.achievements_label')}</span>
          <h2>{t('sections.achievements_title')}</h2>
        </div>
        <div className="carousel-wrapper animate-on-scroll">
          {items.length === 0 ? (
            <EmptyState
              compact
              icon="trophy"
              title={t('achievements_page.empty_title')}
              text={t('achievements_page.empty_text')}
            />
          ) : (
            <CarouselScroller
              label={t('sections.achievements_title')}
              prevLabel={t('a11y_extra.carousel_prev')}
              nextLabel={t('a11y_extra.carousel_next')}
            >
              {items.map((item) => (
                <div key={item.id} className="carousel-card">
                  <AchievementCard item={item} />
                </div>
              ))}
            </CarouselScroller>
          )}
        </div>
        <div className="text-center animate-on-scroll" style={{ marginTop: 'var(--s-12)' }}>
          <Link href={'/achievements' as never} className="btn btn-primary">
            {t('sections.achievements_all')}
          </Link>
        </div>
      </div>
    </section>
  );
}
