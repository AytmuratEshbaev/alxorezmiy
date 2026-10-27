'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from '@/i18n/routing';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';
import ScrollProgress from './ScrollProgress';
import ScrollAnimations from './ScrollAnimations';

export default function SiteShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Har qanday navigatsiya (havola, orqaga tugmasi, qidiruv) menyuni yopadi.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <ScrollProgress />
      <ScrollAnimations />
      <Navbar
        mobileOpen={mobileOpen}
        onHamburgerClick={() => setMobileOpen((v) => !v)}
        hamburgerRef={hamburgerRef}
      />
      <MobileNav open={mobileOpen} onClose={closeMobile} triggerRef={hamburgerRef} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {footer}
      <BackToTop />
    </>
  );
}
