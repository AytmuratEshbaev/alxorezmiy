'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';

const LANG_SHORT: Record<string, string> = { uz: 'UZ', ru: 'RU', kk: 'QQ', en: 'EN' };
const LANG_NAMES: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', kk: 'Qaraqalpaqsha', en: 'English' };

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className={`lang-switcher${open ? ' open' : ''}`} ref={ref}>
      <button
        className="lang-btn"
        aria-label="Tilni tanlash"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        <span className="lang-current">{LANG_SHORT[locale]}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div className="lang-dropdown" role="menu">
        {routing.locales.map((l) => (
          <a
            key={l}
            href="#"
            className={l === locale ? 'active' : undefined}
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              router.replace(pathname, { locale: l });
              setOpen(false);
            }}
          >
            {LANG_NAMES[l]}
          </a>
        ))}
      </div>
    </div>
  );
}
