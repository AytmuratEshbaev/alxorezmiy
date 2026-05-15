import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { OlympiadResult } from '@/types';

const LEVEL_LABELS: Record<string, string> = {
  xalqaro: '🌍 Xalqaro',
  respublika: '🏛️ Respublika',
  shahar: '🏙️ Shahar',
  tuman: '🏘️ Tuman'
};

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
              <p style={{ color: 'var(--text-tertiary)', padding: 'var(--space-xl)' }}>{t('achievements.empty')}</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{ minWidth: 300, flexShrink: 0, textAlign: 'center', scrollSnapAlign: 'start' }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'var(--warning-bg)',
                      color: 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--space-md)',
                      fontSize: '1.5rem',
                      fontWeight: 800
                    }}
                  >
                    {item.place}
                  </div>
                  <h3 style={{ marginBottom: 4 }}>{item.student}</h3>
                  <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>{item.subject}</p>
                  <p style={{ fontSize: '0.85rem' }}>
                    {item.olympiad_name || ''} {item.year ? `— ${item.year}` : ''}
                  </p>
                  <span className="card-badge" style={{ position: 'static', display: 'inline-block', marginTop: 'var(--space-sm)' }}>
                    {LEVEL_LABELS[item.level] || item.level}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="text-center animate-on-scroll" style={{ marginTop: 'var(--s-12)' }}>
          <Link href={'/achievements' as never} className="btn btn-primary">{t('sections.achievements_all')}</Link>
        </div>
      </div>
    </section>
  );
}
