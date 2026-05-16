import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { OlympiadResult } from '@/types';

const LEVEL_ICONS: Record<string, string> = {
  xalqaro: '🌍',
  respublika: '🏛️',
  shahar: '🏙️',
  tuman: '🏘️'
};

const LEVEL_I18N_KEY: Record<string, string> = {
  xalqaro: 'level_international',
  respublika: 'level_republic',
  shahar: 'level_city',
  tuman: 'level_district'
};

function placeStyle(place: number): { background: string; color: string } {
  if (place === 1) return { background: 'rgba(245,158,11,.15)', color: 'var(--amber-text)' };       // gold
  if (place === 2) return { background: 'rgba(148,163,184,.18)', color: 'var(--ink-2)' };           // silver
  if (place === 3) return { background: 'rgba(180,121,87,.18)', color: '#8B5A2B' };                 // bronze
  return { background: 'var(--navy-soft)', color: 'var(--navy)' };
}

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
                  color: 'var(--ink-3)'
                }}
              >
                <div aria-hidden="true" style={{ fontSize: '2.5rem', marginBottom: 'var(--s-3)', opacity: 0.5 }}>🏆</div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--ink-2)' }}>
                  {t('achievements_page.empty_title')}
                </p>
                <p style={{ margin: 'var(--s-2) 0 0', fontSize: '0.9375rem' }}>
                  {t('achievements_page.empty_text')}
                </p>
              </div>
            ) : (
              items.map((item) => {
                const ps = placeStyle(Number(item.place));
                const levelKey = LEVEL_I18N_KEY[item.level];
                const levelLabel = levelKey ? t(`achievements.${levelKey}` as never) : item.level;
                const levelIcon = LEVEL_ICONS[item.level] || '';
                return (
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
                        background: ps.background,
                        color: ps.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--s-4)',
                        fontSize: '1.5rem',
                        fontWeight: 800
                      }}
                      aria-label={`${item.place} ${t('common.place')}`}
                    >
                      {item.place}
                    </div>
                    <h3 style={{ marginBottom: 'var(--s-1)' }}>{item.student}</h3>
                    <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 'var(--s-1)' }}>{item.subject}</p>
                    <p style={{ fontSize: '0.85rem' }}>
                      {item.olympiad_name || ''} {item.year ? `— ${item.year}` : ''}
                    </p>
                    <span className="card-badge" style={{ position: 'static', display: 'inline-block', marginTop: 'var(--s-2)' }}>
                      {levelIcon && <span aria-hidden="true">{levelIcon} </span>}{levelLabel}
                    </span>
                  </div>
                );
              })
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
