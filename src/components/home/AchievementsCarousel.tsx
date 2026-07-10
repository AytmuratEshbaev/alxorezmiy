import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import AchievementCard from '@/components/achievements/AchievementCard';
import Icon from '@/components/ui/Icon';
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
          <div className="carousel-track" id="achievementsCarousel">
            {items.length === 0 ? (
              <div
                role="status"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: 'var(--s-12) var(--s-4)',
                  color: 'var(--ink-3)',
                }}
              >
                <Icon
                  name="trophy"
                  size={44}
                  style={{ color: 'var(--ink-4)', marginBottom: 'var(--s-3)' }}
                />
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2)' }}>
                  {t('achievements_page.empty_title')}
                </p>
                <p style={{ margin: 'var(--s-2) 0 0', fontSize: '0.9375rem' }}>
                  {t('achievements_page.empty_text')}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="carousel-card">
                  <AchievementCard item={item} />
                </div>
              ))
            )}
          </div>
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
