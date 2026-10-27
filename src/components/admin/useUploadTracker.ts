'use client';
import { useEffect, useMemo, useRef } from 'react';
import { deleteUpload } from '@/lib/admin-api';

export interface UploadTracker {
  /** Modal sessiyasida yuklangan (hali saqlanmagan) kalitni ro'yxatga olish. */
  add: (key: string) => void;
  /** Kalit shu sessiyada yuklangan bo'lsa — R2'dan o'chirish (almashtirildi/olib tashlandi). */
  drop: (key: string) => void;
  /** Saqlash muvaffaqiyatli — kutilayotgan kalitlar endi yozuvga tegishli. */
  commit: () => void;
  /** Bekor qilish/yopish — saqlanmagan barcha yuklamalarni o'chirish. */
  discardAll: (opts?: { keepalive?: boolean }) => void;
  pendingCount: () => number;
}

/**
 * Modal ichida yuklangan, lekin saqlanmagan rasmlarni kuzatadi va ular yetim bo'lib
 * qolmasligi uchun o'chiradi (best-effort; server ishlatilayotgan kalitni o'chirmaydi).
 */
export function useUploadTracker(): UploadTracker {
  const pending = useRef(new Set<string>());

  const tracker = useMemo<UploadTracker>(
    () => ({
      add: (key) => {
        if (key) pending.current.add(key);
      },
      drop: (key) => {
        if (key && pending.current.delete(key)) void deleteUpload(key);
      },
      commit: () => pending.current.clear(),
      discardAll: (opts) => {
        const keys = [...pending.current];
        pending.current.clear();
        for (const k of keys) void deleteUpload(k, opts);
      },
      pendingCount: () => pending.current.size,
    }),
    []
  );

  useEffect(() => {
    // bfcache'ga tushgan sahifa ochiq modal bilan qaytishi mumkin — faqat haqiqiy yopilishda tozalaymiz.
    const onPageHide = (e: PageTransitionEvent) => {
      if (!e.persisted) tracker.discardAll({ keepalive: true });
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      tracker.discardAll();
    };
  }, [tracker]);

  return tracker;
}
