import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('hero');
  return (
    <main style={{ padding: '2rem' }}>
      <h1>{t('title')}</h1>
      <p>Locale: {locale}</p>
    </main>
  );
}
