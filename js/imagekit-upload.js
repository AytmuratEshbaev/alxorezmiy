// ============================================
// IMAGEKIT UPLOAD HELPER — Frontend
// ============================================
// Foydalanish:
//   const url = await uploadImage(fileInput.files[0], 'news');
//   // returns: 'https://ik.imagekit.io/alxorezmiy/news/abc123_xyz.jpg'

const IMAGEKIT_CONFIG = {
  publicKey: 'PUBLIC_KEY_HERE', // ← Public key kelgach almashtiramiz
  urlEndpoint: 'https://ik.imagekit.io/alxorezmiy',
  // Auth endpoint:
  // - Production'da: '/api/imagekit-auth' (avtomatik to'g'ri yo'l)
  // - Local dev'da Vercel'siz: deployed URL kerak
  authEndpoint: '/api/imagekit-auth'
};

/**
 * Rasm faylini ImageKit'ga yuklaydi
 * @param {File} file - <input type="file"> dan keladigan fayl
 * @param {string} folder - 'news', 'teachers', 'gallery' (papka)
 * @param {function} onProgress - 0-100 progress callback (ixtiyoriy)
 * @returns {Promise<{url: string, fileId: string, name: string}>}
 */
window.uploadImage = async function uploadImage(file, folder = 'misc', onProgress) {
  if (!file) throw new Error('Fayl tanlanmagan');
  if (!file.type.startsWith('image/')) throw new Error("Faqat rasm fayllari (jpg, png, webp) qabul qilinadi");
  if (file.size > 10 * 1024 * 1024) throw new Error("Rasm hajmi 10MB dan oshmasligi kerak");

  // 1. Auth tokenini Vercel'dan olish
  const authResp = await fetch(IMAGEKIT_CONFIG.authEndpoint);
  if (!authResp.ok) {
    throw new Error("Auth endpoint javob bermadi. Vercel deploy tekshiring.");
  }
  const auth = await authResp.json();

  // 2. ImageKit'ga upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('publicKey', IMAGEKIT_CONFIG.publicKey);
  formData.append('signature', auth.signature);
  formData.append('expire', auth.expire);
  formData.append('token', auth.token);
  formData.append('fileName', file.name);
  formData.append('folder', `/${folder}`);
  formData.append('useUniqueFileName', 'true');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
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
      } catch (e) {
        reject(new Error('Server javobini o\'qib bo\'lmadi'));
      }
    };
    xhr.onerror = () => reject(new Error('Tarmoq xatosi'));
    xhr.send(formData);
  });
};

/**
 * Rasm URL'ini transformatsiya qiladi (resize, optimize)
 * @param {string} url - ImageKit URL
 * @param {object} opts - { width, height, quality }
 * @returns {string} - Transformatsiya qilingan URL
 *
 * Misol:
 *   transformImage('https://ik.imagekit.io/alxorezmiy/news/abc.jpg', { width: 600 })
 *   → 'https://ik.imagekit.io/alxorezmiy/tr:w-600,q-auto,f-auto/news/abc.jpg'
 */
window.transformImage = function transformImage(url, opts = {}) {
  if (!url || !url.includes('ik.imagekit.io')) return url;

  const params = [];
  if (opts.width) params.push(`w-${opts.width}`);
  if (opts.height) params.push(`h-${opts.height}`);
  params.push(`q-${opts.quality || 'auto'}`);
  params.push(`f-${opts.format || 'auto'}`);

  const tr = `tr:${params.join(',')}`;
  return url.replace('/alxorezmiy/', `/alxorezmiy/${tr}/`);
};
