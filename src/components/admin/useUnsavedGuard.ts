'use client';
import { useEffect } from 'react';

/** Saqlanmagan o'zgarishlar bo'lsa, sahifani yopish/yangilashdan oldin brauzer ogohlantiradi. */
export function useUnsavedGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
