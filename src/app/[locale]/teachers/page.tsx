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
            <h2 style={{ marginBottom: 'var(--s-2)' }}>{t('teachers_page.title')}</h2>
            <p>{t('teachers_page.subtitle')}</p>
          </div>

          {items.length === 0 ? (
            <div
              role="status"
              style={{
                textAlign: 'center',
                color: 'var(--ink-3)',
                padding: 'var(--s-16) var(--s-4)',
                maxWidth: 480,
                margin: '0 auto'
              }}
            >
              <div aria-hidden="true" style={{ fontSize: '3rem', marginBottom: 'var(--s-4)', opacity: 0.5 }}>👩‍🏫</div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--s-2)', color: 'var(--ink-2)' }}>
                {t('teachers_page.empty_title')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9375rem' }}>{t('teachers_page.empty_text')}</p>
            </div>
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
