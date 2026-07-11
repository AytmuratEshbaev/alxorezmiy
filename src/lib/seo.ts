import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz').replace(/\/$/, '');

const BRAND = 'Al-Xorazmiy maktabi';

// next-intl uses BCP-47-ish locale tags. Map our routing locales to OG ones.
const OG_LOCALES: Record<string, string> = {
  uz: 'uz_UZ',
  ru: 'ru_RU',
  kk: 'kk_KZ',
  en: 'en_US',
};

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
export function buildPageMetadata({
  locale,
  title,
  description,
  path = '',
  image,
  imageAlt,
  ogType = 'website',
  publishedTime,
  modifiedTime,
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  const ogImage = image || '/assets/images/logo.webp';
  // Avoid a double brand suffix when the title already contains the school name.
  const fullTitle = title.includes(BRAND) ? title : `${title} — ${BRAND}`;
  const alt = imageAlt || fullTitle;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`;

  // Declare dimensions only for the bundled fallback logo (its real size);
  // override images come from ImageKit with unknown dimensions — omit rather than lie.
  const images = image
    ? [{ url: image, alt }]
    : [{ url: ogImage, width: 1000, height: 1000, alt }];

  const openGraphBase = {
    title: fullTitle,
    description,
    url,
    siteName: BRAND,
    locale: OG_LOCALES[locale] || locale,
    images,
  };

  const openGraph: Metadata['openGraph'] =
    ogType === 'article'
      ? { ...openGraphBase, type: 'article', publishedTime, modifiedTime }
      : { ...openGraphBase, type: 'website' };

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [{ url: ogImage, alt }],
    },
  };
}
