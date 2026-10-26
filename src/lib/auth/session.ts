import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/cf';
import { nowIso } from '@/lib/db/rows';

export const SESSION_COOKIE = 'ax_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Sessiya muddati shu vaqtdan kam qolsa, so'rovda uzaytiriladi (sliding expiration). */
const RENEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires,
  };
}

/** Yangi sessiya yaratib, cookie'ni o'rnatadi. Route handler ichida chaqiriladi. */
export async function createSession(adminId: string): Promise<void> {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  const db = getDb();
  await db.batch([
    // Muddati o'tgan sessiyalarni shu yerda tozalab ketamiz — alohida cron kerak emas.
    db.prepare(`DELETE FROM sessions WHERE expiresAt < ?`).bind(nowIso()),
    db
      .prepare(`INSERT INTO sessions (id, admin_id, expiresAt, createdAt) VALUES (?, ?, ?, ?)`)
      .bind(await sha256Hex(token), adminId, expires.toISOString(), nowIso()),
  ]);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(expires));
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb()
      .prepare(`DELETE FROM sessions WHERE id = ?`)
      .bind(await sha256Hex(token))
      .run();
  }
  jar.delete(SESSION_COOKIE);
}

/** Joriy so'rovdagi admin (yoki null). Bitta so'rov ichida keshlanadi. */
export const getSessionUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const id = await sha256Hex(token);
  const row = await getDb()
    .prepare(
      `SELECT a.id, a.email, a.name, s.expiresAt
         FROM sessions s JOIN admins a ON a.id = s.admin_id
        WHERE s.id = ?`
    )
    .bind(id)
    .first<AdminUser & { expiresAt: string }>();
  if (!row) return null;

  const expiresAt = Date.parse(row.expiresAt);
  if (!(expiresAt > Date.now())) {
    await getDb().prepare(`DELETE FROM sessions WHERE id = ?`).bind(id).run();
    return null;
  }
  if (expiresAt - Date.now() < SESSION_TTL_MS - RENEW_THRESHOLD_MS) {
    const next = new Date(Date.now() + SESSION_TTL_MS);
    await getDb()
      .prepare(`UPDATE sessions SET expiresAt = ? WHERE id = ?`)
      .bind(next.toISOString(), id)
      .run();
    try {
      // Server Component render'ida cookie yozib bo'lmaydi — u holda keyingi API so'rovida yangilanadi.
      (await cookies()).set(SESSION_COOKIE, token, cookieOptions(next));
    } catch {
      /* read-only context */
    }
  }
  return { id: row.id, email: row.email, name: row.name };
});

/** Admin'ning barcha sessiyalarini o'chiradi (parol almashganda yoki admin o'chirilganda). */
export async function revokeAllSessions(adminId: string, exceptCurrent = false): Promise<void> {
  if (exceptCurrent) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const keep = token ? await sha256Hex(token) : '';
    await getDb()
      .prepare(`DELETE FROM sessions WHERE admin_id = ? AND id != ?`)
      .bind(adminId, keep)
      .run();
    return;
  }
  await getDb().prepare(`DELETE FROM sessions WHERE admin_id = ?`).bind(adminId).run();
}
