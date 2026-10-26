import 'server-only';
import { getSecret } from '@/lib/cf';

/**
 * Cloudflare Turnstile tokenini tekshiradi.
 * TURNSTILE_SECRET_KEY o'rnatilmagan bo'lsa (lokal dev) — tekshiruv o'tkazib yuboriladi,
 * production'da esa bu holat logga yoziladi.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = getSecret('TURNSTILE_SECRET_KEY');
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error("[turnstile] TURNSTILE_SECRET_KEY o'rnatilmagan — captcha tekshirilmayapti!");
    }
    return true;
  }
  if (!token || token.length > 2048) return false;

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip && ip !== 'unknown') body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) console.warn('[turnstile] rejected:', data['error-codes']);
    return data.success === true;
  } catch (err) {
    console.warn('[turnstile] verify error:', (err as Error).message);
    return false;
  }
}
