import { NextResponse } from 'next/server';
import { getDb } from '@/lib/cf';
import { requireAdmin, readJson, jsonError, NO_STORE } from '@/lib/http';
import { hashPassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { newId, nowIso } from '@/lib/db/rows';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { results } = await getDb()
    .prepare(`SELECT id, email, name, createdAt FROM admins ORDER BY createdAt ASC`)
    .all();
  return NextResponse.json({ items: results, currentId: auth.user.id }, { headers: NO_STORE });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const body = await readJson<{ email?: unknown; name?: unknown; password?: unknown }>(req);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return jsonError("Email format noto'g'ri", 400);
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > 256) {
    return jsonError(`Parol kamida ${PASSWORD_MIN_LENGTH} belgidan iborat bo'lishi kerak`, 400);
  }

  const exists = await getDb().prepare(`SELECT 1 FROM admins WHERE email = ?`).bind(email).first();
  if (exists) return jsonError('Bu email bilan admin allaqachon mavjud', 409);

  const id = newId();
  await getDb()
    .prepare(`INSERT INTO admins (id, email, name, password_hash, createdAt) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, email, name, await hashPassword(password), nowIso())
    .run();
  return NextResponse.json({ id }, { status: 201 });
}
