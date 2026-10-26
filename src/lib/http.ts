import 'server-only';
import { NextResponse } from 'next/server';
import { getSessionUser, type AdminUser } from '@/lib/auth/session';

export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

/**
 * CSRF himoyasi: holatni o'zgartiruvchi so'rov boshqa saytdan kelmaganini tekshiradi.
 * Brauzer har doim Origin (yoki hech bo'lmasa Sec-Fetch-Site) yuboradi.
 */
export function isSameOrigin(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = req.headers.get('origin');
  if (!origin) return site === 'same-origin';
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

type AdminHandlerResult = { user: AdminUser } | { response: NextResponse };

/**
 * Admin API'lari uchun yagona darvoza: sessiya + (o'zgartiruvchi metodlar uchun) same-origin.
 * Foydalanish: `const auth = await requireAdmin(req); if ('response' in auth) return auth.response;`
 */
export async function requireAdmin(req: Request): Promise<AdminHandlerResult> {
  if (req.method !== 'GET' && req.method !== 'HEAD' && !isSameOrigin(req)) {
    return { response: jsonError('Forbidden', 403) };
  }
  const user = await getSessionUser();
  if (!user) return { response: jsonError('Unauthorized', 401) };
  return { user };
}

/** JSON body'ni xavfsiz o'qish; noto'g'ri bo'lsa null. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    const body = (await req.json()) as unknown;
    return body && typeof body === 'object' ? (body as T) : null;
  } catch {
    return null;
  }
}

export const NO_STORE = { 'Cache-Control': 'no-store' };
