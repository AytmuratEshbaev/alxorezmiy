/**
 * next/image uchun Cloudflare Image Transformations loader'i.
 * Production'da har bir srcset kengligi uchun /cdn-cgi/image/width=…,quality=…,format=auto/<src>
 * URL quriladi — Cloudflare rasmni o'zgartirib, edge'da keshlaydi.
 *
 * NEXT_PUBLIC_IMAGE_RESIZING=0 bo'lsa (yoki dev rejimida) rasm o'zgartirilmasdan beriladi —
 * masalan, *.workers.dev'da /cdn-cgi/image mavjud emas.
 */
const ENABLED =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_IMAGE_RESIZING !== '0';

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!ENABLED || src.endsWith('.svg') || src.startsWith('data:')) return src;
  const params = [`width=${width}`, `quality=${quality ?? 80}`, 'format=auto'].join(',');
  // Nisbiy yo'llar: /cdn-cgi/image/<opts>/media/... ; absolyut URL'lar o'zicha qo'yiladi.
  const source = src.startsWith('/') ? src.slice(1) : src;
  return `/cdn-cgi/image/${params}/${source}`;
}

/** next/image'dan tashqarida (lightbox, OG rasm) bitta o'lcham uchun URL. */
export function resizedImage(src: string | undefined, width: number, quality = 80): string {
  if (!src) return '';
  return cloudflareLoader({ src, width, quality });
}
