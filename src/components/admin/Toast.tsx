'use client';
import { useEffect, useState, useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<ToastOptions> {
  id: number;
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
  success: (message: string, duration?: number) => showToast({ message, variant: 'success', duration }),
  error: (message: string, duration?: number) => showToast({ message, variant: 'error', duration }),
  info: (message: string, duration?: number) => showToast({ message, variant: 'info', duration })
};

const ICON: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ'
};

const BG: Record<ToastVariant, string> = {
  success: 'linear-gradient(135deg, #10B981, #059669)',
  error: 'linear-gradient(135deg, #EF4444, #DC2626)',
  info: 'linear-gradient(135deg, #6366F1, #4F46E5)'
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((opts: ToastOptions) => {
    const id = nextId++;
    const item: ToastItem = {
      id,
      message: opts.message,
      variant: opts.variant ?? 'info',
      duration: opts.duration ?? 4000
    };
    setItems((prev) => [...prev, item]);
    if (item.duration > 0) {
      window.setTimeout(() => remove(id), item.duration);
    }
  }, [remove]);

  useEffect(() => {
    externalPush = push;
    return () => {
      externalPush = null;
    };
  }, [push]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 6000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 48px)'
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          onClick={() => remove(t.id)}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            background: BG[t.variant],
            color: 'white',
            padding: '14px 18px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 260,
            maxWidth: 420,
            boxShadow: '0 12px 32px rgba(15, 23, 42, .25)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            lineHeight: 1.5,
            animation: 'toastSlideIn 0.25s cubic-bezier(.22, 1, .36, 1)'
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              flexShrink: 0,
              fontSize: '0.875rem'
            }}
          >
            {ICON[t.variant]}
          </span>
          <span style={{ flex: 1, wordBreak: 'break-word' }}>{t.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
