import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function DirectionsGrid() {
  const t = await getTranslations();
  return (
    <>
      <section className="section" id="aboutShort">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('sections.about_short_label')}</span>
            <h2>{t('sections.about_short_title')}</h2>
            <p>{t('sections.about_short_text')}</p>
          </div>
          <div className="text-center animate-on-scroll">
            <Link href={'/about' as never} className="btn btn-primary">{t('sections.about_btn')}</Link>
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
            <div className="card card-hover direction-card animate-scale" data-subject="math">
              <div className="direction-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
              </div>
              <h3>{t('directions_list.math')}</h3>
              <p>{t('directions_short.math')}</p>
            </div>
            <div className="card card-hover direction-card animate-scale animate-delay-1" data-subject="physics">
              <div className="direction-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="2" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)" />
                </svg>
              </div>
              <h3>{t('directions_list.physics')}</h3>
              <p>{t('directions_short.physics')}</p>
            </div>
            <div className="card card-hover direction-card animate-scale animate-delay-2" data-subject="informatics">
              <div className="direction-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                  <line x1="13" y1="4" x2="11" y2="20" strokeDasharray="2 2" />
                </svg>
              </div>
              <h3>{t('directions_list.informatics')}</h3>
              <p>{t('directions_short.informatics')}</p>
            </div>
            <div className="card card-hover direction-card animate-scale animate-delay-1" data-subject="chemistry">
              <div className="direction-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 9V3" />
                  <line x1="9" y1="3" x2="15" y2="3" />
                  <circle cx="10" cy="16" r="1" fill="currentColor" />
                  <circle cx="14" cy="14" r="1" fill="currentColor" />
                </svg>
              </div>
              <h3>{t('directions_list.chemistry')}</h3>
              <p>{t('directions_short.chemistry')}</p>
            </div>
            <div className="card card-hover direction-card animate-scale animate-delay-2" data-subject="biology">
              <div className="direction-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 3c0 6 8 10 8 18c0-8 8-12 8-18" />
                  <path d="M4 3c4 2 12 2 16 0" />
                  <path d="M5 8c4 1 10 1 14 0" />
                  <path d="M6 13c3 1 9 1 12 0" />
                </svg>
              </div>
              <h3>{t('directions_list.biology')}</h3>
              <p>{t('directions_short.biology')}</p>
            </div>
            <div className="card card-hover direction-card animate-scale animate-delay-3" data-subject="languages">
              <div className="direction-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10M12 2a15.3 15.3 0 0 0-4 10a15.3 15.3 0 0 0 4 10" />
                </svg>
              </div>
              <h3>{t('directions_list.languages')}</h3>
              <p>{t('directions_short.languages')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
