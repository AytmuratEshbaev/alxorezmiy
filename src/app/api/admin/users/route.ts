import { NextResponse } from 'next/server';
import { getDb } from '@/lib/cf';
import { requireAdmin, readJson, jsonError, NO_STORE } from '@/lib/http';
import { isRecentLogin, REAUTH_ERROR } from '@/lib/auth/reauth';
import { newId, nowIso } from '@/lib/db/rows';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { results } = await getDb()
    .prepare(
      `SELECT id, telegram_id AS telegramId, name, username, createdAt, lastLoginAt
         FROM admins ORDER BY createdAt ASC`
    )
    .all();
  return NextResponse.json({ items: results, currentId: auth.user.id }, { headers: NO_STORE });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const body = await readJson<{ telegramId?: unknown; name?: unknown }>(req);
  const telegramId =
    typeof body?.telegramId === 'string' || typeof body?.telegramId === 'number'
      ? String(body.telegramId).trim()
      : '';
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 100) : '';

  if (!/^\d{1,20}$/.test(telegramId)) {
    return jsonError("Telegram ID faqat raqamlardan iborat bo'lishi kerak", 400);
  }
  if (!isRecentLogin(auth.user)) return jsonError(REAUTH_ERROR, 403);

  const exists = await getDb()
    .prepare(`SELECT 1 FROM admins WHERE telegram_id = ?`)
    .bind(telegramId)
    .first();
  if (exists) return jsonError('Bu Telegram ID bilan admin allaqachon mavjud', 409);

  const id = newId();
  await getDb()
    .prepare(`INSERT INTO admins (id, telegram_id, name, createdAt) VALUES (?, ?, ?, ?)`)
    .bind(id, telegramId, name, nowIso())
    .run();
  return NextResponse.json({ id }, { status: 201 });
}
