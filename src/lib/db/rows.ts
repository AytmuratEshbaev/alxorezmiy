import 'server-only';
import { DECODERS, type ColumnKind } from './schema';

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/** D1 qatorini frontend kutayotgan ko'rinishga keltiradi (0/1 → boolean, JSON matn → obyekt). */
export function decodeRow<T>(table: string, row: Record<string, unknown>): T {
  const decoders = DECODERS[table] || {};
  const out: Record<string, unknown> = { ...row };
  for (const [col, kind] of Object.entries(decoders)) {
    if (!(col in out)) continue;
    if (kind === 'bool') out[col] = out[col] === 1 || out[col] === true;
    if (kind === 'json') {
      try {
        out[col] = typeof out[col] === 'string' ? JSON.parse(out[col] as string) : out[col];
      } catch {
        out[col] = null;
      }
    }
  }
  return out as T;
}

/** Klientdan kelgan qiymatni ustun turiga moslab D1 uchun tayyorlaydi. null — qiymat yaroqsiz. */
export function encodeValue(kind: ColumnKind, value: unknown): string | number | null {
  switch (kind) {
    case 'text':
      return value == null ? '' : String(value).slice(0, 50_000);
    case 'int': {
      const n = typeof value === 'number' ? value : parseInt(String(value), 10);
      return Number.isFinite(n) ? Math.trunc(n) : 0;
    }
    case 'bool':
      return value === true || value === 1 || value === 'true' ? 1 : 0;
    case 'json':
      try {
        return JSON.stringify(value ?? null).slice(0, 50_000);
      } catch {
        return null;
      }
  }
}
