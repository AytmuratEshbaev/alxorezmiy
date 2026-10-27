'use client';
/**
 * Admin panel uchun klient API (avvalgi Firestore client-queries o'rniga).
 * Yozish amalidan keyin shu collection'ga obuna bo'lganlar (`onCollectionChange`) xabardor qilinadi
 * va ro'yxatlarni qayta yuklaydi.
 */

export interface QueryOptions {
  orderBy?: string;
  direction?: 'asc' | 'desc';
  where?: Record<string, string | number | boolean>;
  limit?: number;
  /** Faqat `createdAt` shu ISO vaqtdan oldingi yozuvlar (createdAt desc sahifalash uchun). */
  before?: string;
}

export interface Page<T> {
  items: T[];
  hasMore: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export const SESSION_EXPIRED_EVENT = 'admin:session-expired';
export const SESSION_EXPIRED_MESSAGE = 'Sessiya tugadi — qayta kiring';

/**
 * 401 bo'lsa sahifani majburan almashtirmaymiz (forma ma'lumotlari yo'qolmasin) —
 * hodisa yuboramiz, ToastHost "Qayta kirish" havolasi bilan ogohlantirish ko'rsatadi.
 */
function sessionExpired(): ApiError {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return new ApiError(SESSION_EXPIRED_MESSAGE, 401);
}

export function isSessionError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
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
  if (res.status === 401) throw sessionExpired();
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error || `HTTP ${res.status}`, res.status);
  return data as T;
}

const listeners = new Map<string, Set<() => void>>();

/** Collection o'zgarganda (yozish amalidan keyin) chaqiriladigan funksiyani ro'yxatga oladi. */
export function onCollectionChange(name: string, fn: () => void): () => void {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(fn);
  return () => {
    listeners.get(name)?.delete(fn);
  };
}

export function notifyCollection(name: string) {
  listeners.get(name)?.forEach((fn) => fn());
}

function listUrl(name: string, options: QueryOptions) {
  const p = new URLSearchParams();
  if (options.orderBy) p.set('orderBy', options.orderBy);
  if (options.direction) p.set('direction', options.direction);
  if (options.limit) p.set('limit', String(options.limit));
  if (options.before) p.set('before', options.before);
  for (const [k, v] of Object.entries(options.where || {})) p.append('where', `${k}:${v}`);
  const qs = p.toString();
  return `/api/admin/data/${name}${qs ? `?${qs}` : ''}`;
}

export async function getPage<T>(name: string, options: QueryOptions = {}): Promise<Page<T>> {
  const res = await apiFetch<{ items: T[]; hasMore?: boolean }>(listUrl(name, options));
  return { items: res.items, hasMore: !!res.hasMore };
}

export async function getDocuments<T>(name: string, options: QueryOptions = {}): Promise<T[]> {
  return (await getPage<T>(name, options)).items;
}

export async function addDocument<T extends object>(name: string, data: T) {
  const res = await apiFetch<{ id: string }>(`/api/admin/data/${name}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  notifyCollection(name);
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
  if (!silent) notifyCollection(name);
}

export async function deleteDocument(name: string, id: string) {
  await apiFetch(`/api/admin/data/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  notifyCollection(name);
}

const BULK_CHUNK = 500;

/** Bir nechta yozuvga bir xil o'zgarishni bulk PATCH bilan yozadi; ro'yxat bir marta yangilanadi. */
export async function updateMany<T extends object>(name: string, ids: string[], data: T) {
  try {
    for (let i = 0; i < ids.length; i += BULK_CHUNK) {
      await apiFetch(`/api/admin/data/${name}`, {
        method: 'PATCH',
        body: JSON.stringify({ ids: ids.slice(i, i + BULK_CHUNK), data }),
      });
    }
  } finally {
    notifyCollection(name);
  }
}

/**
 * Har xil ma'lumotli bir nechta yangilash (masalan, tartib raqamlari). So'rovlar cheklangan
 * parallellikda jo'natiladi, ro'yxat oxirida faqat bir marta yangilanadi.
 */
export async function updateEach<T extends object>(
  name: string,
  updates: { id: string; data: T }[],
  concurrency = 6
) {
  let next = 0;
  const worker = async () => {
    while (next < updates.length) {
      const u = updates[next++];
      await updateDocument(name, u.id, u.data, { silent: true });
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, updates.length) }, worker));
  } finally {
    notifyCollection(name);
  }
}

/**
 * Saqlanmagan (bekor qilingan/almashtirilgan) yuklamani R2'dan o'chirish. Server kalit biror
 * yozuvda ishlatilayotgan bo'lsa o'chirmaydi. Best-effort: xatolar e'tiborsiz qoldiriladi.
 */
export function deleteUpload(key: string, { keepalive = false } = {}): Promise<void> {
  if (!key) return Promise.resolve();
  return fetch('/api/admin/upload', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
    keepalive,
  }).then(
    () => undefined,
    () => undefined
  );
}

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
}

export type UploadFolder = 'news' | 'teachers' | 'gallery' | 'misc';

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

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export async function uploadImage(
  original: File,
  folder: UploadFolder = 'misc',
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<UploadResult> {
  if (!original.type.startsWith('image/')) throw new Error('Faqat rasm fayllari qabul qilinadi');
  const file = await downscale(original);
  if (file.size > MAX_BYTES) throw new Error('Rasm hajmi 10MB dan oshmasligi kerak');
  if (signal?.aborted) throw new DOMException('Upload aborted', 'AbortError');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  // fetch upload progress bermaydi — XHR ishlatamiz.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    signal?.addEventListener('abort', onAbort);
    xhr.open('POST', '/api/admin/upload');
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.onload = () => {
      cleanup();
      if (xhr.status === 401) {
        reject(sessionExpired());
        return;
      }
      let result: { url?: string; fileId?: string; name?: string; error?: string } = {};
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && result.url && result.fileId) {
        resolve({ url: result.url, fileId: result.fileId, name: result.name || file.name });
      } else {
        reject(new ApiError(result.error || 'Yuklash muvaffaqiyatsiz', xhr.status));
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('Tarmoq xatosi'));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException('Upload aborted', 'AbortError'));
    };
    xhr.send(formData);
  });
}
