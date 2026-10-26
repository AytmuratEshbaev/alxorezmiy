import 'server-only';
import { cache } from 'react';
import { getDb } from '@/lib/cf';
import { decodeRow } from './rows';
import type { News, Teacher, OlympiadResult, FaqItem, GalleryItem, Settings } from '@/types';

// Har bir o'qish React.cache() bilan o'ralgan — generateMetadata va sahifa render'i
// bitta so'rov ichida bir xil argument bilan chaqirsa, D1'ga bitta murojaat ketadi.

async function all<T>(table: string, sql: string, ...params: unknown[]): Promise<T[]> {
  const { results } = await getDb()
    .prepare(sql)
    .bind(...params)
    .all<Record<string, unknown>>();
  return results.map((r) => decodeRow<T>(table, r));
}

export const getNewsList = cache(async (limit = 50): Promise<News[]> => {
  return all<News>(
    'news',
    `SELECT * FROM news WHERE status = 'published' ORDER BY createdAt DESC LIMIT ?`,
    limit
  );
});

/** createdAt bo'yicha kursor: `before` dan eskiroq nashr etilgan yangiliklar. */
export async function getNewsPage(before: string, limit: number): Promise<News[]> {
  return all<News>(
    'news',
    `SELECT * FROM news WHERE status = 'published' AND createdAt < ? ORDER BY createdAt DESC LIMIT ?`,
    before,
    limit
  );
}

export const getNewsById = cache(async (id: string): Promise<News | null> => {
  const rows = await all<News>(
    'news',
    `SELECT * FROM news WHERE id = ? AND status = 'published'`,
    id
  );
  return rows[0] ?? null;
});

export const getTeachers = cache(async (): Promise<Teacher[]> => {
  return all<Teacher>(
    'teachers',
    `SELECT * FROM teachers ORDER BY "order" ASC, name_uz COLLATE NOCASE ASC`
  );
});

export const getOlympiad = cache(async (): Promise<OlympiadResult[]> => {
  return all<OlympiadResult>('olympiad', `SELECT * FROM olympiad ORDER BY year DESC, place ASC`);
});

export const getFaq = cache(async (): Promise<FaqItem[]> => {
  return all<FaqItem>('faq', `SELECT * FROM faq ORDER BY "order" ASC, createdAt ASC`);
});

export const getGallery = cache(async (): Promise<GalleryItem[]> => {
  return all<GalleryItem>('gallery', `SELECT * FROM gallery ORDER BY createdAt DESC`);
});

export const getSettings = cache(async (): Promise<Settings | null> => {
  const row = await getDb()
    .prepare(`SELECT data FROM settings WHERE id = 'main'`)
    .first<{ data: string }>();
  if (!row) return null;
  try {
    return JSON.parse(row.data) as Settings;
  } catch {
    return null;
  }
});
