import 'server-only';
import { getDb } from '@/lib/cf';

/** Ommaviy saytda ko'rinadigan jadvallar — ular o'zgarsa edge kesh bekor qilinadi. */
export const PUBLIC_TABLES = new Set([
  'news',
  'teachers',
  'olympiad',
  'faq',
  'gallery',
  'settings',
]);

/**
 * Edge kesh versiyasini oshiradi (worker.ts kesh kalitiga qo'shadi) — keyingi so'rovda
 * barcha ommaviy sahifalar yangidan render qilinadi. Xato bo'lsa yozuvni bekor qilmaydi:
 * eng yomon holatda kesh TTL (30 daqiqa) tugaguncha eski sahifa ko'rinadi.
 */
export async function bumpCacheVersion(table: string): Promise<void> {
  if (!PUBLIC_TABLES.has(table)) return;
  try {
    await getDb().prepare(`UPDATE cache_version SET v = v + 1 WHERE id = 1`).run();
  } catch (err) {
    console.warn('[cache] version bump failed:', (err as Error).message);
  }
}
