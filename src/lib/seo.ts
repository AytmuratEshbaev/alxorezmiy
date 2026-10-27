import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { htmlLang } from '@/lib/utils';

/** Kanonik sayt manzili (oxirida `/` yo'q) — barcha absolyut URL'lar shundan quriladi. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz').replace(
  /\/$/,
  ''
);

export const LOGO_PATH = '/assets/images/logo.webp';

// Routing locale → OpenGraph locale. `kk` URL'lari qoraqalpoq tilida (ISO 639-3: kaa).
const OG_LOCALES: Record<string, string> = {
  uz: 'uz_UZ',
  ru: 'ru_RU',
  kk: 'kaa_UZ',
  en: 'en_US',
};

/** Nisbiy yo'lni (`/media/...`) absolyut URL'ga aylantiradi; absolyutlar o'zgarmaydi. */
export function absoluteUrl(src: string): string {
  return src.startsWith('/') ? `${SITE_URL}${src}` : src;
}

/**
 * JSON-LD uchun xavfsiz serializatsiya: `</script>` yoki HTML izohlari bilan
 * <script> blokidan chiqib ketishning oldini oladi (<, >, &, U+2028/2029 escape).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Production'da Cloudflare Worker CSP nonce'ini `x-nonce` so'rov sarlavhasida uzatadi.
 * Dev'da sarlavha yo'q — `undefined` qaytadi va inline skriptlar odatdagidek ishlaydi.
 */
export async function getNonce(): Promise<string | undefined> {
  return (await headers()).get('x-nonce') ?? undefined;
}

/** Sayt uchun qisqa nom (masalan "Al-Xorazmiy maktabi") — har bir til uchun xabarlardan. */
export async function getSiteName(locale: string): Promise<string> {
  const t = await getTranslations({ locale });
  return t('site_short_name');
}

/** hreflang alternativlari: `/kk` URL'lari `kaa` deb e'lon qilinadi, x-default → /uz. */
export function languageAlternates(path = ''): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[htmlLang(l)] = `${SITE_URL}/${l}${path}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`;
  return languages;
}

export interface PageMetaInput {
  locale: string;
  title: string;
  description: string;
  /** Path AFTER the /:locale prefix, e.g. "/about", "/news/abc". Use "" for the home page. */
  path?: string;
  /** Optional OG image override (absolute or root-relative URL). */
  image?: string;
  /** Alt text for the OG/Twitter image. Falls back to the (branded) title. */
  imageAlt?: string;
  /** OG type. Defaults to 'website'. Use 'article' for news detail pages. */
  ogType?: 'website' | 'article';
  /** ISO datetime — maps to openGraph article:published_time when ogType is 'article'. */
  publishedTime?: string;
  /** ISO datetime — maps to openGraph article:modified_time when ogType is 'article'. */
  modifiedTime?: string;
}

/**
 * Build a Metadata object with consistent canonical, openGraph, twitter, and
 * hreflang alternates for every locale.
 */
export async function buildPageMetadata({
  locale,
  title,
  description,
  path = '',
  image,
  imageAlt,
  ogType = 'website',
  publishedTime,
  modifiedTime,
}: PageMetaInput): Promise<Metadata> {
  const siteName = await getSiteName(locale);
  const url = `${SITE_URL}/${locale}${path}`;
  // Brend nomi faqat sarlavhada hali bo'lmasa qo'shiladi (har bir til o'z nomi bilan).
  const fullTitle = title.toLowerCase().includes(siteName.toLowerCase())
    ? title
    : `${title} — ${siteName}`;
  const alt = imageAlt || fullTitle;

  // O'lchamlar faqat ilova ichidagi logo uchun ma'lum (haqiqiy o'lchami); yuklangan
  // rasmlarning o'lchami noma'lum — noto'g'ri qiymat yozgandan ko'ra tushirib qoldiramiz.
  const images = image
    ? [{ url: image, alt }]
    : [{ url: LOGO_PATH, width: 1000, height: 1000, alt }];

  const openGraphBase = {
    title: fullTitle,
    description,
    url,
    siteName,
    locale: OG_LOCALES[locale] || locale,
    alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l] || l),
    images,
  };

  const openGraph: Metadata['openGraph'] =
    ogType === 'article'
      ? { ...openGraphBase, type: 'article', publishedTime, modifiedTime }
      : { ...openGraphBase, type: 'website' };

  return {
    // `absolute` — layout'dagi title.template ikkinchi marta brend qo'shmasin.
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [{ url: image || LOGO_PATH, alt }],
    },
  };
}
