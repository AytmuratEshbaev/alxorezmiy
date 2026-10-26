/**
 * R2'dagi media fayllar manzili. Default — Worker'ning o'zi `/media/<key>` orqali beradi.
 * Agar R2 bucket'ga alohida custom domain ulasangiz (masalan, https://media.alxorezmiy.uz),
 * NEXT_PUBLIC_MEDIA_URL ni o'rnating — shunda rasmlar Worker'ni chetlab, to'g'ridan-to'g'ri beriladi.
 */
export const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_URL || '/media').replace(/\/$/, '');

export function mediaUrl(key: string): string {
  return `${MEDIA_BASE}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const UPLOAD_FOLDERS = ['news', 'teachers', 'gallery', 'misc'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** R2 kaliti xavfsizmi: faqat bizning upload sxemamiz (<folder>/<yyyy>/<hex>.<ext>). */
export function isSafeMediaKey(key: string): boolean {
  return /^(news|teachers|gallery|misc)\/\d{4}\/[a-f0-9]{32}\.(jpg|png|webp|avif|gif)$/.test(key);
}
