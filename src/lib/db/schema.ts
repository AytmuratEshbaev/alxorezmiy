import 'server-only';

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
  /** R2 obyekt kaliti saqlanadigan ustun — yozuv o'chirilganda/almashganda fayl ham o'chiriladi. */
  fileKey?: string;
  /** false bo'lsa admin yangi yozuv yarata olmaydi (masalan, xabarlar faqat saytdan keladi). */
  creatable?: boolean;
}

const LANGS = ['uz', 'ru', 'kk', 'en'] as const;

function localized(...prefixes: string[]): Record<string, ColumnKind> {
  const out: Record<string, ColumnKind> = {};
  for (const p of prefixes) for (const l of LANGS) out[`${p}_${l}`] = 'text';
  return out;
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  news: {
    table: 'news',
    columns: {
      category: 'text',
      status: 'text',
      image: 'text',
      imageId: 'text',
      ...localized('title', 'content'),
    },
    sortable: ['createdAt', 'updatedAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['status', 'category'],
    fileKey: 'imageId',
  },
  teachers: {
    table: 'teachers',
    columns: {
      ...localized('name'),
      subject: 'text',
      category: 'text',
      experience: 'int',
      photo: 'text',
      photoId: 'text',
      achievements: 'json',
      order: 'int',
    },
    sortable: ['order', 'name_uz', 'createdAt'],
    defaultSort: { column: 'name_uz', direction: 'asc' },
    filterable: ['category'],
    fileKey: 'photoId',
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
  },
  faq: {
    table: 'faq',
    columns: { category: 'text', order: 'int', ...localized('question', 'answer') },
    sortable: ['order', 'createdAt'],
    defaultSort: { column: 'order', direction: 'asc' },
    filterable: ['category'],
  },
  gallery: {
    table: 'gallery',
    columns: { url: 'text', fileId: 'text', category: 'text', ...localized('caption') },
    sortable: ['createdAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['category'],
    fileKey: 'fileId',
  },
  messages: {
    table: 'messages',
    columns: { read: 'bool' },
    sortable: ['createdAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['read'],
    creatable: false,
  },
  applications: {
    table: 'applications',
    columns: { read: 'bool', status: 'text' },
    sortable: ['createdAt'],
    defaultSort: { column: 'createdAt', direction: 'desc' },
    filterable: ['read', 'status'],
    creatable: false,
  },
};

/** Qaytariladigan qatorlarni JS turlariga o'girish uchun — barcha jadvallarning bool/json ustunlari. */
export const DECODERS: Record<string, Record<string, ColumnKind>> = {
  news: {},
  teachers: { achievements: 'json' },
  olympiad: {},
  faq: {},
  gallery: {},
  messages: { read: 'bool' },
  applications: { read: 'bool' },
};

export function getCollection(name: string): CollectionDef | null {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, name) ? COLLECTIONS[name] : null;
}

/** SQL identifikatorini qo'shtirnoqqa olish ("order" kabi kalit so'zlar uchun). Faqat whitelist'dan keladi. */
export function ident(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
