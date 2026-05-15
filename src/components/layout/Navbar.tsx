'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { NAV_ITEMS } from './nav-config';
import NavbarDropdown from './NavbarDropdown';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SearchTrigger from '@/components/ui/SearchTrigger';

export default function Navbar({ onHamburgerClick }: { onHamburgerClick: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function isActive(item: { key: string; href: string; childKeys?: string[] }) {
    const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    if (item.href === path) return true;
    if (item.childKeys && item.childKeys.some((k) => path.endsWith(`/${k}`))) return true;
    return false;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">{t('a11y.skip')}</a>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" aria-label={t('a11y.home_link')}>
            <span className="navbar-logo-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/logo.webp" alt="" width={44} height={44} />
            </span>
          </Link>
          <div className="nav-links">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <NavbarDropdown key={item.key} item={item} active={isActive(item)} />
              ) : (
                <Link
                  key={item.key}
                  href={item.href as never}
                  className={isActive(item) ? 'active' : undefined}
                  aria-current={isActive(item) ? 'page' : undefined}
                >
                  {t(item.i18nKey as never)}
                </Link>
              )
            )}
          </div>
          <div className="nav-actions">
            <SearchTrigger />
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              type="button"
              className="hamburger"
              aria-label={t('a11y.menu')}
              aria-expanded="false"
              aria-controls="mobileNav"
              onClick={onHamburgerClick}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
