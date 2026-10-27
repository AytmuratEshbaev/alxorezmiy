import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export interface Crumb {
  label: string;
  /** Locale-relative path; the last crumb (current page) has none. */
  href?: string;
  /** Set when the label is DB content that fell back to another language. */
  lang?: string;
}

/** "Bosh sahifa / … / Joriy sahifa" — Home is prepended automatically. */
export default async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = await getTranslations();
  const all: Crumb[] = [{ label: t('common.home'), href: '/' }, ...items];
  return (
    <nav aria-label={t('a11y.breadcrumb')} className="breadcrumb-nav">
      <ol className="breadcrumb">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${i}-${c.href ?? ''}`}>
              {last || !c.href ? (
                <span className="current" aria-current={last ? 'page' : undefined} lang={c.lang}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href as never} lang={c.lang}>
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
