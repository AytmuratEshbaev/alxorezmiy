import { NextResponse } from 'next/server';
import { getDb } from '@/lib/cf';
import { requireAdmin, jsonError } from '@/lib/http';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (id === auth.user.id) return jsonError("O'zingizni o'chira olmaysiz", 400);

  const db = getDb();
  // Sessiyalar ham birga o'chadi (FK cascade D1'da yoqilgan, lekin aniqlik uchun alohida).
  const [, res] = await db.batch([
    db.prepare(`DELETE FROM sessions WHERE admin_id = ?`).bind(id),
    db.prepare(`DELETE FROM admins WHERE id = ?`).bind(id)
  ]);
  if (!res.meta.changes) return jsonError('Not found', 404);
  return NextResponse.json({ ok: true });
}
