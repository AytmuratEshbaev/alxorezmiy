import 'server-only';
import { getDb, getEnv } from '@/lib/cf';
import { isSafeMediaKey } from '@/lib/media';
import { getCollection, ident, type CollectionDef } from './schema';
import { decodeRow, encodeValue, newId, nowIso } from './rows';

export interface ListOptions {
  orderBy?: string | null;
  direction?: string | null;
  where?: Record<string, string>;
  limit?: number;
}

export class CrudError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

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
  const limit = Math.min(Math.max(opts.limit || 500, 1), 1000);
  const sql =
    `SELECT * FROM ${ident(d.table)}` +
    (clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '') +
    ` ORDER BY ${ident(sortCol)} ${dir.toUpperCase()}, id ASC LIMIT ?`;
  const { results } = await getDb()
    .prepare(sql)
    .bind(...params, limit)
    .all<Record<string, unknown>>();
  return results.map((r) => decodeRow<Record<string, unknown>>(d.table, r));
}

function pickColumns(d: CollectionDef, data: Record<string, unknown>) {
  const cols: string[] = [];
  const values: (string | number | null)[] = [];
  for (const [col, kind] of Object.entries(d.columns)) {
    if (!(col in data)) continue;
    const v = encodeValue(kind, data[col]);
    if (v === null) throw new CrudError(`Invalid value for ${col}`, 400);
    cols.push(col);
    values.push(v);
  }
  return { cols, values };
}

export async function createDocument(name: string, data: Record<string, unknown>) {
  const d = def(name);
  if (d.creatable === false) throw new CrudError('Not allowed', 405);
  const { cols, values } = pickColumns(d, data);
  const id = newId();
  const now = nowIso();
  const allCols = ['id', ...cols, 'createdAt', 'updatedAt'];
  await getDb()
    .prepare(
      `INSERT INTO ${ident(d.table)} (${allCols.map(ident).join(', ')}) VALUES (${allCols.map(() => '?').join(', ')})`
    )
    .bind(id, ...values, now, now)
    .run();
  return { id };
}

async function getFileKey(d: CollectionDef, id: string): Promise<string | null> {
  if (!d.fileKey) return null;
  const row = await getDb()
    .prepare(`SELECT ${ident(d.fileKey)} AS k FROM ${ident(d.table)} WHERE id = ?`)
    .bind(id)
    .first<{ k: string }>();
  return row?.k || null;
}

/** R2'dan faylni o'chirish — xato bo'lsa ham yozuv amaliyotini to'xtatmaydi. */
async function deleteMedia(key: string | null) {
  if (!key || !isSafeMediaKey(key)) return;
  try {
    await getEnv().MEDIA.delete(key);
  } catch (err) {
    console.warn('[media] delete failed:', key, (err as Error).message);
  }
}

export async function updateDocument(name: string, id: string, data: Record<string, unknown>) {
  const d = def(name);
  const { cols, values } = pickColumns(d, data);
  if (cols.length === 0) throw new CrudError('Nothing to update', 400);

  const oldKey = d.fileKey && d.fileKey in data ? await getFileKey(d, id) : null;
  const set = [...cols.map((c) => `${ident(c)} = ?`), `"updatedAt" = ?`].join(', ');
  const res = await getDb()
    .prepare(`UPDATE ${ident(d.table)} SET ${set} WHERE id = ?`)
    .bind(...values, nowIso(), id)
    .run();
  if (!res.meta.changes) throw new CrudError('Not found', 404);

  if (oldKey && d.fileKey && oldKey !== String(data[d.fileKey] ?? '')) await deleteMedia(oldKey);
}

export async function deleteDocument(name: string, id: string) {
  const d = def(name);
  const key = await getFileKey(d, id);
  const res = await getDb()
    .prepare(`DELETE FROM ${ident(d.table)} WHERE id = ?`)
    .bind(id)
    .run();
  if (!res.meta.changes) throw new CrudError('Not found', 404);
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
