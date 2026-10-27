import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getSettings, getNewsList, getOlympiad } from '@/lib/db/queries';
import { filled, getLocalizedField, htmlLang, safe } from '@/lib/utils';
import Hero from '@/components/home/Hero';
import StatsCounter, { type StatItem } from '@/components/home/StatsCounter';
import DirectionsGrid from '@/components/home/DirectionsGrid';
import LatestNews from '@/components/home/LatestNews';
import AchievementsCarousel from '@/components/home/AchievementsCarousel';
import ContactShort from '@/components/home/ContactShort';
import { getSocialLinks } from '@/components/layout/SocialLinks';
import JsonLd from '@/components/ui/JsonLd';
import { LOGO_PATH, SITE_URL, buildPageMetadata } from '@/lib/seo';
import type { Locale, News, OlympiadResult, Settings } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.home' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '' });
}

/** Sozlamadagi son: o'rnatilmagan (undefined/null/'') bo'lsa null; 0 — haqiqiy qiymat. */
function statValue(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [settings, news, olympiad] = await Promise.all([
    safe<Settings | null>(() => getSettings(), null, 'home getSettings'),
    safe<News[]>(() => getNewsList(3), [], 'home getNewsList'),
    safe<OlympiadResult[]>(() => getOlympiad(10), [], 'home getOlympiad'),
  ]);

  // Faqat admin kiritgan raqamlar — o'rnatilmaganlari ko'rsatilmaydi (soxta qiymat yo'q).
  const statDefs = [
    { key: 'students', label: t('stats.students'), value: settings?.students_count, suffix: '+' },
    { key: 'teachers', label: t('stats.teachers'), value: settings?.teachers_count },
    {
      key: 'experience',
      label: t('stats.experience'),
      value: settings?.experience_years,
      suffix: '+',
    },
    { key: 'olympiad', label: t('stats.olympiad'), value: settings?.olympiad_winners, suffix: '+' },
  ];
  const stats: StatItem[] = statDefs.flatMap(({ value, ...rest }) => {
    const count = statValue(value);
    return count === null ? [] : [{ ...rest, count }];
  });

  const fullName = settings ? getLocalizedField(settings, 'fullName', locale as Locale) : '';
  const shortName = settings ? getLocalizedField(settings, 'shortName', locale as Locale) : '';
  const address = filled(settings?.address);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: fullName || t('site_title'),
    alternateName: shortName || t('site_short_name'),
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}${LOGO_PATH}`,
    image: `${SITE_URL}/assets/images/hero.webp`,
    inLanguage: htmlLang(locale),
    sameAs: getSocialLinks(settings).map((l) => l.href),
    address: address
      ? {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressLocality: 'Nukus',
          addressCountry: 'UZ',
        }
      : undefined,
    telephone: filled(settings?.phone),
    email: filled(settings?.email),
  };

  return (
    <>
      <JsonLd data={ld} />
      <Hero />
      <StatsCounter stats={stats} />
      <DirectionsGrid />
      <LatestNews items={news} locale={locale as Locale} />
      <AchievementsCarousel items={olympiad} />
      <ContactShort settings={settings} />
    </>
  );
}
