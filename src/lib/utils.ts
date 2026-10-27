import type { LocalizedFields, Locale } from '@/types';

export function escapeHtml(s: string | undefined | null): string {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m] as string
  );
}

export function getLocalizedField<T extends LocalizedFields>(
  obj: T,
  prefix: string,
  locale: Locale
): string {
  const rec = obj as unknown as Record<string, string | undefined>;
  return rec[`${prefix}_${locale}`] || rec[`${prefix}_uz`] || '';
}

/**
 * Lokalizatsiya qilingan qiymat o'zbekchaga qaytgan bo'lsa `'uz'`, aks holda `undefined`.
 * Elementga `lang={fallbackLang(...)}` qo'yish uchun — ekran o'quvchilar to'g'ri talaffuz qiladi.
 */
export function fallbackLang<T extends LocalizedFields>(
  obj: T,
  prefix: string,
  locale: Locale
): 'uz' | undefined {
  if (locale === 'uz') return undefined;
  const rec = obj as unknown as Record<string, string | undefined>;
  return !rec[`${prefix}_${locale}`] && rec[`${prefix}_uz`] ? 'uz' : undefined;
}

/**
 * Routing locale → HTML/BCP-47 til kodi. `/kk` URL'lari qoraqalpoq tilida (ISO 639-3 `kaa`),
 * qozoq tili (`kk`) emas — shuning uchun html lang, hreflang va JSON-LD'da `kaa`.
 */
export function htmlLang(locale: string): string {
  return locale === 'kk' ? 'kaa' : locale;
}

/** Intl API'lari uchun til kodi (sonlarni formatlash va h.k.). */
export function intlLocale(locale: string): string {
  // `kaa` uchun ICU ma'lumotlari ko'pincha yo'q — lotin yozuvidagi o'zbekcha eng yaqin.
  return { uz: 'uz-Latn-UZ', ru: 'ru-RU', kk: 'uz-Latn-UZ', en: 'en-US' }[locale] || 'uz-Latn-UZ';
}

/** Yangilikning ko'rsatiladigan/tartiblanadigan sanasi: publishedAt, bo'lmasa createdAt. */
export function newsDate(item: { publishedAt?: string; createdAt?: string }): string {
  return item.publishedAt || item.createdAt || '';
}

function toDate(ts: string | undefined | null): Date | null {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

// Qoraqalpoq tilidagi oy nomlari (lotin yozuvi) — Intl'da `kaa` ma'lumotlari yo'q.
const KAA_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
];

/**
 * Locale-aware short date, e.g. "28 Mar 2026" / "28 марта 2026" / "28 mart 2026".
 * Accepts an ISO string.
 */
export function formatDate(ts: string | undefined | null, locale: Locale = 'uz'): string {
  const d = toDate(ts);
  if (!d) return '';
  if (locale === 'kk') {
    // Toshkent vaqti (UTC+5, yozgi vaqt yo'q) — Intl tarmog'idagi timeZone bilan bir xil.
    const t = new Date(d.getTime() + 5 * 60 * 60 * 1000);
    return `${t.getUTCDate()} ${KAA_MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
  }
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Tashkent',
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

/** ISO `YYYY-MM-DD` — for machine-readable contexts (datetime attr, sort keys). */
export function formatDateISO(ts: string | undefined | null): string {
  const d = toDate(ts);
  return d ? d.toISOString().split('T')[0] : '';
}

/** Serialized timestamp → full ISO datetime (or undefined if missing/invalid). */
export function toISO(ts: string | undefined | null): string | undefined {
  const d = toDate(ts);
  return d ? d.toISOString() : undefined;
}

/**
 * Estimate reading time in minutes for a body of text.
 * Conservative 180 wpm so short articles read "1 min" not "<1".
 */
export function readingTimeMinutes(text: string | undefined | null): number {
  if (!text) return 1;
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function classNames(...xs: Array<string | false | undefined | null>): string {
  return xs.filter(Boolean).join(' ');
}

/** Sozlamalardagi bo'sh bo'lmagan matn qiymati (bo'sh satr = "o'rnatilmagan"). */
export function filled(v: string | undefined | null): string | undefined {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : undefined;
}

/** Telefon raqamidan `tel:` havolasi (bo'shliq/qavslarsiz). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * Server sahifalari uchun: o'qish xatosi sahifani yiqitmasin — log yozib, zaxira qiymat.
 * (Mavjud bo'lmagan yozuv ≠ xato: maqola sahifasi bunday holatda safe() ishlatmaydi.)
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[${label}] failed:`, err);
    return fallback;
  }
}

/** Ob'ektdan faqat ko'rsatilgan kalitlarni oladi (masalan, client'ga xabar nomlar fazolari). */
export function pick<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly string[]
): Partial<T> {
  const out: Partial<T> = {};
  for (const k of keys) {
    if (k in obj) (out as Record<string, unknown>)[k] = obj[k];
  }
  return out;
}
