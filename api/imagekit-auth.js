// ============================================
// IMAGEKIT AUTH ENDPOINT — Vercel Serverless Function
// ============================================
// URL: https://YOUR-PROJECT.vercel.app/api/imagekit-auth
// Browser bu endpoint'dan signature oladi va ImageKit'ga rasm yuklaydi.
// Private key faqat shu serverda saqlanadi — browser'ga chiqmaydi.

import crypto from 'node:crypto';

export default function handler(req, res) {
  // CORS — local dev (localhost) va production'da ishlaydi
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    console.error('IMAGEKIT_PRIVATE_KEY env variable not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600; // 10 daqiqa
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return res.status(200).json({ token, expire, signature });
}
