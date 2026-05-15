import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getTeachers } from '@/lib/firebase/server-queries';
import TeacherCard from '@/components/teachers/TeacherCard';
import { buildPageMetadata } from '@/lib/seo';
import type { Teacher, Locale } from '@/types';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.teachers' });
  return buildPageMetadata({ locale, title: t('title'), description: t('description'), path: '/teachers' });
}

async function safeGetTeachers(): Promise<Teacher[]> {
  try {
    return await getTeachers();
  } catch (err) {
    console.warn('[teachers] getTeachers failed:', err);
    return [];
  }
}

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safeGetTeachers();

  return (
    <>
      <div className="page-header">
        <h1>{t('teachers_page.title')}</h1>
        <div className="breadcrumb">
          <Link href={'/' as never}>{t('common.home')}</Link>
          <span className="separator">/</span>
          <span className="current">{t('nav.teachers')}</span>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 8 }}>{t('teachers_page.title')}</h2>
            <p>{t('teachers_page.subtitle')}</p>
          </div>

          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 60 }}>
              {t('teachers_page.empty')}
            </p>
          ) : (
            <div className="grid grid-4">
              {items.map((item) => (
                <TeacherCard key={item.id} item={item} locale={locale as Locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
