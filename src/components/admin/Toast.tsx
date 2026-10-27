'use client';
import { useEffect, useState, useCallback } from 'react';
import { SESSION_EXPIRED_EVENT, SESSION_EXPIRED_MESSAGE } from '@/lib/admin-api';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  href: string;
  /** Yangi oynada ochish (joriy sahifadagi forma holati saqlanib qoladi). */
  newTab?: boolean;
}

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  /** ms; 0 — foydalanuvchi yopmaguncha turadi. */
  duration?: number;
  action?: ToastAction;
  /** Bir xil kalitli toast allaqachon ko'rinib turgan bo'lsa, yangisi qo'shilmaydi. */
  key?: string;
}

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
  key?: string;
}

let externalPush: ((opts: ToastOptions) => void) | null = null;
let nextId = 1;

/** Show a toast notification from anywhere in the admin app. */
export function showToast(opts: ToastOptions): void {
  if (externalPush) {
    externalPush(opts);
  } else if (typeof window !== 'undefined') {
    // Fallback when host not mounted (very rare).
    // eslint-disable-next-line no-console
    console.warn('[toast]', opts.variant ?? 'info', opts.message);
  }
}

export const toast = {
  success: (message: string, duration?: number) =>
    showToast({ message, variant: 'success', duration }),
  error: (message: string, duration?: number) => showToast({ message, variant: 'error', duration }),
  info: (message: string, duration?: number) => showToast({ message, variant: 'info', duration }),
};

const ICON: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (opts: ToastOptions) => {
      const id = nextId++;
      const item: ToastItem = {
        id,
        message: opts.message,
        variant: opts.variant ?? 'info',
        duration: opts.duration ?? 4000,
        action: opts.action,
        key: opts.key,
      };
      setItems((prev) => (item.key && prev.some((t) => t.key === item.key) ? prev : [...prev, item]));
      if (item.duration > 0) {
        window.setTimeout(() => remove(id), item.duration);
      }
    },
    [remove]
  );

  useEffect(() => {
    externalPush = push;
    return () => {
      externalPush = null;
    };
  }, [push]);

  // 401: forma holatini saqlab qolish uchun sahifani almashtirmaymiz — qayta kirish havolasini beramiz.
  useEffect(() => {
    const onExpired = () =>
      push({
        key: 'session-expired',
        message: SESSION_EXPIRED_MESSAGE,
        variant: 'error',
        duration: 0,
        action: { label: 'Qayta kirish', href: '/admin/login', newTab: true },
      });
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [push]);

  return (
    <div className="admin-toast-container" aria-live="polite" aria-atomic="false">
      {items.map((t) => (
        <div key={t.id} role={t.variant === 'error' ? 'alert' : 'status'} className={`admin-toast admin-toast-${t.variant}`}>
          <span className="admin-toast-icon" aria-hidden="true">
            {ICON[t.variant]}
          </span>
          <span className="admin-toast-message">
            {t.message}
            {t.action && (
              <a
                className="admin-toast-action"
                href={t.action.href}
                target={t.action.newTab ? '_blank' : undefined}
                rel={t.action.newTab ? 'noopener' : undefined}
              >
                {t.action.label}
              </a>
            )}
          </span>
          <button
            type="button"
            className="admin-toast-close"
            onClick={() => remove(t.id)}
            aria-label="Bildirishnomani yopish"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
