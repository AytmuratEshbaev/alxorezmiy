import type { LocalizedFields, Locale } from '@/types';

export function escapeHtml(s: string | undefined | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string)
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

function toDate(ts: string | { toDate: () => Date } | undefined): Date | null {
  if (!ts) return null;
  const d = typeof ts === 'object' && 'toDate' in ts ? ts.toDate() : new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

const LOCALE_BCP47: Record<string, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-US'
};

/**
 * Locale-aware short date, e.g. "28 Mar 2026" / "28 марта 2026".
 * Accepts ISO string or Firestore Timestamp-like { toDate }.
 */
export function formatDate(
  ts: string | { toDate: () => Date } | undefined,
  locale: Locale = 'uz'
): string {
  const d = toDate(ts);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(LOCALE_BCP47[locale] || 'uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

/** ISO `YYYY-MM-DD` — for machine-readable contexts (datetime attr, sort keys). */
export function formatDateISO(ts: string | { toDate: () => Date } | undefined): string {
  const d = toDate(ts);
  return d ? d.toISOString().split('T')[0] : '';
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
