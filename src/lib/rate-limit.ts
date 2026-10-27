import 'server-only';
import { getEnv } from '@/lib/cf';

/**
 * Cloudflare Workers Rate Limiting binding'i orqali cheklov. Hisoblagichlar har bir
 * Cloudflare joylashuvi (PoP) uchun alohida va taxminiy (login'da asosiy himoya —
 * Telegram imzosi, bu yerda faqat ortiqcha so'rovlar to'xtatiladi).
 * Limit/period wrangler.jsonc'da. Binding bo'lmasa (`next dev`) — in-memory fallback.
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

/**
 * Mijoz IP'si. Cloudflare `cf-connecting-ip` ni o'zi qo'yadi (soxtalashtirib bo'lmaydi).
 * IPv6 manzillar /64 prefiksga qisqartiriladi — bitta abonent odatda butun /64 ga ega,
 * aks holda manzilni almashtirib limitni chetlab o'tish oson bo'lardi.
 */
export function clientIp(req: Request): string {
  const ip =
    req.headers.get('cf-connecting-ip')?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown';
  if (!ip.includes(':')) return ip;
  const [head] = ip.split('::');
  const groups = ip.includes('::') ? head.split(':').filter(Boolean) : ip.split(':');
  return `${[...groups, '0', '0', '0', '0'].slice(0, 4).join(':')}::/64`;
}
