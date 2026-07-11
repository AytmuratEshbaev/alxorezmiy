import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getSettings } from '@/lib/firebase/server-queries';
import { getLocalizedField } from '@/lib/utils';
import { buildPageMetadata } from '@/lib/seo';
import Icon, { type IconName } from '@/components/ui/Icon';
import type { Locale, Settings } from '@/types';

export const revalidate = 3600;

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

async function safeGetSettings(): Promise<Settings | null> {
  try {
    return await getSettings();
  } catch (err) {
    console.warn('[about] getSettings failed:', err);
    return null;
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const settings = await safeGetSettings();
  const fullName = settings ? getLocalizedField(settings, 'fullName', locale as Locale) : '';

  return (
    <>
      <div className="page-header">
        <h1>{t('about_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('about_page.title')}</span>
        </div>
      </div>

      {fullName && (
        <section
          className="section"
          style={{ padding: 'var(--s-12) 0 var(--s-8)' }}
          id="officialName"
        >
          <div className="container" style={{ maxWidth: 860 }}>
            <div
              className="card animate-on-scroll"
              style={{
                textAlign: 'center',
                background: 'var(--brand-gradient-soft)',
                border: '1px solid var(--navy-line)',
              }}
            >
              <span className="section-label" style={{ marginBottom: 'var(--s-4)' }}>
                {t('footer.official_name')}
              </span>
              <p
                style={{
                  fontSize: '1.0625rem',
                  lineHeight: 1.7,
                  color: 'var(--text-hi)',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {fullName}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="section" id="history">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.history_label')}</span>
            <h2>{t('about_page.history_title')}</h2>
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
      </section>

      <section className="section" style={{ background: 'var(--bg-secondary)' }} id="mission">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-label">{t('about_page.mission_label')}</span>
            <h2>{t('about_page.mission_title')}</h2>
            <p>{t('about_page.mission_text')}</p>
          </div>
          <div className="grid grid-2" style={{ maxWidth: 900, margin: '0 auto' }}>
            {(
              [
                { key: 'excellence', icon: 'trophy' },
                { key: 'innovation', icon: 'lightbulb' },
                { key: 'integrity', icon: 'scale' },
                { key: 'community', icon: 'users' },
              ] as { key: string; icon: IconName }[]
            ).map((v, i) => (
              <div
                key={v.key}
                className={`card card-hover animate-on-scroll${i > 0 ? ` animate-delay-${i}` : ''}`}
                style={{ textAlign: 'center' }}
              >
                <div className="direction-icon" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
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
          <div className="grid grid-3 animate-on-scroll">
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
              <div className="tour-tile" key={tile.key}>
                <Icon name={tile.icon} size={40} />
                <span className="tour-tile-caption">
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
