import 'server-only';
import { getDb } from '@/lib/cf';

/**
 * Email bo'yicha brute-force himoyasi (IP almashtirish yordam bermaydi):
 * 15 daqiqa ichida 10 ta muvaffaqiyatsiz urinish → 15 daqiqaga bloklash.
 * Rate limiter binding'i (per-IP, per-location) bilan birga ishlaydi.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const LOCK_MS = 15 * 60 * 1000;

interface Row {
  count: number;
  windowStart: string;
  lockedUntil: string;
}

/** Bloklangan bo'lsa — qolgan soniyalar, aks holda 0. */
export async function lockedForSeconds(email: string): Promise<number> {
  const row = await getDb()
    .prepare(`SELECT lockedUntil FROM login_failures WHERE email = ?`)
    .bind(email)
    .first<Pick<Row, 'lockedUntil'>>();
  const until = row?.lockedUntil ? Date.parse(row.lockedUntil) : 0;
  return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0;
}

export async function recordFailure(email: string): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const row = await db
    .prepare(`SELECT count, windowStart, lockedUntil FROM login_failures WHERE email = ?`)
    .bind(email)
    .first<Row>();

  const windowOpen = row && now - Date.parse(row.windowStart) < WINDOW_MS;
  const count = windowOpen ? row!.count + 1 : 1;
  const windowStart = windowOpen ? row!.windowStart : new Date(now).toISOString();
  const lockedUntil = count >= MAX_FAILURES ? new Date(now + LOCK_MS).toISOString() : '';

  await db
    .prepare(
      `INSERT INTO login_failures (email, count, windowStart, lockedUntil) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(email) DO UPDATE SET count = ?2, windowStart = ?3, lockedUntil = ?4`
    )
    .bind(email, count, windowStart, lockedUntil)
    .run();
}

export async function clearFailures(email: string): Promise<void> {
  await getDb().prepare(`DELETE FROM login_failures WHERE email = ?`).bind(email).run();
}
