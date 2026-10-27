import 'server-only';
import { getDb } from '@/lib/cf';
import { verifyPassword } from './password';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Xavfli amallar (admin qo'shish/o'chirish, boshqaning parolini tiklash) oldidan joriy
 * admin parolini qayta so'rash: o'g'irlangan sessiya bilan yangi "orqa eshik" admin
 * yaratib bo'lmasin.
 */
export async function verifyCurrentPassword(adminId: string, password: unknown): Promise<boolean> {
  if (typeof password !== 'string' || !password || password.length > 256) return false;
  if (!(await rateLimit('LOGIN_LIMITER', `reauth:${adminId}`))) return false;
  const row = await getDb()
    .prepare(`SELECT password_hash FROM admins WHERE id = ?`)
    .bind(adminId)
    .first<{ password_hash: string }>();
  return !!row && (await verifyPassword(password, row.password_hash));
}

export const REAUTH_ERROR = "Joriy parolingiz noto'g'ri";
