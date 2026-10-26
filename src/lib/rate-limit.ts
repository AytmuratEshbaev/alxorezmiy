import 'server-only';
import { getEnv } from '@/lib/cf';

/**
 * Cloudflare Workers Rate Limiting binding'i orqali cheklov (global, barcha
 * instansiyalar uchun umumiy). Limit/period wrangler.jsonc'da belgilangan.
 * Binding mavjud bo'lmasa (masalan, `next dev` bindingsiz) — oddiy in-memory fallback.
 */
type LimiterName = 'FORM_LIMITER' | 'LOGIN_LIMITER';

const memory = new Map<string, number[]>();
const FALLBACK = { limit: 5, windowMs: 60_000 };

function memoryLimit(key: string): boolean {
  const now = Date.now();
  const hits = (memory.get(key) || []).filter((t) => now - t < FALLBACK.windowMs);
  if (hits.length >= FALLBACK.limit) {
    memory.set(key, hits);
    return false;
  }
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 5000) memory.clear();
  return true;
}

/** true — ruxsat, false — limitdan oshdi. */
export async function rateLimit(limiter: LimiterName, key: string): Promise<boolean> {
  let binding: RateLimit | undefined;
  try {
    binding = getEnv()[limiter];
  } catch {
    binding = undefined;
  }
  if (!binding) return memoryLimit(`${limiter}:${key}`);
  try {
    const { success } = await binding.limit({ key });
    return success;
  } catch (err) {
    console.warn('[rate-limit] binding error:', (err as Error).message);
    return memoryLimit(`${limiter}:${key}`);
  }
}

/** Cloudflare har doim haqiqiy mijoz IP'sini `cf-connecting-ip` da beradi (soxtalashtirib bo'lmaydi). */
export function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip')?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}
