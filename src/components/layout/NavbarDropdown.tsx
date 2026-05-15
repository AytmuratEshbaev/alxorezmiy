'use client';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import type { NavItem } from './nav-config';

export default function NavbarDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  return (
    <div className="nav-item-has-children">
      <Link href={item.href as never} className={active ? 'active' : undefined} aria-haspopup="true" aria-expanded="false">
        <span>{t(item.i18nKey as never)}</span>
        <svg className="nav-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Link>
      <div className="nav-dropdown" role="menu">
        {item.children!.map((c) => (
          <Link
            key={c.key}
            href={c.href as never}
            className={pathname.endsWith(c.href) ? 'active' : undefined}
            aria-current={pathname.endsWith(c.href) ? 'page' : undefined}
            role="menuitem"
          >
            {t(c.i18nKey as never)}
          </Link>
        ))}
      </div>
    </div>
  );
}
