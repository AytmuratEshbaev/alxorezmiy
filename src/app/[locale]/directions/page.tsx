import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { buildPageMetadata } from '@/lib/seo';
import { DIRECTION_SUBJECTS, DirectionIcon } from '@/components/home/direction-icons';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.directions' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/directions',
  });
}

export default async function DirectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <div className="page-header">
        <h1>{t('directions_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.directions')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <div className="animate-on-scroll">
              <h2 style={{ marginBottom: 'var(--space-md)' }}>
                {t('directions_page.intro_title')}
              </h2>
              <p style={{ marginBottom: 'var(--space-lg)', fontSize: '1.05rem', lineHeight: 1.7 }}>
                {t('directions_page.intro_text')}
              </p>
              <ul className="checklist" style={{ marginBottom: 'var(--space-lg)' }}>
                <li>{t('directions_page.checklist_1')}</li>
                <li>{t('directions_page.checklist_2')}</li>
                <li>{t('directions_page.checklist_3')}</li>
                <li>{t('directions_page.checklist_4')}</li>
              </ul>
            </div>
            <div className="animate-on-scroll animate-delay-1">
              <div className="brand-panel" aria-hidden="true">
                <div className="brand-panel-grid">
                  {DIRECTION_SUBJECTS.map((subject) => (
                    <span key={subject} className="brand-panel-tile" data-subject={subject}>
                      <DirectionIcon subject={subject} />
                    </span>
                  ))}
                </div>
                <span className="brand-panel-mono">{'> alxorezmiy.uz / directions'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header animate-on-scroll">
            <h2>{t('directions_page.subjects_title')}</h2>
          </div>
          <div className="grid grid-3">
            {DIRECTION_SUBJECTS.map((subject, i) => (
              <div
                key={subject}
                className={`card card-hover direction-card animate-on-scroll${i > 0 ? ` animate-delay-${i % 4}` : ''}`}
                data-subject={subject}
              >
                <div className="direction-icon">
                  <DirectionIcon subject={subject} />
                </div>
                <h3>{t(`directions_list.${subject}` as never)}</h3>
                <p>{t(`directions_page.${subject}_desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div
            className="card animate-on-scroll"
            style={{ textAlign: 'center', padding: 'var(--s-12)' }}
          >
            <span className="section-label" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              {t('achievements.label')}
            </span>
            <h2 style={{ marginBottom: 'var(--s-4)' }}>{t('directions_page.cta_title')}</h2>
            <p style={{ maxWidth: 580, margin: '0 auto var(--s-6)', color: 'var(--ink-2)' }}>
              {t('directions_page.cta_text')}
            </p>
            <Link href={'/achievements' as never} className="btn btn-primary">
              {t('directions_page.cta_btn')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
