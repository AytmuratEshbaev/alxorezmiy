import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/cf';
import { nowIso } from '@/lib/db/rows';

/**
 * `__Host-` prefiksi: cookie faqat Secure, Path=/ va Domain'siz bo'lishi shart — subdomen
 * cookie'ni almashtira olmaydi. Brauzerlar http://localhost'da ham Secure cookie'ni qabul qiladi.
 */
export const SESSION_COOKIE = '__Host-ax_session';
/** Faolsizlik chegarasi: shuncha vaqt panel ochilmasa, qayta Telegram orqali tasdiqlash kerak. */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
/** Faollikdan qat'i nazar, kirishdan keyin shu muddatda sessiya albatta tugaydi. */
const ABSOLUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Oxirgi uzaytirishdan shuncha vaqt o'tgach, so'rovda muddat yana uzaytiriladi (sliding expiration). */
const RENEW_THRESHOLD_MS = 60 * 60 * 1000;

export interface AdminUser {
  id: string;
  telegramId: string;
  name: string;
  username: string;
  /** Oxirgi marta Telegram orqali tasdiqlangan vaqt — reauth.ts uchun. */
  verifiedAt: string;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    expires,
  };
}

/** Yangi sessiya yaratib, cookie'ni o'rnatadi. Route handler ichida chaqiriladi. */
export async function createSession(adminId: string): Promise<void> {
  const jar = await cookies();
  const previous = jar.get(SESSION_COOKIE)?.value;
  const token = randomToken();
  const now = Date.now();
  const expires = new Date(now + SESSION_TTL_MS);
  const absolute = new Date(now + ABSOLUTE_TTL_MS);
  const db = getDb();
  await db.batch([
    // Muddati o'tgan sessiyalarni shu yerda tozalab ketamiz — alohida cron kerak emas.
    db
      .prepare(`DELETE FROM sessions WHERE expiresAt < ?1 OR absoluteExpiresAt < ?1`)
      .bind(nowIso()),
    // Shu brauzerdagi eski sessiya (session fixation'ga qarshi).
    db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(previous ? await sha256Hex(previous) : ''),
    db
      .prepare(
        `INSERT INTO sessions (id, admin_id, expiresAt, absoluteExpiresAt, createdAt, verifiedAt)
         VALUES (?, ?, ?, ?, ?5, ?5)`
      )
      .bind(
        await sha256Hex(token),
        adminId,
        expires.toISOString(),
        absolute.toISOString(),
        nowIso()
      ),
  ]);
  jar.set(SESSION_COOKIE, token, cookieOptions(expires));
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
  jar.set(SESSION_COOKIE, '', { ...cookieOptions(new Date(0)), maxAge: 0 });
}

/** Joriy so'rovdagi admin (yoki null). Bitta so'rov ichida keshlanadi. */
export const getSessionUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;
  const id = await sha256Hex(token);
  const row = await getDb()
    .prepare(
      `SELECT a.id, a.telegram_id AS telegramId, a.name, a.username, s.verifiedAt,
              s.expiresAt, s.absoluteExpiresAt
         FROM sessions s JOIN admins a ON a.id = s.admin_id
        WHERE s.id = ?`
    )
    .bind(id)
    .first<AdminUser & { expiresAt: string; absoluteExpiresAt: string }>();
  if (!row) return null;

  const now = Date.now();
  let expiresAt = Date.parse(row.expiresAt);
  const absoluteAt = Date.parse(row.absoluteExpiresAt);
  if (!(expiresAt > now) || !(absoluteAt > now)) {
    await getDb().prepare(`DELETE FROM sessions WHERE id = ?`).bind(id).run();
    return null;
  }
  if (expiresAt - now < SESSION_TTL_MS - RENEW_THRESHOLD_MS) {
    const next = new Date(Math.min(now + SESSION_TTL_MS, absoluteAt));
    await getDb()
      .prepare(`UPDATE sessions SET expiresAt = ? WHERE id = ?`)
      .bind(next.toISOString(), id)
      .run();
    expiresAt = next.getTime();
  }
  try {
    // Server render'i D1 muddatini uzaytirgan bo'lsa ham, keyingi API so'rovi cookie'ni yangilaydi.
    (await cookies()).set(SESSION_COOKIE, token, cookieOptions(new Date(expiresAt)));
  } catch {
    /* Server Component: cookie faqat Route Handler'da yoziladi. */
  }
  return {
    id: row.id,
    telegramId: row.telegramId,
    name: row.name,
    username: row.username,
    verifiedAt: row.verifiedAt,
  };
});

/** Joriy so'rov sessiyasining bazadagi ID'si (sha256(token)) yoki null. */
export async function currentSessionId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token && token.length <= 128 ? sha256Hex(token) : null;
}

/** Admin'ning barcha sessiyalarini o'chiradi (admin o'chirilganda). */
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
