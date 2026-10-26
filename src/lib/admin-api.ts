'use client';
/**
 * Admin panel uchun klient API (avvalgi Firestore client-queries o'rniga, imzolar deyarli bir xil).
 * Real-time onSnapshot o'rniga: yozish amalidan keyin shu collection'ga obuna bo'lganlar
 * avtomatik qayta yuklanadi, oyna fokusga qaytganda ham yangilanadi.
 */

export interface QueryOptions {
  orderBy?: string;
  direction?: 'asc' | 'desc';
  where?: Record<string, string | number | boolean>;
  limit?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'same-origin',
    headers:
      init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json', ...init.headers }
        : init?.headers,
  });
  if (
    res.status === 401 &&
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/admin/login')
  ) {
    window.location.href = '/admin/login';
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error || `HTTP ${res.status}`, res.status);
  return data as T;
}

const listeners = new Map<string, Set<() => void>>();

function notify(name: string) {
  listeners.get(name)?.forEach((fn) => fn());
}

function listUrl(name: string, options: QueryOptions) {
  const p = new URLSearchParams();
  if (options.orderBy) p.set('orderBy', options.orderBy);
  if (options.direction) p.set('direction', options.direction);
  if (options.limit) p.set('limit', String(options.limit));
  for (const [k, v] of Object.entries(options.where || {})) p.append('where', `${k}:${v}`);
  const qs = p.toString();
  return `/api/admin/data/${name}${qs ? `?${qs}` : ''}`;
}

export async function getDocuments<T>(name: string, options: QueryOptions = {}): Promise<T[]> {
  const { items } = await apiFetch<{ items: T[] }>(listUrl(name, options));
  return items;
}

export function subscribeCollection<T>(
  name: string,
  callback: (items: T[]) => void,
  options: QueryOptions = {},
  onError?: (err: Error) => void
): () => void {
  let active = true;
  let seq = 0;
  const load = () => {
    const mine = ++seq;
    getDocuments<T>(name, options)
      .then((items) => {
        // Faqat eng so'nggi so'rov natijasini qo'llaymiz (eski javob yangisini bosib ketmasin).
        if (active && mine === seq) callback(items);
      })
      .catch((err: Error) => {
        console.error(`[${name}] load error:`, err);
        if (active) onError?.(err);
      });
  };
  const onFocus = () => document.visibilityState === 'visible' && load();

  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(load);
  document.addEventListener('visibilitychange', onFocus);
  load();

  return () => {
    active = false;
    listeners.get(name)?.delete(load);
    document.removeEventListener('visibilitychange', onFocus);
  };
}

export async function addDocument<T extends object>(name: string, data: T) {
  const res = await apiFetch<{ id: string }>(`/api/admin/data/${name}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  notify(name);
  return res;
}

export async function updateDocument<T extends object>(
  name: string,
  id: string,
  data: T,
  { silent = false } = {}
) {
  await apiFetch(`/api/admin/data/${name}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!silent) notify(name);
}

export async function deleteDocument(name: string, id: string) {
  await apiFetch(`/api/admin/data/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  notify(name);
}

/** Bir nechta yozuvni yangilab, ro'yxatni faqat bir marta qayta yuklaydi. */
export async function updateMany<T extends object>(name: string, ids: string[], data: T) {
  try {
    await Promise.all(ids.map((id) => updateDocument(name, id, data, { silent: true })));
  } finally {
    notify(name);
  }
}

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 2400;

/**
 * Katta rasmlarni yuklashdan oldin brauzerda kichraytiradi (eng uzun tomoni ≤ 2400px, WebP).
 * Telefon kamerasidan 8–12MB'lik suratlar 300–600KB bo'lib ketadi. GIF/kichik fayllarga tegilmaydi.
 */
async function downscale(file: File): Promise<File> {
  if (
    file.type === 'image/gif' ||
    file.size < 800 * 1024 ||
    typeof createImageBitmap !== 'function'
  )
    return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function uploadImage(
  original: File,
  folder: 'news' | 'teachers' | 'gallery' | 'misc' = 'misc',
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  if (!original.type.startsWith('image/')) throw new Error('Faqat rasm fayllari qabul qilinadi');
  const file = await downscale(original);
  if (file.size > MAX_BYTES) throw new Error('Rasm hajmi 10MB dan oshmasligi kerak');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  // fetch upload progress bermaydi — XHR ishlatamiz.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.onload = () => {
      let result: { url?: string; fileId?: string; name?: string; error?: string } = {};
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && result.url && result.fileId) {
        resolve({ url: result.url, fileId: result.fileId, name: result.name || file.name });
      } else {
        reject(new Error(result.error || 'Yuklash muvaffaqiyatsiz'));
      }
    };
    xhr.onerror = () => reject(new Error('Tarmoq xatosi'));
    xhr.send(formData);
  });
}
