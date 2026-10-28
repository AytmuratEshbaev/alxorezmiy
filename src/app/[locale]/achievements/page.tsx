import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getOlympiad, getCertificates } from '@/lib/db/queries';
import AchievementCard from '@/components/achievements/AchievementCard';
import CertificatesSection from '@/components/achievements/CertificatesSection';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { safe } from '@/lib/utils';
import { buildPageMetadata } from '@/lib/seo';
import type { OlympiadResult, CertificateItem } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.achievements' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/achievements',
  });
}

function groupByYear(items: OlympiadResult[]): Array<[number, OlympiadResult[]]> {
  const map = new Map<number, OlympiadResult[]>();
  for (const item of items) {
    const y = item.year || 0;
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(item);
  }
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
}

export default async function AchievementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [olympiadItems, certificateItems] = await Promise.all([
    safe<OlympiadResult[]>(() => getOlympiad(), [], 'achievements getOlympiad'),
    safe<CertificateItem[]>(() => getCertificates(), [], 'achievements getCertificates'),
  ]);
  const grouped = groupByYear(olympiadItems);

  return (
    <>
      <PageHeader
        title={t('achievements_page.title')}
        crumbs={[{ label: t('nav.achievements') }]}
      />

      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            <span className="section-label">{t('achievements.label')}</span>
            <h2>{t('achievements.intro_title')}</h2>
            <p>{t('achievements.intro_text')}</p>
            <div className="achievements-nav">
              <a href="#olympiads" className="pill-link">
                {t('certificates.nav_olympiads')} ({olympiadItems.length})
              </a>
              <a href="#certificates" className="pill-link">
                {t('certificates.nav_certificates')} ({certificateItems.length})
              </a>
            </div>
          </div>

          <div id="olympiads">
            {grouped.length === 0 ? (
              <EmptyState
                icon="trophy"
                title={t('achievements_page.empty_title')}
                text={t('achievements_page.empty_text')}
              />
            ) : (
              grouped.map(([year, list]) => (
                <div key={year} style={{ marginBottom: 'var(--space-2xl)' }}>
                  <h2 style={{ marginBottom: 'var(--space-lg)' }}>
                    {year ? t('common.year_label', { year: String(year) }) : '—'}
                  </h2>
                  <div className="grid grid-3">
                    {list.map((item) => (
                      <AchievementCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="section" id="certificates">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            <span className="section-label">{t('certificates.label')}</span>
            <h2>{t('certificates.title')}</h2>
            <p>{t('certificates.text')}</p>
          </div>

          <CertificatesSection items={certificateItems} />
        </div>
      </section>
    </>
  );
}
