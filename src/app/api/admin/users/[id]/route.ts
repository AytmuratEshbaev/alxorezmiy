import { NextResponse } from 'next/server';
import { getDb } from '@/lib/cf';
import { requireAdmin, readJson, jsonError } from '@/lib/http';
import { hashPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { verifyCurrentPassword, REAUTH_ERROR } from '@/lib/auth/reauth';
import { revokeAllSessions } from '@/lib/auth/session';

type Ctx = { params: Promise<{ id: string }> };

/** Ismni o'zgartirish (har qanday admin, o'zi ham) va boshqa admin parolini tiklash. */
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const body = await readJson<{ name?: unknown; password?: unknown; currentPassword?: unknown }>(
    req
  );
  if (!body) return jsonError('Invalid JSON', 400);

  const db = getDb();
  const target = await db.prepare(`SELECT id FROM admins WHERE id = ?`).bind(id).first();
  if (!target) return jsonError('Not found', 404);

  const sets: string[] = [];
  const values: string[] = [];
  if (typeof body.name === 'string') {
    sets.push('name = ?');
    values.push(body.name.trim().slice(0, 100));
  }
  if (body.password !== undefined) {
    if (id === auth.user.id) {
      return jsonError("O'z parolingizni \"Parolni almashtirish\" bo'limida o'zgartiring", 400);
    }
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length < PASSWORD_MIN_LENGTH || password.length > 256) {
      return jsonError(`Parol kamida ${PASSWORD_MIN_LENGTH} belgidan iborat bo'lishi kerak`, 400);
    }
    if (!(await verifyCurrentPassword(auth.user.id, body.currentPassword))) {
      return jsonError(REAUTH_ERROR, 403);
    }
    sets.push('password_hash = ?');
    values.push(await hashPassword(password));
  }
  if (sets.length === 0) return jsonError('Nothing to update', 400);

  await db
    .prepare(`UPDATE admins SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values, id)
    .run();
  if (body.password !== undefined) await revokeAllSessions(id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (id === auth.user.id) return jsonError("O'zingizni o'chira olmaysiz", 400);

  const body = await readJson<{ currentPassword?: unknown }>(req);
  if (!(await verifyCurrentPassword(auth.user.id, body?.currentPassword))) {
    return jsonError(REAUTH_ERROR, 403);
  }

  const db = getDb();
  const [, res] = await db.batch([
    db.prepare(`DELETE FROM sessions WHERE admin_id = ?`).bind(id),
    db.prepare(`DELETE FROM admins WHERE id = ?`).bind(id),
  ]);
  if (!res.meta.changes) return jsonError('Not found', 404);
  return NextResponse.json({ ok: true });
}
