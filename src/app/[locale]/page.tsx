import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getSettings, getNewsList, getOlympiad } from '@/lib/firebase/server-queries';
import Hero from '@/components/home/Hero';
import StatsCounter from '@/components/home/StatsCounter';
import DirectionsGrid from '@/components/home/DirectionsGrid';
import LatestNews from '@/components/home/LatestNews';
import AchievementsCarousel from '@/components/home/AchievementsCarousel';
import ContactShort from '@/components/home/ContactShort';
import type { Locale, News, OlympiadResult, Settings } from '@/types';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.home' });
  return {
    title: t('title'),
    description: t('description')
  };
}

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[home] ${label} failed:`, err);
    return fallback;
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [settings, news, olympiad] = await Promise.all([
    safe<Settings | null>(() => getSettings(), null, 'getSettings'),
    safe<News[]>(() => getNewsList(6), [], 'getNewsList'),
    safe<OlympiadResult[]>(() => getOlympiad(), [], 'getOlympiad')
  ]);

  const stats = [
    { label: t('stats.students'), count: settings?.students_count || 520, suffix: '+' },
    { label: t('stats.teachers'), count: settings?.teachers_count || 65 },
    { label: t('stats.experience'), count: settings?.experience_years || 15, suffix: '+' },
    { label: t('stats.olympiad'), count: settings?.olympiad_winners || 180, suffix: '+' }
  ];

  return (
    <>
      <Hero />
      <StatsCounter stats={stats} />
      <DirectionsGrid />
      <LatestNews items={news.slice(0, 3)} locale={locale as Locale} />
      <AchievementsCarousel items={olympiad.slice(0, 10)} />
      <ContactShort settings={settings} />
    </>
  );
}
