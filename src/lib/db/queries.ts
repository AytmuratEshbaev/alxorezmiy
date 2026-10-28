import 'server-only';
import { cache } from 'react';
import { getDb } from '@/lib/cf';
import { decodeRow } from './rows';
import type {
  News,
  Teacher,
  OlympiadResult,
  CertificateItem,
  FaqItem,
  GalleryItem,
  Settings,
  Locale,
} from '@/types';

// Har bir o'qish React.cache() bilan o'ralgan — generateMetadata va sahifa render'i
// bitta so'rov ichida bir xil argument bilan chaqirsa, D1'ga bitta murojaat ketadi.
// Xatolar yutilmaydi (throw) — sahifa darajasida qaror qilinadi.

const LOCALES: Locale[] = ['uz', 'ru', 'kk', 'en'];

/** Kartochkalar uchun: matn 400 belgigacha qisqartiriladi (to'liq matn faqat getNewsById'da). */
const NEWS_CARD_COLUMNS = [
  'id',
  'category',
  'status',
  'image',
  'publishedAt',
  'createdAt',
  'updatedAt',
  ...LOCALES.map((l) => `title_${l}`),
  ...LOCALES.map((l) => `substr(content_${l}, 1, 400) AS content_${l}`),
].join(', ');

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
    `SELECT ${NEWS_CARD_COLUMNS} FROM news WHERE status = 'published'
      ORDER BY publishedAt DESC, id DESC LIMIT ?`,
    limit
  );
});

/** "Ko'proq yuklash" kursori: `${publishedAt}|${id}` — bir xil sanali yozuvlar ham tushib qolmaydi. */
export function newsCursor(item: Pick<News, 'id' | 'publishedAt'>): string {
  return `${item.publishedAt}|${item.id}`;
}

export async function getNewsPage(cursor: string, limit: number): Promise<News[]> {
  const sep = cursor.lastIndexOf('|');
  const at = cursor.slice(0, sep);
  const id = cursor.slice(sep + 1);
  return all<News>(
    'news',
    `SELECT ${NEWS_CARD_COLUMNS} FROM news
      WHERE status = 'published' AND (publishedAt < ?1 OR (publishedAt = ?1 AND id < ?2))
      ORDER BY publishedAt DESC, id DESC LIMIT ?3`,
    at,
    id,
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

/** Shu kategoriyadagi boshqa yangiliklar (maqola sahifasi pastida). */
export const getRelatedNews = cache(
  async (id: string, category: string, limit = 3): Promise<News[]> => {
    return all<News>(
      'news',
      `SELECT ${NEWS_CARD_COLUMNS} FROM news
        WHERE status = 'published' AND id != ?1
        ORDER BY (category = ?2) DESC, publishedAt DESC LIMIT ?3`,
      id,
      category,
      limit
    );
  }
);

/** Sitemap uchun — faqat id va sanalar. */
export const getNewsSitemapEntries = cache(
  async (): Promise<Pick<News, 'id' | 'publishedAt' | 'updatedAt'>[]> => {
    return all(
      'news',
      `SELECT id, publishedAt, updatedAt FROM news WHERE status = 'published'
        ORDER BY publishedAt DESC LIMIT 5000`
    );
  }
);

export const getTeachers = cache(async (): Promise<Teacher[]> => {
  return all<Teacher>(
    'teachers',
    `SELECT * FROM teachers ORDER BY "order" ASC, name_uz COLLATE NOCASE ASC`
  );
});

export const getCertificates = cache(async (): Promise<CertificateItem[]> => {
  return all<CertificateItem>(
    'certificates',
    `SELECT id, student, type, subject, score, year FROM certificates ORDER BY year DESC, student COLLATE NOCASE ASC`
  );
});

export const getOlympiad = cache(async (limit?: number): Promise<OlympiadResult[]> => {
  return all<OlympiadResult>(
    'olympiad',
    `SELECT * FROM olympiad ORDER BY year DESC, place ASC LIMIT ?`,
    limit ?? -1
  );
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

export interface SearchIndex {
  news: { id: string; title: string; excerpt: string }[];
  teachers: { id: string; name: string; subject: string }[];
  faq: { id: string; question: string; answer: string }[];
}

/**
 * Qidiruv oynasi uchun ixcham, bitta tilga moslangan indeks (bo'sh maydon → o'zbekcha).
 * Locale qiymati whitelist'dan o'tgani uchun ustun nomiga xavfsiz qo'shiladi.
 */
export async function getSearchIndex(locale: Locale): Promise<SearchIndex> {
  const l = LOCALES.includes(locale) ? locale : 'uz';
  const pick = (col: string) => `COALESCE(NULLIF(${col}_${l}, ''), ${col}_uz)`;
  const db = getDb();
  const [news, teachers, faq] = await db.batch<Record<string, string>>([
    db.prepare(
      `SELECT id, ${pick('title')} AS title, substr(${pick('content')}, 1, 160) AS excerpt
         FROM news WHERE status = 'published' ORDER BY publishedAt DESC LIMIT 100`
    ),
    db.prepare(
      `SELECT id, ${pick('name')} AS name, ${pick('subject')} AS subject
         FROM teachers ORDER BY "order" ASC, name_uz LIMIT 200`
    ),
    db.prepare(
      `SELECT id, ${pick('question')} AS question, substr(${pick('answer')}, 1, 300) AS answer
         FROM faq ORDER BY "order" ASC LIMIT 200`
    ),
  ]);
  return {
    news: news.results as SearchIndex['news'],
    teachers: teachers.results as SearchIndex['teachers'],
    faq: faq.results as SearchIndex['faq'],
  };
}
