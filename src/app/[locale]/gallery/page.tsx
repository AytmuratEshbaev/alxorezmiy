import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getGallery } from '@/lib/db/queries';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import PageHeader from '@/components/ui/PageHeader';
import { buildPageMetadata } from '@/lib/seo';
import { safe } from '@/lib/utils';
import type { GalleryItem, Locale } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.gallery' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/gallery',
  });
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safe<GalleryItem[]>(() => getGallery(), [], 'gallery getGallery');

  return (
    <>
      <PageHeader title={t('gallery_page.title')} crumbs={[{ label: t('nav.gallery') }]} />

      <section className="section">
        <div className="container">
          <GalleryGrid items={items} locale={locale as Locale} />
        </div>
      </section>
    </>
  );
}
