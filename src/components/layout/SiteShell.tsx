'use client';
import { useRef, useState, type ReactNode } from 'react';
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
  return (
    <>
      <ScrollProgress />
      <ScrollAnimations />
      <Navbar
        mobileOpen={mobileOpen}
        onHamburgerClick={() => setMobileOpen((v) => !v)}
        hamburgerRef={hamburgerRef}
      />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} triggerRef={hamburgerRef} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {footer}
      <BackToTop />
    </>
  );
}
