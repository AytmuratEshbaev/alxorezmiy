import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.admission' });
  return { title: t('title'), description: t('description') };
}

export default async function AdmissionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <div className="page-header">
        <h1>{t('admission_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.admission')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('admission_page.section_label')}</span>
            <h2>{t('admission_page.section_title')}</h2>
            <p>{t('admission_page.section_text')}</p>
          </div>

          <div className="timeline animate-on-scroll" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="timeline-item">
              <span className="timeline-year">1</span>
              <h3>{t('admission_page.step1_title')}</h3>
              <p>{t('admission_page.step1_text')}</p>
              <ul className="checklist" style={{ marginTop: 'var(--space-sm)' }}>
                <li>{t('admission_page.doc1')}</li>
                <li>{t('admission_page.doc2')}</li>
                <li>{t('admission_page.doc3')}</li>
              </ul>
            </div>
            <div className="timeline-item">
              <span className="timeline-year">2</span>
              <h3>{t('admission_page.step2_title')}</h3>
              <p>{t('admission_page.step2_text')}</p>
            </div>
            <div className="timeline-item">
              <span className="timeline-year">3</span>
              <h3>{t('admission_page.step3_title')}</h3>
              <p>{t('admission_page.step3_text')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container text-center animate-on-scroll">
          <h2>{t('admission_page.download_title')}</h2>
          <p style={{ marginBottom: 'var(--space-xl)', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            {t('admission_page.download_text')}
          </p>
          <a href="#" className="btn btn-primary btn-lg" target="_blank" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {t('admission_page.download_btn')}
          </a>
        </div>
      </section>
    </>
  );
}
