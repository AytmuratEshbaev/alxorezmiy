'use client';
import { useEffect, useId, useRef, useState, useCallback } from 'react';
import { trapTab, useDialogFocus } from '@/components/admin/useDialogFocus';

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
      setState((prev) => {
        // Oldingi ochiq dialog javobsiz qolmasin.
        prev.resolve?.(false);
        return { open: true, ...opts, resolve };
      });
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

  if (!state.open) return null;
  return <ConfirmDialogView state={state} onClose={close} />;
}

function ConfirmDialogView({ state, onClose }: { state: State; onClose: (r: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useDialogFocus(ref);

  const {
    title = 'Tasdiqlang',
    message = '',
    confirmText = 'Tasdiqlash',
    cancelText = 'Bekor qilish',
    danger = false,
    icon,
  } = state;

  return (
    <div
      className="confirm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <div
        ref={ref}
        className={'confirm-dialog' + (danger ? ' danger' : '')}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? descId : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose(false);
            return;
          }
          trapTab(e);
        }}
      >
        <div className="confirm-icon" aria-hidden="true">
          {icon ?? (danger ? '⚠️' : '❓')}
        </div>
        <h3 className="confirm-title" id={titleId}>
          {title}
        </h3>
        {message && (
          <p className="confirm-message" id={descId}>
            {message}
          </p>
        )}
        <div className="confirm-actions">
          {/* Xavfli amalda tasodifiy Enter tasdiqlab yubormasligi uchun fokus "Bekor qilish"da. */}
          <button
            type="button"
            className="btn btn-outline"
            data-autofocus={danger ? '' : undefined}
            onClick={() => onClose(false)}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')}
            data-autofocus={danger ? undefined : ''}
            onClick={() => onClose(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
