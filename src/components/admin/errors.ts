'use client';
import { isSessionError } from '@/lib/admin-api';
import { toast } from '@/components/admin/Toast';

/**
 * Xatoni toast bilan ko'rsatadi. 401 (sessiya tugagan) uchun alohida doimiy ogohlantirish
 * allaqachon chiqqan bo'ladi — ikkinchi marta ko'rsatmaymiz.
 */
export function toastError(err: unknown, prefix = 'Xatolik: '): void {
  if (isSessionError(err)) return;
  const message = err instanceof Error ? err.message : String(err);
  toast.error(prefix + message);
}
