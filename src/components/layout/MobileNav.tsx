'use client';
import { useEffect, useRef, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import Icon from '@/components/ui/Icon';
import { NAV_ITEMS, matchesPath } from './nav-config';

// React 18 tiplarida `inert` yo'q — atribut sifatida satr bilan uzatamiz (SSR'da ham chiqadi).
const INERT = { inert: '' } as unknown as Record<string, never>;

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
  const closeRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);
  // Havola bosilganda true — yopilishda fokus hamburgerga qaytarilmaydi.
  const navigating = useRef(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Ochilganda — yopish tugmasiga fokus; Esc/yopish tugmasi bilan yopilganda — hamburgerga.
  // Navigatsiya tufayli yopilsa fokus qaytarilmaydi (yangi sahifa o'z fokusini oladi).
  // Birinchi mount'da fokus o'g'irlanmaydi.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (open) {
      navigating.current = false;
      closeRef.current?.focus();
    } else if (!navigating.current) {
      triggerRef?.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape closes + focus trap (yopish tugmasi + havolalar) while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = navRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!navRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Yopiq holatda `inert` — panel va havolalar tab tartibidan ham, AT daraxtidan ham chiqadi
  // (CSS visibility:hidden qo'shimcha himoya, responsive.css).
  return (
    <nav
      ref={navRef}
      className={`mobile-nav${open ? ' active' : ''}`}
      id="mobileNav"
      role="dialog"
      aria-modal={open ? true : undefined}
      aria-label={t('a11y.mobile_menu')}
      {...(open ? {} : INERT)}
    >
      <button
        type="button"
        ref={closeRef}
        className="mobile-nav-close"
        onClick={onClose}
        aria-label={t('a11y.close_menu')}
      >
        <Icon name="x" size={22} />
      </button>
      {flat.map((item) => {
        const active = matchesPath(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href as never}
            className={active ? 'active' : undefined}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              navigating.current = (pathname.replace(/(.)\/$/, '$1') || '/') !== item.href;
              onClose();
            }}
          >
            {t(item.i18nKey as never)}
          </Link>
        );
      })}
    </nav>
  );
}
