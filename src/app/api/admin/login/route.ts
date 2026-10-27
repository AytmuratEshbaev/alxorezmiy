import { NextResponse } from 'next/server';
import { getDb } from '@/lib/cf';
import { isSameOrigin, readJson, jsonError } from '@/lib/http';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { verifyPassword, DUMMY_HASH } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { lockedForSeconds, recordFailure, clearFailures } from '@/lib/auth/lockout';

const TOO_MANY = "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return jsonError('Forbidden', 403);

  const body = await readJson<{ email?: unknown; password?: unknown }>(req);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password || email.length > 254 || password.length > 256) {
    return jsonError('Email va parolni kiriting', 400);
  }

  // Ikki qatlam: IP (yoki IPv6 /64) bo'yicha va akkaunt bo'yicha.
  const ip = clientIp(req);
  const [ipOk, acctOk] = await Promise.all([
    rateLimit('LOGIN_LIMITER', `login-ip:${ip}`),
    rateLimit('LOGIN_LIMITER', `login-acct:${email}`),
  ]);
  if (!ipOk || !acctOk) return jsonError(TOO_MANY, 429);
  if ((await lockedForSeconds(email)) > 0) return jsonError(TOO_MANY, 429);

  const admin = await getDb()
    .prepare(`SELECT id, password_hash FROM admins WHERE email = ?`)
    .bind(email)
    .first<{ id: string; password_hash: string }>();

  // Foydalanuvchi topilmasa ham hash hisoblanadi — javob vaqti bir xil bo'lsin.
  const ok = await verifyPassword(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) {
    await recordFailure(email);
    return jsonError("Email yoki parol noto'g'ri", 401);
  }

  await clearFailures(email);
  await createSession(admin.id);
  return NextResponse.json({ ok: true });
}
