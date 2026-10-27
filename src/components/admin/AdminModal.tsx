'use client';
import { useId, useRef, type ReactNode } from 'react';
import { trapTab, useDialogFocus } from '@/components/admin/useDialogFocus';

interface AdminModalProps {
  title: string;
  /** Esc, fon yoki × bosilganda chaqiriladi (o'zgarishlar bo'lsa sahifa tasdiq so'raydi). */
  onRequestClose: () => void;
  children: ReactNode;
  /** Modal kengligi (px). */
  width?: number;
}

/**
 * Umumiy modal: role="dialog", aria-modal, sarlavha bilan bog'langan, fokus tutqichi,
 * ochilganda birinchi maydonga fokus va yopilganda avvalgi elementga qaytarish.
 * Esc tutqichi modalning o'zida — ustidan ochilgan ConfirmDialog bilan to'qnashmaydi.
 */
export function AdminModal({ title, onRequestClose, children, width = 600 }: AdminModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(ref);

  return (
    <div
      className="modal-overlay active"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ maxWidth: width }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onRequestClose();
            return;
          }
          trapTab(e);
        }}
      >
        <div className="modal-header">
          <h3 className="modal-title" id={titleId}>
            {title}
          </h3>
          <button className="modal-close" type="button" onClick={onRequestClose} aria-label="Yopish">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
