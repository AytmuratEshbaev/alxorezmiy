'use client';
import { useEffect, useState, useCallback } from 'react';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  icon?: string;
}

interface State extends ConfirmOptions {
  open: boolean;
  resolve?: (v: boolean) => void;
}

let externalShow: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOptions = {}): Promise<boolean> {
  if (externalShow) return externalShow(opts);
  // Fallback if host not mounted yet
  return Promise.resolve(window.confirm(opts.message || 'Tasdiqlaysizmi?'));
}

export function ConfirmDialogHost() {
  const [state, setState] = useState<State>({ open: false });

  const show = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, ...opts, resolve });
    });
  }, []);

  useEffect(() => {
    externalShow = show;
    return () => {
      externalShow = null;
    };
  }, [show]);

  const close = (result: boolean) => {
    state.resolve?.(result);
    setState({ open: false });
  };

  useEffect(() => {
    if (!state.open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open]);

  if (!state.open) return null;

  const {
    title = 'Tasdiqlang',
    message = '',
    confirmText = 'Tasdiqlash',
    cancelText = 'Bekor qilish',
    danger = false,
    icon
  } = state;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(15, 23, 42, .65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: 'white',
          borderRadius: 16,
          maxWidth: 420,
          width: '100%',
          padding: 28,
          boxShadow: '0 24px 60px rgba(0, 0, 0, .25)'
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            marginBottom: 16,
            fontSize: '1.6rem',
            background: danger ? 'rgba(239, 68, 68, .12)' : 'rgba(99, 102, 241, .12)',
            color: danger ? '#EF4444' : '#6366F1'
          }}
        >
          {icon ?? (danger ? '⚠️' : '❓')}
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '.95rem', color: '#475569', lineHeight: 1.55, margin: '0 0 24px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => close(false)}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1.5px solid #E2E8F0',
              background: 'white',
              color: '#475569'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1.5px solid transparent',
              color: 'white',
              background: danger
                ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: danger
                ? '0 4px 14px rgba(239, 68, 68, .35)'
                : '0 4px 14px rgba(99, 102, 241, .35)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
