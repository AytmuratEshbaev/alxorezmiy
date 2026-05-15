import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alxorezmiy.uz').replace(/\/$/, '');

// next-intl uses BCP-47-ish locale tags. Map our routing locales to OG ones.
const OG_LOCALES: Record<string, string> = {
  uz: 'uz_UZ',
  ru: 'ru_RU',
  kk: 'kk_KZ',
  en: 'en_US'
};

export interface PageMetaInput {
  locale: string;
  title: string;
  description: string;
  /** Path AFTER the /:locale prefix, e.g. "/about", "/news/abc". Use "" for the home page. */
  path?: string;
  /** Optional OG image override (absolute or root-relative URL). */
  image?: string;
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
  image
}: PageMetaInput): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  const ogImage = image || '/assets/images/logo.webp';

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${path}`;
  }
  languages['x-default'] = `${SITE_URL}/${routing.defaultLocale}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Al-Xorazmiy maktabi',
      locale: OG_LOCALES[locale] || locale,
      type: 'website',
      images: [{ url: ogImage }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage]
    }
  };
}
