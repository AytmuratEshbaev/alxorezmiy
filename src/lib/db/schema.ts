import 'server-only';
import type { UploadFolder } from '@/lib/media';

/**
 * Admin CRUD API orqali yoziladigan jadvallar ta'rifi. API faqat shu yerda sanalgan
 * ustunlarni qabul qiladi (whitelist) — boshqa har qanday kalit jim tashlab yuboriladi.
 */
export type ColumnKind = 'text' | 'int' | 'bool' | 'json';

export interface CollectionDef {
  table: string;
  columns: Record<string, ColumnKind>;
  /** ORDER BY uchun ruxsat etilgan ustunlar. */
  sortable: string[];
  defaultSort: { column: string; direction: 'asc' | 'desc' };
  /** WHERE <col> = ? uchun ruxsat etilgan ustunlar. */
  filterable: string[];
  /** Faqat sanalgan qiymatlarni qabul qiladigan ustunlar. */
  enums?: Record<string, readonly string[]>;
  /** Rasm URL'i ustunlari: '' yoki o'zimizning /media/... yoki https:// bo'lishi shart. */
  urlColumns?: string[];
  /**
   * R2 obyekt kaliti saqlanadigan ustun va uning upload papkasi. Yozuv o'chirilganda yoki
   * rasm almashtirilganda eski fayl R2'dan ham o'chiriladi.
   */
  file?: { column: string; folder: UploadFolder };
  /** false bo'lsa admin yangi yozuv yarata olmaydi (masalan, xabarlar faqat saytdan keladi). */
  creatable?: boolean;
  /** Admin ro'yxatida `before` kursori ishlatiladigan vaqt ustuni. */
  cursorColumn?: string;
}

const LANGS = ['uz', 'ru', 'kk', 'en'] as const;

function localized(...prefixes: string[]): Record<string, ColumnKind> {
  const out: Record<string, ColumnKind> = {};
  for (const p of prefixes) for (const l of LANGS) out[`${p}_${l}`] = 'text';
  return out;
}

export const NEWS_STATUSES = ['published', 'draft'] as const;
export const APPLICATION_STATUSES = ['new', 'contacted', 'accepted', 'rejected'] as const;

export const COLLECTIONS: Record<string, CollectionDef> = {
  news: {
    table: 'news',
    columns: {
      category: 'text',
      status: 'text',
      image: 'text',
      imageId: 'text',
      publishedAt: 'text',
      ...localized('title', 'content'),
    },
    sortable: ['createdAt', 'updatedAt', 'publishedAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['status', 'category'],
    enums: { status: NEWS_STATUSES, category: ['events', 'announcements'] },
    urlColumns: ['image'],
    file: { column: 'imageId', folder: 'news' },
    cursorColumn: 'createdAt',
  },
  teachers: {
    table: 'teachers',
    columns: {
      ...localized('name', 'subject'),
      category: 'text',
      experience: 'int',
      photo: 'text',
      photoId: 'text',
      achievements: 'json',
      order: 'int',
    },
    sortable: ['order', 'name_uz', 'createdAt'],
    defaultSort: { column: 'order', direction: 'asc' },
    filterable: ['category'],
    urlColumns: ['photo'],
    file: { column: 'photoId', folder: 'teachers' },
  },
  olympiad: {
    table: 'olympiad',
    columns: {
      student: 'text',
      subject: 'text',
      level: 'text',
      place: 'int',
      olympiad_name: 'text',
      year: 'int',
    },
    sortable: ['year', 'createdAt'],
    defaultSort: { column: 'year', direction: 'desc' },
    filterable: ['level', 'year'],
    enums: { level: ['xalqaro', 'respublika', 'shahar', 'tuman'] },
  },
  faq: {
    table: 'faq',
    columns: { category: 'text', order: 'int', ...localized('question', 'answer') },
    sortable: ['order', 'createdAt'],
    defaultSort: { column: 'order', direction: 'asc' },
    filterable: ['category'],
    enums: { category: ['admission', 'education', 'general'] },
  },
  gallery: {
    table: 'gallery',
    columns: { url: 'text', fileId: 'text', category: 'text', ...localized('caption') },
    sortable: ['createdAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['category'],
    enums: { category: ['building', 'lessons', 'sports', 'events'] },
    urlColumns: ['url'],
    file: { column: 'fileId', folder: 'gallery' },
    cursorColumn: 'createdAt',
  },
  messages: {
    table: 'messages',
    columns: { read: 'bool' },
    sortable: ['createdAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['read'],
    creatable: false,
    cursorColumn: 'createdAt',
  },
  applications: {
    table: 'applications',
    columns: { read: 'bool', status: 'text' },
    sortable: ['createdAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['read', 'status'],
    enums: { status: APPLICATION_STATUSES },
    creatable: false,
    cursorColumn: 'createdAt',
  },
};

/** R2 kalitlari saqlanadigan barcha (jadval, ustun) juftliklari — "fayl ishlatilyaptimi?" tekshiruvi uchun. */
export const FILE_REFERENCES = Object.values(COLLECTIONS)
  .filter((d) => d.file)
  .map((d) => ({ table: d.table, column: d.file!.column }));

/** Qaytariladigan qatorlarni JS turlariga o'girish uchun: jadval → (ustun → bool/json). */
export const DECODERS: Record<string, Record<string, ColumnKind>> = Object.fromEntries(
  Object.values(COLLECTIONS).map((d) => [
    d.table,
    Object.fromEntries(
      Object.entries(d.columns).filter(([, kind]) => kind === 'bool' || kind === 'json')
    ),
  ])
);

export function getCollection(name: string): CollectionDef | null {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, name) ? COLLECTIONS[name] : null;
}

/** SQL identifikatorini qo'shtirnoqqa olish ("order" kabi kalit so'zlar uchun). Faqat whitelist'dan keladi. */
export function ident(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
