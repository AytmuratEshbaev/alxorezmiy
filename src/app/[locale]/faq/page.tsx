import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getFaq } from '@/lib/db/queries';
import { getLocalizedField, htmlLang, safe } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import JsonLd from '@/components/ui/JsonLd';
import FaqAccordion from '@/components/faq/FaqAccordion';
import { buildPageMetadata } from '@/lib/seo';
import type { FaqItem, Locale } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.faq' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/faq',
  });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safe<FaqItem[]>(() => getFaq(), [], 'faq getFaq');

  const faqLd =
    items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: htmlLang(locale),
          mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: getLocalizedField(item, 'question', locale as Locale),
            acceptedAnswer: {
              '@type': 'Answer',
              text: getLocalizedField(item, 'answer', locale as Locale),
            },
          })),
        }
      : null;

  return (
    <>
      {faqLd && <JsonLd data={faqLd} />}
      <PageHeader title={t('faq_page.title')} crumbs={[{ label: t('nav.faq') }]} />

      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <FaqAccordion items={items} locale={locale as Locale} />
        </div>
      </section>
    </>
  );
}
