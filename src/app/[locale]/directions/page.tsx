import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.directions' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '/directions' });
}

export default async function DirectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const subjects = [
    { key: 'math', icon: '📐' },
    { key: 'physics', icon: '⚛️' },
    { key: 'informatics', icon: '💻' },
    { key: 'chemistry', icon: '🧪' },
    { key: 'biology', icon: '🧬' },
    { key: 'languages', icon: '🌍' }
  ];

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
              <h2 style={{ marginBottom: 'var(--space-md)' }}>{t('directions_page.intro_title')}</h2>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop"
                alt={t('directions_page.intro_title')}
                style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
              />
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
            {subjects.map((s, i) => (
              <div
                key={s.key}
                className={`card card-hover direction-card animate-on-scroll${i > 0 ? ` animate-delay-${i % 4}` : ''}`}
              >
                <div className="direction-icon">{s.icon}</div>
                <h3>{t(`directions_list.${s.key}` as never)}</h3>
                <p>{t(`directions_page.${s.key}_desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card animate-on-scroll" style={{ textAlign: 'center', padding: 'var(--s-12)' }}>
            <span className="section-label" style={{ marginLeft: 'auto', marginRight: 'auto' }}>{t('achievements.label')}</span>
            <h2 style={{ marginBottom: 'var(--s-4)' }}>{t('directions_page.cta_title')}</h2>
            <p style={{ maxWidth: 580, margin: '0 auto var(--s-6)', color: 'var(--ink-2)' }}>{t('directions_page.cta_text')}</p>
            <Link href={'/achievements' as never} className="btn btn-primary">{t('directions_page.cta_btn')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
