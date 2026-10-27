import { NextResponse } from 'next/server';
import { getDb } from '@/lib/cf';
import { requireAdmin, readJson, jsonError } from '@/lib/http';
import { isRecentLogin, REAUTH_ERROR } from '@/lib/auth/reauth';

type Ctx = { params: Promise<{ id: string }> };

/** Ismni o'zgartirish (har qanday admin, o'zi ham). */
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const body = await readJson<{ name?: unknown }>(req);
  if (!body) return jsonError('Invalid JSON', 400);
  if (typeof body.name !== 'string') return jsonError('Nothing to update', 400);

  const res = await getDb()
    .prepare(`UPDATE admins SET name = ? WHERE id = ?`)
    .bind(body.name.trim().slice(0, 100), id)
    .run();
  if (!res.meta.changes) return jsonError('Not found', 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (id === auth.user.id) return jsonError("O'zingizni o'chira olmaysiz", 400);
  if (!isRecentLogin(auth.user)) return jsonError(REAUTH_ERROR, 403);

  const db = getDb();
  const [, res] = await db.batch([
    db.prepare(`DELETE FROM sessions WHERE admin_id = ?`).bind(id),
    db.prepare(`DELETE FROM admins WHERE id = ?`).bind(id),
  ]);
  if (!res.meta.changes) return jsonError('Not found', 404);
  return NextResponse.json({ ok: true });
}
