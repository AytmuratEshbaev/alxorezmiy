import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getOlympiad } from '@/lib/db/queries';
import AchievementCard from '@/components/achievements/AchievementCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { safe } from '@/lib/utils';
import { buildPageMetadata } from '@/lib/seo';
import type { OlympiadResult } from '@/types';

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
  const items = await safe<OlympiadResult[]>(() => getOlympiad(), [], 'achievements getOlympiad');
  const grouped = groupByYear(items);

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
          </div>

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
      </section>
    </>
  );
}
