import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Worker binding'lari (D1, R2, rate limiter'lar) — faqat so'rov ichida chaqiriladi. */
export function getEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}

export function getDb(): D1Database {
  return getEnv().DB;
}

/** Secret yoki var: avval binding'dan, keyin process.env'dan (next dev uchun). */
export function getSecret(name: string): string | undefined {
  const fromEnv = (getEnv() as unknown as Record<string, unknown>)[name];
  if (typeof fromEnv === 'string' && fromEnv) return fromEnv;
  return process.env[name] || undefined;
}
