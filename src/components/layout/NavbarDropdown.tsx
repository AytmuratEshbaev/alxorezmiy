'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import type { NavItem } from './nav-config';

export default function NavbarDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownId = `nav-dropdown-${item.key}`;

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      containerRef.current?.querySelector<HTMLElement>(':scope > a')?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      containerRef.current?.querySelector<HTMLElement>('.nav-dropdown a')?.focus();
    }
  }

  return (
    <div
      className={`nav-item-has-children${open ? ' open' : ''}`}
      ref={containerRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <Link
        href={item.href as never}
        className={active ? 'active' : undefined}
        aria-expanded={open}
        aria-controls={dropdownId}
      >
        <span>{t(item.i18nKey as never)}</span>
        <svg
          className="nav-caret"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Link>
      <div className="nav-dropdown" id={dropdownId}>
        {item.children!.map((c) => (
          <Link
            key={c.key}
            href={c.href as never}
            className={pathname.endsWith(c.href) ? 'active' : undefined}
            aria-current={pathname.endsWith(c.href) ? 'page' : undefined}
          >
            {t(c.i18nKey as never)}
          </Link>
        ))}
      </div>
    </div>
  );
}
