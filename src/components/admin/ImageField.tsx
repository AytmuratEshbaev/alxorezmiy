'use client';
import { useEffect, useRef, useState } from 'react';
import {
  deleteUpload,
  isAbortError,
  uploadImage,
  type UploadFolder,
} from '@/lib/admin-api';
import { toastError } from '@/components/admin/errors';
import type { UploadTracker } from '@/components/admin/useUploadTracker';

export interface ImageValue {
  url: string;
  fileId: string;
}

interface ImageFieldProps {
  id: string;
  label: string;
  required?: boolean;
  folder: UploadFolder;
  url: string;
  fileId: string;
  onChange: (value: ImageValue) => void;
  tracker: UploadTracker;
  onUploadingChange: (uploading: boolean) => void;
  /** round — o'qituvchi fotosi, wide — yangilik/galereya rasmi. */
  shape?: 'round' | 'wide';
  /** "Rasmni olib tashlash" tugmasini ko'rsatish. */
  removable?: boolean;
}

/**
 * Rasm yuklash maydoni: progress, bekor qilish (modal yopilsa XHR to'xtatiladi), eskirgan
 * javoblarni e'tiborsiz qoldirish, almashtirilgan/olib tashlangan saqlanmagan yuklamani o'chirish.
 */
export function ImageField({
  id,
  label,
  required = false,
  folder,
  url,
  fileId,
  onChange,
  tracker,
  onUploadingChange,
  shape = 'wide',
  removable = true,
}: ImageFieldProps) {
  const [pct, setPct] = useState<number | null>(null);
  const seq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const fileIdRef = useRef(fileId);
  fileIdRef.current = fileId;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadingRef = useRef(onUploadingChange);
  onUploadingRef.current = onUploadingChange;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- so'rov hisoblagichi, DOM ref emas: eskirgan javoblarni bekor qilish uchun ataylab oshiriladi
      seq.current++;
      abortRef.current?.abort();
    };
  }, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    abortRef.current?.abort();
    const mine = ++seq.current;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const isCurrent = () => mounted.current && mine === seq.current;

    setPct(0);
    onUploadingRef.current(true);
    try {
      const res = await uploadImage(file, folder, (p) => isCurrent() && setPct(p), ctrl.signal);
      if (!isCurrent()) {
        // Modal yopilgan yoki boshqa fayl tanlangan — bu yuklama hech qayerda ishlatilmaydi.
        void deleteUpload(res.fileId);
        return;
      }
      tracker.add(res.fileId);
      const prev = fileIdRef.current;
      if (prev && prev !== res.fileId) tracker.drop(prev);
      onChangeRef.current({ url: res.url, fileId: res.fileId });
      setPct(100);
      window.setTimeout(() => {
        if (isCurrent()) setPct(null);
      }, 1200);
    } catch (err) {
      if (!isCurrent()) return;
      setPct(null);
      if (!isAbortError(err)) toastError(err, 'Rasm yuklashda xato: ');
    } finally {
      if (isCurrent()) {
        abortRef.current = null;
        onUploadingRef.current(false);
      }
    }
  };

  const remove = () => {
    tracker.drop(fileId);
    onChange({ url: '', fileId: '' });
  };

  const uploading = pct !== null && pct < 100;

  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="image-uploader">
        <input
          id={id}
          type="file"
          accept="image/*"
          aria-describedby={pct !== null ? `${id}-progress` : undefined}
          onChange={(e) => {
            const file = e.target.files?.[0];
            // Bir xil faylni qayta tanlash ham onChange chaqirishi uchun.
            e.target.value = '';
            void handleFile(file);
          }}
        />
        {url && (
          <div className={'image-preview ' + shape}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Tanlangan rasm"
              width={shape === 'round' ? 160 : 480}
              height={shape === 'round' ? 160 : 240}
            />
          </div>
        )}
        {pct !== null && (
          <div className="upload-progress" id={`${id}-progress`}>
            <div
              className="upload-progress-bar"
              role="progressbar"
              aria-label="Yuklash jarayoni"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div className="upload-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <small>{pct < 100 ? `${pct}%` : 'Yuklandi'}</small>
          </div>
        )}
        {removable && url && (
          <button
            type="button"
            className="btn btn-outline btn-sm image-remove"
            onClick={remove}
            disabled={uploading}
          >
            Rasmni olib tashlash
          </button>
        )}
      </div>
    </div>
  );
}
