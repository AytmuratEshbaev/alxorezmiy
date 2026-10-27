import { NextResponse } from 'next/server';
import { requireAdmin, jsonError, readJson } from '@/lib/http';
import { deleteMedia, isMediaReferenced } from '@/lib/db/admin-crud';
import { getEnv } from '@/lib/cf';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_FOLDERS,
  isSafeMediaKey,
  mediaUrl,
  type UploadFolder,
} from '@/lib/media';

/** Fayl boshidagi "magic bytes" — Content-Type'ga ishonmaslik uchun. */
function sniffImageType(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && /^avi[fs]/.test(ascii(8, 12))) return 'image/avif';
  return null;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;

  // Content-Length majburiy: aks holda (chunked) butun body xotiraga o'qilgandan keyingina hajm ma'lum bo'ladi.
  const len = Number(req.headers.get('content-length'));
  if (!Number.isFinite(len) || len <= 0) return jsonError('Content-Length talab qilinadi', 411);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) {
    return jsonError('Rasm hajmi 10MB dan oshmasligi kerak', 413);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError('Invalid form data', 400);
  }
  const file = form.get('file');
  const folderRaw = String(form.get('folder') || 'misc');
  const folder: UploadFolder = (UPLOAD_FOLDERS as readonly string[]).includes(folderRaw)
    ? (folderRaw as UploadFolder)
    : 'misc';

  if (!(file instanceof File)) return jsonError('Fayl topilmadi', 400);
  if (file.size > MAX_UPLOAD_BYTES) return jsonError("Rasm hajmi 10MB dan oshmasligi kerak", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type || !ALLOWED_IMAGE_TYPES[type]) {
    return jsonError('Faqat JPG, PNG, WebP, AVIF yoki GIF rasmlar qabul qilinadi', 415);
  }

  const id = crypto.randomUUID().replace(/-/g, '');
  const key = `${folder}/${new Date().getUTCFullYear()}/${id}.${ALLOWED_IMAGE_TYPES[type]}`;
  await getEnv().MEDIA.put(key, bytes, {
    httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { originalName: file.name.slice(0, 200), uploadedBy: auth.user.email }
  });

  return NextResponse.json({ url: mediaUrl(key), fileId: key, name: file.name }, { status: 201 });
}

/**
 * Saqlanmagan upload'ni o'chirish (modal bekor qilinganda yoki rasm almashtirilganda).
 * Faqat hech bir yozuvga bog'lanmagan kalit o'chiriladi.
 */
export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const body = await readJson<{ key?: unknown }>(req);
  const key = typeof body?.key === 'string' ? body.key : '';
  if (!isSafeMediaKey(key)) return jsonError("Fayl kaliti noto'g'ri", 400);
  if (await isMediaReferenced(key)) return NextResponse.json({ ok: true, deleted: false });
  await deleteMedia(key);
  return NextResponse.json({ ok: true, deleted: true });
}
