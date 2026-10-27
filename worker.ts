/**
 * Cloudflare Worker kirish nuqtasi — OpenNext handler'ini o'rab oladi va ikki narsa qo'shadi:
 *
 * 1. CSP nonce: har bir so'rov uchun yangi nonce yaratiladi va so'rov headeri sifatida Next'ga
 *    uzatiladi (Next uni o'z inline <script>'lariga qo'yadi, layout esa `x-nonce` dan o'qiydi).
 *    Javobga `Content-Security-Policy` qo'yiladi.
 *
 * 2. Edge kesh (Cache API): ommaviy sahifalar (/uz, /ru, ...), /api/public/* va sitemap
 *    keshlanadi. Kesh kaliti D1'dagi `cache_version` ga bog'liq — admin biror narsani
 *    saqlasa versiya oshadi va barcha sahifalar darhol yangilanadi. Keshdan berilganda
 *    eski nonce yangisiga almashtiriladi, ya'ni nonce hech qachon takrorlanmaydi.
 *
 * Eslatma: Cache API faqat Custom Domain'da ishlaydi (*.workers.dev'da kesh no-op).
 */
// @ts-expect-error — `.open-next/worker.js` build vaqtida yaratiladi
import openNext from './.open-next/worker.js';

interface Env {
  DB: D1Database;
  [key: string]: unknown;
}

interface Ctx {
  waitUntil(p: Promise<unknown>): void;
  passThroughOnException(): void;
}

const LOCALE_PAGE = /^\/(uz|ru|kk|en)(\/|$)/;
const CACHE_TTL_SECONDS = 1800; // DB xatosi bilan render bo'lgan sahifa ham ko'pi bilan 30 daqiqa yashaydi
const VERSION_MEMO_MS = 5000;
const NONCE_HEADER = 'x-ax-nonce';
/** RSC (client navigatsiya) javobi shu headerlarga qarab o'zgaradi — kesh kalitiga kiradi. */
const RSC_VARY = [
  'rsc',
  'next-router-prefetch',
  'next-router-state-tree',
  'next-router-segment-prefetch',
];

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

function csp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic': nonce'li skriptlar yuklagan skriptlar (Turnstile, Next chunk'lari) ham ruxsat.
    // https: va 'unsafe-inline' — faqat eski brauzerlar uchun fallback (nonce bo'lsa e'tiborga olinmaydi).
    `script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com",
    'frame-src https://challenges.cloudflare.com https://www.google.com',
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

let memo: { v: number; at: number } | null = null;

async function cacheVersion(env: Env): Promise<number | null> {
  if (memo && Date.now() - memo.at < VERSION_MEMO_MS) return memo.v;
  try {
    const v = await env.DB.prepare('SELECT v FROM cache_version WHERE id = 1').first<number>('v');
    memo = { v: v ?? 0, at: Date.now() };
    return memo.v;
  } catch {
    return null; // DB ishlamasa — keshni chetlab o'tamiz
  }
}

async function sha1(input: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function isCacheable(req: Request, url: URL): boolean {
  if (req.method !== 'GET') return false;
  return (
    LOCALE_PAGE.test(url.pathname) ||
    url.pathname.startsWith('/api/public/') ||
    url.pathname === '/sitemap.xml'
  );
}

function needsNonce(url: URL): boolean {
  const p = url.pathname;
  return !p.startsWith('/api/') && !p.startsWith('/media/') && !p.startsWith('/_next/');
}

function isTextual(res: Response): boolean {
  const type = res.headers.get('content-type') || '';
  return type.includes('text/html') || type.includes('text/x-component');
}

function finalize(res: Response, nonce: string | null): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  if (nonce && (out.headers.get('content-type') || '').includes('text/html')) {
    out.headers.set('Content-Security-Policy', csp(nonce));
  }
  out.headers.delete(NONCE_HEADER);
  return out;
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    const nonce = needsNonce(url) ? newNonce() : null;

    let req = request;
    if (nonce) {
      const headers = new Headers(request.headers);
      headers.set('content-security-policy', `script-src 'nonce-${nonce}' 'strict-dynamic'`);
      headers.set('x-nonce', nonce);
      req = new Request(request, { headers });
    }

    if (!isCacheable(request, url)) {
      return finalize(await openNext.fetch(req, env, ctx), nonce);
    }

    const version = await cacheVersion(env);
    if (version === null) return finalize(await openNext.fetch(req, env, ctx), nonce);

    const vary = await sha1(RSC_VARY.map((h) => request.headers.get(h) || '').join('\n'));
    const key = new Request(
      `${url.origin}/__cache/v${version}/${vary}${url.pathname}${url.search}`
    );
    const cache = (caches as unknown as { default: Cache }).default;

    const hit = await cache.match(key);
    if (hit) {
      const oldNonce = hit.headers.get(NONCE_HEADER);
      let body: BodyInit | null = hit.body;
      if (oldNonce && nonce && isTextual(hit)) {
        body = (await hit.text()).replaceAll(oldNonce, nonce);
      }
      const res = new Response(body, hit);
      res.headers.set('Cache-Control', 'private, no-cache');
      res.headers.set('X-Edge-Cache', 'HIT');
      res.headers.delete('Content-Length');
      return finalize(res, nonce);
    }

    const res = await openNext.fetch(req, env, ctx);
    if (res.status === 200 && !res.headers.has('x-middleware-rewrite-error')) {
      const stored = new Response(res.clone().body, res);
      stored.headers.delete('Set-Cookie'); // next-intl NEXT_LOCALE cookie'si keshga tushmasin
      stored.headers.set('Cache-Control', `public, max-age=${CACHE_TTL_SECONDS}`);
      if (nonce) stored.headers.set(NONCE_HEADER, nonce);
      ctx.waitUntil(cache.put(key, stored));
    }
    const out = finalize(res, nonce);
    out.headers.set('X-Edge-Cache', 'MISS');
    return out;
  },
};
