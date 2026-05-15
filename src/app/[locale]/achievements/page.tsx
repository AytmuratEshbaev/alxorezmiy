import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getOlympiad } from '@/lib/firebase/server-queries';
import AchievementCard from '@/components/achievements/AchievementCard';
import { buildPageMetadata } from '@/lib/seo';
import type { OlympiadResult } from '@/types';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.achievements' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '/achievements' });
}

async function safeGetOlympiad(): Promise<OlympiadResult[]> {
  try {
    return await getOlympiad();
  } catch (err) {
    console.warn('[achievements] getOlympiad failed:', err);
    return [];
  }
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

export default async function AchievementsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safeGetOlympiad();
  const grouped = groupByYear(items);

  return (
    <>
      <div className="page-header">
        <h1>{t('achievements_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.achievements')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
            <span className="section-label">{t('achievements.label')}</span>
            <h2>{t('achievements.intro_title')}</h2>
            <p>{t('achievements.intro_text')}</p>
          </div>

          {grouped.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 60 }}>
              {t('achievements_page.empty')}
            </p>
          ) : (
            grouped.map(([year, list]) => (
              <div key={year} style={{ marginBottom: 'var(--space-2xl)' }}>
                <h2 style={{ marginBottom: 'var(--space-lg)' }}>
                  {year} {t('common.year')}
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
