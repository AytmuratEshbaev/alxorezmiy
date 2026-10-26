import { getEnv } from '@/lib/cf';
import { isSafeMediaKey } from '@/lib/media';

/**
 * R2'dagi rasmlarni beradi. Kalitlar o'zgarmas (har upload — yangi UUID), shuning uchun
 * 1 yillik immutable kesh: brauzer qayta so'ramaydi, Cloudflare Image Resizing esa
 * transformatsiya natijasini edge'da keshlaydi — Worker har bir ko'rishda chaqirilmaydi.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.join('/');
  if (!isSafeMediaKey(key)) return new Response('Not found', { status: 404 });

  const object = await getEnv().MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  return new Response(object.body as unknown as ReadableStream, {
    headers: {
      'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
      'content-length': String(object.size),
      etag: object.httpEtag,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}
