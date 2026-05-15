import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getGallery } from '@/lib/firebase/server-queries';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { buildPageMetadata } from '@/lib/seo';
import type { GalleryItem, Locale } from '@/types';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.gallery' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '/gallery' });
}

async function safeGetGallery(): Promise<GalleryItem[]> {
  try {
    return await getGallery();
  } catch (err) {
    console.warn('[gallery] getGallery failed:', err);
    return [];
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safeGetGallery();

  return (
    <>
      <div className="page-header">
        <h1>{t('gallery_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.gallery')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <GalleryGrid items={items} locale={locale as Locale} />
        </div>
      </section>
    </>
  );
}
