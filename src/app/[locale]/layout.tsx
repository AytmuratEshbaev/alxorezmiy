import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing, type AppLocale } from '@/i18n/routing';
import { fontVariables } from '@/lib/fonts';
import { SITE_URL, getNonce, getSiteName } from '@/lib/seo';
import { htmlLang, pick } from '@/lib/utils';
import { ThemeProvider } from '@/contexts/ThemeContext';
import SiteShell from '@/components/layout/SiteShell';
import Footer from '@/components/layout/Footer';
import type { Locale } from '@/types';
import '@/styles/globals.css';
import '@/styles/dark-theme.css';
import '@/styles/responsive.css';

// Kontent D1'dan har so'rovda o'qiladi — admin o'zgarishlari darhol ko'rinadi.
export const dynamic = 'force-dynamic';

/**
 * Client komponentlar (`'use client'` + ularga import qilingan NewsCard) ishlatadigan
 * xabar nom fazolari. Qolganlari faqat serverda render qilinadi — HTML'ga JSON bo'lib
 * tushmasin. Yangi client komponentda useTranslations('...') qo'shilsa, bu yerga ham qo'shing.
 */
const CLIENT_NAMESPACES = [
  'a11y',
  'a11y_extra',
  'nav',
  'common',
  'search',
  'forms',
  'error_page',
  'news_page',
  'contact_page',
  'admission_form',
  'faq_page',
  'faq_page_extra',
  'gallery_page',
  'gallery_page_extra',
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteName = routing.locales.includes(locale as AppLocale)
    ? await getSiteName(locale)
    : 'Al-Xorazmiy maktabi';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: siteName, template: `%s — ${siteName}` },
    applicationName: siteName,
    manifest: '/manifest.json',
    icons: {
      icon: '/assets/icons/favicon.svg',
      apple: '/assets/images/logo.webp',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0D0D5C',
};

// Bo'yoqdan oldin: `js` klassi (no-JS'da animatsiyali bloklar yashirinmasin) va tema.
// Saqlangan tanlov bo'lmasa OS sozlamasi qo'llanadi, lekin saqlanmaydi.
const HEAD_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{var s=localStorage.getItem('theme');var t=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');d.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);
  const [messages, nonce] = await Promise.all([getMessages(), getNonce()]);
  const clientMessages = pick(messages as Record<string, unknown>, CLIENT_NAMESPACES);

  return (
    <html lang={htmlLang(locale)} className={fontVariables} suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={clientMessages as typeof messages}>
          <ThemeProvider>
            <SiteShell footer={<Footer locale={locale as Locale} />}>{children}</SiteShell>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
