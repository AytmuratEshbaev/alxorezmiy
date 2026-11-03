import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { DirectionIcon, DIRECTION_SUBJECTS } from './direction-icons';

export default async function DirectionsGrid() {
  const t = await getTranslations();
  return (
    <>
      <section className="section" id="aboutShort">
        <div className="container">
          <div className="ui-split">
            <div>
              <span className="section-label">{t('sections.about_short_label')}</span>
              <h2>{t('sections.about_short_title')}</h2>
            </div>
            <div>
              <p style={{ marginBottom: 'var(--s-6)' }}>{t('sections.about_short_text')}</p>
              <Link href={'/about' as never} className="btn btn-primary">
                {t('sections.about_btn')}
              </Link>
            </div>
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
          <div className="ui-cells ui-cells--4">
            {DIRECTION_SUBJECTS.map((subject) => (
              <Link
                key={subject}
                href={'/directions' as never}
                className="ui-cell"
              >
                <span className="ui-cell-icon">
                  <DirectionIcon subject={subject} />
                </span>
                <h3>{t(`directions_list.${subject}` as never)}</h3>
                <p>{t(`directions_short.${subject}` as never)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
