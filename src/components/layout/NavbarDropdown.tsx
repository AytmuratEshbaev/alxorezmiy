'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { matchesPath, type NavItem } from './nav-config';

export default function NavbarDropdown({ item, active }: { item: NavItem; active: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Sensorli ekranlarda hover yo'q: birinchi bosish menyuni ochadi, ikkinchisi o'tadi.
  // pointerdown paytidagi holat saqlanadi, chunki fokus (onFocus) click'dan oldin ochib qo'yadi.
  const tap = useRef<{ touch: boolean; wasOpen: boolean }>({ touch: false, wasOpen: false });
  const dropdownId = `nav-dropdown-${item.key}`;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Tashqariga bosish (sensorli ekranlarda mouseleave yo'q) yopadi.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

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
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <Link
        href={item.href as never}
        className={active ? 'active' : undefined}
        aria-expanded={open}
        aria-controls={dropdownId}
        onPointerDown={(e) => {
          tap.current = { touch: e.pointerType !== 'mouse', wasOpen: open };
        }}
        onClick={(e) => {
          const { touch, wasOpen } = tap.current;
          tap.current = { touch: false, wasOpen: false };
          if (touch && !wasOpen) {
            e.preventDefault();
            setOpen(true);
          }
        }}
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
        {item.children!.map((c) => {
          const current = matchesPath(pathname, c.href);
          return (
            <Link
              key={c.key}
              href={c.href as never}
              className={current ? 'active' : undefined}
              aria-current={current ? 'page' : undefined}
            >
              {t(c.i18nKey as never)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
