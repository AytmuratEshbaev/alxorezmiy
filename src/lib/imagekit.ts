const ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;

export interface ImageOpts {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'jpg';
}

export function transformImage(url: string, opts: ImageOpts = {}): string {
  if (!url || !url.includes('ik.imagekit.io')) return url;
  const params: string[] = [];
  if (opts.width) params.push(`w-${opts.width}`);
  if (opts.height) params.push(`h-${opts.height}`);
  params.push(`q-${opts.quality ?? 'auto'}`);
  params.push(`f-${opts.format ?? 'auto'}`);
  const tr = `tr:${params.join(',')}`;
  // ik.imagekit.io/alxorezmiy/folder/file.jpg → ik.imagekit.io/alxorezmiy/tr:w-600/folder/file.jpg
  return url.replace(/(ik\.imagekit\.io\/[^/]+)\//, `$1/${tr}/`);
}

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
  thumbnailUrl?: string;
}

export async function uploadImage(
  file: File,
  folder = 'misc',
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) throw new Error('Faqat rasm fayllari qabul qilinadi');
  if (file.size > 10 * 1024 * 1024) throw new Error("Rasm hajmi 10MB dan oshmasligi kerak");

  const authResp = await fetch('/api/imagekit-auth');
  if (!authResp.ok) throw new Error('Auth endpoint javob bermadi');
  const auth = await authResp.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('publicKey', PUBLIC_KEY);
  formData.append('signature', auth.signature);
  formData.append('expire', String(auth.expire));
  formData.append('token', auth.token);
  formData.append('fileName', file.name);
  formData.append('folder', `/${folder}`);
  formData.append('useUniqueFileName', 'true');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: result.url,
            fileId: result.fileId,
            name: result.name,
            thumbnailUrl: result.thumbnailUrl
          });
        } else {
          reject(new Error(result.message || 'Yuklash muvaffaqiyatsiz'));
        }
      } catch {
        reject(new Error("Server javobini o'qib bo'lmadi"));
      }
    };
    xhr.onerror = () => reject(new Error('Tarmoq xatosi'));
    xhr.send(formData);
  });
}
