'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { NAV_ITEMS } from './nav-config';

export default function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const flat = NAV_ITEMS.flatMap((i) => i.children ?? [i]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`mobile-nav${open ? ' active' : ''}`} id="mobileNav">
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
    </div>
  );
}
