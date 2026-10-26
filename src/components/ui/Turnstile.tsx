'use client';
import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';

/**
 * Cloudflare Turnstile — ko'rinmas captcha. `appearance: 'interaction-only'`: oddiy
 * foydalanuvchi hech narsa ko'rmaydi, faqat shubhali holatda tekshiruv oynasi chiqadi.
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY bo'lmasa (lokal dev) — hech narsa render qilinmaydi.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () =>
        window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing'));
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('turnstile script failed'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

const LANG: Record<string, string> = { uz: 'uz', ru: 'ru', kk: 'ru', en: 'en' };

interface Props {
  onToken: (token: string) => void;
  /** Qiymat o'zgarganda widget qayta ishga tushadi (token bir martalik). */
  resetKey?: number;
}

export default function Turnstile({ onToken, resetKey = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const locale = useLocale();

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;
    loadScript()
      .then((ts) => {
        if (cancelled || !ref.current) return;
        widgetId.current = ts.render(ref.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          size: 'flexible',
          theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
          language: LANG[locale] || 'auto',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current(''),
        });
      })
      .catch((err) => console.warn('[turnstile]', err));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [locale]);

  useEffect(() => {
    if (resetKey === 0 || !widgetId.current || !window.turnstile) return;
    onTokenRef.current('');
    window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={ref} style={{ marginBottom: 'var(--s-4)' }} />;
}
