import { NextResponse } from 'next/server';
import { getDb } from '@/lib/cf';
import { requireAdmin, readJson, jsonError } from '@/lib/http';
import { hashPassword, verifyPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { revokeAllSessions } from '@/lib/auth/session';

/** Joriy admin o'z parolini almashtiradi; boshqa qurilmalardagi sessiyalar bekor qilinadi. */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const body = await readJson<{ current?: unknown; next?: unknown }>(req);
  const current = typeof body?.current === 'string' ? body.current : '';
  const next = typeof body?.next === 'string' ? body.next : '';

  if (next.length < PASSWORD_MIN_LENGTH || next.length > 256) {
    return jsonError(`Yangi parol kamida ${PASSWORD_MIN_LENGTH} belgidan iborat bo'lishi kerak`, 400);
  }
  const row = await getDb()
    .prepare(`SELECT password_hash FROM admins WHERE id = ?`)
    .bind(auth.user.id)
    .first<{ password_hash: string }>();
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return jsonError("Joriy parol noto'g'ri", 400);
  }

  await getDb()
    .prepare(`UPDATE admins SET password_hash = ? WHERE id = ?`)
    .bind(await hashPassword(next), auth.user.id)
    .run();
  await revokeAllSessions(auth.user.id, true);
  return NextResponse.json({ ok: true });
}
