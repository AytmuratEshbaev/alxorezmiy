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

export function formatDate(ts: string | { toDate: () => Date } | undefined): string {
  if (!ts) return '';
  const d = typeof ts === 'object' && 'toDate' in ts ? ts.toDate() : new Date(ts);
  return d.toISOString().split('T')[0];
}

export function classNames(...xs: Array<string | false | undefined | null>): string {
  return xs.filter(Boolean).join(' ');
}
