import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getFaq } from '@/lib/firebase/server-queries';
import FaqAccordion from '@/components/faq/FaqAccordion';
import { buildPageMetadata } from '@/lib/seo';
import type { FaqItem, Locale } from '@/types';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.faq' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '/faq' });
}

async function safeGetFaq(): Promise<FaqItem[]> {
  try {
    return await getFaq();
  } catch (err) {
    console.warn('[faq] getFaq failed:', err);
    return [];
  }
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safeGetFaq();

  return (
    <>
      <div className="page-header">
        <h1>{t('faq_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.faq')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <FaqAccordion items={items} locale={locale as Locale} />
        </div>
      </section>
    </>
  );
}
