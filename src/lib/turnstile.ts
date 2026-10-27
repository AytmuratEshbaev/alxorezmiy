import 'server-only';
import { getSecret } from '@/lib/cf';

/**
 * Cloudflare Turnstile tokenini tekshiradi.
 * Production'da TURNSTILE_SECRET_KEY bo'lmasa — formalar YOPIQ (fail-closed): secret unutilsa
 * botlar uchun eshik ochilib qolmasin. Lokal dev'da secret bo'lmasa tekshiruv o'tkazib yuboriladi.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = getSecret('TURNSTILE_SECRET_KEY');
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error("[turnstile] TURNSTILE_SECRET_KEY o'rnatilmagan — formalar rad etilmoqda!");
      return false;
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
    const data = (await res.json()) as {
      success?: boolean;
      hostname?: string;
      'error-codes'?: string[];
    };
    if (!data.success) {
      console.warn('[turnstile] rejected:', data['error-codes']);
      return false;
    }
    // Token boshqa saytdagi widget'dan olinmaganini tekshiramiz.
    const expected = siteHost();
    if (
      expected &&
      data.hostname &&
      data.hostname !== expected &&
      data.hostname !== `www.${expected}`
    ) {
      console.warn('[turnstile] hostname mismatch:', data.hostname);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[turnstile] verify error:', (err as Error).message);
    return false;
  }
}

function siteHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || '').hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
