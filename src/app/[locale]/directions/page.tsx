import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import PageHeader from '@/components/ui/PageHeader';
import { buildPageMetadata } from '@/lib/seo';
import { DIRECTION_SUBJECTS, DirectionIcon } from '@/components/home/direction-icons';

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
      <PageHeader title={t('directions_page.title')} crumbs={[{ label: t('nav.directions') }]} />

      <section className="section">
        <div className="container">
          <div className="ui-split ui-split--even animate-on-scroll">
            <div>
              <h2>{t('directions_page.intro_title')}</h2>
              <p>{t('directions_page.intro_text')}</p>
            </div>
            <div className="info-panel">
              <ul className="checklist">
                <li>{t('directions_page.checklist_1')}</li>
                <li>{t('directions_page.checklist_2')}</li>
                <li>{t('directions_page.checklist_3')}</li>
                <li>{t('directions_page.checklist_4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <h2>{t('directions_page.subjects_title')}</h2>
          </div>
          <div className="ui-cells ui-cells--4 animate-on-scroll">
            {DIRECTION_SUBJECTS.map((subject) => (
              <div key={subject} className="ui-cell">
                <div className="ui-cell-icon">
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
          <div className="ui-band animate-on-scroll">
            <div>
              <h2>{t('directions_page.cta_title')}</h2>
              <p>{t('directions_page.cta_text')}</p>
            </div>
            <Link href={'/achievements' as never} className="btn">
              {t('directions_page.cta_btn')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
