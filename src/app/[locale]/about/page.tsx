import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { getSettings } from '@/lib/db/queries';
import { fallbackLang, getLocalizedField, safe } from '@/lib/utils';
import { buildPageMetadata } from '@/lib/seo';
import Icon, { type IconName } from '@/components/ui/Icon';
import PageHeader from '@/components/ui/PageHeader';
import type { Locale, Settings } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.about' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/about',
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const settings = await safe<Settings | null>(() => getSettings(), null, 'about getSettings');
  const fullName = settings ? getLocalizedField(settings, 'fullName', locale as Locale) : '';

  return (
    <>
      <PageHeader title={t('about_page.title')} crumbs={[{ label: t('about_page.title') }]} />

      <section className="section" id="officialName">
        <div className="container">
          <div className="ui-split ui-split--even animate-on-scroll">
            <Image
              src="/assets/images/hero.webp"
              alt={t('sections.photo_alt')}
              width={1926}
              height={1282}
              sizes="(max-width: 960px) 100vw, 50vw"
              className="info-photo"
            />
            <div className="info-official">
              <span className="section-label">{t('footer.official_name')}</span>
              <h2 className="info-official-name">
                <span
                  lang={fullName && settings ? fallbackLang(settings, 'fullName', locale as Locale) : undefined}
                >
                  {fullName || t('site_title')}
                </span>
              </h2>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="history">
        <div className="container">
          <div className="ui-split">
            <div className="ui-sticky">
              <div className="section-header animate-on-scroll">
                <span className="section-label">{t('about_page.history_label')}</span>
                <h2>{t('about_page.history_title')}</h2>
              </div>
            </div>
            <div className="timeline animate-on-scroll">
              {['2010', '2012', '2015', '2018', '2020', '2023', '2026'].map((y) => (
                <div className="timeline-item" key={y}>
                  <span className="timeline-year">{y}</span>
                  <h3>{t(`about_history.y${y}` as never)}</h3>
                  <p>{t(`about_history.y${y}_text` as never)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="mission">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.mission_label')}</span>
            <h2>{t('about_page.mission_title')}</h2>
            <p>{t('about_page.mission_text')}</p>
          </div>
          <div className="ui-cells ui-cells--4 animate-on-scroll">
            {(
              [
                { key: 'excellence', icon: 'trophy' },
                { key: 'innovation', icon: 'lightbulb' },
                { key: 'integrity', icon: 'scale' },
                { key: 'community', icon: 'users' },
              ] as { key: string; icon: IconName }[]
            ).map((v) => (
              <div key={v.key} className="ui-cell">
                <div className="ui-cell-icon">
                  <Icon name={v.icon} />
                </div>
                <h3>{t(`about_page.values.${v.key}` as never)}</h3>
                <p>{t(`about_page.values.${v.key}_desc` as never)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="virtualTour">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.virtual_tour_label')}</span>
            <h2>{t('about_page.virtual_tour')}</h2>
          </div>
          <div className="ui-cells ui-cells--3 animate-on-scroll">
            {(
              [
                { key: 'building', icon: 'building' },
                { key: 'classroom', icon: 'user' },
                { key: 'lab', icon: 'lightbulb' },
                { key: 'library', icon: 'scroll' },
                { key: 'gym', icon: 'medal' },
                { key: 'hall', icon: 'users' },
              ] as { key: string; icon: IconName }[]
            ).map((tile) => (
              <div className="ui-cell" key={tile.key}>
                <div className="ui-cell-icon">
                  <Icon name={tile.icon} />
                </div>
                <span>
                  {t(`about_page.virtual_tour_items.${tile.key}` as never)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
