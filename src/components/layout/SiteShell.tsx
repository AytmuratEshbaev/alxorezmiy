'use client';
import { useState, type ReactNode } from 'react';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';
import ScrollProgress from './ScrollProgress';
import ScrollAnimations from './ScrollAnimations';

export default function SiteShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <ScrollProgress />
      <ScrollAnimations />
      <Navbar onHamburgerClick={() => setMobileOpen((v) => !v)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      {children}
      {footer}
      <BackToTop />
    </>
  );
}
