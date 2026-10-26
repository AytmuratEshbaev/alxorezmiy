import { NextResponse } from 'next/server';
import { requireAdmin, readJson, jsonError, NO_STORE } from '@/lib/http';
import { getDb } from '@/lib/cf';
import { nowIso } from '@/lib/db/rows';
import type { Settings } from '@/types';

// Faqat shu kalitlar saqlanadi; qiymat turi ham shu yerda belgilanadi.
const TEXT_KEYS = [
  'address',
  'phone',
  'email',
  'hours',
  'telegram',
  'instagram',
  'facebook',
  'youtube',
  ...['uz', 'ru', 'kk', 'en'].flatMap((l) => [`fullName_${l}`, `shortName_${l}`])
];
const INT_KEYS = ['students_count', 'teachers_count', 'experience_years', 'olympiad_winners'];

async function readSettings(): Promise<Settings> {
  const row = await getDb().prepare(`SELECT data FROM settings WHERE id = 'main'`).first<{ data: string }>();
  try {
    return row ? (JSON.parse(row.data) as Settings) : {};
  } catch {
    return {};
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  return NextResponse.json(await readSettings(), { headers: NO_STORE });
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return jsonError('Invalid JSON', 400);

  const next: Record<string, unknown> = { ...(await readSettings()) };
  for (const k of TEXT_KEYS) {
    if (k in body) next[k] = String(body[k] ?? '').trim().slice(0, 500);
  }
  for (const k of INT_KEYS) {
    if (k in body) {
      const n = Math.trunc(Number(body[k]));
      next[k] = Number.isFinite(n) && n >= 0 ? n : 0;
    }
  }
  await getDb()
    .prepare(
      `INSERT INTO settings (id, data, updatedAt) VALUES ('main', ?1, ?2)
       ON CONFLICT(id) DO UPDATE SET data = ?1, updatedAt = ?2`
    )
    .bind(JSON.stringify(next), nowIso())
    .run();
  return NextResponse.json({ ok: true });
}
