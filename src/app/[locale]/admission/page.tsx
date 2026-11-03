import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import PageHeader from '@/components/ui/PageHeader';
import ApplicationForm from '@/components/admission/ApplicationForm';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.admission' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/admission',
  });
}

export default async function AdmissionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <PageHeader title={t('admission_page.title')} crumbs={[{ label: t('nav.admission') }]} />

      <section className="section">
        <div className="container">
          <div className="ui-split ui-split--even">
            <div>
              <div className="section-header animate-on-scroll">
                <span className="section-label">{t('admission_page.section_label')}</span>
                <h2>{t('admission_page.section_title')}</h2>
                <p>{t('admission_page.section_text')}</p>
              </div>

              <div className="timeline animate-on-scroll">
                <div className="timeline-item">
                  <span className="timeline-year">1</span>
                  <h3>{t('admission_page.step1_title')}</h3>
                  <p>{t('admission_page.step1_text')}</p>
                  <ul className="checklist">
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

            <div className="ui-sticky">
              <div className="info-panel animate-on-scroll">
                <h2>{t('admission_form.title')}</h2>
                <p>{t('admission_form.subtitle')}</p>
                <ApplicationForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="ui-band animate-on-scroll">
            <div>
              <h2>{t('admission_page.download_title')}</h2>
              <p>{t('admission_page.download_text')}</p>
            </div>
            <Link href={'/contact' as never} className="btn">
              {t('nav.contact')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
