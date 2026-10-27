'use client';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export const SIDEBAR_ID = 'admin-sidebar';

interface SidebarState {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

/** Mobil sidebar holati: sahifa almashganda va Esc bosilganda yopiladi. */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const value = useMemo(() => ({ open, setOpen, toggle: () => setOpen((v) => !v) }), [open]);
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider');
  return ctx;
}
