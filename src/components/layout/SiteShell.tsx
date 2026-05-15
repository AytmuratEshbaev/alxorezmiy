'use client';
import { useState, type ReactNode } from 'react';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';
import ScrollProgress from './ScrollProgress';

export default function SiteShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <ScrollProgress />
      <Navbar onHamburgerClick={() => setMobileOpen((v) => !v)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      {children}
      {footer}
      <BackToTop />
    </>
  );
}
