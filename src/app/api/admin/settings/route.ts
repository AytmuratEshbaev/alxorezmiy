import { NextResponse } from 'next/server';
import { requireAdmin, readJson, jsonError, NO_STORE } from '@/lib/http';
import { getDb } from '@/lib/cf';
import { nowIso } from '@/lib/db/rows';
import { bumpCacheVersion } from '@/lib/db/cache';
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

/** "@handle" ko'rinishidagi qisqa yozuvlar uchun asosiy manzillar. */
const SOCIAL_BASE: Record<string, string> = {
  telegram: 'https://t.me/',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  youtube: 'https://youtube.com/@',
};

class ValidationError extends Error {}

/**
 * Ijtimoiy tarmoq havolasini to'liq https:// URL'ga keltiradi:
 * "@maktab" → https://t.me/maktab, "t.me/maktab" → https://t.me/maktab.
 * http(s) dan boshqa sxema (javascript:, data: ...) rad etiladi.
 */
function normalizeSocial(key: string, raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  if (/^@[\w.]{1,64}$/.test(v)) return SOCIAL_BASE[key] + v.slice(1);
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new ValidationError(`${key}: havola noto'g'ri`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new ValidationError(`${key}: faqat http(s) havolalar qabul qilinadi`);
  }
  url.protocol = 'https:';
  return url.toString().slice(0, 500);
}

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
  try {
    for (const k of TEXT_KEYS) {
      if (!(k in body)) continue;
      const v = String(body[k] ?? '').trim().slice(0, 500);
      next[k] = k in SOCIAL_BASE ? normalizeSocial(k, v) : v;
    }
  } catch (err) {
    if (err instanceof ValidationError) return jsonError(err.message, 400);
    throw err;
  }
  if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(next.email))) {
    return jsonError("Email format noto'g'ri", 400);
  }
  for (const k of INT_KEYS) {
    if (!(k in body)) continue;
    // Bo'sh qiymat — "ko'rsatilmasin" (saytda bu statistika yashiriladi).
    if (body[k] === '' || body[k] === null) {
      delete next[k];
      continue;
    }
    const n = Math.trunc(Number(body[k]));
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      return jsonError(`${k}: musbat butun son kiriting`, 400);
    }
    next[k] = n;
  }
  await getDb()
    .prepare(
      `INSERT INTO settings (id, data, updatedAt) VALUES ('main', ?1, ?2)
       ON CONFLICT(id) DO UPDATE SET data = ?1, updatedAt = ?2`
    )
    .bind(JSON.stringify(next), nowIso())
    .run();
  await bumpCacheVersion('settings');
  return NextResponse.json({ ok: true, settings: next });
}
