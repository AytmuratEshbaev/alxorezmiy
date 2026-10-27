import 'server-only';
import { getDb, getEnv } from '@/lib/cf';
import { MEDIA_BASE, isSafeMediaKey, mediaUrl } from '@/lib/media';
import { FILE_REFERENCES, getCollection, ident, type CollectionDef } from './schema';
import { decodeRow, encodeValue, newId, nowIso } from './rows';
import { bumpCacheVersion } from './cache';

export interface ListOptions {
  orderBy?: string | null;
  direction?: string | null;
  where?: Record<string, string>;
  limit?: number;
  /** cursorColumn bo'yicha shu qiymatdan oldingi (eskiroq) yozuvlar. */
  before?: string | null;
}

export class CrudError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** D1 bitta so'rovda ko'pi bilan 100 ta bog'langan parametrga ruxsat beradi. */
const D1_MAX_PARAMS = 100;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

function def(name: string): CollectionDef {
  const d = getCollection(name);
  if (!d) throw new CrudError('Unknown collection', 404);
  return d;
}

export async function listDocuments(name: string, opts: ListOptions = {}) {
  const d = def(name);
  const sortCol =
    opts.orderBy && d.sortable.includes(opts.orderBy) ? opts.orderBy : d.defaultSort.column;
  const dir =
    opts.direction === 'asc' || opts.direction === 'desc'
      ? opts.direction
      : sortCol === d.defaultSort.column
        ? d.defaultSort.direction
        : 'desc';

  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const [col, value] of Object.entries(opts.where || {})) {
    if (!d.filterable.includes(col)) continue;
    const kind = d.columns[col] ?? 'text';
    clauses.push(`${ident(col)} = ?`);
    params.push(encodeValue(kind, value));
  }

  // Kursor faqat vaqt bo'yicha kamayish tartibida ma'noli.
  const cursor = d.cursorColumn && opts.before && ISO_RE.test(opts.before) ? opts.before : null;
  const orderCol = cursor ? d.cursorColumn! : sortCol;
  const orderDir = cursor ? 'DESC' : dir.toUpperCase();
  if (cursor) {
    clauses.push(`${ident(d.cursorColumn!)} < ?`);
    params.push(cursor);
  }

  const limit = Math.min(Math.max(opts.limit || 500, 1), 1000);
  const sql =
    `SELECT * FROM ${ident(d.table)}` +
    (clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '') +
    ` ORDER BY ${ident(orderCol)} ${orderDir}, id ASC LIMIT ?`;
  const { results } = await getDb()
    .prepare(sql)
    .bind(...params, limit + 1)
    .all<Record<string, unknown>>();
  return {
    items: results.slice(0, limit).map((r) => decodeRow<Record<string, unknown>>(d.table, r)),
    hasMore: results.length > limit,
  };
}

/** Kalit biror yozuvda ishlatilyaptimi (except — tekshirilayotgan yozuvning o'zi). */
export async function isMediaReferenced(
  key: string,
  except?: { table: string; id: string }
): Promise<boolean> {
  const db = getDb();
  const stmts = FILE_REFERENCES.map(({ table, column }) =>
    except && except.table === table
      ? db
          .prepare(`SELECT 1 FROM ${ident(table)} WHERE ${ident(column)} = ? AND id != ? LIMIT 1`)
          .bind(key, except.id)
      : db.prepare(`SELECT 1 FROM ${ident(table)} WHERE ${ident(column)} = ? LIMIT 1`).bind(key)
  );
  const results = await db.batch(stmts);
  return results.some((r) => r.results.length > 0);
}

function isAllowedImageUrl(v: string): boolean {
  if (v === '') return true;
  if (v.startsWith(`${MEDIA_BASE}/`)) return isSafeMediaKey(v.slice(MEDIA_BASE.length + 1));
  return /^https:\/\/[^\s"'<>\\]+$/.test(v) && v.length <= 2000;
}

/**
 * Whitelist'dagi ustunlarni ajratib oladi va qiymatlarni tekshiradi:
 * enum'lar, rasm URL'lari (faqat /media/... yoki https://) va R2 kalitlari
 * (faqat shu jadval papkasidagi, boshqa yozuvga tegishli bo'lmagan kalit — aks holda
 * admin boshqa yozuvning faylini "o'ziniki" qilib, keyin o'chirib yuborishi mumkin edi).
 */
async function pickColumns(d: CollectionDef, data: Record<string, unknown>, selfId?: string) {
  const row: Record<string, string | number> = {};
  for (const [col, kind] of Object.entries(d.columns)) {
    if (!(col in data)) continue;
    const v = encodeValue(kind, data[col]);
    if (v === null) throw new CrudError(`Invalid value for ${col}`, 400);
    row[col] = v;
  }

  for (const [col, allowed] of Object.entries(d.enums || {})) {
    if (col in row && !allowed.includes(String(row[col]))) {
      throw new CrudError(`Noto'g'ri qiymat: ${col}`, 400);
    }
  }
  for (const col of d.urlColumns || []) {
    if (col in row && !isAllowedImageUrl(String(row[col]))) {
      throw new CrudError("Rasm manzili noto'g'ri", 400);
    }
  }
  if ('publishedAt' in row && row.publishedAt !== '') {
    const t = Date.parse(String(row.publishedAt));
    if (!Number.isFinite(t)) throw new CrudError("Nashr sanasi noto'g'ri", 400);
    row.publishedAt = new Date(t).toISOString();
  }

  if (d.file && d.file.column in row) {
    const key = String(row[d.file.column]);
    if (key !== '') {
      if (!isSafeMediaKey(key) || !key.startsWith(`${d.file.folder}/`)) {
        throw new CrudError("Fayl kaliti noto'g'ri", 400);
      }
      if (await isMediaReferenced(key, selfId ? { table: d.table, id: selfId } : undefined)) {
        throw new CrudError('Bu fayl boshqa yozuvga tegishli', 409);
      }
      // URL har doim kalitdan hosil qilinadi — klient yuborgan URL'ga ishonmaymiz.
      const urlCol = d.urlColumns?.[0];
      if (urlCol) row[urlCol] = mediaUrl(key);
    }
  }
  return row;
}

export async function createDocument(name: string, data: Record<string, unknown>) {
  const d = def(name);
  if (d.creatable === false) throw new CrudError('Not allowed', 405);
  const row = await pickColumns(d, data);
  const now = nowIso();
  if (d.table === 'news' && row.status === 'published' && !row.publishedAt) row.publishedAt = now;

  const id = newId();
  const cols = ['id', ...Object.keys(row), 'createdAt', 'updatedAt'];
  await getDb()
    .prepare(
      `INSERT INTO ${ident(d.table)} (${cols.map(ident).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    )
    .bind(id, ...Object.values(row), now, now)
    .run();
  await bumpCacheVersion(d.table);
  return { id };
}

async function getFileKey(d: CollectionDef, id: string): Promise<string | null> {
  if (!d.file) return null;
  const row = await getDb()
    .prepare(`SELECT ${ident(d.file.column)} AS k FROM ${ident(d.table)} WHERE id = ?`)
    .bind(id)
    .first<{ k: string }>();
  return row?.k || null;
}

/** R2'dan faylni o'chirish — xato bo'lsa ham yozuv amaliyotini to'xtatmaydi. */
export async function deleteMedia(key: string | null) {
  if (!key || !isSafeMediaKey(key)) return;
  try {
    await getEnv().MEDIA.delete(key);
  } catch (err) {
    console.warn('[media] delete failed:', key, (err as Error).message);
  }
}

function buildSet(d: CollectionDef, row: Record<string, string | number>, now: string) {
  const sets: string[] = [];
  const params: (string | number)[] = [];
  for (const [col, v] of Object.entries(row)) {
    if (col === 'publishedAt' && v === '' && d.table === 'news') continue; // pastda alohida
    sets.push(`${ident(col)} = ?`);
    params.push(v);
  }
  // Yangilik nashr etilganda sana bo'sh bo'lsa — hozirgi vaqt (qayta nashrda o'zgarmaydi).
  if (d.table === 'news' && row.status === 'published' && !row.publishedAt) {
    sets.push(`"publishedAt" = CASE WHEN "publishedAt" = '' THEN ? ELSE "publishedAt" END`);
    params.push(now);
  } else if (d.table === 'news' && row.publishedAt === '') {
    sets.push(`"publishedAt" = ''`);
  }
  sets.push(`"updatedAt" = ?`);
  params.push(now);
  return { sql: sets.join(', '), params };
}

export async function updateDocument(name: string, id: string, data: Record<string, unknown>) {
  const d = def(name);
  const row = await pickColumns(d, data, id);
  if (Object.keys(row).length === 0) throw new CrudError('Nothing to update', 400);

  const oldKey = d.file && d.file.column in row ? await getFileKey(d, id) : null;
  const { sql, params } = buildSet(d, row, nowIso());
  const res = await getDb()
    .prepare(`UPDATE ${ident(d.table)} SET ${sql} WHERE id = ?`)
    .bind(...params, id)
    .run();
  if (!res.meta.changes) throw new CrudError('Not found', 404);
  await bumpCacheVersion(d.table);

  if (oldKey && d.file && oldKey !== String(row[d.file.column] ?? '')) await deleteMedia(oldKey);
}

/** Bir nechta yozuvga bir xil o'zgarish (masalan, "hammasini o'qildi"). Fayl ustunlari taqiqlangan. */
export async function updateManyDocuments(
  name: string,
  ids: unknown,
  data: Record<string, unknown>
) {
  const d = def(name);
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
    throw new CrudError('ids: 1–500 ta element kerak', 400);
  }
  if (!ids.every((x) => typeof x === 'string' && x.length <= 64)) {
    throw new CrudError('Invalid ids', 400);
  }
  if (d.file && (d.file.column in data || d.urlColumns?.some((c) => c in data))) {
    throw new CrudError('Fayl maydonlarini ommaviy o‘zgartirib bo‘lmaydi', 400);
  }
  const row = await pickColumns(d, data);
  if (Object.keys(row).length === 0) throw new CrudError('Nothing to update', 400);

  const { sql, params } = buildSet(d, row, nowIso());
  const chunkSize = D1_MAX_PARAMS - params.length;
  const db = getDb();
  const stmts = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize) as string[];
    stmts.push(
      db
        .prepare(
          `UPDATE ${ident(d.table)} SET ${sql} WHERE id IN (${chunk.map(() => '?').join(', ')})`
        )
        .bind(...params, ...chunk)
    );
  }
  const results = await db.batch(stmts);
  await bumpCacheVersion(d.table);
  return results.reduce((n, r) => n + (r.meta.changes || 0), 0);
}

export async function deleteDocument(name: string, id: string) {
  const d = def(name);
  const key = await getFileKey(d, id);
  const res = await getDb()
    .prepare(`DELETE FROM ${ident(d.table)} WHERE id = ?`)
    .bind(id)
    .run();
  if (!res.meta.changes) throw new CrudError('Not found', 404);
  await bumpCacheVersion(d.table);
  await deleteMedia(key);
}

export async function getCounts() {
  const db = getDb();
  const q = (sql: string) => db.prepare(sql);
  const results = await db.batch<{ n: number }>([
    q(`SELECT COUNT(*) AS n FROM news`),
    q(`SELECT COUNT(*) AS n FROM teachers`),
    q(`SELECT COUNT(*) AS n FROM olympiad`),
    q(`SELECT COUNT(*) AS n FROM gallery`),
    q(`SELECT COUNT(*) AS n FROM faq`),
    q(`SELECT COUNT(*) AS n FROM messages WHERE read = 0`),
    q(`SELECT COUNT(*) AS n FROM applications WHERE read = 0`),
  ]);
  const n = (i: number) => results[i].results[0]?.n ?? 0;
  return {
    news: n(0),
    teachers: n(1),
    olympiad: n(2),
    gallery: n(3),
    faq: n(4),
    unreadMessages: n(5),
    newApplications: n(6),
  };
}
