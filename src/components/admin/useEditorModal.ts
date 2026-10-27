'use client';
import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { confirmDialog } from '@/components/admin/ConfirmDialog';
import { useUnsavedGuard } from '@/components/admin/useUnsavedGuard';
import { useUploadTracker, type UploadTracker } from '@/components/admin/useUploadTracker';

export interface EditorModal<F> {
  open: boolean;
  editingId: string | null;
  form: F;
  setForm: Dispatch<SetStateAction<F>>;
  dirty: boolean;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  tracker: UploadTracker;
  /** Modalni ochish (id=null — yangi yozuv). */
  openWith: (id: string | null, form: F) => void;
  /** Esc/fon/×/Bekor qilish: o'zgarishlar bo'lsa tasdiq so'raydi. */
  requestClose: () => Promise<void>;
  /** Muvaffaqiyatli saqlangandan keyin: yuklamalarni "saqlangan" deb belgilab yopadi. */
  closeSaved: () => void;
}

/**
 * Tahrirlash modallari uchun umumiy holat: forma, "dirty" aniqlash (ochilgandagi nusxaga
 * nisbatan), beforeunload himoyasi, saqlanmagan yuklamalarni tozalash.
 */
export function useEditorModal<F>(empty: () => F): EditorModal<F> {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<F>(empty);
  const [submitting, setSubmittingState] = useState(false);
  const [uploading, setUploading] = useState(false);
  const snapshot = useRef('');
  const submittingRef = useRef(false);
  const tracker = useUploadTracker();

  const dirty = open && (JSON.stringify(form) !== snapshot.current || uploading);
  useUnsavedGuard(dirty);

  const setSubmitting = useCallback((v: boolean) => {
    submittingRef.current = v;
    setSubmittingState(v);
  }, []);

  const openWith = useCallback((id: string | null, next: F) => {
    snapshot.current = JSON.stringify(next);
    setEditingId(id);
    setForm(next);
    setUploading(false);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    tracker.discardAll();
    setOpen(false);
    setEditingId(null);
    setUploading(false);
  }, [tracker]);

  const requestClose = useCallback(async () => {
    // Saqlash davomida yopmaymiz — aks holda yuklama saqlanayotgan paytda o'chirilib ketishi mumkin.
    if (submittingRef.current) return;
    if (dirty) {
      const ok = await confirmDialog({
        title: "Saqlanmagan o'zgarishlar",
        message: "Kiritilgan o'zgarishlar saqlanmagan. Baribir yopilsinmi?",
        confirmText: 'Ha, yopish',
        cancelText: 'Tahrirlashni davom ettirish',
        danger: true,
      });
      if (!ok) return;
    }
    close();
  }, [dirty, close]);

  const closeSaved = useCallback(() => {
    tracker.commit();
    close();
  }, [tracker, close]);

  return {
    open,
    editingId,
    form,
    setForm,
    dirty,
    submitting,
    setSubmitting,
    uploading,
    setUploading,
    tracker,
    openWith,
    requestClose,
    closeSaved,
  };
}
