import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { DIRECTION_SUBJECTS, DirectionIcon } from './direction-icons';

export default async function DirectionsGrid() {
  const t = await getTranslations();
  return (
    <>
      <section className="section" id="aboutShort">
        <div className="container">
          <div className="feature-panel animate-on-scroll">
            <span className="feature-panel-label">{t('sections.about_short_label')}</span>
            <h2>{t('sections.about_short_title')}</h2>
            <p>{t('sections.about_short_text')}</p>
            <Link href={'/about' as never} className="btn btn-primary">
              {t('sections.about_btn')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }} id="directions">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('sections.directions_label')}</span>
            <h2>{t('sections.directions_title')}</h2>
            <p>{t('sections.directions_text')}</p>
          </div>
          <div className="grid grid-3">
            {DIRECTION_SUBJECTS.map((subject, i) => (
              <div
                key={subject}
                className={`card card-hover direction-card animate-scale${i > 0 ? ` animate-delay-${i % 4}` : ''}`}
                data-subject={subject}
              >
                <div className="direction-icon">
                  <DirectionIcon subject={subject} />
                </div>
                <h3>{t(`directions_list.${subject}` as never)}</h3>
                <p>{t(`directions_short.${subject}` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
