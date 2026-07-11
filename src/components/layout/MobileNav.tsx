'use client';
import { useEffect, useRef, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { NAV_ITEMS } from './nav-config';

export default function MobileNav({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLButtonElement>;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const flat = NAV_ITEMS.flatMap((i) => i.children ?? [i]);
  const navRef = useRef<HTMLElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus first link on open; restore focus to the hamburger on close.
  // Skip the initial mount so we don't steal focus on page load.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (open) {
      const first = navRef.current?.querySelector<HTMLElement>('a');
      first?.focus();
    } else {
      triggerRef?.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape closes + focus trap while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = navRef.current?.querySelectorAll<HTMLElement>('a[href]');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Closed state uses CSS visibility:hidden (see responsive.css), which
  // removes the panel and its links from the tab order. React 18 does not
  // support the `inert` attribute, so we rely on the visibility approach.
  return (
    <nav
      ref={navRef}
      className={`mobile-nav${open ? ' active' : ''}`}
      id="mobileNav"
      role="dialog"
      aria-modal="true"
      aria-label={t('a11y.mobile_menu')}
      aria-hidden={!open}
    >
      {flat.map((item) => (
        <Link
          key={item.key}
          href={item.href as never}
          className={pathname === item.href ? 'active' : undefined}
          aria-current={pathname === item.href ? 'page' : undefined}
          onClick={onClose}
        >
          {t(item.i18nKey as never)}
        </Link>
      ))}
    </nav>
  );
}
