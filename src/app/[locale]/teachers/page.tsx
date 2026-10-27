import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getTeachers } from '@/lib/db/queries';
import TeacherCard from '@/components/teachers/TeacherCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { safe } from '@/lib/utils';
import { buildPageMetadata } from '@/lib/seo';
import type { Teacher, Locale } from '@/types';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.teachers' });
  return buildPageMetadata({
    locale,
    title: t('title'),
    description: t('description'),
    path: '/teachers',
  });
}

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const items = await safe<Teacher[]>(() => getTeachers(), [], 'teachers getTeachers');

  return (
    <>
      <PageHeader title={t('teachers_page.title')} crumbs={[{ label: t('nav.teachers') }]} />

      <section className="section">
        <div className="container">
          <h2
            style={{ marginBottom: 'var(--space-2xl)', fontSize: '1.5rem', color: 'var(--ink-2)' }}
          >
            {t('teachers_page.subtitle')}
          </h2>

          {items.length === 0 ? (
            <EmptyState
              icon="users"
              title={t('teachers_page.empty_title')}
              text={t('teachers_page.empty_text')}
            />
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
